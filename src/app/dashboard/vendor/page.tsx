import type { Metadata } from "next";

import { VendorOverview } from "@/components/dashboard/vendor/vendor-overview";

export const metadata: Metadata = { title: "Vendor dashboard" };

export default function VendorDashboardPage() {
  return <VendorOverview />;
}
