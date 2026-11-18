import type { Metadata } from "next";

import { VendorBookings } from "@/components/dashboard/vendor/vendor-bookings";

export const metadata: Metadata = { title: "Booking requests" };

export default function VendorBookingsPage() {
  return <VendorBookings />;
}
