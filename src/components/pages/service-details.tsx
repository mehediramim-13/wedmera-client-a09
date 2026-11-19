"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { BookingDialog } from "@/components/pages/booking-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { VendorBadge } from "@/components/shared/vendor-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { useService } from "@/lib/queries";
import { formatPrice } from "@/components/shared/service-card";
import { getRoleFromUser } from "@/lib/auth-routing";

export function ServiceDetails({ id }: { id: string }) {
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [verifiedIdentity, setVerifiedIdentity] = useState<{
    id: string;
    role: unknown;
  } | null>(null);
  const [sessionCheckError, setSessionCheckError] = useState(false);
  const serviceQuery = useService(
    id,
    !sessionPending && Boolean(session?.user || verifiedIdentity),
  );

  useEffect(() => {
    if (sessionPending || session?.user || sessionCheckError) return;

    let active = true;
    void authClient
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setSessionCheckError(true);
          return;
        }
        if (data?.user) {
          setVerifiedIdentity({
            id: data.user.id,
            role: data.user.role,
          });
          return;
        }
        router.replace(
          `/signin?redirect=${encodeURIComponent(`/services/${encodeURIComponent(id)}`)}`,
        );
      })
      .catch(() => {
        if (active) setSessionCheckError(true);
      });

    return () => {
      active = false;
    };
  }, [id, router, session?.user, sessionCheckError, sessionPending]);

  if (
    serviceQuery.isLoading ||
    sessionPending ||
    (!session?.user && !verifiedIdentity && !sessionCheckError)
  ) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="mb-6 h-9 w-36" />
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <Skeleton className="aspect-[4/3] rounded-2xl" />
          <div className="space-y-5">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (sessionCheckError && !session?.user && !verifiedIdentity) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <ErrorState
          message="We couldn’t verify your sign-in. Please check your connection and try again."
          onRetry={() => setSessionCheckError(false)}
          title="Sign-in check failed"
        />
      </div>
    );
  }

  if (serviceQuery.isError || !serviceQuery.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <ErrorState
          message={
            serviceQuery.error instanceof Error
              ? serviceQuery.error.message
              : "This service could not be found."
          }
          onRetry={() => {
            if (serviceQuery.error && "status" in serviceQuery.error) {
              const status = serviceQuery.error.status;
              if (status === 400 || status === 404) {
                toast.error("This service is no longer available.");
                router.push("/services");
                return;
              }
            }
            void serviceQuery.refetch();
          }}
          title="Service details are unavailable"
        />
        <div className="mt-5 text-center">
          <Button render={<Link href="/services" />} variant="outline">
            <ArrowLeft className="mr-2 size-4" />
            Back to services
          </Button>
        </div>
      </div>
    );
  }

  const service = serviceQuery.data;
  const user = session?.user ?? verifiedIdentity;
  const role = getRoleFromUser(user?.role);
  const ownService = role === "vendor" && user?.id === service.vendorId;
  const cannotBook = role === "vendor" || role === "admin";
  const currentImage = service.images[activeImage] ?? service.images[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Button
        className="mb-6 px-0"
        onClick={() => router.back()}
        variant="ghost"
      >
        <ArrowLeft className="mr-2 size-4" />
        Back
      </Button>
      <div className="grid gap-9 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12">
        <div className="min-w-0">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
            {currentImage ? (
              <Image
                alt={`${service.serviceName} — image ${activeImage + 1}`}
                className="object-cover"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                src={currentImage}
              />
            ) : (
              <div className="grid h-full place-items-center text-muted-foreground">
                No images available
              </div>
            )}
          </div>
          {service.images.length > 1 ? (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
              {service.images.map((image, index) => (
                <button
                  aria-label={`Show image ${index + 1}`}
                  aria-pressed={activeImage === index}
                  className={`relative size-20 shrink-0 overflow-hidden rounded-xl border-2 ${
                    activeImage === index ? "border-primary" : "border-transparent"
                  }`}
                  key={image}
                  onClick={() => setActiveImage(index)}
                  type="button"
                >
                  <Image
                    alt=""
                    className="object-cover"
                    fill
                    sizes="80px"
                    src={image}
                  />
                </button>
              ))}
            </div>
          ) : null}
          <div className="mt-8">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={service.status} />
              <VendorBadge
                premium={service.isPremium || service.vendor.isPremium}
              />
            </div>
            <h1 className="mt-4 font-heading text-3xl font-semibold leading-tight sm:text-4xl">
              {service.serviceName}
            </h1>
            <p className="mt-3 flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4" />
              {service.location}
            </p>
            <div className="mt-8">
              <h2 className="font-heading text-xl font-semibold">About this service</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">
                {service.description}
              </p>
            </div>
            <div className="mt-8">
              <h2 className="font-heading text-xl font-semibold">
                Vendor Information
              </h2>
              <Card className="mt-4 rounded-2xl border-border/80 bg-card shadow-none">
                <CardContent className="flex items-start gap-4 p-5 sm:p-6">
                  <Avatar className="size-14 shrink-0 sm:size-16">
                    <AvatarImage
                      alt={service.vendor.businessName || service.vendor.name}
                      src={service.vendor.image ?? undefined}
                    />
                    <AvatarFallback>
                      {(service.vendor.businessName || service.vendor.name).slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-lg font-semibold leading-tight sm:text-xl">
                        {service.vendor.businessName || service.vendor.name}
                      </h3>
                      {(service.isPremium || service.vendor.isPremium) ? (
                        <VendorBadge premium />
                      ) : null}
                    </div>
                    {service.vendor.address ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Based in {service.vendor.address}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {service.location}
                      </p>
                    )}
                    {service.vendor.bio ? (
                      <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                        {service.vendor.bio}
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <Card className="sticky top-24 rounded-2xl shadow-sm">
            <CardContent className="space-y-6 p-6">
              <div>
                <p className="text-sm text-muted-foreground">Starting from</p>
                <p className="mt-1 text-3xl font-semibold text-primary">
                  {formatPrice(service.price)}
                </p>
              </div>
              <div className="flex items-center gap-3 border-y py-5">
                <Avatar className="size-12">
                  <AvatarImage
                    alt={service.vendor.name}
                    src={service.vendor.image ?? undefined}
                  />
                  <AvatarFallback>{service.vendor.name.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {service.vendor.businessName || service.vendor.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Wedding service provider
                  </p>
                </div>
              </div>
              {ownService ? (
                <div className="rounded-xl border bg-muted/50 p-4 text-sm">
                  <p className="font-medium">This is your service</p>
                  <p className="mt-1 text-muted-foreground">
                    You can review its listing and approval status here.
                  </p>
                </div>
              ) : null}
              {cannotBook ? (
                <div className="flex gap-2 rounded-xl border bg-muted/50 p-4 text-sm text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p>
                    {role === "vendor"
                      ? "Vendors cannot book services."
                      : "Admins cannot book services."}
                  </p>
                </div>
              ) : (
                <BookingDialog service={service} />
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
