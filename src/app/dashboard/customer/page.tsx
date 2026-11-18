import type { Metadata } from "next";

import { CustomerOverview } from "@/components/dashboard/customer/customer-overview";

export const metadata: Metadata = { title: "Customer dashboard" };

export default function CustomerDashboardPage() {
  return <CustomerOverview />;
}
