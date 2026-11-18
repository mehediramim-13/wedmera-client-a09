"use client";

import { useState } from "react";
import { format, isValid, parseISO } from "date-fns";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminTransactions } from "@/lib/queries";

const PAGE_SIZE = 10;

function dateLabel(value: string) {
  const date = parseISO(value);
  return isValid(date) ? format(date, "MMM d, yyyy · h:mm a") : "—";
}

function money(value: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value);
}

export function AdminTransactions() {
  const [page, setPage] = useState(1);
  const transactions = useAdminTransactions({ page, limit: PAGE_SIZE });
  const totalPages = Math.max(1, transactions.data?.pages ?? 1);

  return (
    <div>
      <PageHeader
        description="Review subscription payments recorded across the marketplace."
        eyebrow="Administration"
        title="Transactions"
      />
      {transactions.isLoading ? (
        <div className="h-80 animate-pulse rounded-2xl bg-muted" />
      ) : transactions.isError ? (
        <ErrorState
          message={transactions.error.message}
          onRetry={() => void transactions.refetch()}
        />
      ) : transactions.data?.items.length ? (
        <>
          <div className="overflow-hidden rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.data.items.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>
                      <div className="font-medium">
                        {transaction.vendor?.businessName ||
                          transaction.vendor?.name ||
                          "Unknown vendor"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {transaction.vendor?.email}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {transaction.subscriptionPlan}
                    </TableCell>
                    <TableCell>{money(transaction.amount)}</TableCell>
                    <TableCell><StatusBadge status={transaction.status} /></TableCell>
                    <TableCell>{dateLabel(transaction.createdAt)}</TableCell>
                    <TableCell className="max-w-36 truncate font-mono text-xs">
                      {transaction._id}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {transactions.data.total} transaction
              {transactions.data.total === 1 ? "" : "s"}
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
          description="Payment records will appear here once they are available."
          title="No transactions yet"
        />
      )}
    </div>
  );
}
