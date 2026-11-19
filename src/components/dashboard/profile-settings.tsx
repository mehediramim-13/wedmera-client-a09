"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import { ImageUploader } from "@/components/shared/image-uploader";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { VendorBadge } from "@/components/shared/vendor-badge";
import { apiFetch } from "@/lib/api";
import { queryKeys, useCurrentUser, useSubscription } from "@/lib/queries";
import { isPremiumPlan } from "@/lib/subscription-utils";
import type { User, UserRole } from "@/lib/types";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters."),
  phone: z.string().trim().max(30, "Phone number is too long.").optional(),
  address: z.string().trim().max(200, "Address is too long.").optional(),
  bio: z.string().trim().max(1000, "Keep your introduction under 1,000 characters.").optional(),
  businessName: z
    .string()
    .trim()
    .max(100, "Business name is too long.")
    .optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

export function ProfileSettings({ role }: { role: UserRole }) {
  const profile = useCurrentUser();
  const subscription = useSubscription(role === "vendor");
  if (profile.isLoading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-muted" />;
  }
  if (profile.isError) {
    return (
      <ErrorState
        message={profile.error.message}
        onRetry={() => void profile.refetch()}
      />
    );
  }
  if (!profile.data) return null;

  return (
    <ProfileForm
      role={role}
      user={profile.data}
      subscriptionPlan={
        typeof subscription.data?.plan === "string"
          ? subscription.data.plan
          : typeof subscription.data?.subscriptionPlan === "string"
            ? subscription.data.subscriptionPlan
            : typeof subscription.data?.currentPlan === "string"
              ? subscription.data.currentPlan
              : undefined
      }
    />
  );
}

function ProfileForm({
  role,
  user,
  subscriptionPlan,
}: {
  role: UserRole;
  user: User;
  subscriptionPlan?: string;
}) {
  const queryClient = useQueryClient();
  const [image, setImage] = useState<string[]>(user.image ? [user.image] : []);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name ?? "",
      phone: user.phone ?? "",
      address: user.address ?? "",
      bio: user.bio ?? "",
      businessName: user.businessName ?? "",
    },
  });
  const save = useMutation({
    mutationFn: async (values: ProfileValues) =>
      apiFetch<User>("/users/me", {
        method: "PATCH",
        body: { ...values, image: image[0] ?? null },
      }),
    onSuccess: async (updated) => {
      toast.success("Your profile has been updated.");
      queryClient.setQueryData(queryKeys.me, updated);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update your profile."),
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        description="Keep your contact details current so your wedding plans stay connected."
        eyebrow="Account settings"
        title="Profile settings"
      />
      <form
        className="space-y-6"
        onSubmit={form.handleSubmit((values) => save.mutate(values))}
      >
        <Card className="rounded-2xl">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="font-heading text-xl">Your profile</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {role}
                </Badge>
                {role === "vendor" &&
                (isPremiumPlan(user.subscriptionPlan) ||
                  isPremiumPlan(subscriptionPlan)) ? (
                  <VendorBadge premium />
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Profile photo</Label>
              <ImageUploader images={image} maxFiles={1} onChange={setImage} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                error={form.formState.errors.name?.message}
                id="profile-name"
                label="Full name"
              >
                <Input id="profile-name" {...form.register("name")} />
              </FormField>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email address</Label>
                <Input id="profile-email" readOnly value={user?.email ?? ""} />
                <p className="text-xs text-muted-foreground">
                  Contact support if you need to change your email.
                </p>
              </div>
              <FormField
                error={form.formState.errors.phone?.message}
                id="profile-phone"
                label="Phone number"
              >
                <Input
                  autoComplete="tel"
                  id="profile-phone"
                  placeholder="+880 1XXX-XXXXXX"
                  {...form.register("phone")}
                />
              </FormField>
              {role === "vendor" ? (
                <FormField
                  error={form.formState.errors.businessName?.message}
                  id="profile-business"
                  label="Business name"
                >
                  <Input
                    id="profile-business"
                    {...form.register("businessName")}
                  />
                </FormField>
              ) : null}
            </div>
            <FormField
              error={form.formState.errors.address?.message}
              id="profile-address"
              label="Address"
            >
              <Input
                autoComplete="street-address"
                id="profile-address"
                placeholder="City, district"
                {...form.register("address")}
              />
            </FormField>
            <FormField
              error={form.formState.errors.bio?.message}
              id="profile-bio"
              label={role === "vendor" ? "About your business" : "About you"}
            >
              <Textarea
                className="min-h-28"
                id="profile-bio"
                placeholder={
                  role === "vendor"
                    ? "Share what makes your wedding service special."
                    : "A short introduction (optional)."
                }
                {...form.register("bio")}
              />
            </FormField>
            <div className="flex justify-end border-t pt-5">
              <Button disabled={save.isPending} type="submit">
                {save.isPending ? (
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                Save changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
