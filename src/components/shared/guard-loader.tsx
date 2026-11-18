import { LoaderCircle } from "lucide-react";

import { Logo } from "@/components/shared/logo";

export function GuardLoader({ label = "Loading your account" }: { label?: string }) {
  return (
    <div
      aria-live="polite"
      className="flex min-h-[65vh] flex-col items-center justify-center gap-5 px-4 text-center"
      role="status"
    >
      <Logo size={52} variant="mark" />
      <LoaderCircle className="size-5 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
