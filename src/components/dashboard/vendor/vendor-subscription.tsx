"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Crown, LoaderCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PREMIUM_PRICE_LABEL } from "@/lib/config";
import { ApiError, apiFetch } from "@/lib/api";
import {
  queryKeys,
  useSubscription,
  useVendorServices,
  useVendorTransactions,
} from "@/lib/queries";
import { isPremiumPlan } from "@/lib/subscription-utils";
import type { Transaction } from "@/lib/types";

const freeFeatures = [
  "Up to 3 active services",
  "Basic vendor dashboard",
  "Booking request management",
];
const premiumFeatures = [
  "Unlimited active services",
  "Premium vendor badge",
  "Featured service placement",
  "All Free plan features",
];

function firstString(
  record: Record<string, unknown> | undefined,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === "string" && value) return value;
  }
  return undefined;
}

export function VendorSubscription() {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const queryClient = useQueryClient();
  const subscription = useSubscription();
  const services = useVendorServices();
  const transactions = useVendorTransactions();
  const plan = firstString(
    subscription.data,
    "plan",
    "subscriptionPlan",
    "currentPlan",
  ) ?? "free";
  const isPremium = isPremiumPlan(plan);
  const expiresAt = firstString(
    subscription.data,
    "expiresAt",
    "subscriptionExpiresAt",
  );
  const activeServices =
    services.data?.filter((service) => service.isActive).length;
  const paymentItems = Array.isArray(transactions.data)
    ? transactions.data
    : transactions.data?.items ?? [];

  const checkout = useMutation({
    mutationFn: () =>
      apiFetch<{ url: string }>("/payments/create-checkout-session", {
        method: "POST",
      }),
    onSuccess: ({ url }) => {
      if (!url) {
        toast.error("The payment service did not return a checkout link.");
        return;
      }
      window.location.assign(url);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not start checkout."),
  });

  const cancel = useMutation({
    mutationFn: () =>
      apiFetch("/payments/cancel-subscription", { method: "POST" }),
    onSuccess: async () => {
      toast.success("Your subscription is set to end at the current period.");
      setConfirmCancel(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.subscription });
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
      await queryClient.invalidateQueries({ queryKey: queryKeys.vendorOverview });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.vendorTransactions,
      });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
        return;
      }
      toast.error("Could not cancel your subscription.");
    },
  });

  if (subscription.isLoading || services.isLoading) {
    return <div className="h-[28rem] animate-pulse rounded-2xl bg-muted" />;
  }
  if (subscription.isError || services.isError) {
    const error = subscription.error ?? services.error;
    return (
      <div className="rounded-2xl border border-destructive/20 p-6 text-sm text-muted-foreground">
        {error instanceof Error
          ? error.message
          : "Subscription details could not be loaded."}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        description="Choose the plan that gives your wedding business room to grow."
        eyebrow="Vendor workspace"
        title="Subscription"
      />
      <Card className="mb-7 rounded-2xl bg-secondary/40">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-card text-primary">
              <Crown className="size-5" />
            </span>
            <div>
              <p className="font-medium">Your current plan</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatusBadge status={isPremium ? "Premium" : "Free"} />
                <span className="text-sm text-muted-foreground">
                  {activeServices ?? "—"} active services
                </span>
              </div>
              {expiresAt ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {isPremium ? "Renews or ends" : "Plan expires"}{" "}
                  {new Date(expiresAt).toLocaleDateString()}
                </p>
              ) : null}
            </div>
          </div>
          {isPremium ? (
            <Button
              onClick={() => setConfirmCancel(true)}
              variant="outline"
            >
              Cancel subscription
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <PlanCard
          description="Everything you need to get started."
          features={freeFeatures}
          name="Free"
          selected={!isPremium}
          price="$0"
        />
        <PlanCard
          action={
            isPremium ? (
              <Button className="w-full" disabled>
                <Check className="mr-2 size-4" />
                You’re on Premium
              </Button>
            ) : (
              <Button
                className="w-full"
                disabled={checkout.isPending}
                onClick={() => checkout.mutate()}
              >
                {checkout.isPending ? (
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 size-4" />
                )}
                Upgrade to Premium
              </Button>
            )
          }
          description="More room to showcase your work and grow."
          features={premiumFeatures}
          name="Premium"
          selected={isPremium}
          price={PREMIUM_PRICE_LABEL}
        />
      </div>
      <Card className="mt-7 rounded-2xl">
        <CardHeader>
          <CardTitle className="font-heading text-xl">
            Your Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.isLoading ? (
            <div className="h-20 animate-pulse rounded-xl bg-muted" />
          ) : transactions.isError ? (
            <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                Payment history could not be loaded.
                {transactions.error instanceof Error
                  ? ` ${transactions.error.message}`
                  : ""}
              </span>
              <Button
                onClick={() => void transactions.refetch()}
                size="sm"
                variant="outline"
              >
                Try again
              </Button>
            </div>
          ) : paymentItems.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-muted-foreground">
                    <th className="px-2 py-3 font-medium">Plan</th>
                    <th className="px-2 py-3 font-medium">Amount</th>
                    <th className="px-2 py-3 font-medium">Status</th>
                    <th className="px-2 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentItems.map((payment, index) => (
                    <PaymentHistoryRow
                      index={index}
                      key={payment._id || payment.id || `${payment.createdAt}-${index}`}
                      payment={payment}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">
              Your completed subscription payments will appear here.
            </p>
          )}
        </CardContent>
      </Card>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        Secure payment checkout is provided by our payment partner. Your plan
        changes only after the server confirms the transaction.
      </p>

      <AlertDialog onOpenChange={setConfirmCancel} open={confirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your Premium subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Premium features and your badge stay active until the current
              billing period ends.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Premium</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancel.isPending}
              onClick={() => cancel.mutate()}
            >
              {cancel.isPending ? (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              ) : null}
              Confirm cancellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PaymentHistoryRow({
  payment,
  index,
}: {
  payment: Transaction;
  index: number;
}) {
  const date = payment.createdAt || payment.date;
  const parsedDate = date ? new Date(date) : undefined;
  const dateLabel =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(parsedDate)
      : "—";
  const numericAmount = Number(payment.amount);
  const amount = Number.isFinite(numericAmount)
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(numericAmount)
    : "—";

  return (
    <tr className={index === 0 ? "" : "border-t"}>
      <td className="px-2 py-4 font-medium">
        {payment.plan || payment.subscriptionPlan || "Premium"}
      </td>
      <td className="px-2 py-4">{amount}</td>
      <td className="px-2 py-4">
        <StatusBadge status={payment.status} />
      </td>
      <td className="px-2 py-4 text-muted-foreground">{dateLabel}</td>
    </tr>
  );
}

function PlanCard({
  name,
  description,
  features,
  price,
  selected,
  action,
}: {
  name: string;
  description: string;
  features: string[];
  price: string;
  selected: boolean;
  action?: React.ReactNode;
}) {
  return (
    <Card
      className={`rounded-2xl transition-colors ${
        selected
          ? "border-amber-400 bg-amber-50/60 shadow-md ring-2 ring-amber-400/40 dark:bg-amber-950/15"
          : ""
      }`}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between font-heading text-2xl">
          {name}
          {selected ? <StatusBadge status="Current plan" /> : null}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="pt-2 text-3xl font-semibold text-primary">
          {price}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            / month
          </span>
        </p>
      </CardHeader>
      <CardContent>
        <ul className="mb-6 space-y-3">
          {features.map((feature) => (
            <li className="flex gap-2 text-sm" key={feature}>
              <Check className="size-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
              {feature}
            </li>
          ))}
        </ul>
        {action}
      </CardContent>
    </Card>
  );
}
