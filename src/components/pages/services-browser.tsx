"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  ServiceCard,
  ServiceCardSkeleton,
} from "@/components/shared/service-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/config";
import { useServices } from "@/lib/queries";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Please try again.";
}

export function ServicesBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchText, setSearchText] = useState(searchParams.get("search") ?? "");

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = 9;
  const category = searchParams.get("category") ?? "";
  const location = searchParams.get("location") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const query = useServices({
    search: searchParams.get("search") ?? undefined,
    category: category || undefined,
    location: location || undefined,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    sort,
    page,
    limit,
  });

  useEffect(() => {
    setSearchText(searchParams.get("search") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      updateParam("search", searchText, true);
    }, 350);
    return () => window.clearTimeout(timer);
    // URL changes are intentionally delayed to avoid a request for every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  function updateParam(
    key: string,
    value: string,
    resetPage = false,
  ) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (resetPage && key !== "page") next.delete("page");
    const suffix = next.size ? `?${next.toString()}` : "";
    router.replace(`${pathname}${suffix}`, { scroll: false });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <PageHeader
        description="Find the right people for your day. Refine by category, city, and budget."
        eyebrow="The vendor collection"
        title="Browse wedding services"
      />

      <div className="mb-8 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium">
          <SlidersHorizontal className="size-4 text-primary" />
          Refine your search
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <label className="relative sm:col-span-2 lg:col-span-2">
            <span className="sr-only">Search services</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 pl-9"
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search services"
              value={searchText}
            />
          </label>
          <label>
            <span className="sr-only">Category</span>
            <Select
              onValueChange={(value) =>
                updateParam(
                  "category",
                  value && value !== "all" ? value : "",
                  true,
                )
              }
              value={category || "all"}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label>
            <span className="sr-only">Location</span>
            <Input
              className="h-10"
              onChange={(event) =>
                updateParam("location", event.target.value, true)
              }
              placeholder="City or location"
              value={location}
            />
          </label>
          <label>
            <span className="sr-only">Sort by</span>
            <Select
              onValueChange={(value) =>
                updateParam("sort", value ?? "newest", true)
              }
              value={sort}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_asc">Price: low to high</SelectItem>
                <SelectItem value="price_desc">Price: high to low</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-6 lg:grid-cols-[1fr_1fr_auto]">
            <label>
              <span className="sr-only">Minimum price in taka</span>
              <Input
                className="h-10"
                inputMode="numeric"
                min="0"
                onChange={(event) =>
                  updateParam("minPrice", event.target.value, true)
                }
                placeholder="Min ৳"
                type="number"
                value={minPrice}
              />
            </label>
            <label>
              <span className="sr-only">Maximum price in taka</span>
              <Input
                className="h-10"
                inputMode="numeric"
                min="0"
                onChange={(event) =>
                  updateParam("maxPrice", event.target.value, true)
                }
                placeholder="Max ৳"
                type="number"
                value={maxPrice}
              />
            </label>
            <Button
              className="col-span-2 sm:col-span-1"
              onClick={() => router.replace(pathname, { scroll: false })}
              variant="outline"
            >
              Clear filters
            </Button>
          </div>
        </div>
      </div>

      {query.isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: limit }, (_, index) => (
            <ServiceCardSkeleton key={index} />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState
          message={getErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : query.data?.items.length ? (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {query.data.total} {query.data.total === 1 ? "service" : "services"}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {query.data.items.map((service) => (
              <ServiceCard key={service._id} service={service} />
            ))}
          </div>
          {query.data.pages > 1 ? (
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button
                disabled={page <= 1}
                onClick={() => updateParam("page", String(page - 1))}
                variant="outline"
              >
                Previous
              </Button>
              <span aria-live="polite" className="text-sm text-muted-foreground">
                Page {query.data.page} of {query.data.pages}
              </span>
              <Button
                disabled={page >= query.data.pages}
                onClick={() => updateParam("page", String(page + 1))}
                variant="outline"
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
          <h2 className="font-heading text-xl font-semibold">
            No services match those filters
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a different keyword, category, or price range.
          </p>
          <Button
            className="mt-5"
            onClick={() => router.replace(pathname, { scroll: false })}
            variant="outline"
          >
            Clear filters
          </Button>
          <Link className="sr-only" href="/services">
            Browse all wedding services
          </Link>
        </div>
      )}
    </div>
  );
}
