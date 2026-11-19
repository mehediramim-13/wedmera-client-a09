"use client";

import Image from "next/image";
import Link from "next/link";
import { format, isValid, parseISO } from "date-fns";
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Search,
  XCircle,
} from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatPrice } from "@/components/shared/service-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomerBookings, useCustomerOverview } from "@/lib/queries";
import type { Booking } from "@/lib/types";

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

function dateLabel(value: string) {
  const date = parseISO(value);
  return isValid(date) ? format(date, "PPP") : "Date unavailable";
}

export function CustomerOverview() {
  const overview = useCustomerOverview();
  const bookings = useCustomerBookings();

  if (overview.isLoading || bookings.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="h-28 animate-pulse rounded-xl bg-muted" key={index} />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }
  if (overview.isError || bookings.isError) {
    const error = overview.error ?? bookings.error;
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Your dashboard could not be loaded."}
        onRetry={() => {
          void overview.refetch();
          void bookings.refetch();
        }}
      />
    );
  }

  const data = overview.data;
  const recent = (bookings.data ?? []).slice(0, 4);
  return (
    <div>
      <PageHeader
        description="Track your wedding service inquiries and confirmed vendors at a glance."
        eyebrow="Customer portal"
        title="Customer overview"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewStat
          icon={CalendarCheck}
          label="Total booking requests"
          value={metric(data, "totalBookings", "totalBookingRequests")}
        />
        <OverviewStat
          icon={Clock3}
          label="Pending bookings"
          tone="amber"
          value={metric(data, "pendingBookings", "pending")}
        />
        <OverviewStat
          icon={CheckCircle2}
          label="Accepted bookings"
          tone="green"
          value={metric(data, "acceptedBookings", "accepted")}
        />
        <OverviewStat
          icon={XCircle}
          label="Rejected bookings"
          tone="rose"
          value={metric(data, "rejectedBookings", "rejected")}
        />
      </div>

      <Card className="mt-7 rounded-2xl">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="font-heading text-xl">
            Recent booking requests
          </CardTitle>
          <div className="flex gap-2">
            <Button
              render={<Link href="/dashboard/customer/bookings" />}
              variant="outline"
            >
              Manage all
            </Button>
            <Button render={<Link href="/services" />}>
              <Search className="mr-2 size-4" />
              Browse services
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recent.length ? (
            <div className="divide-y rounded-xl border">
              {recent.map((booking) => (
                <RecentBooking booking={booking} key={booking._id} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed px-5 py-8 text-center">
              <span className="grid size-11 place-items-center rounded-full bg-secondary text-primary">
                <CalendarDays className="size-5" />
              </span>
              <h2 className="mt-3 font-heading text-lg font-semibold">
                No booking requests yet
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Explore our wedding marketplace to send your first inquiry.
              </p>
              <Button className="mt-4" render={<Link href="/services" />}>
                Explore services
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OverviewStat({
  icon: Icon,
  label,
  value,
  tone = "rose",
}: {
  icon: typeof CalendarCheck;
  label: string;
  value: string | number;
  tone?: "rose" | "amber" | "green";
}) {
  const iconTone = {
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  }[tone];

  return (
    <Card className="rounded-2xl">
      <CardContent className="flex min-h-32 items-center justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 font-heading text-3xl font-semibold">{value}</p>
        </div>
        <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${iconTone}`}>
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}

function RecentBooking({ booking }: { booking: Booking }) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:aspect-square sm:size-16">
        {booking.service?.images?.[0] ? (
          <Image
            alt={booking.service.serviceName}
            className="object-cover"
            fill
            sizes="64px"
            src={booking.service.images[0]}
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={booking.status} />
          <span className="text-xs text-muted-foreground">
            Event date: {dateLabel(booking.eventDate)}
          </span>
        </div>
        <p className="mt-1 truncate font-medium">
          {booking.service?.serviceName ?? "Wedding service"}
        </p>
        <p className="text-sm text-muted-foreground">
          {booking.vendor?.businessName || booking.vendor?.name || "Vendor"}
          {" · "}
          {booking.eventLocation}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        {typeof booking.service?.price === "number" ? (
          <span className="text-sm font-semibold text-primary">
            {formatPrice(booking.service.price)}
          </span>
        ) : null}
        <Button
          aria-label={`View ${booking.service?.serviceName ?? "booking"} details`}
          render={<Link href="/dashboard/customer/bookings" />}
          size="icon"
          variant="ghost"
        >
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
