"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatPrice } from "@/components/shared/service-card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import { queryKeys, useVendorServices } from "@/lib/queries";
import type { Service } from "@/lib/types";

export function VendorServices() {
  const queryClient = useQueryClient();
  const services = useVendorServices();
  const [selected, setSelected] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const availability = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiFetch(`/vendor/services/${encodeURIComponent(id)}/availability`, {
        method: "PATCH",
        body: { isActive },
      }),
    onSuccess: async () => {
      toast.success("Service availability updated.");
      await queryClient.invalidateQueries({ queryKey: queryKeys.vendorServices });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.vendorOverview,
      });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update availability."),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/vendor/services/${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      toast.success("Service removed.");
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.vendorServices });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.vendorOverview,
      });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not delete service."),
  });

  if (services.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 animate-pulse rounded-xl bg-muted" />
        {Array.from({ length: 4 }, (_, index) => (
          <div className="h-20 animate-pulse rounded-xl bg-muted" key={index} />
        ))}
      </div>
    );
  }
  if (services.isError) {
    return (
      <ErrorState
        message={services.error.message}
        onRetry={() => void services.refetch()}
      />
    );
  }

  const rows = services.data ?? [];
  return (
    <div>
      <PageHeader
        action={
          <Button render={<Link href="/dashboard/vendor/services/add" />}>
            <Plus className="mr-2 size-4" />
            Add service
          </Button>
        }
        description="Keep your listings accurate and ready for new booking requests."
        eyebrow="Vendor workspace"
        title="My services"
      />
      <div className="mb-6 rounded-xl border border-primary/15 bg-secondary/35 p-4 text-sm leading-6">
        <p>
          <strong>Approval:</strong> Pending services are waiting for review.
          Rejected services are hidden from customers until updated and approved.
        </p>
        <p className="mt-1 text-muted-foreground">
          Free plans can have up to 3 active services. Upgrade to Premium for
          unlimited listings.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 text-center">
          <h2 className="font-heading text-xl font-semibold">
            Your first service is waiting
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a listing to help couples discover your work.
          </p>
          <Button
            className="mt-5"
            render={<Link href="/dashboard/vendor/services/add" />}
          >
            Add a service
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {rows.map((service) => (
              <ServiceMobileCard
                key={service._id}
                onDelete={() => setDeleteTarget(service)}
                onToggle={(checked) =>
                  availability.mutate({ id: service._id, isActive: checked })
                }
                service={service}
                togglePending={availability.isPending}
              />
            ))}
          </div>
          <div className="hidden overflow-hidden rounded-2xl border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((service) => (
                  <TableRow key={service._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ServiceThumb service={service} />
                        <div>
                          <p className="max-w-48 truncate font-medium">
                            {service.serviceName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {service.location}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{service.category}</TableCell>
                    <TableCell>{formatPrice(service.price)}</TableCell>
                    <TableCell>
                      <StatusBadge status={service.status} />
                    </TableCell>
                    <TableCell>
                      <Switch
                        aria-label={`Set ${service.serviceName} availability`}
                        checked={Boolean(service.isActive)}
                        disabled={availability.isPending}
                        onCheckedChange={(checked) =>
                          availability.mutate({
                            id: service._id,
                            isActive: checked,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <ServiceActions
                        onDelete={() => setDeleteTarget(service)}
                        onView={() => setSelected(service)}
                        service={service}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Dialog
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        open={Boolean(selected)}
      >
        {selected ? (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selected.serviceName}</DialogTitle>
              <DialogDescription>
                {selected.category} · {selected.location}
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm leading-6 text-muted-foreground">
              {selected.description}
            </p>
            <div className="flex items-center justify-between border-t pt-4">
              <StatusBadge status={selected.status} />
              <span className="font-semibold text-primary">
                {formatPrice(selected.price)}
              </span>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        open={Boolean(deleteTarget)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this service?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.serviceName} will be permanently removed from your
              listings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep service</AlertDialogCancel>
            <AlertDialogAction
              disabled={remove.isPending}
              onClick={() => {
                if (deleteTarget) remove.mutate(deleteTarget._id);
              }}
            >
              {remove.isPending ? "Removing..." : "Delete service"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ServiceThumb({ service }: { service: Service }) {
  return (
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
  );
}

function ServiceActions({
  service,
  onView,
  onDelete,
}: {
  service: Service;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      <Button
        aria-label={`View ${service.serviceName}`}
        onClick={onView}
        size="icon"
        variant="ghost"
      >
        <Eye className="size-4" />
      </Button>
      <Button
        aria-label={`Edit ${service.serviceName}`}
        render={
          <Link
            href={`/dashboard/vendor/services/${encodeURIComponent(service._id)}/edit`}
          />
        }
        size="icon"
        variant="ghost"
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        aria-label={`Delete ${service.serviceName}`}
        onClick={onDelete}
        size="icon"
        variant="ghost"
      >
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </div>
  );
}

function ServiceMobileCard({
  service,
  onToggle,
  onDelete,
  togglePending,
}: {
  service: Service;
  onToggle: (checked: boolean) => void;
  onDelete: () => void;
  togglePending: boolean;
}) {
  const [viewOpen, setViewOpen] = useState(false);

  return (
    <article className="rounded-2xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <ServiceThumb service={service} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-medium">{service.serviceName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {service.category} · {service.location}
          </p>
          <p className="mt-2 font-semibold text-primary">
            {formatPrice(service.price)}
          </p>
        </div>
        <StatusBadge status={service.status} />
      </div>
      <div className="mt-4 flex items-center justify-between border-t pt-3">
        <label className="flex items-center gap-2 text-sm">
          <Switch
            aria-label={`Set ${service.serviceName} availability`}
            checked={Boolean(service.isActive)}
            disabled={togglePending}
            onCheckedChange={onToggle}
          />
          Available
        </label>
        <div className="flex gap-1">
          <Button
            aria-label={`View ${service.serviceName}`}
            onClick={() => setViewOpen(true)}
            size="icon"
            variant="ghost"
          >
            <Eye className="size-4" />
          </Button>
          <Button
            aria-label={`Edit ${service.serviceName}`}
            render={
              <Link
                href={`/dashboard/vendor/services/${encodeURIComponent(service._id)}/edit`}
              />
            }
            size="icon"
            variant="ghost"
          >
            <Pencil className="size-4" />
          </Button>
          <Button aria-label={`Delete ${service.serviceName}`} onClick={onDelete} size="icon" variant="ghost">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>
      <Dialog onOpenChange={setViewOpen} open={viewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{service.serviceName}</DialogTitle>
            <DialogDescription>
              {service.category} · {service.location}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm leading-6 text-muted-foreground">
            {service.description}
          </p>
        </DialogContent>
      </Dialog>
    </article>
  );
}
