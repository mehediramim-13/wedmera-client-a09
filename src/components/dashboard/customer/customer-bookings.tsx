"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { CalendarDays, LoaderCircle, MapPin } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatPrice } from "@/components/shared/service-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";
import { queryKeys, useCustomerBooking, useCustomerBookings } from "@/lib/queries";
import type { Booking } from "@/lib/types";

const filters = ["All", "Pending", "Accepted", "Rejected", "Cancelled"] as const;

function dateLabel(value: string) {
  const date = parseISO(value);
  return isValid(date) ? format(date, "PPP") : "Date unavailable";
}

export function CustomerBookings() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const queryClient = useQueryClient();
  const bookings = useCustomerBookings(filter === "All" ? "" : filter);
  const selected = useCustomerBooking(selectedId);

  const cancel = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/customer/bookings/${encodeURIComponent(id)}/cancel`, {
        method: "PATCH",
      }),
    onSuccess: async () => {
      toast.success("Booking request cancelled.");
      setCancelTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["customer", "bookings"] });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.customerOverview,
      });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not cancel this request."),
  });

  return (
    <div>
      <PageHeader
        description="Track each request and revisit the details you shared with a vendor."
        eyebrow="Your wedding workspace"
        title="My bookings"
      />
      <Tabs
        onValueChange={(value) => {
          if (filters.includes(value as (typeof filters)[number])) {
            setFilter(value as (typeof filters)[number]);
          }
        }}
        value={filter}
      >
        <TabsList className="mb-6 flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-muted p-1 sm:w-fit">
          {filters.map((item) => (
            <TabsTrigger className="rounded-lg px-4 py-2" key={item} value={item}>
              {item}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {bookings.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div className="h-36 animate-pulse rounded-2xl bg-muted" key={index} />
          ))}
        </div>
      ) : bookings.isError ? (
        <ErrorState
          message={bookings.error.message}
          onRetry={() => void bookings.refetch()}
        />
      ) : bookings.data?.length ? (
        <div className="space-y-4">
          {bookings.data.map((booking) => (
            <BookingCard
              booking={booking}
              key={booking._id}
              onCancel={() => setCancelTarget(booking)}
              onView={() => setSelectedId(booking._id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          action={
            <Button render={<Link href="/services" />}>
              Browse wedding services
            </Button>
          }
          description="Browse wedding services and submit a booking request on any service page."
          title="You haven’t requested any bookings yet"
        />
      )}

      <Dialog
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        open={Boolean(selectedId)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking details</DialogTitle>
            <DialogDescription>
              Your request and event information.
            </DialogDescription>
          </DialogHeader>
          {selected.isLoading ? (
            <div className="h-40 animate-pulse rounded-xl bg-muted" />
          ) : selected.isError ? (
            <ErrorState
              message={selected.error.message}
              onRetry={() => void selected.refetch()}
            />
          ) : selected.data ? (
            <BookingDetail booking={selected.data} />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        open={Boolean(cancelTarget)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking request?</AlertDialogTitle>
            <AlertDialogDescription>
              You can’t undo this action. The vendor will see the request as
              Cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep request</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancel.isPending}
              onClick={() => {
                if (cancelTarget) cancel.mutate(cancelTarget._id);
              }}
            >
              {cancel.isPending ? (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              ) : null}
              Cancel request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BookingCard({
  booking,
  onView,
  onCancel,
}: {
  booking: Booking;
  onView: () => void;
  onCancel: () => void;
}) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:aspect-square sm:size-24">
          {booking.service?.images?.[0] ? (
            <Image
              alt={booking.service.serviceName}
              className="object-cover"
              fill
              sizes="(max-width: 640px) 100vw, 96px"
              src={booking.service.images[0]}
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={booking.status} />
            <span className="text-xs text-muted-foreground">
              Requested {dateLabel(booking.createdAt)}
            </span>
          </div>
          <h2 className="mt-2 truncate font-heading text-lg font-semibold">
            {booking.service?.serviceName ?? "Wedding service"}
          </h2>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {dateLabel(booking.eventDate)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" />
              {booking.eventLocation}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
          <div className="flex items-center gap-2">
            <Avatar className="size-8">
              <AvatarImage
                alt={booking.vendor?.name ?? "Vendor"}
                src={booking.vendor?.image ?? undefined}
              />
              <AvatarFallback>
                {booking.vendor?.name?.slice(0, 1) ?? "V"}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-28 truncate text-sm">
              {booking.vendor?.businessName ||
                booking.vendor?.name ||
                "Vendor"}
            </span>
          </div>
          <div className="ml-auto flex gap-2 sm:ml-0">
            <Button onClick={onView} size="sm" variant="outline">
              View details
            </Button>
            {booking.status === "Pending" ? (
              <Button onClick={onCancel} size="sm" variant="ghost">
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BookingDetail({ booking }: { booking: Booking }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium">{booking.service?.serviceName ?? "Service"}</p>
        <StatusBadge status={booking.status} />
      </div>
      {booking.service?.price ? (
        <p className="text-sm text-primary">{formatPrice(booking.service.price)}</p>
      ) : null}
      <div className="grid gap-3 rounded-xl bg-muted/50 p-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Event date</p>
          <p className="mt-1 font-medium">{dateLabel(booking.eventDate)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Event location</p>
          <p className="mt-1 font-medium">{booking.eventLocation}</p>
        </div>
      </div>
      {booking.message ? (
        <div>
          <p className="text-xs font-medium text-muted-foreground">Your message</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
            {booking.message}
          </p>
        </div>
      ) : null}
    </div>
  );
}
