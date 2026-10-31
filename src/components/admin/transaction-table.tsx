"use client";

import * as React from "react";
import {
  Search,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Receipt,
  Tag,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatPaiseToRupees, formatDate, formatDateTime, formatDurationMonths } from "@/lib/format";
import {
  OverrideDialog,
  OverrideTransactionTarget,
} from "@/components/admin/override-dialog";

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
  payments: Array<{
    amountPaise: number;
    paidAt: string;
    reference: string;
  }>;
  overriddenBy: {
    name: string;
    email: string;
  } | null;
  overriddenAt: string | null;
  overrideNote: string | null;
  createdAt: string;
  athlete: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export function AdminTransactionTable({
  transactions,
}: {
  transactions: SerializedAdminTransaction[];
}) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "COMPLETED" | "PARTIAL" | "PENDING">("ALL");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [overrideTarget, setOverrideTarget] = React.useState<OverrideTransactionTarget | null>(null);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const filteredTransactions = transactions.filter((tx) => {
    const matchesStatus = statusFilter === "ALL" || tx.paymentStatus === statusFilter;

    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      query === "" ||
      tx.invoiceNumber.toLowerCase().includes(query) ||
      (tx.athlete?.email && tx.athlete.email.toLowerCase().includes(query)) ||
      (tx.athlete?.name && tx.athlete.name.toLowerCase().includes(query)) ||
      tx.planSnapshot.name.toLowerCase().includes(query);

    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by invoice, email, or athlete..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground mr-1 shrink-0" />
          {(["ALL", "COMPLETED", "PARTIAL", "PENDING"] as const).map((status) => (
            <Button
              key={status}
              type="button"
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="text-xs font-mono h-8 capitalize whitespace-nowrap"
            >
              {status.toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filteredTransactions.length === 0 ? (
        <div className="rounded border border-border bg-card p-12 text-center space-y-2">
          <p className="text-sm font-semibold text-foreground">No matching invoices found</p>
          <p className="text-xs text-muted-foreground">
            Try adjusting your search query or status filter.
          </p>
        </div>
      ) : (
        <div className="rounded border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-mono text-[11px] text-left">
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Athlete</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Paid / Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Issued</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {filteredTransactions.map((tx) => {
                  const isExpanded = expandedId === tx.id;
                  const canOverride = tx.paymentStatus === "PARTIAL" && tx.remainingBalancePaise > 0;

                  return (
                    <React.Fragment key={tx.id}>
                      <tr className="hover:bg-muted/20 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-foreground font-sans">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono">{tx.invoiceNumber}</span>
                            {tx.overriddenAt && (
                              <Badge variant="accent" className="text-[9px] py-0 px-1 font-mono">
                                Override
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-sans">
                          <span className="text-foreground font-medium block">
                            {tx.athlete?.name || "Unassigned"}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {tx.athlete?.email || "—"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-sans text-foreground">
                          {tx.planSnapshot.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-foreground font-semibold">
                            {formatPaiseToRupees(tx.amountPaidPaise)}
                          </span>
                          <span className="text-muted-foreground ml-1">
                            / {formatPaiseToRupees(tx.totalAmountPaise)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {tx.paymentStatus === "COMPLETED" && (
                            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[10px] gap-1">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              COMPLETED
                            </Badge>
                          )}
                          {tx.paymentStatus === "PARTIAL" && (
                            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400 text-[10px] gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              PARTIAL ({formatPaiseToRupees(tx.remainingBalancePaise)})
                            </Badge>
                          )}
                          {tx.paymentStatus === "PENDING" && (
                            <Badge variant="outline" className="border-muted text-muted-foreground text-[10px]">
                              PENDING
                            </Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canOverride && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() =>
                                  setOverrideTarget({
                                    id: tx.id,
                                    invoiceNumber: tx.invoiceNumber,
                                    planName: tx.planSnapshot.name,
                                    athleteName: tx.athlete?.name || tx.athlete?.email || "Athlete",
                                    remainingBalancePaise: tx.remainingBalancePaise,
                                  })
                                }
                                className="h-7 text-[11px] font-semibold bg-amber-600 hover:bg-amber-500 text-black px-2.5"
                              >
                                Override
                              </Button>
                            )}

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpand(tx.id)}
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <span>{isExpanded ? "Hide" : "Details"}</span>
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5 ml-1" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 ml-1" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable History and Snapshot Details */}
                      {isExpanded && (
                        <tr className="bg-muted/15">
                          <td colSpan={7} className="p-4 sm:p-5 border-t border-border/40 font-sans">
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="rounded border border-border/50 bg-background/50 p-3 space-y-1">
                                  <span className="text-[11px] text-muted-foreground font-medium block">
                                    Plan details
                                  </span>
                                  <p className="font-semibold text-foreground text-xs">
                                    {tx.planSnapshot.name} ({formatDurationMonths(tx.planSnapshot.durationMonths)})
                                  </p>
                                  <p className="text-[11px] text-muted-foreground font-mono">
                                    Rate: {formatPaiseToRupees(tx.planSnapshot.baseMonthlyPricePaise)}/mo | Disc: {tx.planSnapshot.discountPercentage}%
                                  </p>
                                </div>

                                <div className="rounded border border-border/50 bg-background/50 p-3 space-y-1">
                                  <span className="text-[11px] text-muted-foreground font-medium block">
                                    Coupon details
                                  </span>
                                  {tx.couponSnapshot ? (
                                    <div>
                                      <span className="font-mono font-bold text-emerald-400 flex items-center gap-1 text-xs">
                                        <Tag className="h-3 w-3" />
                                        {tx.couponSnapshot.code}
                                      </span>
                                      <p className="text-[11px] text-muted-foreground">
                                        {tx.couponSnapshot.type === "PERCENTAGE"
                                          ? `${tx.couponSnapshot.percentage}% off`
                                          : `${formatPaiseToRupees(tx.couponSnapshot.flatAmountPaise)} flat off`}
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-muted-foreground text-xs">None applied</p>
                                  )}
                                </div>

                                <div className="rounded border border-border/50 bg-background/50 p-3 space-y-1">
                                  <span className="text-[11px] text-muted-foreground font-medium block">
                                    Payment dates
                                  </span>
                                  <p className="text-muted-foreground text-xs">
                                    Created: {formatDateTime(tx.createdAt)}
                                  </p>
                                  {tx.paymentDate && (
                                    <p className="text-foreground text-xs">
                                      First payment: {formatDateTime(tx.paymentDate)}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Administrative Override Meta */}
                              {tx.overriddenAt && (
                                <div className="rounded border border-primary/30 bg-primary/5 p-3 space-y-1">
                                  <span className="text-xs text-primary font-semibold block">
                                    Administrative override
                                  </span>
                                  <p className="text-foreground text-xs">
                                    Overridden by <strong className="font-semibold">{tx.overriddenBy?.name || tx.overriddenBy?.email || "Admin"}</strong> on {formatDateTime(tx.overriddenAt)}
                                  </p>
                                  {tx.overrideNote && (
                                    <p className="text-xs text-muted-foreground italic mt-0.5">
                                      &ldquo;{tx.overrideNote}&rdquo;
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Installment History Log */}
                              <div className="space-y-1.5">
                                <span className="text-xs font-semibold text-muted-foreground block">
                                  Payment history ({tx.payments.length})
                                </span>
                                {tx.payments.length === 0 ? (
                                  <p className="text-muted-foreground text-xs italic">No payments recorded.</p>
                                ) : (
                                  <div className="rounded border border-border/50 overflow-hidden divide-y divide-border/40 font-mono">
                                    {tx.payments.map((p, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between p-2.5 bg-background/40"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Receipt className="h-3.5 w-3.5 text-primary shrink-0" />
                                          <span className="font-medium text-foreground">
                                            {formatPaiseToRupees(p.amountPaise)}
                                          </span>
                                          <span className="text-[11px] text-muted-foreground ml-2">
                                            Ref: {p.reference}
                                          </span>
                                        </div>
                                        <span className="text-muted-foreground text-[11px]">
                                          {formatDateTime(p.paidAt)}
                                        </span>
                                      </div>
                                    ))}
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

      {/* Override Dialog Modal */}
      <OverrideDialog
        isOpen={Boolean(overrideTarget)}
        onClose={() => setOverrideTarget(null)}
        transaction={overrideTarget}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}