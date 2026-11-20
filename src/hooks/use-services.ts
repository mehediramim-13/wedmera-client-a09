"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { Paginated, Service } from "@/lib/types";

export interface ServiceFilters {
  search?: string;
  category?: string;
  location?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
  sort?: "price_asc" | "price_desc" | "newest" | "";
  page?: number;
  limit?: number;
  featured?: boolean;
  enabled?: boolean;
}

export function buildServiceQuery(filters: ServiceFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.location) params.set("location", filters.location);
  if (filters.minPrice !== undefined && filters.minPrice !== "") {
    params.set("minPrice", String(filters.minPrice));
  }
  if (filters.maxPrice !== undefined && filters.maxPrice !== "") {
    params.set("maxPrice", String(filters.maxPrice));
  }
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.featured) params.set("featured", "true");
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  return params.toString();
}

export function useServices(filters: ServiceFilters) {
  return useQuery({
    queryKey: queryKeys.services(filters as Record<string, unknown>),
    queryFn: () =>
      apiFetch<Paginated<Service>>(`/services?${buildServiceQuery(filters)}`, {
        auth: false,
      }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    enabled: filters.enabled ?? true,
  });
}

export function useFeaturedServices() {
  return useQuery({
    queryKey: queryKeys.services({ featured: true, limit: 6 } as Record<string, unknown>),
    queryFn: () =>
      apiFetch<Paginated<Service>>("/services?featured=true&limit=6", { auth: false }),
    staleTime: 60_000,
  });
}

export function useService(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.service(id ?? ""),
    queryFn: () => apiFetch<Service>(`/services/${id}`),
    enabled: Boolean(id),
    retry: false,
  });
}
