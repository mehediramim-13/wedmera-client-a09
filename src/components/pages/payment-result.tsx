"use client";

import Link from "next/link";
import { CheckCircle2, CircleAlert, XCircle } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription } from "@/lib/queries";

export function PaymentSuccess() {
  const subscription = useSubscription();
  const plan = subscription.data?.plan ?? subscription.data?.subscriptionPlan;
  const premium =
    typeof plan === "string" && plan.toLowerCase() === "premium";

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
            Checking subscription status…
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
          <StatusBadge status="Premium" />
        ) : null}
      </div>
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
