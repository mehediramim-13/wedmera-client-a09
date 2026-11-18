"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, UserRound, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Browse services" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, isPending } = authClient.useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = session?.user;
  const role = getRoleFromUser(user?.role);
  const profilePath = getProfilePath(role);

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
          {publicLinks.map((link) => (
            <Link
              aria-current={pathname === link.href ? "page" : undefined}
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
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
                render={
                  <Button
                    className="h-10 gap-2 rounded-full pl-1.5 pr-3"
                    variant="ghost"
                  />
                }
              >
                <Avatar className="size-8">
                  <AvatarImage alt={user.name} src={user.image ?? undefined} />
                  <AvatarFallback>{user.name.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <span className="max-w-28 truncate text-sm font-medium">
                  {user.name}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <span className="block truncate">{user.name}</span>
                  <span className="mt-1 block truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </span>
                  {user.subscriptionPlan === "premium" ? (
                    <span className="mt-2 inline-flex">
                      <VendorBadge premium />
                    </span>
                  ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={
                    <Link href={getDashboardPath(role)}>
                      <LayoutDashboard />
                      Dashboard
                    </Link>
                  }
                />
                <DropdownMenuItem
                  render={
                    <Link href={profilePath}>
                      <UserRound />
                      Profile settings
                    </Link>
                  }
                />
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
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
                {publicLinks.map((link) => (
                  <Link
                    aria-current={pathname === link.href ? "page" : undefined}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
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
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      {user.name}
                    </p>
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
