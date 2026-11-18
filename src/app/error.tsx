"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function Error({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <main className="container mx-auto flex min-h-svh items-center px-4 py-12">
      <div className="mx-auto w-full max-w-xl">
        <ErrorState
          message="An unexpected error interrupted this page. You can try loading it again."
          onRetry={retry}
          title="We hit a small snag"
        />
      </div>
    </main>
  );
}
