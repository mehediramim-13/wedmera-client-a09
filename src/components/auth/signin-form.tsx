"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Mail } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { GuestGuard } from "@/components/auth/guest-guard";
import { Logo } from "@/components/shared/logo";
import { PasswordInput } from "@/components/shared/password-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { getSafeRedirect } from "@/lib/auth-routing";
import { getRoleFromUser } from "@/lib/auth-routing";
import { getDashboardPath } from "@/lib/paths";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type SignInValues = z.infer<typeof signInSchema>;

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const blocked = searchParams.get("blocked") === "1";
  const redirect = searchParams.get("redirect");
  const { data: session, isPending } = authClient.useSession();
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!isPending && session?.user) {
      const role = getRoleFromUser(session.user.role);
      router.replace(
        redirect
          ? getSafeRedirect(redirect, role ?? "customer")
          : getDashboardPath(role),
      );
    }
  }, [isPending, redirect, router, session]);

  async function submit(values: SignInValues) {
    const result = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });

    if (result.error) {
      toast.error(result.error.message || "Sign in failed.");
      return;
    }

    const role = getRoleFromUser(result.data?.user.role) ?? "customer";
    toast.success("Welcome back.");
    router.replace(
      redirect ? getSafeRedirect(redirect, role) : getDashboardPath(role),
    );
    router.refresh();
  }

  async function signInWithGoogle() {
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: redirect ?? "/dashboard",
    });
    if (result.error) {
      toast.error(result.error.message || "Google sign in failed.");
    }
  }

  return (
    <GuestGuard>
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
        <Card className="w-full max-w-md rounded-3xl shadow-lg">
          <CardHeader className="items-center text-center">
            <Logo size={42} />
            <CardTitle className="mt-4 font-heading text-3xl">
              Welcome back
            </CardTitle>
            <CardDescription>
              Sign in to pick up where your plans left off.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {blocked ? (
              <Alert variant="destructive">
                <AlertTitle>Account blocked</AlertTitle>
                <AlertDescription>
                  Your account is blocked. Contact support if you believe this
                  is a mistake.
                </AlertDescription>
              </Alert>
            ) : null}
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(submit)}
            >
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  autoComplete="email"
                  id="signin-email"
                  placeholder="you@example.com"
                  type="email"
                  {...form.register("email")}
                />
                {form.formState.errors.email ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <PasswordInput
                  autoComplete="current-password"
                  id="signin-password"
                  {...form.register("password")}
                />
                {form.formState.errors.password ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                ) : null}
              </div>
              <Button
                className="h-11 w-full"
                disabled={form.formState.isSubmitting}
                type="submit"
              >
                {form.formState.isSubmitting ? (
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 size-4" />
                )}
                Sign in
              </Button>
            </form>
            <div className="relative py-1 text-center text-xs text-muted-foreground">
              <span className="relative z-10 bg-card px-3">or continue with</span>
              <div className="absolute inset-x-0 top-1/2 border-t" />
            </div>
            <Button
              className="h-11 w-full"
              disabled={form.formState.isSubmitting}
              onClick={() => void signInWithGoogle()}
              variant="outline"
            >
              <GoogleMark />
              Continue with Google
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              New to WedMera?{" "}
              <Link className="font-medium text-primary hover:underline" href="/signup">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </GuestGuard>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="mr-2 size-4" viewBox="0 0 48 48">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
        transform="translate(0 5)"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94a11.05 11.05 0 0 1-4.8 7.24l7.76 6.02c4.53-4.19 7.08-10.36 7.08-17.73Z"
      />
      <path
        fill="#34A853"
        d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24 24 0 0 0 0 21.56l7.98-6.19Z"
      />
      <path
        fill="#FBBC05"
        d="M24 48c6.48 0 11.93-2.13 15.9-5.77l-7.76-6.02c-2.16 1.45-4.92 2.3-8.14 2.3-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
        transform="translate(0 -5)"
      />
    </svg>
  );
}
