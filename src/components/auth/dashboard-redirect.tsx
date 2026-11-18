"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { GuardLoader } from "@/components/shared/guard-loader";
import { authClient } from "@/lib/auth-client";
import { useCurrentUser } from "@/lib/queries";
import { getDashboardPath } from "@/lib/paths";

export function DashboardRedirect() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const userQuery = useCurrentUser(Boolean(session?.user));

  useEffect(() => {
    if (isPending || userQuery.isLoading) return;
    if (!session?.user || userQuery.isError) {
      router.replace("/signin?redirect=%2Fdashboard");
      return;
    }
    if (userQuery.data?.isBlocked) {
      void authClient.signOut();
      router.replace("/signin?blocked=1");
      return;
    }
    if (userQuery.data) {
      router.replace(getDashboardPath(userQuery.data.role));
    }
  }, [
    isPending,
    router,
    session?.user,
    userQuery.data,
    userQuery.isError,
    userQuery.isLoading,
  ]);

  return <GuardLoader label="Opening your dashboard" />;
}
