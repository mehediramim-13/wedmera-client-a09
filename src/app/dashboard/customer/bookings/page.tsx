import type { Metadata } from "next";

import { CustomerBookings } from "@/components/dashboard/customer/customer-bookings";

export const metadata: Metadata = { title: "My bookings" };

export default function CustomerBookingsPage() {
  return <CustomerBookings />;
}
