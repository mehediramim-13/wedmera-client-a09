"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { VendorBadge } from "@/components/shared/vendor-badge";
import { authClient } from "@/lib/auth-client";
import { clearTokenCache } from "@/lib/api";
import { getProfilePath } from "@/lib/paths";
import type { UserRole } from "@/lib/types";
import { getRoleFromUser } from "@/lib/auth-routing";

const navigation = {
  vendor: [
    { href: "/dashboard/vendor", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/vendor/services", label: "My services", icon: Package },
    { href: "/dashboard/vendor/services/add", label: "Add a service", icon: ArrowUpRight },
    { href: "/dashboard/vendor/bookings", label: "Booking requests", icon: CalendarDays },
    { href: "/dashboard/vendor/subscription", label: "Subscription", icon: CreditCard },
    { href: "/dashboard/vendor/profile", label: "Profile settings", icon: Settings },
  ],
  customer: [
    { href: "/dashboard/customer", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/customer/bookings", label: "My bookings", icon: ClipboardList },
    { href: "/dashboard/customer/profile", label: "Profile settings", icon: Settings },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/admin/users", label: "Manage users", icon: Users },
    { href: "/dashboard/admin/services", label: "Manage services", icon: Package },
    { href: "/dashboard/admin/transactions", label: "Transactions", icon: CreditCard },
    { href: "/dashboard/admin/profile", label: "Profile settings", icon: Settings },
  ],
} satisfies Record<
  UserRole,
  { href: string; label: string; icon: typeof LayoutDashboard }[]
>;

function DashboardSidebar({ role }: { role: UserRole }) {
  const { isMobile, state } = useSidebar();
  const currentPath = usePathname();
  const compact = state === "collapsed" && !isMobile;

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="min-h-16 justify-center border-b border-sidebar-border px-3">
        <Logo
          className={compact ? "justify-center" : ""}
          size={compact ? 34 : 38}
          variant={compact ? "mark" : "full"}
        />
      </SidebarHeader>
      <SidebarContent className="py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navigation[role].map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    isActive={
                      href === `/dashboard/${role}`
                        ? currentPath === href
                        : currentPath === href ||
                          currentPath.startsWith(`${href}/`)
                    }
                    render={<Link href={href} />}
                    tooltip={label}
                  >
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2 rounded-xl bg-sidebar-accent/70 p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
          <Shield className="size-4 shrink-0 text-primary" />
          {!compact ? (
            <span className="text-xs font-medium text-sidebar-foreground">
              {role === "admin"
                ? "Administration"
                : role === "vendor"
                  ? "Vendor workspace"
                  : "Your wedding plans"}
            </span>
          ) : null}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function DashboardShell({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const user = session?.user;

  async function signOut() {
    await authClient.signOut();
    clearTokenCache();
    queryClient.clear();
    toast.success("You’re signed out.");
    router.push("/");
    router.refresh();
  }

  const roleFromSession = getRoleFromUser(user?.role);

  return (
    <SidebarProvider>
      <DashboardSidebar role={role} />
      <SidebarInset className="min-h-svh">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/90 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger aria-label="Toggle dashboard navigation" />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-medium">
                {navigation[role].find((item) => item.href === pathname)?.label ??
                  "Your workspace"}
              </p>
              <p className="text-xs capitalize text-muted-foreground">{role} account</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    aria-label="Open account menu"
                    className="size-9 rounded-full p-0"
                    variant="ghost"
                  />
                }
              >
                <Avatar className="size-8">
                  <AvatarImage alt={user?.name ?? "Account"} src={user?.image ?? undefined} />
                  <AvatarFallback>{user?.name?.slice(0, 1) ?? "W"}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <span className="block truncate">{user?.name ?? "Account"}</span>
                  <span className="mt-1 block truncate text-xs font-normal text-muted-foreground">
                    {user?.email}
                  </span>
                  {role === "vendor" && user?.subscriptionPlan === "premium" ? (
                    <span className="mt-2 inline-flex">
                      <VendorBadge premium />
                    </span>
                  ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={
                    <Link href={getProfilePath(roleFromSession ?? role)}>
                      <Settings />
                      Profile settings
                    </Link>
                  }
                />
                <DropdownMenuItem onClick={() => void signOut()}>
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
