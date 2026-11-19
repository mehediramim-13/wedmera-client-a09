"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, UserRound, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { VendorBadge } from "@/components/shared/vendor-badge";
import { authClient } from "@/lib/auth-client";
import { clearTokenCache } from "@/lib/api";
import { getDashboardPath, getProfilePath } from "@/lib/paths";
import { getRoleFromUser } from "@/lib/auth-routing";
import { SITE_NAME } from "@/lib/config";
import { useSubscription } from "@/lib/queries";
import { isPremiumPlan } from "@/lib/subscription-utils";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Browse services" },
];

const roleLabels = {
  customer: "Customer",
  vendor: "Vendor",
  admin: "Admin",
} as const;

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, isPending } = authClient.useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = session?.user;
  const role = getRoleFromUser(user?.role);
  const subscription = useSubscription(role === "vendor");
  const vendorIsPremium =
    role === "vendor" &&
    isPremiumPlan(subscription.data?.effectivePlan);
  const profilePath = getProfilePath(role);
  const links = [
    ...publicLinks,
    ...(role === "customer"
      ? [{ href: "/dashboard/customer", label: "My Bookings" }]
      : role === "vendor"
        ? [{ href: "/dashboard/vendor", label: "Vendor Hub" }]
        : role === "admin"
          ? [{ href: "/dashboard/admin", label: "Admin Hub" }]
          : []),
  ];

  function isActiveLink(href: string) {
    return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  }

  async function handleSignOut() {
    await authClient.signOut();
    clearTokenCache();
    queryClient.clear();
    toast.success("You’re signed out.");
    router.push("/");
    router.refresh();
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-xl">
      <nav
        aria-label={`${SITE_NAME} main navigation`}
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8"
      >
        <Logo />
        <div className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              aria-current={isActiveLink(link.href) ? "page" : undefined}
              className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                isActiveLink(link.href)
                  ? "bg-secondary text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={`Open account menu for ${user.name}`}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-border/70 bg-background pl-1.5 pr-3 text-left outline-none transition hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Avatar className="size-8">
                  <AvatarImage alt={user.name} src={user.image ?? undefined} />
                  <AvatarFallback>{user.name.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-col">
                  <span className="max-w-36 truncate text-sm font-medium">
                    {user.name}
                  </span>
                  {role ? (
                    <span className="text-xs capitalize text-muted-foreground">
                      {roleLabels[role]}
                      {vendorIsPremium ? " • Premium" : ""}
                    </span>
                  ) : null}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 rounded-2xl border bg-popover p-2"
              >
                <DropdownMenuLabel className="px-3 py-3">
                  <span className="block truncate">{user.name}</span>
                  <span className="mt-1 block truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </span>
                  {role ? (
                    <Badge className="mt-2 border-0 bg-secondary text-secondary-foreground">
                      {roleLabels[role]}
                    </Badge>
                  ) : null}
                  {vendorIsPremium ? (
                    <span className="mt-2 inline-flex">
                      <VendorBadge premium />
                    </span>
                  ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="h-10 cursor-pointer px-3"
                  onClick={() => router.push(getDashboardPath(role))}
                >
                  <LayoutDashboard />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="h-10 cursor-pointer px-3"
                  onClick={() => router.push(profilePath)}
                >
                  <UserRound />
                  Profile settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="h-10 cursor-pointer px-3"
                  onClick={() => void handleSignOut()}
                  variant="destructive"
                >
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : isPending ? (
            <div className="h-9 w-36 animate-pulse rounded-full bg-muted" />
          ) : (
            <>
              <Button render={<Link href="/signin" />} variant="ghost">
                Sign in
              </Button>
              <Button render={<Link href="/signup" />}>Get started</Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Sheet onOpenChange={setMobileOpen} open={mobileOpen}>
            <SheetTrigger
              render={
                <Button aria-label="Open navigation menu" size="icon" variant="ghost" />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent className="w-[min(22rem,90vw)]" side="right">
              <SheetHeader>
                <SheetTitle>
                  <Logo size={32} />
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-4">
                {links.map((link) => (
                  <Link
                    aria-current={isActiveLink(link.href) ? "page" : undefined}
                    className={`rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted ${
                      isActiveLink(link.href)
                        ? "bg-secondary text-primary"
                        : ""
                    }`}
                    href={link.href}
                    key={link.href}
                    onClick={closeMobile}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="my-2 border-t" />
                {user ? (
                  <>
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium">{user.name}</p>
                      {role ? (
                        <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                          {roleLabels[role]}
                        </p>
                      ) : null}
                    </div>
                    <Link
                      className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
                      href={getDashboardPath(role)}
                      onClick={closeMobile}
                    >
                      Dashboard
                    </Link>
                    <Link
                      className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
                      href={profilePath}
                      onClick={closeMobile}
                    >
                      Profile settings
                    </Link>
                    <Button
                      className="mt-2 justify-start"
                      onClick={() => {
                        closeMobile();
                        void handleSignOut();
                      }}
                      variant="outline"
                    >
                      <LogOut />
                      Sign out
                    </Button>
                  </>
                ) : isPending ? (
                  <div className="h-9 animate-pulse rounded bg-muted" />
                ) : (
                  <>
                    <Button
                      onClick={closeMobile}
                      render={<Link href="/signin" />}
                      variant="outline"
                    >
                      Sign in
                    </Button>
                    <Button
                      onClick={closeMobile}
                      render={<Link href="/signup" />}
                    >
                      Get started
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
