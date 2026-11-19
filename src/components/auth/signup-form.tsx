"use client";

import Image from "next/image";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, LoaderCircle, Trash2, Upload } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { GuestGuard } from "@/components/auth/guest-guard";
import { Logo } from "@/components/shared/logo";
import { PasswordInput } from "@/components/shared/password-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { getSafeRedirect, getRoleFromUser } from "@/lib/auth-routing";
import { clearTokenCache, uploadImage } from "@/lib/api";
import type { UserRole } from "@/lib/types";

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(6, "Use at least 6 characters.")
    .regex(/[A-Z]/, "Include at least one uppercase letter.")
    .regex(/[a-z]/, "Include at least one lowercase letter."),
  role: z.enum(["customer", "vendor"]),
  businessName: z.string().trim().max(100, "Use 100 characters or fewer."),
});

type SignUpValues = z.infer<typeof signUpSchema>;

const passwordRules = [
  { label: "At least 6 characters", test: (value: string) => value.length >= 6 },
  { label: "One uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "One lowercase letter", test: (value: string) => /[a-z]/.test(value) },
];

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const { data: session, isPending } = authClient.useSession();
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "customer",
      businessName: "",
    },
  });
  const password = form.watch("password");
  const role = form.watch("role");

  useEffect(() => {
    if (!isPending && session?.user) {
      const currentRole = getRoleFromUser(session.user.role);
      router.replace(
        redirect
          ? getSafeRedirect(redirect, currentRole ?? "customer")
          : "/dashboard",
      );
    }
  }, [isPending, redirect, router, session]);

  useEffect(
    () => () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  async function handleImageChange(file: File | undefined) {
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      setImageUrl(await uploadImage(file));
    } catch {
      setImageUrl("");
    } finally {
      setUploading(false);
    }
  }

  async function submit(values: SignUpValues) {
    const result = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      image: imageUrl || undefined,
      role: values.role,
      businessName:
        values.role === "vendor" ? values.businessName || undefined : undefined,
    });

    if (result.error) {
      toast.error(result.error.message || "Account creation failed.");
      return;
    }

    clearTokenCache();
    const userRole =
      getRoleFromUser(result.data?.user.role) ?? values.role;
    toast.success("Your account is ready.");
    router.replace(
      redirect
        ? getSafeRedirect(redirect, userRole)
        : getSafeRedirect(null, userRole),
    );
    router.refresh();
  }

  async function signUpWithGoogle(selectedRole: UserRole) {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `wm_role=${selectedRole}; Path=/; Max-Age=300; SameSite=Lax${secure}`;

    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: getSafeRedirect(redirect, selectedRole),
    });
    if (result.error) {
      toast.error(result.error.message || "Google sign up failed.");
    }
  }

  const passwordError = form.formState.errors.password?.message;

  return (
    <GuestGuard>
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        <Card className="w-full max-w-2xl rounded-3xl shadow-lg">
          <CardHeader className="items-center text-center">
            <Logo size={42} />
            <CardTitle className="mt-4 font-heading text-3xl">
              Start planning your way
            </CardTitle>
            <CardDescription>
              Create an account to find your people or share your craft.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={form.handleSubmit(submit)}>
              <fieldset disabled={form.formState.isSubmitting}>
                <legend className="mb-2 text-sm font-medium">
                  I’m joining as a
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["customer", "Customer", "Find and book wedding services."],
                      ["vendor", "Vendor", "Showcase your wedding business."],
                    ] as const
                  ).map(([value, title, description]) => (
                    <button
                      aria-pressed={role === value}
                      className={`rounded-xl border p-4 text-left transition ${
                        role === value
                          ? "border-primary bg-secondary/60 ring-2 ring-primary/15"
                          : "hover:border-primary/40"
                      }`}
                      key={value}
                      onClick={() =>
                        form.setValue("role", value, { shouldValidate: true })
                      }
                      type="button"
                    >
                      <span className="block font-medium">{title}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {description}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>

              {role === "vendor" ? (
                <div className="space-y-2">
                  <Label htmlFor="signup-business">Business name (optional)</Label>
                  <Input
                    id="signup-business"
                    placeholder="Your studio or business"
                    {...form.register("businessName")}
                  />
                  {form.formState.errors.businessName ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.businessName.message}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full name</Label>
                  <Input
                    autoComplete="name"
                    id="signup-name"
                    placeholder="Your name"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    autoComplete="email"
                    id="signup-email"
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <PasswordInput
                  autoComplete="new-password"
                  id="signup-password"
                  {...form.register("password")}
                />
                <ul aria-live="polite" className="grid gap-1 sm:grid-cols-3">
                  {passwordRules.map((rule) => (
                    <li
                      className={`text-xs ${
                        rule.test(password)
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-muted-foreground"
                      }`}
                      key={rule.label}
                    >
                      {rule.test(password) ? "✓" : "○"} {rule.label}
                    </li>
                  ))}
                </ul>
                {passwordError ? (
                  <p className="text-sm text-destructive">{passwordError}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-image">Profile image (optional)</Label>
                <div className="flex flex-col gap-3 rounded-xl border border-dashed p-4 sm:flex-row sm:items-center">
                  {previewUrl ? (
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-muted">
                      <Image
                        alt="Profile image preview"
                        className="object-cover"
                        fill
                        sizes="64px"
                        src={previewUrl}
                        unoptimized
                      />
                    </div>
                  ) : (
                    <span className="grid size-16 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                      <ImagePlus className="size-6" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      Add a friendly face to your profile
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      JPEG, PNG, WebP, or GIF · 5 MB maximum
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      disabled={uploading}
                      onClick={() =>
                        document.getElementById("signup-image")?.click()
                      }
                      type="button"
                      variant="outline"
                    >
                      {uploading ? (
                        <LoaderCircle className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 size-4" />
                      )}
                      {uploading ? "Uploading" : "Choose image"}
                    </Button>
                    {previewUrl ? (
                      <Button
                        aria-label="Remove profile image"
                        disabled={uploading}
                        onClick={() => {
                          setPreviewUrl("");
                          setImageUrl("");
                        }}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                  <input
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    id="signup-image"
                    onChange={(event) => {
                      void handleImageChange(event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                    type="file"
                  />
                </div>
              </div>

              <Button
                className="h-11 w-full"
                disabled={form.formState.isSubmitting || uploading}
                type="submit"
              >
                {form.formState.isSubmitting ? (
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                ) : null}
                Create account
              </Button>
            </form>

            <div className="relative my-5 text-center text-xs text-muted-foreground">
              <span className="relative z-10 bg-card px-3">or</span>
              <div className="absolute inset-x-0 top-1/2 border-t" />
            </div>
            <Button
              className="h-11 w-full"
              disabled={uploading}
              onClick={() => void signUpWithGoogle(role)}
              variant="outline"
            >
              <GoogleMark />
              Continue with Google as {role}
            </Button>
            <Alert className="mt-5">
              <AlertTitle>Choose your account type carefully</AlertTitle>
              <AlertDescription>
                Admin access is provisioned separately and is never available
                during registration.
              </AlertDescription>
            </Alert>
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link className="font-medium text-primary hover:underline" href="/signin">
                Sign in
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
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.9-6.9C35.9 2.4 30.5 0 24 0 14.6 0 6.5 5.4 2.6 13.2l8 6.2C12.4 13.7 17.7 9.5 24 9.5Z" transform="translate(0 5)" />
      <path fill="#4285F4" d="M47 24.5c0-1.6-.2-3.1-.4-4.5H24v9h12.9a11 11 0 0 1-4.8 7.3l7.8 6c4.5-4.2 7.1-10.4 7.1-17.8Z" />
      <path fill="#34A853" d="M10.5 28.6a14.5 14.5 0 0 1 0-9.2l-8-6.2a24 24 0 0 0 0 21.6l8-6.2Z" />
      <path fill="#FBBC05" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.8-6c-2.2 1.4-4.9 2.3-8.1 2.3-6.3 0-11.6-4.2-13.5-9.9l-8 6.2C6.5 42.6 14.6 48 24 48Z" transform="translate(0 -5)" />
    </svg>
  );
}
