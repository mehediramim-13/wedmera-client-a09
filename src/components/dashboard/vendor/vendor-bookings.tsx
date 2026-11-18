"use client";

import { useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { Check, ChevronDown, ChevronUp, LoaderCircle, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";
import { useVendorBookings } from "@/lib/queries";
import type { Booking } from "@/lib/types";

type ActionIntent = "accept" | "reject";
const filters = ["All", "Pending", "Accepted", "Rejected"] as const;

function eventDate(value: string) {
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, "PPP") : "Date unavailable";
}

export function VendorBookings() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [intent, setIntent] = useState<{
    booking: Booking;
    action: ActionIntent;
  } | null>(null);
  const queryClient = useQueryClient();
  const bookings = useVendorBookings(filter === "All" ? "" : filter);

  const updateStatus = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: ActionIntent;
    }) =>
      apiFetch(`/vendor/bookings/${encodeURIComponent(id)}/${action}`, {
        method: "PATCH",
      }),
    onSuccess: async () => {
      toast.success(
        intent?.action === "accept"
          ? "Booking request accepted."
          : "Booking request declined.",
      );
      setIntent(null);
      await queryClient.invalidateQueries({ queryKey: ["vendor", "bookings"] });
      await queryClient.invalidateQueries({
        queryKey: ["vendor", "overview"],
      });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update this request."),
  });

  return (
    <div>
      <PageHeader
        description="Review event details, reply to customers, and keep each request moving."
        eyebrow="Vendor workspace"
        title="Booking requests"
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
          {Array.from({ length: 4 }, (_, index) => (
            <div className="h-40 animate-pulse rounded-2xl bg-muted" key={index} />
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
            <BookingRequestCard
              booking={booking}
              key={booking._id}
              onAction={(action) => setIntent({ booking, action })}
              pending={updateStatus.isPending}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          description="When a couple sends a request, you’ll find their event details here."
          title="No booking requests yet"
        />
      )}
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setIntent(null);
        }}
        open={Boolean(intent)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {intent?.action === "accept"
                ? "Accept this booking request?"
                : "Decline this booking request?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {intent?.booking.customer?.name ?? "This customer"} will see the
              updated booking status in their dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction
              disabled={updateStatus.isPending}
              onClick={() => {
                if (intent) {
                  updateStatus.mutate({
                    id: intent.booking._id,
                    action: intent.action,
                  });
                }
              }}
            >
              {updateStatus.isPending ? (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              ) : null}
              {intent?.action === "accept" ? "Accept request" : "Decline request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BookingRequestCard({
  booking,
  onAction,
  pending,
}: {
  booking: Booking;
  onAction: (action: ActionIntent) => void;
  pending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={booking.status} />
              <span className="text-xs text-muted-foreground">
                Requested {eventDate(booking.createdAt)}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-8 gap-y-4">
              <div className="flex min-w-52 items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage
                    alt={booking.customer?.name ?? "Customer"}
                    src={booking.customer?.image ?? undefined}
                  />
                  <AvatarFallback>
                    {booking.customer?.name?.slice(0, 1) ?? "C"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {booking.customer?.name ?? "Customer"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {booking.customer?.email ?? "Email unavailable"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Service</p>
                <p className="mt-1 font-medium">
                  {booking.service?.serviceName ?? "Wedding service"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Event date</p>
                <p className="mt-1 font-medium">{eventDate(booking.eventDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Event location</p>
                <p className="mt-1 font-medium">{booking.eventLocation}</p>
              </div>
            </div>
            {booking.message ? (
              <div className="mt-4 rounded-xl bg-muted/60 p-3">
                <button
                  aria-expanded={expanded}
                  className="flex w-full items-center justify-between gap-3 text-left text-sm font-medium"
                  onClick={() => setExpanded((value) => !value)}
                  type="button"
                >
                  Customer message
                  {expanded ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </button>
                {expanded ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {booking.message}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          {booking.status === "Pending" ? (
            <div className="flex shrink-0 gap-2">
              <Button
                disabled={pending}
                onClick={() => onAction("reject")}
                variant="outline"
              >
                <X className="mr-1.5 size-4" />
                Decline
              </Button>
              <Button disabled={pending} onClick={() => onAction("accept")}>
                <Check className="mr-1.5 size-4" />
                Accept
              </Button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
