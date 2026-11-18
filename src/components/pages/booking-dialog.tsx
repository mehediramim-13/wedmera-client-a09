"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format, startOfDay } from "date-fns";
import { CalendarIcon, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import type { Service } from "@/lib/types";

const bookingSchema = z.object({
  eventDate: z.string().min(1, "Choose your event date."),
  eventLocation: z.string().trim().min(2, "Enter the event location."),
  message: z.string().trim().max(1000, "Keep your message under 1,000 characters."),
});

type BookingValues = z.infer<typeof bookingSchema>;

export function BookingDialog({ service }: { service: Service }) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const queryClient = useQueryClient();
  const form = useForm<BookingValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { eventDate: "", eventLocation: "", message: "" },
  });
  const booking = useMutation({
    mutationFn: (values: BookingValues) =>
      apiFetch("/bookings", {
        method: "POST",
        body: { ...values, serviceId: service._id },
      }),
    onSuccess: async () => {
      toast.success("Your booking request has been sent.");
      await queryClient.invalidateQueries({ queryKey: ["customer"] });
      form.reset();
      setSelectedDate(undefined);
      setOpen(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not send your request.",
      );
    },
  });

  function submit(values: BookingValues) {
    booking.mutate(values);
  }

  return (
    <>
      <Button
        className="h-11 w-full"
        disabled={service.status !== "Approved"}
        onClick={() => setOpen(true)}
      >
        {service.status === "Approved" ? "Request to book" : "Not available to book"}
      </Button>
      {service.status !== "Approved" ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          This service must be approved before it can receive booking requests.
        </p>
      ) : null}
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request this service</DialogTitle>
            <DialogDescription>
              Share the key details of your celebration with the vendor.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={form.handleSubmit(submit)}>
            <div className="space-y-2">
              <Label htmlFor="event-date">Event date</Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      aria-invalid={Boolean(form.formState.errors.eventDate)}
                      className="h-10 w-full justify-start text-left font-normal"
                      id="event-date"
                      variant="outline"
                    />
                  }
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {selectedDate
                    ? format(selectedDate, "PPP")
                    : "Choose a future date"}
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    disabled={(date) => date < startOfDay(new Date())}
                    mode="single"
                    onSelect={(date) => {
                      setSelectedDate(date);
                      form.setValue(
                        "eventDate",
                        date ? format(date, "yyyy-MM-dd") : "",
                        { shouldDirty: true, shouldValidate: true },
                      );
                    }}
                    selected={selectedDate}
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.eventDate ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.eventDate.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-location">Event location</Label>
              <Input
                autoComplete="address-level2"
                id="event-location"
                placeholder="City, venue, or neighborhood"
                {...form.register("eventLocation")}
              />
              {form.formState.errors.eventLocation ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.eventLocation.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-message">A note for the vendor</Label>
              <Textarea
                id="booking-message"
                placeholder="Tell them what you have in mind..."
                rows={4}
                {...form.register("message")}
              />
              {form.formState.errors.message ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.message.message}
                </p>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                className="w-full sm:w-auto"
                disabled={booking.isPending}
                type="submit"
              >
                {booking.isPending ? (
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                ) : null}
                Send request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
