"use client";

import * as React from "react";
import { CreditCard, Crown, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  useCancelSubscription,
  useCreateCheckout,
  useVendorOverview,
  useVendorSubscription,
} from "@/hooks/use-vendor";
import { PREMIUM_PRICE_LABEL } from "@/lib/config";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function VendorSubscription() {
  const subscriptionQuery = useVendorSubscription();
  const overviewQuery = useVendorOverview();
  const checkout = useCreateCheckout();
  const cancel = useCancelSubscription();

  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const subscription = subscriptionQuery.data;
  const overview = overviewQuery.data;
  const isPremium = subscription?.effectivePlan === "premium";
  const expiresAt = subscription?.expiresAt ?? overview?.subscriptionExpiresAt ?? null;
  const activeCount = subscription?.activeServicesCount ?? overview?.activeServices ?? 0;
  const limit = subscription?.limits.activeServices ?? 3;

  // Decide UI from refetched server data only.
  const showCancel = isPremium && !subscriptionQuery.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vendor workspace"
        title="Subscription"
        description="Compare plans and manage your WedMera Premium membership."
      />

      {subscriptionQuery.isError ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          We could not load your subscription. Please try again.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Free plan */}
        <Card className={cn(!isPremium && "border-primary/40")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4" aria-hidden />
                Free
              </CardTitle>
              {!isPremium ? <StatusBadge status="Free" /> : null}
            </div>
            <CardDescription>Get started with a limited number of listings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ul className="space-y-2 text-muted-foreground">
              <li>Up to {limit} active services</li>
              <li>Basic vendor dashboard</li>
              <li>Booking request management</li>
            </ul>
            <p className="text-lg font-semibold">৳ 0</p>
          </CardContent>
          <CardFooter>
            {!isPremium ? (
              <Button variant="outline" className="w-full" disabled>
                Current plan
              </Button>
            ) : null}
          </CardFooter>
        </Card>

        {/* Premium plan */}
        <Card className={cn(isPremium && "border-[var(--status-premium-fg)]/40 bg-[var(--status-premium-bg)]/20")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Crown className="size-4 text-[var(--status-premium-fg)]" aria-hidden />
                Premium
              </CardTitle>
              {isPremium ? <StatusBadge status="Premium" /> : null}
            </div>
            <CardDescription>Unlimited listings and a Premium vendor badge.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ul className="space-y-2 text-muted-foreground">
              <li>Unlimited active services</li>
              <li>Premium vendor badge</li>
              <li>All Free plan features</li>
            </ul>
            <p className="text-lg font-semibold">{PREMIUM_PRICE_LABEL}</p>
            {isPremium && expiresAt ? (
              <p className="text-xs text-muted-foreground">
                Premium is active until {formatDate(expiresAt)}.
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            {!isPremium ? (
              <Button
                className="w-full"
                disabled={checkout.isPending}
                onClick={() => checkout.mutate()}
              >
                {checkout.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <CreditCard className="size-4 animate-pulse" aria-hidden />
                    Redirecting…
                  </span>
                ) : (
                  <>
                    <CreditCard className="size-4" aria-hidden />
                    Upgrade to Premium
                  </>
                )}
              </Button>
            ) : showCancel ? (
              <Button
                variant="destructive"
                className="w-full"
                disabled={cancel.isPending}
                onClick={() => setConfirmOpen(true)}
              >
                {cancel.isPending ? "Cancelling…" : "Cancel subscription"}
              </Button>
            ) : null}
            {isPremium && expiresAt && !showCancel ? (
              <p className="text-xs text-muted-foreground">
                Premium until {formatDate(expiresAt)}, will not renew.
              </p>
            ) : null}
          </CardFooter>
        </Card>
      </div>

      {isPremium ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current status</CardTitle>
            <CardDescription>Your plan and expiry date.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3 text-sm">
            <StatusBadge status={isPremium ? "Premium" : "Free"} />
            <span className="text-muted-foreground">
              {isPremium
                ? expiresAt
                  ? `Premium is active until ${formatDate(expiresAt)}.`
                  : "Premium is active."
                : "You are on the Free plan. Upgrade any time."}
            </span>
            <span className="text-muted-foreground">
              Active services: {activeCount}
              {isPremium ? "" : ` / ${limit}`}
            </span>
          </CardContent>
        </Card>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Cancel your Premium subscription?"
        description="Your Premium features stay active until the end of the paid period. After that, your account returns to the Free plan."
        confirmLabel="Cancel subscription"
        destructive
        loading={cancel.isPending}
        onConfirm={async () => {
          try {
            await cancel.mutateAsync();
            setConfirmOpen(false);
          } catch {
            // The mutation already surfaces the server message.
          }
        }}
      />
    </div>
  );
}