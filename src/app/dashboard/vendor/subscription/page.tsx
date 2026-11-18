import type { Metadata } from "next";

import { VendorSubscription } from "@/components/dashboard/vendor/vendor-subscription";

export const metadata: Metadata = { title: "Vendor subscription" };

export default function VendorSubscriptionPage() {
  return <VendorSubscription />;
}
