"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Package,
  Plus,
} from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVendorOverview } from "@/lib/queries";

function metric(
  data: Record<string, number | string | null> | undefined,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = data?.[key];
    if (typeof value === "number" || typeof value === "string") return value;
  }
  return "—";
}

export function VendorOverview() {
  const overview = useVendorOverview();

  if (overview.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 5 }, (_, index) => (
            <div className="h-28 animate-pulse rounded-xl bg-muted" key={index} />
          ))}
        </div>
      </div>
    );
  }
  if (overview.isError) {
    return (
      <ErrorState
        message={overview.error.message}
        onRetry={() => void overview.refetch()}
      />
    );
  }

  const data = overview.data;
  return (
    <div>
      <PageHeader
        action={
          <Button render={<Link href="/dashboard/vendor/services/add" />}>
            <Plus className="mr-2 size-4" />
            Add a service
          </Button>
        }
        description="A clear view of your listings, requests, and subscription."
        eyebrow="Vendor workspace"
        title="Welcome to your dashboard"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          detail="Across your account"
          icon={Package}
          label="Total services"
          value={metric(data, "totalServices", "serviceCount")}
        />
        <StatCard
          icon={CheckCircle2}
          label="Active services"
          value={metric(data, "activeServices", "activeServiceCount")}
        />
        <StatCard
          icon={CalendarDays}
          label="Pending requests"
          value={metric(data, "pendingBookings", "pendingBookingRequests")}
        />
        <StatCard
          icon={CheckCircle2}
          label="Accepted bookings"
          value={metric(data, "acceptedBookings", "acceptedBookingCount")}
        />
        <StatCard
          detail="Current plan"
          icon={CreditCard}
          label="Subscription"
          value={metric(data, "effectivePlan")}
        />
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="font-heading text-xl">
              Build a booking-ready profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Keep your services up to date, respond to requests promptly, and
              make it easy for couples to picture your work in their celebration.
            </p>
            <Button
              className="mt-5"
              render={<Link href="/dashboard/vendor/services" />}
              variant="outline"
            >
              Manage my services <ArrowRight className="ml-2 size-4" />
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-secondary/45">
          <CardHeader>
            <CardTitle className="font-heading text-xl">
              Quick actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button
              className="justify-start"
              render={<Link href="/dashboard/vendor/bookings" />}
              variant="ghost"
            >
              <CalendarDays className="mr-2 size-4" />
              Review booking requests
            </Button>
            <Button
              className="justify-start"
              render={<Link href="/dashboard/vendor/subscription" />}
              variant="ghost"
            >
              <CreditCard className="mr-2 size-4" />
              View subscription options
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
