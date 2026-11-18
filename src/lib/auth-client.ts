"use client";

import { createAuthClient } from "better-auth/react";
import {
  inferAdditionalFields,
  jwtClient,
} from "better-auth/client/plugins";

import { APP_URL } from "@/lib/config";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  baseURL: APP_URL,
  plugins: [jwtClient(), inferAdditionalFields<typeof auth>()],
});
