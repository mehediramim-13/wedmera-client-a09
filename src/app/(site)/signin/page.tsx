import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInForm } from "@/components/auth/signin-form";
import { GuardLoader } from "@/components/shared/guard-loader";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <Suspense fallback={<GuardLoader />}>
      <SignInForm />
    </Suspense>
  );
}
