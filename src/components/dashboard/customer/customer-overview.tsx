"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
} from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomerOverview } from "@/lib/queries";

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

export function CustomerOverview() {
  const overview = useCustomerOverview();

  if (overview.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
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
        description="Keep an eye on your requests and take the next step toward your celebration."
        eyebrow="Your wedding workspace"
        title="Your plans, all in one place"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarDays}
          label="Booking requests"
          value={metric(data, "totalBookings", "totalBookingRequests")}
        />
        <StatCard
          icon={Clock3}
          label="Pending"
          value={metric(data, "pendingBookings", "pending")}
        />
        <StatCard
          icon={CheckCircle2}
          label="Accepted"
          value={metric(data, "acceptedBookings", "accepted")}
        />
        <StatCard
          icon={FileCheck2}
          label="Rejected"
          value={metric(data, "rejectedBookings", "rejected")}
        />
      </div>
      <Card className="mt-8 rounded-2xl bg-secondary/35">
        <CardHeader>
          <CardTitle className="font-heading text-xl">
            A little more inspiration
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Keep discovering local photographers, venues, florists, caterers,
            stylists, and wedding fashion professionals.
          </p>
          <Button render={<Link href="/services" />}>
            Browse services <ArrowRight className="ml-2 size-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
