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
  userId: string;
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

const cachedTokens = new Map<string, TokenRecord>();
const tokenRequests = new Map<string, Promise<TokenRecord>>();
let tokenCacheGeneration = 0;

export function clearTokenCache() {
  tokenCacheGeneration += 1;
  cachedTokens.clear();
  tokenRequests.clear();
}

function getTokenExpiry(token: string): number | undefined {
  try {
    const payload = token.split(".")[1];
    if (!payload) return undefined;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized)) as { exp?: number };
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : undefined;
  } catch {
    return undefined;
  }
}

function logApiRequest(
  path: string,
  method: string,
  token: string | undefined,
  status: number,
  message: string | undefined,
) {
  if (process.env.NODE_ENV !== "development") return;
  const expiresAt = token ? getTokenExpiry(token) : undefined;
  console.debug(
    `[api] ${method} ${path} bearer=${token ? "yes" : "no"} exp=${
      expiresAt ? new Date(expiresAt).toISOString() : "n/a"
    } status=${status} message=${message || "-"}`,
  );
}

async function fetchTokenForUser(
  userId: string,
  generation: number,
): Promise<TokenRecord> {
  let response: Response;
  try {
    response = await fetch(`${APP_URL}/api/auth/token`, {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new ApiError(
      0,
      "We could not reach the authentication service. Check your connection and try again.",
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | { token?: string; message?: string }
    | null;

  if (!response.ok || !payload?.token) {
    logApiRequest(
      "/api/auth/token",
      "GET",
      undefined,
      response.status,
      payload?.message || response.statusText,
    );
    throw new ApiError(
      response.status || 401,
      payload?.message || "Please sign in to continue.",
    );
  }

  const expiresAt = getTokenExpiry(payload.token);
  if (!expiresAt || expiresAt <= Date.now()) {
    logApiRequest(
      "/api/auth/token",
      "GET",
      payload.token,
      response.status,
      "Authentication service returned an invalid or expired JWT.",
    );
    throw new ApiError(
      401,
      "The authentication service returned an invalid or expired token.",
    );
  }

  const record = { value: payload.token, userId, expiresAt };
  if (generation === tokenCacheGeneration) {
    cachedTokens.set(userId, record);
  }
  logApiRequest(
    "/api/auth/token",
    "GET",
    payload.token,
    response.status,
    payload.message || "ok",
  );
  return record;
}

async function requestToken(force = false) {
  const { data: session, error } = await authClient.getSession();
  const userId = session?.user?.id;
  if (error || !userId) {
    clearTokenCache();
    throw new ApiError(401, error?.message || "Please sign in to continue.");
  }

  const cached = cachedTokens.get(userId);
  if (
    !force &&
    cached?.userId === userId &&
    cached.expiresAt > Date.now() + 30_000
  ) {
    return cached.value;
  }
  cachedTokens.delete(userId);

  const currentRequest = tokenRequests.get(userId);
  if (!force && currentRequest) return (await currentRequest).value;

  const generation = tokenCacheGeneration;
  const request = fetchTokenForUser(userId, generation);
  tokenRequests.set(userId, request);
  try {
    const record = await request;
    if (generation !== tokenCacheGeneration) {
      throw new ApiError(401, "Your sign-in changed. Please try again.");
    }
    return record.value;
  } finally {
    if (tokenRequests.get(userId) === request) tokenRequests.delete(userId);
  }
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

  const responseMessage = await response
    .clone()
    .json()
    .then((payload: unknown) =>
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : undefined,
    )
    .catch(() => undefined);
  logApiRequest(
    path,
    options.method ?? "GET",
    token,
    response.status,
    responseMessage,
  );
  return { response, data: await readEnvelope<T>(response) };
}

async function handleAuthorizationError(error: ApiError) {
  if (typeof window === "undefined") return;

  if (
    error.status === 403 &&
    error.message.trim().toLowerCase() === "your account has been blocked."
  ) {
    clearTokenCache();
    toast.error("Your account is blocked");
    try {
      await authClient.signOut();
    } finally {
      window.location.assign("/signin?blocked=1");
    }
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
    const redirect = `${window.location.pathname}${window.location.search}`;
    window.location.assign(
      `/signin?redirect=${encodeURIComponent(redirect)}`,
    );
  }
}

export async function apiFetch<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const requiresAuth = options.auth !== false;

  try {
    const token = requiresAuth ? await requestToken() : undefined;
    const first = await send<T>(path, options, token);
    return first.data as T;
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;

    if (error.status === 401 && requiresAuth) {
      clearTokenCache();
      try {
        const freshToken = await requestToken(true);
        const retry = await send<T>(path, options, freshToken);
        return retry.data as T;
      } catch (retryError) {
        if (retryError instanceof ApiError) {
          await handleAuthorizationError(retryError);
        }
        throw retryError;
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

export async function uploadVendorServiceImage(file: File): Promise<string> {
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
    const response = await fetch("/api/vendor-image-upload", {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    });
    const result = (await response.json().catch(() => null)) as
      | { url?: string; message?: string }
      | null;
    if (!response.ok || !result?.url) {
      throw new ApiError(
        response.status,
        result?.message || "Image upload failed.",
      );
    }
    return result.url;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Image upload failed.";
    toast.error(message);
    throw error;
  }
}
