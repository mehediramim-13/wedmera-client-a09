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
import { queryKeys, useSubscription, useVendorServices } from "@/lib/queries";

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
  const plan = firstString(
    subscription.data,
    "plan",
    "subscriptionPlan",
    "currentPlan",
  ) ?? "free";
  const isPremium = plan.toLowerCase() === "premium";
  const expiresAt = firstString(
    subscription.data,
    "expiresAt",
    "subscriptionExpiresAt",
  );
  const activeServices =
    services.data?.filter((service) => service.isActive).length;

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
      className={`rounded-2xl ${
        selected ? "border-primary/50 shadow-md ring-1 ring-primary/15" : ""
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
