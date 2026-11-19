"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, CheckCircle2, CircleAlert, XCircle } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PREMIUM_PRICE_LABEL } from "@/lib/config";
import { queryKeys, useSubscription } from "@/lib/queries";
import { isPremiumPlan } from "@/lib/subscription-utils";

const premiumFeatures = [
  "Unlimited active services",
  "Premium vendor badge",
  "Featured service placement",
  "Basic vendor dashboard",
  "Booking request management",
];

export function PaymentSuccess() {
  const queryClient = useQueryClient();
  const subscription = useSubscription(true, true);
  const plan =
    subscription.data?.plan ??
    subscription.data?.subscriptionPlan ??
    subscription.data?.currentPlan;
  const premium = isPremiumPlan(plan);

  useEffect(() => {
    if (!premium) return;
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.me }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.vendorOverview,
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.vendorServices,
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.vendorTransactions,
      }),
    ]);
  }, [premium, queryClient]);

  return (
    <PaymentLayout>
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="size-8" />
      </span>
      <h1 className="mt-5 font-heading text-3xl font-semibold">
        Payment received
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        {premium
          ? "Your Premium subscription is active. You can now enjoy all the benefits of your plan."
          : "Your payment is being confirmed. Your plan will update as soon as the server verifies the transaction."}
      </p>
      <div className="mt-5 flex min-h-8 items-center justify-center">
        {subscription.isLoading ? (
          <span className="text-sm text-muted-foreground">
            Confirming your Premium subscription…
          </span>
        ) : subscription.isError ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleAlert className="size-4" />
            We couldn’t refresh your plan status.
            <button
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => void subscription.refetch()}
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
