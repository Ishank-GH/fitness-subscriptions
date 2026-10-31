"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPaiseToRupees, formatDateTime, formatDurationMonths } from "@/lib/format";
import { OverrideDialog, OverrideTransactionTarget } from "@/components/admin/override-dialog";

export interface SerializedAdminTransaction {
  id: string;
  invoiceNumber: string;
  planSnapshot: {
    name: string;
    durationMonths: number;
    baseMonthlyPricePaise: number;
    discountPercentage: number;
    allowPartialPayment: boolean;
  };
  couponSnapshot: {
    code: string;
    type: "FLAT" | "PERCENTAGE";
    flatAmountPaise: number;
    percentage: number;
  } | null;
  totalAmountPaise: number;
  amountPaidPaise: number;
  remainingBalancePaise: number;
  paymentStatus: "COMPLETED" | "PARTIAL" | "PENDING";
  paymentDate: string | null;
  payments: Array<{ amountPaise: number; paidAt: string; reference: string; }>;
  overriddenBy: { name: string; email: string; } | null;
  overriddenAt: string | null;
  overrideNote: string | null;
  createdAt: string;
  athlete: { id: string; name: string; email: string; } | null;
}

export function AdminTransactionTable({ transactions }: { transactions: SerializedAdminTransaction[] }) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "COMPLETED" | "PARTIAL" | "PENDING">("ALL");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [overrideTarget, setOverrideTarget] = React.useState<OverrideTransactionTarget | null>(null);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesStatus = statusFilter === "ALL" || tx.paymentStatus === statusFilter;
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery = query === "" ||
      tx.invoiceNumber.toLowerCase().includes(query) ||
      (tx.athlete?.email && tx.athlete.email.toLowerCase().includes(query)) ||
      tx.planSnapshot.name.toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Input
          type="text"
          placeholder="Search invoice, email, or plan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-80 text-sm font-mono"
        />
        <div className="flex gap-2">
          {(["ALL", "COMPLETED", "PARTIAL", "PENDING"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="text-xs font-mono h-8 capitalize"
            >
              {status.toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="rounded-sm border border-border bg-card p-12 text-center text-sm text-muted-foreground font-mono">
          No invoices found
        </div>
      ) : (
        <div className="rounded-sm border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-background/50 text-muted-foreground font-mono text-xs">
                  <th className="py-3 px-5 font-normal">Invoice</th>
                  <th className="py-3 px-5 font-normal">Athlete</th>
                  <th className="py-3 px-5 font-normal">Plan</th>
                  <th className="py-3 px-5 font-normal">Paid / Total</th>
                  <th className="py-3 px-5 font-normal">Status</th>
                  <th className="py-3 px-5 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-xs">
                {filteredTransactions.map((tx) => {
                  const isExpanded = expandedId === tx.id;
                  const canOverride = tx.paymentStatus === "PARTIAL" && tx.remainingBalancePaise > 0;

                  return (
                    <React.Fragment key={tx.id}>
                      <tr className="hover:bg-background/50 transition-colors">
                        <td className="py-3.5 px-5 font-bold text-foreground">
                          {tx.invoiceNumber}
                          {tx.overriddenAt && <span className="ml-2 px-1 border border-border rounded-sm text-[10px] font-normal text-muted-foreground">Admin</span>}
                        </td>
                        <td className="py-3.5 px-5 font-sans">
                          <span className="block text-foreground">{tx.athlete?.name || "Unassigned"}</span>
                          <span className="block text-[10px] text-muted-foreground">{tx.athlete?.email || "—"}</span>
                        </td>
                        <td className="py-3.5 px-5 text-foreground">{tx.planSnapshot.name}</td>
                        <td className="py-3.5 px-5 text-foreground tabular-nums">
                          {formatPaiseToRupees(tx.amountPaidPaise)} / {formatPaiseToRupees(tx.totalAmountPaise)}
                        </td>
                        <td className="py-3.5 px-5 text-foreground">{tx.paymentStatus}</td>
                        <td className="py-3.5 px-5 text-right space-x-3">
                          {canOverride && (
                            <button
                              onClick={() => setOverrideTarget({
                                id: tx.id,
                                invoiceNumber: tx.invoiceNumber,
                                planName: tx.planSnapshot.name,
                                athleteName: tx.athlete?.name || tx.athlete?.email || "Athlete",
                                remainingBalancePaise: tx.remainingBalancePaise,
                              })}
                              className="text-foreground underline underline-offset-2"
                            >
                              Override
                            </button>
                          )}
                          <button onClick={() => setExpandedId(isExpanded ? null : tx.id)} className="text-muted-foreground hover:text-foreground">
                            {isExpanded ? "Hide" : "Details"}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-background/30">
                          <td colSpan={6} className="p-5 border-t border-border/40 font-mono text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-2">
                                <span className="text-foreground block font-bold mb-1 font-sans text-sm">Purchase details</span>
                                <p className="text-muted-foreground">Term: {formatDurationMonths(tx.planSnapshot.durationMonths)}</p>
                                <p className="text-muted-foreground tabular-nums">Base: {formatPaiseToRupees(tx.planSnapshot.baseMonthlyPricePaise)}/mo</p>
                                <p className="text-muted-foreground">Discount: {tx.planSnapshot.discountPercentage}%</p>
                                {tx.couponSnapshot && (
                                  <p className="text-muted-foreground">Coupon: {tx.couponSnapshot.code}</p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <span className="text-foreground block font-bold mb-1 font-sans text-sm">Payment log</span>
                                {tx.payments.length === 0 ? <p className="text-muted-foreground">No payments.</p> : (
                                  tx.payments.map((p, i) => (
                                    <div key={i} className="flex justify-between items-center tabular-nums">
                                      <span className="text-foreground">{formatPaiseToRupees(p.amountPaise)}</span>
                                      <span className="text-muted-foreground text-[10px]">{formatDateTime(p.paidAt)}</span>
                                    </div>
                                  ))
                                )}
                                {tx.overriddenAt && (
                                  <div className="pt-2 text-muted-foreground text-[10px]">
                                    Overridden by {tx.overriddenBy?.name || "Admin"} on {formatDateTime(tx.overriddenAt)}
                                    <br />"{tx.overrideNote}"
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <OverrideDialog
        isOpen={Boolean(overrideTarget)}
        onClose={() => setOverrideTarget(null)}
        transaction={overrideTarget}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}