import { toNextJsHandler } from "better-auth/next-js";

import { getAuth } from "@/lib/auth";

function dispatch(method: "GET" | "POST") {
  return async (request: Request) => {
    const handlers = toNextJsHandler(getAuth());
    return handlers[method](request);
  };
}

export const GET = dispatch("GET");
export const POST = dispatch("POST");
