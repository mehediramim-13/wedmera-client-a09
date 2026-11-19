"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import Link from "next/link";

import { ImageUploader } from "@/components/shared/image-uploader";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CATEGORIES } from "@/lib/config";
import {
  ApiError,
  apiFetch,
  uploadVendorServiceImage,
} from "@/lib/api";
import { queryKeys, useVendorServices, useSubscription } from "@/lib/queries";
import type { Service } from "@/lib/types";

const serviceSchema = z.object({
  serviceName: z.string().trim().min(3, "Enter at least 3 characters."),
  category: z.enum(CATEGORIES),
  description: z.string().trim().min(20, "Add at least 20 characters."),
  price: z.coerce.number().min(1, "Enter a price greater than zero."),
  location: z.string().trim().min(2, "Enter a location."),
  images: z.array(z.string().url()).min(1, "Upload at least one image.").max(5),
});

type ServiceFormInput = z.input<typeof serviceSchema>;
type ServiceValues = z.output<typeof serviceSchema>;

export function VendorServiceForm({
  service,
}: {
  service?: Service;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const existingServices = useVendorServices(!service);
  const subscription = useSubscription(!service);
  const [images, setImages] = useState<string[]>(service?.images ?? []);
  const [limitExceeded, setLimitExceeded] = useState(false);
  const form = useForm<ServiceFormInput, unknown, ServiceValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      serviceName: service?.serviceName ?? "",
      category: service?.category ?? CATEGORIES[0],
      description: service?.description ?? "",
      price: service?.price ?? 0,
      location: service?.location ?? "",
      images: service?.images ?? [],
    },
  });

  useEffect(() => {
    setImages(service?.images ?? []);
    form.reset({
      serviceName: service?.serviceName ?? "",
      category: service?.category ?? CATEGORIES[0],
      description: service?.description ?? "",
      price: service?.price ?? 0,
      location: service?.location ?? "",
      images: service?.images ?? [],
    });
  }, [form, service]);

  const save = useMutation({
    mutationFn: (values: ServiceValues) =>
      apiFetch(
        service
          ? `/vendor/services/${encodeURIComponent(service._id)}`
          : "/vendor/services",
        {
          method: service ? "PATCH" : "POST",
          body: values,
        },
      ),
    onSuccess: async () => {
      toast.success(service ? "Service updated." : "Service submitted for approval.");
      await queryClient.invalidateQueries({ queryKey: queryKeys.vendorServices });
      await queryClient.invalidateQueries({ queryKey: queryKeys.vendorOverview });
      router.push("/dashboard/vendor/services");
      router.refresh();
    },
    onError: (error) => {
      if (
        error instanceof ApiError &&
        error.status === 403 &&
        /limit|maximum|free plan/i.test(error.message)
      ) {
        setLimitExceeded(true);
        toast.error(error.message);
        return;
      }
      toast.error(error instanceof Error ? error.message : "Could not save service.");
    },
  });

  function submit(values: ServiceValues) {
    setLimitExceeded(false);
    save.mutate({ ...values, images });
  }

  const activeCount =
    existingServices.data?.filter((item) => item.isActive).length ?? "—";
  const planValue = subscription.data?.effectivePlan;
  const plan =
    typeof planValue === "string" ? planValue : "Free";

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        description={
          service
            ? "Update your listing details and keep your service current."
            : "Give couples the details they need to imagine your service at their celebration."
        }
        eyebrow="Vendor workspace"
        title={service ? "Edit service" : "Add a service"}
      />

      <Alert className="mb-6">
        <AlertTitle>{plan} plan · {activeCount} active services</AlertTitle>
        <AlertDescription>
          Free plans can have up to 3 active services. New listings start as
          Pending and need admin approval before customers can book.
        </AlertDescription>
      </Alert>
      {limitExceeded ? (
        <Alert className="mb-6 border-primary/30">
          <AlertTitle>You’ve reached the Free plan service limit</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            Upgrade to Premium to create unlimited active listings.
            <Button
              render={<Link href="/dashboard/vendor/subscription" />}
              size="sm"
              variant="outline"
            >
              Upgrade to Premium
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="rounded-2xl">
        <CardContent className="p-5 sm:p-7">
          <form
            className="space-y-5"
            onSubmit={form.handleSubmit(submit)}
          >
            <fieldset
              className="space-y-5"
              disabled={form.formState.isSubmitting || save.isPending}
            >
              <div className="space-y-2">
                <Label htmlFor="service-name">Service name</Label>
                <Input
                  id="service-name"
                  placeholder="e.g. Full-day wedding photography"
                  {...form.register("serviceName")}
                />
                {form.formState.errors.serviceName ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.serviceName.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="service-category">Category</Label>
                  <Select
                    onValueChange={(value) => {
                      const category = CATEGORIES.find((item) => item === value);
                      if (category) {
                        form.setValue("category", category, {
                          shouldValidate: true,
                        });
                      }
                    }}
                    value={form.watch("category")}
                  >
                    <SelectTrigger className="h-10 w-full" id="service-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.category ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.category.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-price">Price (BDT)</Label>
                  <Input
                    id="service-price"
                    inputMode="numeric"
                    min="1"
                    placeholder="25000"
                    type="number"
                    {...form.register("price", { valueAsNumber: true })}
                  />
                  {form.formState.errors.price ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.price.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-location">Location</Label>
                <Input
                  id="service-location"
                  placeholder="City or service area"
                  {...form.register("location")}
                />
                {form.formState.errors.location ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.location.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-description">Description</Label>
                <Textarea
                  id="service-description"
                  placeholder="Describe what’s included and what makes your service special."
                  rows={6}
                  {...form.register("description")}
                />
                {form.formState.errors.description ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Service images</Label>
                <ImageUploader
                  images={images}
                  maxFiles={5}
                  onChange={(next) => {
                    setImages(next);
                    form.setValue("images", next, { shouldValidate: true });
                  }}
                  uploadFile={uploadVendorServiceImage}
                />
                {form.formState.errors.images ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.images.message}
                  </p>
                ) : null}
              </div>
              <Button
                className="h-11 w-full sm:w-auto"
                disabled={save.isPending}
                type="submit"
              >
                {save.isPending ? (
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                ) : null}
                {service ? "Save changes" : "Submit for approval"}
              </Button>
            </fieldset>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
