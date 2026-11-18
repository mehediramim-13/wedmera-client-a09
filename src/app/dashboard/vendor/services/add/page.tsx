import type { Metadata } from "next";

import { VendorServiceForm } from "@/components/dashboard/vendor/vendor-service-form";

export const metadata: Metadata = { title: "Add a service" };

export default function AddVendorServicePage() {
  return <VendorServiceForm />;
}
