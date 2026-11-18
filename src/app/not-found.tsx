import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center px-4 py-12">
      <div className="flex w-full max-w-lg flex-col items-center text-center">
        <Logo />
        <p className="mt-12 font-heading text-8xl font-semibold text-primary/20">
          404
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">
          This page wandered off
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
          The page may have moved or the link may be incorrect. Let’s get you
          back to planning something lovely.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button render={<Link href="/" />}>Back to home</Button>
          <Button render={<Link href="/services" />} variant="outline">
            Explore services
          </Button>
        </div>
      </div>
    </main>
  );
}
