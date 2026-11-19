import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VendorBadge } from "@/components/shared/vendor-badge";
import { isPremiumPlan } from "@/lib/subscription-utils";
import type { Service } from "@/lib/types";

export function formatPrice(price: number) {
  return `৳ ${new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(price)}`;
}

export function ServiceCard({ service }: { service: Service }) {
  const detailsHref = `/services/${encodeURIComponent(service._id)}`;
  const vendorIsPremium =
    service.isPremium === true ||
    service.vendor.isPremium === true ||
    isPremiumPlan(service.vendor.subscriptionPlan);

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-2xl border-border/80 py-0 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Link
        aria-label={`View ${service.serviceName}`}
        className="relative block aspect-[4/3] shrink-0 overflow-hidden bg-muted"
        href={detailsHref}
      >
        {service.images[0] ? (
          <Image
            alt={service.serviceName}
            className="object-cover transition duration-500 group-hover:scale-105"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            src={service.images[0]}
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            Image unavailable
          </div>
        )}
        <Badge className="absolute left-3 top-3 border-white/60 bg-background/90 text-foreground shadow-sm">
          {service.category}
        </Badge>
      </Link>
      <CardContent className="flex flex-1 flex-col p-5">
        <div className="min-h-24">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 min-h-12 font-heading text-lg font-semibold leading-snug">
              {service.serviceName}
            </h3>
            <VendorBadge premium={vendorIsPremium} />
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            {service.location}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="size-8">
              <AvatarImage
                alt={service.vendor.name}
                src={service.vendor.image ?? undefined}
              />
              <AvatarFallback>{service.vendor.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <span className="truncate text-sm text-muted-foreground">
              {service.vendor.businessName || service.vendor.name}
            </span>
          </div>
          <p className="shrink-0 font-semibold text-primary">
            {formatPrice(service.price)}
          </p>
        </div>
        <Button
          className="mt-4 w-full"
          render={<Link href={detailsHref} />}
        >
          View details
        </Button>
      </CardContent>
    </Card>
  );
}

export function ServiceCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-2xl py-0">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <CardContent className="space-y-4 p-5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-10 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}
