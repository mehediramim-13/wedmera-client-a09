"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { LoadingScreen } from "@/components/shared/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { usePaymentSessionPolling } from "@/hooks/use-payments";
import { queryKeys } from "@/lib/query-keys";
import { formatPrice, formatDate } from "@/lib/format";

function PaymentSuccessInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const sessionId = searchParams.get("session_id");

  const { data, error, isTimedOut, restart } =
    usePaymentSessionPolling(sessionId);

  const [premiumActive, setPremiumActive] = React.useState(false);
  const [activating, setActivating] = React.useState(false);

  React.useEffect(() => {
    if (data?.status !== "paid") return;

    let cancelled = false;
    (async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.me }),
        queryClient.invalidateQueries({ queryKey: queryKeys.vendorSubscription }),
        queryClient.invalidateQueries({ queryKey: queryKeys.vendorOverview }),
      ]);
      await queryClient.refetchQueries({ queryKey: queryKeys.me });
      router.refresh();

      const me = queryClient.getQueryData<{ effectivePlan?: string }>(queryKeys.me);
      if (me?.effectivePlan === "premium") {
        if (!cancelled) {
          setPremiumActive(true);
          setActivating(false);
        }
        return;
      }

      if (!cancelled) setActivating(true);

      let tries = 0;
      const interval = setInterval(async () => {
        tries += 1;
        await queryClient.refetchQueries({ queryKey: queryKeys.me });
        await queryClient.refetchQueries({ queryKey: queryKeys.vendorSubscription });
        const refreshed = queryClient.getQueryData<{ effectivePlan?: string }>(
          queryKeys.me,
        );
        if (refreshed?.effectivePlan === "premium") {
          setPremiumActive(true);
          setActivating(false);
          clearInterval(interval);
          return;
        }
        if (tries >= 10) {
          clearInterval(interval);
          setActivating(false);
        }
      }, 2000);

      return () => clearInterval(interval);
    })();

    return () => {
      cancelled = true;
    };
  }, [data?.status, queryClient, router]);

  if (!sessionId) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16 text-center">
        <Logo variant="mark" size={48} className="mx-auto" />
        <h1 className="mt-4 text-2xl font-semibold">Missing session reference</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We could not find a payment session. You can check your subscription
          status.
        </p>
        <Button className="mt-6" render={<Link href="/dashboard/vendor/subscription" />}>
          Go to Subscription
        </Button>
      </div>
    );
  }

  // Real error (400/403).
  if (error) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16 text-center">
        <Logo variant="mark" size={48} className="mx-auto" />
        <h1 className="mt-4 text-2xl font-semibold">Payment verification failed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {(error as Error).message}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="outline" render={<Link href="/dashboard/vendor/subscription" />}>
            Subscription
          </Button>
          <Button render={<Link href="/dashboard" />}>Dashboard</Button>
        </div>
      </div>
    );
  }

  if (isTimedOut) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16 text-center">
        <Logo variant="mark" size={48} className="mx-auto" />
        <h1 className="mt-4 text-2xl font-semibold">Your payment is being confirmed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your payment is being confirmed. Premium activates automatically once
          confirmed.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="outline" onClick={() => restart()}>
            Check again
          </Button>
          <Button render={<Link href="/dashboard/vendor/subscription" />}>
            Subscription
          </Button>
          <Button variant="outline" render={<Link href="/dashboard" />}>
            Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (data?.status === "paid") {
    const heading = premiumActive
      ? "Premium active"
      : activating
        ? "Payment received, activating your Premium..."
        : "Payment received";

    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16 text-center">
        <Logo variant="mark" size={48} className="mx-auto" />
        <h1 className="mt-4 text-2xl font-semibold">{heading}</h1>
        <Card className="mt-6 text-left">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Confirmation <StatusBadge status="Paid" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">{data.plan ?? "Premium"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">
                {formatPrice(data.amount)}
                {data.currency ? ` (${data.currency})` : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">
                {data.createdAt ? formatDate(data.createdAt) : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">{data.status}</span>
            </div>
          </CardContent>
        </Card>
        <div className="mt-6 flex justify-center gap-2">
          <Button render={<Link href="/dashboard/vendor/subscription" />}>
            <CreditCard className="size-4" />
            Subscription
          </Button>
          <Button variant="outline" render={<Link href="/dashboard" />}>
            Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Processing / still polling.
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 text-center">
      <Logo variant="mark" size={48} className="mx-auto" />
      <h1 className="mt-4 text-2xl font-semibold">Confirming your payment…</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This usually takes a few seconds.
      </p>
      <LoadingScreen label="Verifying payment" />
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingScreen label="Loading" />}>
      <PaymentSuccessInner />
    </Suspense>
  );
}