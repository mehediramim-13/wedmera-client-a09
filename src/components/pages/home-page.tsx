"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarCheck,
  Camera,
  Flower2,
  Heart,
  Shirt,
  Sparkles,
  Utensils,
} from "lucide-react";
import { MotionConfig, motion } from "motion/react";

import { ErrorState } from "@/components/shared/error-state";
import {
  ServiceCard,
  ServiceCardSkeleton,
} from "@/components/shared/service-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CATEGORIES } from "@/lib/config";
import { useCategories, useServices } from "@/lib/queries";

const categoryIcons = [
  Camera,
  Building2,
  Flower2,
  Utensils,
  Sparkles,
  Shirt,
];

const reasons = [
  {
    icon: BadgeCheck,
    title: "Vetted professionals",
    description:
      "Browse clear service details from vendors who are reviewed before their work goes live.",
  },
  {
    icon: Heart,
    title: "Planning that feels personal",
    description:
      "Find the right fit for your style, location, and celebration budget.",
  },
  {
    icon: CalendarCheck,
    title: "Keep every detail together",
    description:
      "Send booking requests and follow their progress from one calm, simple dashboard.",
  },
];

const steps = [
  {
    number: "01",
    title: "Find your people",
    description: "Explore trusted services by category, location, and price.",
  },
  {
    number: "02",
    title: "Share your plans",
    description: "Tell a vendor when and where you are celebrating.",
  },
  {
    number: "03",
    title: "Bring it to life",
    description: "Keep an eye on requests and plan with more confidence.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
        {description}
      </p>
    </div>
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Please try again in a moment.";
}

export function HomePage() {
  const featured = useServices({ featured: "true", limit: 6 });
  const categories = useCategories();

  return (
    <MotionConfig reducedMotion="user">
      <section
        className="relative isolate overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(20,15,18,.82), rgba(20,15,18,.32)), url('https://images.unsplash.com/photo-1519741497674-611481863552?w=2200&q=85')",
        }}
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#140f12]/75 via-[#140f12]/35 to-transparent" />
        <div className="mx-auto flex min-h-[620px] max-w-7xl items-center px-4 py-20 sm:px-6 lg:min-h-[690px] lg:px-8">
          <motion.div
            animate="visible"
            className="max-w-2xl text-white"
            initial="hidden"
            transition={{ staggerChildren: 0.12 }}
          >
            <motion.p
              className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-[#f1d78d]"
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              Every detail, beautifully yours
            </motion.p>
            <motion.h1
              className="font-heading text-5xl font-medium leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl"
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              Your forever starts with a plan.
            </motion.h1>
            <motion.p
              className="mt-6 max-w-xl text-base leading-7 text-white/85 sm:text-lg"
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              Discover the people who make your day feel like you. Find trusted
              wedding services, send requests, and bring every detail together.
            </motion.p>
            <motion.div
              className="mt-9 flex flex-col gap-3 sm:flex-row"
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <Button
                className="h-12 px-6 text-base"
                render={<Link href="/services" />}
              >
                Explore Wedding Services
                <ArrowRight className="ml-1 size-4" />
              </Button>
              <Button
                className="h-12 border-white/50 bg-white/10 px-6 text-base text-white hover:bg-white/20 hover:text-white"
                render={<Link href="/signup" />}
                variant="outline"
              >
                Join as a vendor
              </Button>
            </motion.div>
            <motion.a
              className="mt-12 inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
              href="#featured"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1 },
              }}
            >
              A little inspiration
              <ArrowDown className="size-4" />
            </motion.a>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" id="featured">
        <SectionHeading
          description="Thoughtful details, talented people, and services worth remembering."
          eyebrow="A few lovely finds"
          title="Featured wedding services"
        />
        {featured.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <ServiceCardSkeleton key={index} />
            ))}
          </div>
        ) : featured.isError ? (
          <ErrorState
            message={errorMessage(featured.error)}
            onRetry={() => void featured.refetch()}
          />
        ) : featured.data?.items.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.data.items.slice(0, 6).map((service) => (
              <motion.div
                key={service._id}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
              >
                <ServiceCard service={service} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
            New featured services are on their way. Browse all services to keep
            exploring.
            <div className="mt-5">
              <Button render={<Link href="/services" />} variant="outline">
                Browse services
              </Button>
            </div>
          </div>
        )}
        <div className="mt-9 text-center">
          <Button render={<Link href="/services" />} variant="outline">
            Explore all services <ArrowRight className="ml-1 size-4" />
          </Button>
        </div>
      </section>

      <section className="bg-secondary/45 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            description="Start with what matters most to you. There’s a thoughtful team for every part of your day."
            eyebrow="Find your perfect fit"
            title="Wedding services by category"
          />
          {categories.isError ? (
            <ErrorState
              message={errorMessage(categories.error)}
              onRetry={() => void categories.refetch()}
            />
          ) : categories.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((category) => (
                <div
                  className="h-28 animate-pulse rounded-2xl bg-card"
                  key={category}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((category, index) => {
                const Icon = categoryIcons[index];
                const count =
                  categories.data?.find((item) => item.category === category)
                    ?.count ?? 0;
                return (
                  <Link
                    className="group"
                    href={`/services?category=${encodeURIComponent(category)}`}
                    key={category}
                  >
                    <Card className="h-full rounded-2xl border-transparent transition duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-md">
                      <CardContent className="flex items-center gap-4 p-5">
                        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                          <Icon className="size-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{category}</span>
                          <span className="mt-1 block text-sm text-muted-foreground">
                            {count} {count === 1 ? "service" : "services"}
                          </span>
                        </span>
                        <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <motion.section
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.45 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
      >
        <SectionHeading
          description="A wedding is made of a thousand little moments. We make finding the right people for them feel simple."
          eyebrow="Why WedMera"
          title="More joy, less juggling"
        />
        <div className="grid gap-6 md:grid-cols-3">
          {reasons.map(({ icon: Icon, title, description }) => (
            <Card className="rounded-2xl border-border/70" key={title}>
              <CardContent className="p-7">
                <span className="grid size-12 place-items-center rounded-xl bg-secondary text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 font-heading text-xl font-semibold">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>

      <section className="border-y bg-card py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            description="A few simple steps from first idea to a day that feels completely your own."
            eyebrow="How it works"
            title="Make planning feel lighter"
          />
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div className="relative" key={step.number}>
                <span className="font-heading text-5xl text-primary/35">
                  {step.number}
                </span>
                <h3 className="mt-4 font-heading text-xl font-semibold">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-3xl bg-gradient-to-r from-primary to-[#7d2444] px-7 py-10 text-primary-foreground shadow-lg sm:flex-row sm:items-center sm:px-12 sm:py-12">
          <div>
            <p className="text-sm font-medium text-white/75">
              YOUR NEXT CHAPTER STARTS HERE
            </p>
            <h2 className="mt-2 font-heading text-3xl font-semibold">
              Let’s make room for the magic.
            </h2>
          </div>
          <Button
            className="h-11 bg-white px-5 text-primary hover:bg-white/90"
            render={<Link href="/services" />}
          >
            Find your vendors <ArrowRight className="ml-1 size-4" />
          </Button>
        </div>
      </section>
    </MotionConfig>
  );
}

