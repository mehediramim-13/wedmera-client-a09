"use client";

import { useVendorServices } from "@/lib/queries";
import { VendorServiceForm } from "@/components/dashboard/vendor/vendor-service-form";
import { ErrorState } from "@/components/shared/error-state";

export function VendorServiceEdit({ id }: { id: string }) {
  const services = useVendorServices();
  if (services.isLoading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  }
  if (services.isError) {
    return (
      <ErrorState
        message={services.error.message}
        onRetry={() => void services.refetch()}
      />
    );
  }

  const service = services.data?.find((item) => item._id === id);
  if (!service) {
    return (
      <ErrorState
        message="This service could not be found in your listings."
        title="Service not found"
      />
    );
  }

  return <VendorServiceForm service={service} />;
}
