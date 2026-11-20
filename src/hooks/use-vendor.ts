"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetch, errorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type {
  Service,
  ServicePayload,
  VendorBooking,
  VendorOverview,
  VendorSubscription,
} from "@/lib/types";

export function useVendorOverview() {
  return useQuery({
    queryKey: queryKeys.vendorOverview,
    queryFn: () => apiFetch<VendorOverview>("/vendor/overview"),
  });
}

export function useVendorServices() {
  return useQuery({
    queryKey: queryKeys.vendorServices,
    queryFn: () => apiFetch<Service[]>("/vendor/services"),
  });
}

export function useVendorService(id: string | undefined) {
  const servicesQuery = useVendorServices();
  return {
    ...servicesQuery,
    service: servicesQuery.data?.find((service) => service._id === id) ?? null,
  };
}

function useInvalidateVendorServices() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.vendorServices }),
      queryClient.invalidateQueries({ queryKey: queryKeys.vendorOverview }),
      queryClient.invalidateQueries({ queryKey: ["services"] }),
    ]);
  };
}

export function useCreateService() {
  const invalidate = useInvalidateVendorServices();

  return useMutation({
    mutationFn: (payload: ServicePayload) =>
      apiFetch<Service>("/vendor/services", { method: "POST", body: payload }),
    onSuccess: async () => {
      await invalidate();
      toast.success("Service submitted for admin review.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useUpdateService() {
  const invalidate = useInvalidateVendorServices();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ServicePayload }) =>
      apiFetch<Service>(`/vendor/services/${id}`, { method: "PATCH", body: payload }),
    onSuccess: async () => {
      await invalidate();
      toast.success("Service updated and submitted for review.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useToggleServiceAvailability() {
  const invalidate = useInvalidateVendorServices();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiFetch<Service>(`/vendor/services/${id}/availability`, {
        method: "PATCH",
        body: { isActive },
      }),
    onSuccess: async (_data, variables) => {
      await invalidate();
      toast.success(variables.isActive ? "Service is now available." : "Service paused.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useDeleteService() {
  const invalidate = useInvalidateVendorServices();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ message?: string }>(`/vendor/services/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await invalidate();
      toast.success("Service deleted.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useVendorBookings(status?: string) {
  return useQuery({
    queryKey: queryKeys.vendorBookings(status),
    queryFn: () => {
      const query = status ? `?status=${encodeURIComponent(status)}` : "";
      return apiFetch<VendorBooking[]>(`/vendor/bookings${query}`);
    },
  });
}

export function useVendorBookingAction(action: "accept" | "reject") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<VendorBooking>(`/vendor/bookings/${id}/${action}`, { method: "PATCH" }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["vendor", "bookings"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.vendorOverview }),
      ]);
      toast.success(action === "accept" ? "Booking accepted." : "Booking rejected.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useVendorSubscription() {
  return useQuery({
    queryKey: queryKeys.vendorSubscription,
    queryFn: () => apiFetch<VendorSubscription>("/vendor/subscription"),
  });
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: () =>
      apiFetch<{ url: string }>("/payments/create-checkout-session", {
        method: "POST",
      }),
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error("Stripe did not return a checkout URL. Please try again.");
      }
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useResumeSubscription() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const result = await apiFetch<{ message?: string }>(
        "/vendor/subscription/resume",
        { method: "POST" },
      );
      if (process.env.NODE_ENV === "development") {
        console.log("Resume subscription", {
          httpStatus: 200,
          message: result?.message,
        });
      }
      return result;
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.vendorSubscription }),
        queryClient.invalidateQueries({ queryKey: queryKeys.me }),
        queryClient.invalidateQueries({ queryKey: queryKeys.vendorOverview }),
      ]);
      await queryClient.refetchQueries({ queryKey: queryKeys.vendorSubscription });
      router.refresh();
      toast.success(data?.message || "Subscription resumed.");
    },
    onError: (error) => {
      const apiError = error as { status?: number; message?: string };
      if (process.env.NODE_ENV === "development") {
        console.log("Resume subscription", {
          httpStatus: apiError?.status ?? 0,
          message: apiError?.message ?? errorMessage(error),
        });
      }
      toast.error(errorMessage(error));
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const result = await apiFetch<{ message?: string }>(
        "/payments/cancel-subscription",
        { method: "POST" },
      );
      if (process.env.NODE_ENV === "development") {
        console.log("Cancel subscription", {
          httpStatus: 200,
          message: result?.message,
        });
      }
      return result;
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.vendorSubscription }),
        queryClient.invalidateQueries({ queryKey: queryKeys.me }),
        queryClient.invalidateQueries({ queryKey: queryKeys.vendorOverview }),
      ]);
      await Promise.all([
        queryClient.refetchQueries({ queryKey: queryKeys.vendorSubscription }),
        queryClient.refetchQueries({ queryKey: queryKeys.me }),
        queryClient.refetchQueries({ queryKey: queryKeys.vendorOverview }),
      ]);
      router.refresh();
      toast.success(
        data?.message || "Your subscription has been cancelled.",
      );
    },
    onError: (error) => {
      const apiError = error as { status?: number; message?: string };
      if (process.env.NODE_ENV === "development") {
        console.log("Cancel subscription", {
          httpStatus: apiError?.status ?? 0,
          message: apiError?.message ?? errorMessage(error),
        });
      }
      toast.error(errorMessage(error));
    },
  });
}
