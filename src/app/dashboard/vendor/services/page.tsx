import type { Metadata } from "next";

import { VendorServices } from "@/components/dashboard/vendor/vendor-services";

export const metadata: Metadata = { title: "My services" };

export default function VendorServicesPage() {
  return <VendorServices />;
}
