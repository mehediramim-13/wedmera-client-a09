import type { Metadata } from "next";

import { ServicesBrowser } from "@/components/pages/services-browser";

export const metadata: Metadata = {
  title: "Browse wedding services",
  description: "Search wedding vendors by service, category, location, and price.",
};

export default function ServicesPage() {
  return <ServicesBrowser />;
}
