"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { GuardLoader } from "@/components/shared/guard-loader";
import { authClient } from "@/lib/auth-client";
import { getDashboardPath } from "@/lib/paths";
import { getRoleFromUser } from "@/lib/auth-routing";

export function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace(
        getDashboardPath(getRoleFromUser(session.user.role)),
      );
    }
  }, [isPending, router, session]);

  if (isPending || session?.user) {
    return <GuardLoader label="Checking your session" />;
  }

  return children;
}
