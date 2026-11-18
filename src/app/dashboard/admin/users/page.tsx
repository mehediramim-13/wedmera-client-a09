import type { Metadata } from "next";

import { AdminUsers } from "@/components/dashboard/admin/admin-users";

export const metadata: Metadata = { title: "Manage users" };

export default function AdminUsersPage() {
  return <AdminUsers />;
}
