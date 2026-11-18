import { Logo } from "@/components/shared/logo";

export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading WedMera"
      className="container mx-auto min-h-svh px-4 py-8 sm:px-6"
    >
      <div className="flex items-center justify-between border-b pb-5">
        <Logo />
        <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="mx-auto max-w-6xl py-10">
        <div className="h-10 w-2/3 max-w-lg animate-pulse rounded-lg bg-muted" />
        <div className="mt-4 h-5 w-full max-w-xl animate-pulse rounded bg-muted" />
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="overflow-hidden rounded-2xl border" key={index}>
              <div className="aspect-[4/3] animate-pulse bg-muted" />
              <div className="space-y-3 p-4">
                <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
