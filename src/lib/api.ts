"use client";

import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { API_URL, APP_URL } from "@/lib/config";
import type { ApiEnvelope } from "@/lib/types";

type ApiOptions = {
  method?: string;
  body?: unknown;
  formData?: FormData;
  auth?: boolean;
};

type TokenRecord = {
  value: string;
  expiresAt: number;
};

export class ApiError extends Error {
  readonly status: number;
  readonly errors?: unknown;

  constructor(status: number, message: string, errors?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

let cachedToken: TokenRecord | undefined;
let loggedToken: string | undefined;

export function clearTokenCache() {
  cachedToken = undefined;
}

function getTokenExpiry(token: string) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return Date.now() + 60_000;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized)) as { exp?: number };
    return decoded.exp ? decoded.exp * 1000 : Date.now() + 60_000;
  } catch {
    return Date.now() + 60_000;
  }
}

async function requestToken(force = false) {
  if (!force && cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const response = await fetch(`${APP_URL}/api/auth/token`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const payload = (await response.json().catch(() => null)) as
    | { token?: string; message?: string }
    | null;

  if (!response.ok || !payload?.token) {
    throw new ApiError(
      response.status || 401,
      payload?.message || "Please sign in to continue.",
    );
  }

  const expiresAt = getTokenExpiry(payload.token);
  cachedToken = { value: payload.token, expiresAt };

  if (process.env.NODE_ENV === "development" && loggedToken !== payload.token) {
    loggedToken = payload.token;
    console.log("JWT (dev):", payload.token);
  }

  return payload.token;
}

async function readEnvelope<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | null;

  if (!response.ok || payload?.success === false) {
    throw new ApiError(
      response.status,
      payload?.message || "The request could not be completed.",
      payload?.errors,
    );
  }

  if (payload && Object.hasOwn(payload, "data")) {
    return payload.data as T;
  }

  return payload as T;
}

async function send<T>(
  path: string,
  options: ApiOptions,
  token?: string,
): Promise<{ response: Response; data?: T }> {
  const headers = new Headers();
  let body: BodyInit | undefined;

  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}/${path.replace(/^\/+/, "")}`, {
      method: options.method ?? "GET",
      headers,
      body,
    });
  } catch {
    throw new ApiError(
      0,
      "We could not reach the server. Check your connection and try again.",
    );
  }

  return { response, data: await readEnvelope<T>(response) };
}

async function handleAuthorizationError(error: ApiError) {
  if (typeof window === "undefined") return;

  if (error.status === 403 && error.message.toLowerCase().includes("blocked")) {
    clearTokenCache();
    toast.error("Your account is blocked");
    await authClient.signOut();
    window.location.assign("/signin?blocked=1");
    return;
  }

  if (error.status === 403) {
    toast.error("Access denied");
    return;
  }

  if (error.status === 401) {
    clearTokenCache();
    await authClient.signOut();
    toast.error("Your session expired. Please sign in again.");
    window.location.assign("/signin");
  }
}

export async function apiFetch<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const requiresAuth = options.auth !== false;
  let token = requiresAuth ? await requestToken() : undefined;

  try {
    const first = await send<T>(path, options, token);
    return first.data as T;
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;

    if (error.status === 401 && requiresAuth) {
      token = await requestToken(true).catch(() => undefined);
      if (token) {
        try {
          const retry = await send<T>(path, options, token);
          return retry.data as T;
        } catch (retryError) {
          if (retryError instanceof ApiError) {
            await handleAuthorizationError(retryError);
            throw retryError;
          }
          throw retryError;
        }
      }
    }

    await handleAuthorizationError(error);
    throw error;
  }
}

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export async function uploadImage(file: File): Promise<string> {
  if (!IMAGE_TYPES.has(file.type)) {
    const error = new ApiError(
      400,
      "Choose a JPEG, PNG, WebP, or GIF image.",
    );
    toast.error(error.message);
    throw error;
  }
  if (file.size > MAX_IMAGE_SIZE) {
    const error = new ApiError(400, "Images must be 5 MB or smaller.");
    toast.error(error.message);
    throw error;
  }

  const formData = new FormData();
  formData.append("image", file);

  try {
    const result = await apiFetch<{ url: string }>("/upload", {
      method: "POST",
      formData,
      auth: false,
    });
    return result.url;
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Image upload failed.",
    );
    throw error;
  }
}
