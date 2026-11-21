"use client";

import { useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { LoaderCircle, Search, ShieldBan, ShieldCheck } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError, apiFetch } from "@/lib/api";
import { queryKeys, useAdminUsers } from "@/lib/queries";
import type { Paginated, User } from "@/lib/types";

const PAGE_SIZE = 10;

function createdLabel(value?: string) {
  if (!value) return "—";
  const date = parseISO(value);
  return isValid(date) ? format(date, "MMM d, yyyy") : "—";
}

function getUserId(user: User) {
  return user.id || user._id;
}

export function AdminUsers() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const [userToToggle, setUserToToggle] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const users = useAdminUsers({
    search: search.trim(),
    role: role === "all" ? "" : role,
    page,
    limit: PAGE_SIZE,
  });

  const toggleBlocked = useMutation({
    mutationFn: (user: User) => {
      const id = getUserId(user);
      if (!id) throw new Error("This account is missing its ID.");
      return apiFetch<User>(`/admin/users/${encodeURIComponent(id)}`, {
        method: "PATCH",
        // API_URL already ends in /api, so this path stays relative to it.
        body: { status: user.isBlocked ? "active" : "blocked" },
      });
    },
    onSuccess: async (updatedUser) => {
      toast.success(updatedUser.isBlocked ? "User blocked." : "User unblocked.");
      setUserToToggle(null);

      // Reflect the new account status immediately in every cached users list.
      queryClient.setQueriesData<Paginated<User>>(
        { queryKey: ["admin", "users"] },
        (current) =>
          current
            ? {
                ...current,
                items: current.items.map((item) =>
                  getUserId(item) === getUserId(updatedUser)
                    ? {
                        ...item,
                        ...updatedUser,
                        id: getUserId(updatedUser) ?? item.id,
                      }
                    : item,
                ),
              }
            : current,
      );

      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminOverview });
    },
    onError: (error) => {
      // The shared API layer already signed the user out and showed the
      // blocked-account message for this case.
      if (
        error instanceof ApiError &&
        error.status === 403 &&
        error.message === "Your account has been blocked."
      ) {
        return;
      }
      toast.error(
        error instanceof Error ? error.message : "Could not update this account.",
      );
    },
  });

  const totalPages = Math.max(1, users.data?.pages ?? 1);
  return (
    <div>
      <PageHeader
        description="Review marketplace accounts and protect the community by managing access."
        eyebrow="Administration"
        title="Manage users"
      />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search users"
            className="pl-9"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search name or email"
            value={search}
          />
        </div>
        <Select
          onValueChange={(value) => {
            if (value) {
              setRole(value);
              setPage(1);
            }
          }}
          value={role}
        >
          <SelectTrigger aria-label="Filter by role" className="w-full sm:w-48">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="customer">Customers</SelectItem>
            <SelectItem value="vendor">Vendors</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {users.isLoading ? (
        <div className="h-80 animate-pulse rounded-2xl bg-muted" />
      ) : users.isError ? (
        <ErrorState message={users.error.message} onRetry={() => void users.refetch()} />
      ) : users.data?.items.length ? (
        <>
          <div className="hidden overflow-hidden rounded-2xl border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Access</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data.items.map((user) => (
                  <TableRow key={getUserId(user) ?? user.email}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell>
                      <StatusBadge status={user.isBlocked ? "Blocked" : "Active"} />
                    </TableCell>
                    <TableCell>{createdLabel(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        aria-label={`${user.isBlocked ? "Unblock" : "Block"} ${user.name}`}
                        onClick={() => setUserToToggle(user)}
                        size="sm"
                        variant="outline"
                      >
                        {user.isBlocked ? (
                          <><ShieldCheck className="mr-2 size-4" /> Unblock</>
                        ) : (
                          <><ShieldBan className="mr-2 size-4" /> Block</>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-3 md:hidden">
            {users.data.items.map((user) => (
              <div className="rounded-2xl border bg-card p-4" key={getUserId(user) ?? user.email}>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</dt>
                    <dd className="break-words text-sm font-medium">{user.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</dt>
                    <dd className="break-words text-sm">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Role</dt>
                    <dd className="break-words text-sm capitalize">{user.role}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</dt>
                    <dd className="break-words text-sm">
                      <StatusBadge status={user.isBlocked ? "Blocked" : "Active"} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Joined</dt>
                    <dd className="break-words text-sm">{createdLabel(user.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Access</dt>
                    <dd className="pt-1">
                      <Button
                        aria-label={`${user.isBlocked ? "Unblock" : "Block"} ${user.name}`}
                        className="w-full"
                        onClick={() => setUserToToggle(user)}
                        size="sm"
                        variant="outline"
                      >
                        {user.isBlocked ? (
                          <><ShieldCheck className="mr-2 size-4" /> Unblock</>
                        ) : (
                          <><ShieldBan className="mr-2 size-4" /> Block</>
                        )}
                      </Button>
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {users.data.total} account{users.data.total === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-2">
              <Button
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                size="sm"
                variant="outline"
              >
                Previous
              </Button>
              <span className="min-w-20 text-center text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                size="sm"
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          description="Try a different search or role filter."
          title="No users found"
        />
      )}

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setUserToToggle(null);
        }}
        open={Boolean(userToToggle)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToToggle?.isBlocked ? "Restore this account?" : "Block this account?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userToToggle?.isBlocked
                ? `${userToToggle.name} will be able to access WedMera again.`
                : `${userToToggle?.name} will be signed out and will not be able to access WedMera.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction
              disabled={toggleBlocked.isPending}
              onClick={() => {
                if (userToToggle) toggleBlocked.mutate(userToToggle);
              }}
            >
              {toggleBlocked.isPending ? (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              ) : null}
              {userToToggle?.isBlocked ? "Unblock account" : "Block account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Alert className="mt-6">
        <AlertTitle>Account safety</AlertTitle>
        <AlertDescription>
          Blocking an account should be reserved for policy or safety concerns.
          Users can be restored here when the issue is resolved.
        </AlertDescription>
      </Alert>
    </div>
  );
}
