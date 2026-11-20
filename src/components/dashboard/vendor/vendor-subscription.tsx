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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  useCancelSubscription,
  useCreateCheckout,
  useResumeSubscription,
  useVendorOverview,
  useVendorSubscription,
} from "@/hooks/use-vendor";
import { PREMIUM_PRICE_LABEL } from "@/lib/config";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function VendorSubscription() {
  const subscriptionQuery = useVendorSubscription();
  const overviewQuery = useVendorOverview();
  const checkout = useCreateCheckout();
  const cancel = useCancelSubscription();
  const resume = useResumeSubscription();

  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const subscription = subscriptionQuery.data;
  // Single source of truth: the plan value returned by GET /vendor/subscription.
  const isPremium = subscription?.effectivePlan === "premium";
  const expiresAt = subscription?.expiresAt ?? null;
  const periodStart = subscription?.currentPeriodStart ?? null;
  const periodEnd = subscription?.currentPeriodEnd ?? expiresAt;
  const cancelAtPeriodEnd = Boolean(subscription?.cancelAtPeriodEnd);
  const activeCount = subscription?.activeServicesCount ?? overviewQuery.data?.activeServices ?? 0;
  const limit = subscription?.limits.activeServices ?? 3;

  const showCancel = isPremium && !cancelAtPeriodEnd && !subscriptionQuery.isPending;

  const payments =
    subscription?.payments ?? subscription?.paymentHistory ?? [];

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

      {subscriptionQuery.isLoading || !subscription ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading your subscription…
        </div>
      ) : null}

      {subscription ? (
        <>
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
                {isPremium && periodStart ? (
                  <p className="text-xs text-muted-foreground">
                    Started on {formatDate(periodStart)}.
                  </p>
                ) : null}
                {isPremium && periodEnd ? (
                  <p className="text-xs text-muted-foreground">
                    {cancelAtPeriodEnd
                      ? `Ends on ${formatDate(periodEnd)}.`
                      : `Renews on ${formatDate(periodEnd)}.`}
                  </p>
                ) : null}
                {isPremium && cancelAtPeriodEnd && periodEnd ? (
                  <p className="text-xs text-muted-foreground">
                    Your Premium plan is cancelled. You keep Premium features until then.
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
                ) : cancelAtPeriodEnd ? (
                  <Button
                    className="w-full"
                    disabled={resume.isPending}
                    onClick={() => resume.mutate()}
                  >
                    {resume.isPending ? "Resuming…" : "Resume subscription"}
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
              </CardFooter>
            </Card>
          </div>

          {isPremium ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Current status</CardTitle>
                <CardDescription>Your current plan and expiry date.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3 text-sm">
                <StatusBadge status="Premium" />
                <span className="text-muted-foreground">
                  {periodEnd
                    ? cancelAtPeriodEnd
                      ? `Premium ends on ${formatDate(periodEnd)}.`
                      : `Premium renews on ${formatDate(periodEnd)}.`
                    : "Premium is active."}
                </span>
                <span className="text-muted-foreground">
                  Active services: {activeCount}
                </span>
              </CardContent>
            </Card>
          ) : null}

          {payments.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment history</CardTitle>
                <CardDescription>Your Premium payments.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Paid on</TableHead>
                        <TableHead>Valid from</TableHead>
                        <TableHead>Valid until</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment, index) => (
                        <TableRow key={payment._id ?? index}>
                          <TableCell>{payment.plan ?? "—"}</TableCell>
                          <TableCell>
                            {payment.amount != null
                              ? formatPrice(payment.amount)
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={payment.status ?? "—"} />
                          </TableCell>
                          <TableCell>
                            {payment.createdAt ? formatDate(payment.createdAt) : "—"}
                          </TableCell>
                          <TableCell>
                            {payment.periodStart
                              ? formatDate(payment.periodStart)
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {payment.periodEnd
                              ? formatDate(payment.periodEnd)
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </>
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