import type { ReactNode } from "react";

import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard role="customer">
      <DashboardShell role="customer">{children}</DashboardShell>
    </RoleGuard>
  );
}
