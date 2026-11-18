import type { Metadata } from "next";

import { ProfileSettings } from "@/components/dashboard/profile-settings";

export const metadata: Metadata = { title: "Profile settings" };

export default function VendorProfilePage() {
  return <ProfileSettings role="vendor" />;
}
