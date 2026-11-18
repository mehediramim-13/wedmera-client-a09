"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { GuardLoader } from "@/components/shared/guard-loader";
import { authClient } from "@/lib/auth-client";
import { useCurrentUser } from "@/lib/queries";
import { getDashboardPath } from "@/lib/paths";
import { getRoleFromUser } from "@/lib/auth-routing";
import type { UserRole } from "@/lib/types";

export function RoleGuard({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const userQuery = useCurrentUser(Boolean(session?.user));
  const user = userQuery.data;

  useEffect(() => {
    if (sessionPending || userQuery.isLoading) return;

    if (!session?.user) {
      router.replace(`/signin?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (userQuery.isError) return;
    if (!user) return;

    if (user.isBlocked) {
      void authClient.signOut();
      router.replace("/signin?blocked=1");
      return;
    }

    if (user.role !== role) {
      toast.error("Access denied");
      router.replace(getDashboardPath(getRoleFromUser(user.role)));
    }
  }, [
    pathname,
    role,
    router,
    session?.user,
    sessionPending,
    user,
    userQuery.isError,
    userQuery.isLoading,
  ]);

  const allowed =
    !sessionPending &&
    Boolean(session?.user) &&
    !userQuery.isLoading &&
    !userQuery.isError &&
    Boolean(user) &&
    !user?.isBlocked &&
    user?.role === role;

  if (allowed) return children;
  if (userQuery.isError && !sessionPending) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="font-heading text-2xl font-semibold">
          We couldn’t verify your account
        </p>
        <p className="text-sm text-muted-foreground">
          Refresh the page or sign in again to continue.
        </p>
      </div>
    );
  }
  return <GuardLoader label="Verifying your access" />;
}
