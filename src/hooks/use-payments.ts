"use client";

import * as React from "react";
import { authClient } from "@/lib/auth-client";
import { apiFetch, errorMessage } from "@/lib/api";
import type { PaymentSessionStatus } from "@/lib/types";

export interface PaymentPollResult {
  data: PaymentSessionStatus | null;
  error: Error | null;
  isPolling: boolean;
  isTimedOut: boolean;
  restart: () => void;
}

const MAX_ATTEMPTS = 30; // 60 seconds at 2s intervals
const INTERVAL_MS = 2000;

/**
 * Polls GET /payments/session/:sessionId every 2 seconds for up to 60 seconds.
 *
 * - Does not start until the Better Auth session has finished loading and a
 *   Bearer JWT can be attached.
 * - 404 / 5xx / network errors and a 200 with status "processing" are treated
 *   as "still processing" and never surface as errors.
 * - Stops only for status "paid" (success) or a 400/403 response (real error).
 * - Strict-mode safe: a ref guards against two concurrent polling loops.
 */
export function usePaymentSessionPolling(
  sessionId: string | null,
): PaymentPollResult {
  const session = authClient.useSession();

  const [data, setData] = React.useState<PaymentSessionStatus | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [isPolling, setIsPolling] = React.useState(false);
  const [isTimedOut, setIsTimedOut] = React.useState(false);
  const [restartTick, setRestartTick] = React.useState(0);

  const mountedRef = React.useRef(true);
  const pollingRef = React.useRef(false);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (!sessionId) return;
    if (session.isPending) return;
    if (!session.data?.user) return;

    // Reset state for a fresh run.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(null);
    setError(null);
    setIsTimedOut(false);
    setIsPolling(true);

    let cancelled = false;
    let attempts = 0;

    // Guard against React strict mode starting two loops.
    if (pollingRef.current) return;
    pollingRef.current = true;

    async function poll() {
      if (cancelled || !mountedRef.current) return;
      attempts += 1;

      try {
        const result = await apiFetch<PaymentSessionStatus>(
          `/payments/session/${encodeURIComponent(sessionId as string)}`,
        );
        if (cancelled || !mountedRef.current) return;

        if (process.env.NODE_ENV === "development") {
          console.log("Payment poll", {
            httpStatus: 200,
            status: result?.status,
            message: (result as { message?: string })?.message,
          });
        }

        setData(result);
        setError(null);

        if (result?.status === "paid") {
          setIsPolling(false);
          return; // stop polling
        }
        // otherwise keep polling (processing / pending / etc.)
      } catch (caught) {
        if (cancelled || !mountedRef.current) return;
        const apiError = caught as { status?: number; message?: string };
        const status = apiError?.status ?? 0;

        if (process.env.NODE_ENV === "development") {
          console.log("Payment poll", {
            httpStatus: status,
            status: undefined,
            message: apiError?.message ?? errorMessage(caught),
          });
        }

        // Real errors: stop polling and surface the server message.
        if (status === 400 || status === 403) {
          setError(caught instanceof Error ? caught : new Error(errorMessage(caught)));
          setIsPolling(false);
          return;
        }
        // 404, 5xx, network (0): keep polling, never show an error.
      }

      if (cancelled || !mountedRef.current) return;

      if (attempts >= MAX_ATTEMPTS) {
        setIsPolling(false);
        setIsTimedOut(true);
        return;
      }

      setTimeout(() => {
        if (!cancelled && mountedRef.current) void poll();
      }, INTERVAL_MS);
    }

    void poll();

    return () => {
      cancelled = true;
      pollingRef.current = false;
    };
  }, [sessionId, session.isPending, session.data?.user, restartTick]);

  const restart = React.useCallback(() => {
    setRestartTick((value) => value + 1);
  }, []);

  return { data, error, isPolling, isTimedOut, restart };
}