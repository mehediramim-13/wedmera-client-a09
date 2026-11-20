"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, errorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type {
  AdminOverview,
  AdminUser,
  Paginated,
  Service,
  Transaction,
} from "@/lib/types";

export interface AdminUsersParams {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export function useAdminOverview() {
  return useQuery({
    queryKey: queryKeys.adminOverview,
    queryFn: () => apiFetch<AdminOverview>("/admin/overview"),
  });
}

function toQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function useAdminUsers(params: AdminUsersParams) {
  return useQuery({
    queryKey: queryKeys.adminUsers(params as Record<string, unknown>),
    queryFn: () => apiFetch<Paginated<AdminUser>>(`/admin/users${toQuery(params as Record<string, string | number | undefined>)}`),
  });
}

export function useAdminUser(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminUser(id ?? ""),
    queryFn: () => apiFetch<AdminUser>(`/admin/users/${id}`),
    enabled: Boolean(id) && enabled,
  });
}

export function useBlockUser(action: "block" | "unblock") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<null>(`/admin/users/${id}/${action}`, { method: "PATCH" }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview }),
      ]);
      toast.success(action === "block" ? "User blocked." : "User unblocked.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export interface AdminServicesParams {
  search?: string;
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export function useAdminServices(params: AdminServicesParams) {
  return useQuery({
    queryKey: queryKeys.adminServices(params as Record<string, unknown>),
    queryFn: () => apiFetch<Paginated<Service>>(`/admin/services${toQuery(params as Record<string, string | number | undefined>)}`),
  });
}

export function useUpdateServiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch<Service>(`/admin/services/${id}/status`, {
        method: "PATCH",
        body: { status },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "services"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview }),
        queryClient.invalidateQueries({ queryKey: ["services"] }),
      ]);
      toast.success("Service status updated.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useAdminDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<null>(`/admin/services/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "services"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview }),
        queryClient.invalidateQueries({ queryKey: ["services"] }),
      ]);
      toast.success("Service deleted.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export interface AdminTransactionsParams {
  status?: string;
  plan?: string;
  page?: number;
  limit?: number;
}

export function useAdminTransactions(params: AdminTransactionsParams) {
  return useQuery({
    queryKey: queryKeys.adminTransactions(params as Record<string, unknown>),
    queryFn: () =>
      apiFetch<Paginated<Transaction>>(`/admin/transactions${toQuery(params as Record<string, string | number | undefined>)}`),
  });
}
