"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { Check, LoaderCircle, Search, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import { queryKeys, useAdminServices } from "@/lib/queries";
import type { Service, ServiceStatus } from "@/lib/types";

const PAGE_SIZE = 10;

function createdLabel(value: string) {
  const date = parseISO(value);
  return isValid(date) ? format(date, "MMM d, yyyy") : "—";
}

function money(value: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value);
}

export function AdminServices() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const services = useAdminServices({
    search: search.trim(),
    status: status === "all" ? "" : status,
    page,
    limit: PAGE_SIZE,
  });

  const moderate = useMutation({
    mutationFn: ({
      service,
      nextStatus,
    }: {
      service: Service;
      nextStatus: ServiceStatus;
    }) =>
      apiFetch(`/admin/services/${encodeURIComponent(service._id)}`, {
        method: "PATCH",
        body: { status: nextStatus },
      }),
    onSuccess: async (_result, variables) => {
      toast.success(
        variables.nextStatus === "Approved"
          ? "Service approved."
          : "Service rejected.",
      );
      await queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview });
      await queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update this service."),
  });

  const totalPages = Math.max(1, services.data?.pages ?? 1);
  return (
    <div>
      <PageHeader
        description="Review listings and make sure services meet marketplace standards."
        eyebrow="Administration"
        title="Manage services"
      />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search services"
            className="pl-9"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search services"
            value={search}
          />
        </div>
        <Select
          onValueChange={(value) => {
            if (value) {
              setStatus(value);
              setPage(1);
            }
          }}
          value={status}
        >
          <SelectTrigger aria-label="Filter by status" className="w-full sm:w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {services.isLoading ? (
        <div className="h-80 animate-pulse rounded-2xl bg-muted" />
      ) : services.isError ? (
        <ErrorState
          message={services.error.message}
          onRetry={() => void services.refetch()}
        />
      ) : services.data?.items.length ? (
        <>
          <div className="overflow-hidden rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.data.items.map((service) => (
                  <TableRow key={service._id}>
                    <TableCell>
                      <div className="flex min-w-52 items-center gap-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {service.images[0] ? (
                            <Image
                              alt=""
                              className="object-cover"
                              fill
                              sizes="48px"
                              src={service.images[0]}
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <Link
                            className="line-clamp-1 font-medium hover:text-primary"
                            href={`/services/${encodeURIComponent(service._id)}`}
                          >
                            {service.serviceName}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {service.category} · {service.location}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {service.vendor.businessName || service.vendor.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {service.vendor.name}
                      </div>
                    </TableCell>
                    <TableCell>{money(service.price)}</TableCell>
                    <TableCell><StatusBadge status={service.status} /></TableCell>
                    <TableCell>{createdLabel(service.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      {service.status === "Pending" ? (
                        <div className="inline-flex gap-2">
                          <Button
                            aria-label={`Approve ${service.serviceName}`}
                            disabled={moderate.isPending}
                            onClick={() =>
                              moderate.mutate({ service, nextStatus: "Approved" })
                            }
                            size="sm"
                            variant="outline"
                          >
                            <Check className="mr-1 size-4" />
                            Approve
                          </Button>
                          <Button
                            aria-label={`Reject ${service.serviceName}`}
                            disabled={moderate.isPending}
                            onClick={() =>
                              moderate.mutate({ service, nextStatus: "Rejected" })
                            }
                            size="sm"
                            variant="ghost"
                          >
                            <X className="mr-1 size-4" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Reviewed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {services.data.total} listing{services.data.total === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-2">
              <Button
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                size="sm"
                variant="outline"
              >
                Previous
              </Button>
              <span className="min-w-20 text-center text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                size="sm"
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          description="Try a different search or status filter."
          title="No services found"
        />
      )}
      {moderate.isPending ? (
        <p className="sr-only" role="status">
          <LoaderCircle className="size-4 animate-spin" />
          Updating service status
        </p>
      ) : null}
    </div>
  );
}
