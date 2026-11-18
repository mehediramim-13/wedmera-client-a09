"use client";

import {
  BriefcaseBusiness,
  CreditCard,
  UserRound,
  Users,
} from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { useAdminOverview } from "@/lib/queries";

function metric(
  data: Record<string, number | string | null> | undefined,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = data?.[key];
    if (typeof value === "number" || typeof value === "string") return value;
  }
  return "—";
}

export function AdminOverview() {
  const overview = useAdminOverview();

  if (overview.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="h-28 animate-pulse rounded-xl bg-muted" key={index} />
          ))}
        </div>
      </div>
    );
  }
  if (overview.isError) {
    return (
      <ErrorState
        message={overview.error.message}
        onRetry={() => void overview.refetch()}
      />
    );
  }

  const data = overview.data;
  return (
    <div>
      <PageHeader
        description="A clear view of activity across the WedMera marketplace."
        eyebrow="Administration"
        title="Platform overview"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total users"
          value={metric(data, "totalUsers", "userCount")}
        />
        <StatCard
          icon={UserRound}
          label="Vendors"
          value={metric(data, "totalVendors", "vendorCount")}
        />
        <StatCard
          icon={BriefcaseBusiness}
          label="Services"
          value={metric(data, "totalServices", "serviceCount")}
        />
        <StatCard
          icon={CreditCard}
          label="Transactions"
          value={metric(data, "totalTransactions", "transactionCount")}
        />
      </div>
    </div>
  );
}
