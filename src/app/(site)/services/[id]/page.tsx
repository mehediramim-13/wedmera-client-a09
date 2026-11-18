import type { Metadata } from "next";

import { ServiceDetails } from "@/components/pages/service-details";

export const metadata: Metadata = {
  title: "Wedding service details",
  description: "Explore a wedding service and send a booking request.",
};

export default async function ServiceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ServiceDetails id={id} />;
}
