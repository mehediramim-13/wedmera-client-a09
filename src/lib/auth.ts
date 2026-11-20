import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { jwt } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { MongoClient, type Db } from "mongodb";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

const MONGODB_URL = requireEnv("MONGODB_URL");
const DB_NAME = requireEnv("DB_NAME");
const BETTER_AUTH_SECRET = requireEnv("BETTER_AUTH_SECRET");
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
const BETTER_AUTH_URL = (process.env.BETTER_AUTH_URL || APP_URL).replace(/\/+$/, "");

/**
 * Reuse the Mongo client and the Better Auth instance across hot reloads in
 * development so we never leak connections or re-create the JWKS keys.
 */
const globalForAuth = globalThis as unknown as {
  __wedmeraMongoClient?: MongoClient;
  __wedmeraAuth?: ReturnType<typeof betterAuth>;
};

const mongoClient =
  globalForAuth.__wedmeraMongoClient ?? new MongoClient(MONGODB_URL);
if (process.env.NODE_ENV !== "production") {
  globalForAuth.__wedmeraMongoClient = mongoClient;
}

const db: Db = mongoClient.db(DB_NAME);

function readCookieHeader(context: unknown): string {
  const ctx = context as
    | {
        headers?: HeadersInit;
        request?: Request;
      }
    | null
    | undefined;
  if (!ctx) return "";

  const fromRequest = ctx.request?.headers?.get("cookie");
  if (fromRequest) return fromRequest;

  const headers = ctx.headers;
  if (!headers) return "";
  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    return headers.get("cookie") || "";
  }
  if (Array.isArray(headers)) {
    const entry = headers.find(([key]) => String(key).toLowerCase() === "cookie");
    return entry?.[1] ?? "";
  }
  const record = headers as Record<string, string>;
  return record.cookie || record.Cookie || "";
}

function readRoleCookie(context: unknown): "vendor" | "customer" | null {
  const cookieHeader = readCookieHeader(context);
  const match = /(?:^|;\s*)wm_role=(vendor|customer)(?:;|$)/.exec(cookieHeader);
  return match ? (match[1] as "vendor" | "customer") : null;
}

export const auth = betterAuth({
  appName: "WedMera",
  baseURL: BETTER_AUTH_URL,
  secret: BETTER_AUTH_SECRET,
  trustedOrigins: Array.from(
    new Set([APP_URL, BETTER_AUTH_URL, "http://localhost:3000"]),
  ),
  database: mongodbAdapter(db, { client: mongoClient }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    autoSignIn: true,
  },
  socialProviders: {
    google: {
      clientId: requireEnv("GOOGLE_CLIENT_ID"),
      clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "customer",
        input: true,
      },
      isBlocked: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
      businessName: {
        type: "string",
        required: false,
        input: true,
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      address: {
        type: "string",
        required: false,
        input: true,
      },
      bio: {
        type: "string",
        required: false,
        input: true,
      },
      subscriptionPlan: {
        type: "string",
        defaultValue: "free",
        input: false,
      },
      subscriptionExpiresAt: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          const data = { ...user } as Record<string, unknown>;

          // Admins can only ever be created by promoting an existing account
          // through the server seed script.
          if (data.role === "admin") {
            throw new APIError("BAD_REQUEST", {
              message: "Admin accounts cannot be created through registration.",
            });
          }

          let role = data.role;
          if (role !== "vendor" && role !== "customer") {
            // Google sign-up has no body fields, so read the short-lived role
            // cookie set by the client immediately before redirecting.
            role = readRoleCookie(context) ?? "customer";
          }

          return {
            data: {
              ...data,
              role,
              isBlocked: false,
              subscriptionPlan: "free",
              subscriptionExpiresAt: null,
            },
          };
        },
      },
      update: {
        before: async (user) => {
          const data = { ...user } as Record<string, unknown>;
          delete data.role;
          delete data.isBlocked;
          delete data.subscriptionPlan;
          delete data.subscriptionExpiresAt;
          return { data };
        },
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      const body = ctx.body as { password?: unknown } | undefined;
      const password = typeof body?.password === "string" ? body.password : "";
      if (password.length < 6 || !/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
        throw new APIError("BAD_REQUEST", {
          message:
            "Password must be at least 6 characters and include at least one uppercase and one lowercase letter.",
        });
      }
    }),
  },
  plugins: [
    jwt({
      jwt: {
        // Keep the token minimal: the API reads the role and plan from MongoDB.
        definePayload: ({ user }) => ({ id: user.id, email: user.email }),
      },
    }),
    nextCookies(),
  ],
});

if (process.env.NODE_ENV !== "production") {
  globalForAuth.__wedmeraAuth = auth as never;
}

export type AuthSession = typeof auth.$Infer.Session;
