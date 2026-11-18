"use client";

import { ErrorState } from "@/components/shared/error-state";
import "./globals.css";

export default function GlobalError({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-svh font-sans antialiased">
        <main className="container mx-auto flex min-h-svh items-center px-4 py-12">
          <div className="mx-auto w-full max-w-xl">
            <ErrorState
              message="An unexpected error interrupted the app. You can try loading it again."
              onRetry={retry}
              title="WedMera needs a moment"
            />
          </div>
        </main>
      </body>
    </html>
  );
}
