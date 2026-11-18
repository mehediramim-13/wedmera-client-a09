import type { ReactNode } from "react";

import { RoleGuard } from "@/components/auth/role-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function VendorLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard role="vendor">
      <DashboardShell role="vendor">{children}</DashboardShell>
    </RoleGuard>
  );
}
