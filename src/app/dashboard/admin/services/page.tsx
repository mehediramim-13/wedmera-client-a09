import type { Metadata } from "next";

import { AdminServices } from "@/components/dashboard/admin/admin-services";

export const metadata: Metadata = { title: "Manage services" };

export default function AdminServicesPage() {
  return <AdminServices />;
}
