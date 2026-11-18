import type { Metadata } from "next";

import { VendorServiceEdit } from "@/components/dashboard/vendor/vendor-service-edit";

export const metadata: Metadata = { title: "Edit service" };

export default async function EditVendorServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VendorServiceEdit id={id} />;
}
