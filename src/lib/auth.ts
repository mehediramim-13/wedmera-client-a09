import { MongoClient } from "mongodb";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { jwt } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

import { APP_URL, requiredEnv } from "@/lib/config";

type MongoGlobal = typeof globalThis & {
  __wedmeraMongoClient?: MongoClient;
};

const globalForMongo = globalThis as MongoGlobal;

function getMongoClient() {
  const cached = globalForMongo.__wedmeraMongoClient;
  if (cached) return cached;

  const client = new MongoClient(requiredEnv("MONGODB_URL"));
  globalForMongo.__wedmeraMongoClient = client;
  return client;
}

function readRoleCookie(context: { request?: Request } | null) {
  const cookie = context?.request?.headers.get("cookie");
  const value = cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("wm_role="))
    ?.slice("wm_role=".length);

  return value === "vendor" || value === "customer" ? value : undefined;
}

function buildAuth() {
  const database = getMongoClient().db(requiredEnv("DB_NAME"));

  return betterAuth({
    database: mongodbAdapter(database),
    baseURL: requiredEnv("BETTER_AUTH_URL"),
    secret: requiredEnv("BETTER_AUTH_SECRET"),
    trustedOrigins: [APP_URL],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
      autoSignIn: true,
    },
    socialProviders: {
      google: {
        clientId: requiredEnv("GOOGLE_CLIENT_ID"),
        clientSecret: requiredEnv("GOOGLE_CLIENT_SECRET"),
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
            if (user.role === "admin") {
              throw new APIError("BAD_REQUEST", {
                message: "Admin accounts cannot be created through sign up.",
              });
            }

            const cookieRole = readRoleCookie(context);
            const role =
              cookieRole ??
              (user.role === "vendor" || user.role === "customer"
                ? user.role
                : "customer");

            return {
              data: {
                ...user,
                role,
                isBlocked: false,
                subscriptionPlan: "free",
              },
            };
          },
        },
        update: {
          before: async (user) => {
            const {
              role: _role,
              isBlocked: _isBlocked,
              subscriptionPlan: _subscriptionPlan,
              subscriptionExpiresAt: _subscriptionExpiresAt,
              ...safeUser
            } = user;

            return { data: safeUser };
          },
        },
      },
    },
    hooks: {
      before: createAuthMiddleware(async (context) => {
        if (context.path !== "/sign-up/email") return;
        const password = context.body?.password;
        if (
          typeof password !== "string" ||
          password.length < 6 ||
          !/[A-Z]/.test(password) ||
          !/[a-z]/.test(password)
        ) {
          throw new APIError("BAD_REQUEST", {
            message:
              "Password must be at least 6 characters and include an uppercase and a lowercase letter.",
          });
        }
      }),
    },
    plugins: [
      jwt({
        jwt: {
          definePayload: ({ user }) => ({
            id: user.id,
            email: user.email,
          }),
        },
      }),
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof buildAuth>;

let authInstance: Auth | undefined;

export function getAuth(): Auth {
  authInstance ??= buildAuth();
  return authInstance;
}

export const auth = new Proxy({} as Auth, {
  get(_target, property) {
    const instance = getAuth();
    const value = Reflect.get(instance, property);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
