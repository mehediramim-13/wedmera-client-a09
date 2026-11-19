"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { isPremiumPlan } from "@/lib/subscription-utils";
import type {
  Booking,
  CategoryCount,
  DashboardOverview,
  Paginated,
  Service,
  ServicePage,
  Transaction,
  User,
} from "@/lib/types";

export const queryKeys = {
  categories: ["categories"] as const,
  services: (params: string) => ["services", params] as const,
  service: (id: string) => ["service", id] as const,
  me: ["me"] as const,
  paymentSession: (sessionId: string) =>
    ["payment", "session", sessionId] as const,
  vendorOverview: ["vendor", "overview"] as const,
  vendorServices: ["vendor", "services"] as const,
  vendorTransactions: ["vendor", "transactions"] as const,
  vendorBookings: (status: string) => ["vendor", "bookings", status] as const,
  subscription: ["vendor", "subscription"] as const,
  customerOverview: ["customer", "overview"] as const,
  customerBookings: (status: string) =>
    ["customer", "bookings", status] as const,
  customerBooking: (id: string) => ["customer", "booking", id] as const,
  adminOverview: ["admin", "overview"] as const,
  adminUsers: (params: string) => ["admin", "users", params] as const,
  adminServices: (params: string) => ["admin", "services", params] as const,
  transactions: (params: string) => ["admin", "transactions", params] as const,
};

export const queryFns = {
  me: () => apiFetch<User>("/users/me"),
  vendorOverview: () => apiFetch<DashboardOverview>("/vendor/overview"),
  subscription: () => apiFetch<Record<string, unknown>>("/vendor/subscription"),
};

function makeSearchParams(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && String(value).trim() !== "") {
      search.set(key, String(value));
    }
  }
  return search.toString();
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => apiFetch<CategoryCount[]>("/categories", { auth: false }),
  });
}

export function useServices(
  params: Record<string, string | number | undefined> = {},
) {
  const search = makeSearchParams(params);
  return useQuery({
    queryKey: queryKeys.services(search),
    queryFn: () =>
      apiFetch<ServicePage>(`/services${search ? `?${search}` : ""}`, {
        auth: false,
      }),
  });
}

export function useService(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.service(id),
    queryFn: () =>
      apiFetch<Service>(`/services/${encodeURIComponent(id)}`),
    enabled: Boolean(id) && enabled,
  });
}

export function useCurrentUser(enabled = true) {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: queryFns.me,
    enabled,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useVendorOverview(enabled = true) {
  return useQuery({
    queryKey: queryKeys.vendorOverview,
    queryFn: queryFns.vendorOverview,
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function usePaymentSession(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.paymentSession(sessionId ?? ""),
    queryFn: async () => {
      const response = await apiFetch<unknown>(
        `/payments/session/${encodeURIComponent(sessionId ?? "")}`,
      );
      const transaction =
        typeof response === "object" &&
        response !== null &&
        "transaction" in response
          ? response.transaction
          : response;
      const hasTransactionId =
        typeof transaction === "object" &&
        transaction !== null &&
        (("_id" in transaction && typeof transaction._id === "string") ||
          ("id" in transaction && typeof transaction.id === "string"));
      if (
        typeof transaction !== "object" ||
        transaction === null ||
        !("status" in transaction) ||
        typeof transaction.status !== "string" ||
        !hasTransactionId
      ) {
        throw new Error("The payment session could not be verified.");
      }
      return transaction;
    },
    enabled: Boolean(sessionId),
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useVendorServices(enabled = true) {
  return useQuery({
    queryKey: queryKeys.vendorServices,
    queryFn: () => apiFetch<Service[]>("/vendor/services"),
    enabled,
  });
}

export function useVendorTransactions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.vendorTransactions,
    queryFn: () =>
      apiFetch<Paginated<Transaction> | Transaction[]>("/vendor/transactions"),
    enabled,
    retry: false,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useVendorBookings(status = "", enabled = true) {
  const search = makeSearchParams({ status });
  return useQuery({
    queryKey: queryKeys.vendorBookings(status),
    queryFn: () =>
      apiFetch<Booking[]>(`/vendor/bookings${search ? `?${search}` : ""}`),
    enabled,
  });
}

export function useSubscription(
  enabled = true,
  confirmPayment = false,
) {
  return useQuery({
    queryKey: queryKeys.subscription,
    queryFn: queryFns.subscription,
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: confirmPayment
      ? (query) => {
          const plan =
            query.state.data?.effectivePlan;
          if (isPremiumPlan(plan)) return false;
          if (
            query.state.dataUpdateCount + query.state.errorUpdateCount >=
            15
          ) {
            return false;
          }
          return 2_000;
        }
      : false,
  });
}

export function useCustomerOverview(enabled = true) {
  return useQuery({
    queryKey: queryKeys.customerOverview,
    queryFn: () => apiFetch<DashboardOverview>("/customer/overview"),
    enabled,
  });
}

export function useCustomerBookings(status = "", enabled = true) {
  const search = makeSearchParams({ status });
  return useQuery({
    queryKey: queryKeys.customerBookings(status),
    queryFn: () =>
      apiFetch<Booking[]>(`/customer/bookings${search ? `?${search}` : ""}`),
    enabled,
  });
}

export function useCustomerBooking(id: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.customerBooking(id ?? ""),
    queryFn: () =>
      apiFetch<Booking>(`/customer/bookings/${encodeURIComponent(id ?? "")}`),
    enabled: Boolean(id) && enabled,
  });
}

export function useAdminOverview(enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminOverview,
    queryFn: () => apiFetch<DashboardOverview>("/admin/overview"),
    enabled,
  });
}

export function useAdminUsers(
  params: Record<string, string | number | undefined>,
  enabled = true,
) {
  const search = makeSearchParams(params);
  return useQuery({
    queryKey: queryKeys.adminUsers(search),
    queryFn: () =>
      apiFetch<Paginated<User>>(`/admin/users${search ? `?${search}` : ""}`),
    enabled,
  });
}

export function useAdminServices(
  params: Record<string, string | number | undefined>,
  enabled = true,
) {
  const search = makeSearchParams(params);
  return useQuery({
    queryKey: queryKeys.adminServices(search),
    queryFn: () =>
      apiFetch<ServicePage>(
        `/admin/services${search ? `?${search}` : ""}`,
      ),
    enabled,
  });
}

export function useAdminTransactions(
  params: Record<string, string | number | undefined>,
  enabled = true,
) {
  const search = makeSearchParams(params);
  return useQuery({
    queryKey: queryKeys.transactions(search),
    queryFn: () =>
      apiFetch<Paginated<Transaction>>(
        `/admin/transactions${search ? `?${search}` : ""}`,
      ),
    enabled,
  });
}
