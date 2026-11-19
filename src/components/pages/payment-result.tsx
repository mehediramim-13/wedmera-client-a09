"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  XCircle,
} from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PREMIUM_PRICE_LABEL } from "@/lib/config";
import { authClient } from "@/lib/auth-client";
import {
  queryFns,
  queryKeys,
  usePaymentSession,
  useSubscription,
} from "@/lib/queries";
import { isPremiumPlan } from "@/lib/subscription-utils";

const premiumFeatures = [
  "Unlimited active services",
  "Premium vendor badge",
  "Featured service placement",
  "Basic vendor dashboard",
  "Booking request management",
];

export function PaymentSuccess() {
  const { refetch: refreshSession } = authClient.useSession();
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [searchParamsLoaded, setSearchParamsLoaded] = useState(false);
  const [refreshingPlan, setRefreshingPlan] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const refreshedSessionId = useRef<string | null>(null);
  const paymentSession = usePaymentSession(sessionId);
  const subscription = useSubscription(
    paymentSession.isSuccess,
    paymentSession.isSuccess,
  );
  const premium =
    paymentSession.isSuccess &&
    subscription.isSuccess &&
    !refreshingPlan &&
    !refreshError &&
    !subscription.isFetching &&
    isPremiumPlan(subscription.data?.effectivePlan);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get("session_id") || params.get("sessionId"));
    setSearchParamsLoaded(true);
  }, []);

  useEffect(() => {
    if (
      !paymentSession.isSuccess ||
      !sessionId ||
      refreshedSessionId.current === sessionId
    ) {
      return;
    }

    refreshedSessionId.current = sessionId;
    setRefreshingPlan(true);
    setRefreshError(false);
    void (async () => {
      const keys = [
        queryKeys.me,
        queryKeys.subscription,
        queryKeys.vendorOverview,
      ];
      try {
        await Promise.all(
          keys.map((queryKey) =>
            queryClient.invalidateQueries({ queryKey, refetchType: "none" }),
          ),
        );
        await Promise.all([
          queryClient.fetchQuery({
            queryKey: queryKeys.me,
            queryFn: queryFns.me,
            staleTime: 0,
          }),
          queryClient.fetchQuery({
            queryKey: queryKeys.subscription,
            queryFn: queryFns.subscription,
            staleTime: 0,
          }),
          queryClient.fetchQuery({
            queryKey: queryKeys.vendorOverview,
            queryFn: queryFns.vendorOverview,
            staleTime: 0,
          }),
          refreshSession(),
        ]);
      } catch {
        setRefreshError(true);
      } finally {
        setRefreshingPlan(false);
      }
    })();
  }, [paymentSession.isSuccess, queryClient, refreshSession, sessionId]);

  return (
    <PaymentLayout>
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
        {paymentSession.isSuccess ? (
          <CheckCircle2 className="size-8" />
        ) : paymentSession.isError || (searchParamsLoaded && !sessionId) ? (
          <CircleAlert className="size-8" />
        ) : (
          <LoaderCircle className="size-8 animate-spin" />
        )}
      </span>
      <h1 className="mt-5 font-heading text-3xl font-semibold">
        {paymentSession.isSuccess
          ? "Payment session verified"
          : paymentSession.isError || (searchParamsLoaded && !sessionId)
            ? "Payment could not be verified"
            : "Confirming your payment"}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        {premium
          ? "Your Premium subscription is active. You can now enjoy all the benefits of your plan."
          : paymentSession.isSuccess
            ? "The server verified your payment session. Your plan will update when the subscription service confirms it."
            : paymentSession.isError || (searchParamsLoaded && !sessionId)
              ? "We couldn’t verify this payment with the server. Your plan has not been changed."
              : "We’re checking the payment session with the server. Your plan won’t change based on the redirect alone."}
      </p>
      <div className="mt-5 flex min-h-8 items-center justify-center">
        {paymentSession.isLoading || refreshingPlan || subscription.isLoading ? (
          <span className="text-sm text-muted-foreground">
            {paymentSession.isLoading || !paymentSession.isSuccess
              ? "Verifying payment session…"
              : "Refreshing your plan…"}
          </span>
        ) : paymentSession.isError || (searchParamsLoaded && !sessionId) ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleAlert className="size-4" />
            {paymentSession.error?.message ??
              "The checkout URL did not include a payment session ID."}
            {sessionId ? (
              <button
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => void paymentSession.refetch()}
                type="button"
              >
                Try again
              </button>
            ) : null}
          </div>
        ) : refreshError || subscription.isError ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleAlert className="size-4" />
            We couldn’t refresh your plan status.
            <button
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => window.location.reload()}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : premium ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <StatusBadge status="Premium" />
            <span className="text-sm text-muted-foreground">
              {PREMIUM_PRICE_LABEL} / month
            </span>
          </div>
        ) : paymentSession.isSuccess ? (
          <span className="text-sm text-muted-foreground">
            Payment verified; your current plan is still Free.
          </span>
        ) : null}
      </div>
      {premium ? (
        <div className="mx-auto mt-6 max-w-md rounded-2xl border bg-card p-5 text-left">
          <h2 className="font-heading text-lg font-semibold">
            Your Premium benefits
          </h2>
          <ul className="mt-4 space-y-3">
            {premiumFeatures.map((feature) => (
              <li className="flex items-start gap-2 text-sm" key={feature}>
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Button render={<Link href="/dashboard/vendor/subscription" />}>
          View subscription
        </Button>
        <Button render={<Link href="/dashboard/vendor" />} variant="outline">
          Go to dashboard
        </Button>
      </div>
    </PaymentLayout>
  );
}

export function PaymentCancel() {
  return (
    <PaymentLayout>
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-muted text-muted-foreground">
        <XCircle className="size-8" />
      </span>
      <h1 className="mt-5 font-heading text-3xl font-semibold">
        Checkout cancelled
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        No payment was completed. Your current plan remains unchanged, and you
        can return to checkout whenever you’re ready.
      </p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Button render={<Link href="/dashboard/vendor/subscription" />}>
          Return to subscription
        </Button>
        <Button render={<Link href="/dashboard/vendor" />} variant="outline">
          Go to dashboard
        </Button>
      </div>
    </PaymentLayout>
  );
}

function PaymentLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-svh place-items-center bg-secondary/20 px-4 py-10">
      <Card className="w-full max-w-xl rounded-3xl border-border/70 shadow-lg">
        <CardContent className="px-6 py-10 text-center sm:px-12 sm:py-14">
          {children}
        </CardContent>
      </Card>
    </main>
  );
}
