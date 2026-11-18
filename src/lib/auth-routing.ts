import { getDashboardPath } from "@/lib/paths";
import type { UserRole } from "@/lib/types";

export function getSafeRedirect(
  redirect: string | null,
  role: UserRole,
): string {
  const fallback = getDashboardPath(role);
  if (
    !redirect ||
    !redirect.startsWith("/") ||
    redirect.startsWith("//") ||
    redirect.includes("\\")
  ) {
    return fallback;
  }

  const path = redirect.split(/[?#]/, 1)[0];
  if (path === "/dashboard") return fallback;
  if (
    path.startsWith("/dashboard/vendor") &&
    role !== "vendor"
  ) {
    return fallback;
  }
  if (
    path.startsWith("/dashboard/customer") &&
    role !== "customer"
  ) {
    return fallback;
  }
  if (path.startsWith("/dashboard/admin") && role !== "admin") {
    return fallback;
  }

  return redirect;
}

export function getRoleFromUser(value: unknown): UserRole | undefined {
  if (
    value === "admin" ||
    value === "vendor" ||
    value === "customer"
  ) {
    return value;
  }
  return undefined;
}
