import type { Metadata } from "next";
import { Suspense } from "react";

import { SignUpForm } from "@/components/auth/signup-form";
import { GuardLoader } from "@/components/shared/guard-loader";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <Suspense fallback={<GuardLoader />}>
      <SignUpForm />
    </Suspense>
  );
}
