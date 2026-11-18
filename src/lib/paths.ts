import type { UserRole } from "@/lib/types";

export function getDashboardPath(role?: UserRole) {
  if (role === "admin") return "/dashboard/admin";
  if (role === "vendor") return "/dashboard/vendor";
  if (role === "customer") return "/dashboard/customer";
  return "/dashboard";
}

export function getProfilePath(role?: UserRole) {
  if (role === "admin") return "/dashboard/admin/profile";
  if (role === "vendor") return "/dashboard/vendor/profile";
  return "/dashboard/customer/profile";
}
