"use client";

import { Button } from "@/components/ui/button";

export function ErrorState({
  title = "We couldn’t load this right now",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-card px-6 py-12 text-center"
      role="alert"
    >
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {message ?? "Please check your connection and try again."}
      </p>
      {onRetry ? (
        <Button className="mt-5" onClick={onRetry} variant="outline">
          Try again
        </Button>
      ) : null}
    </div>
  );
}
