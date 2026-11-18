import type { Metadata } from "next";

import { HomePage } from "@/components/pages/home-page";
import { SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Wedding planning, made personal",
  description: `Find trusted vendors and plan your celebration with ${SITE_NAME}.`,
};

export default function Home() {
  return <HomePage />;
}
