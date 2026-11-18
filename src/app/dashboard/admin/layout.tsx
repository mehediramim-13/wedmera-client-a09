import type { ReactNode } from "react";

import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard role="admin">
      <DashboardShell role="admin">{children}</DashboardShell>
    </RoleGuard>
  );
}
