"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Receipt,
  Tag,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPaiseToRupees, formatDate, formatDateTime, formatDurationMonths } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface SerializedPaymentRecord {
  amountPaise: number;
  paidAt: string | Date;
  reference: string;
}

export interface SerializedTransaction {
  id: string;
  invoiceNumber: string;
  planSnapshot: {
    name: string;
    durationMonths: number;
    baseMonthlyPricePaise: number;
    discountPercentage: number;
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
  paymentDate: string | Date | null;
  payments: SerializedPaymentRecord[];
  overriddenAt: string | Date | null;
  overrideNote: string | null;
  createdAt: string | Date;
}

export function BillingInvoiceList({
  transactions,
}: {
  transactions: SerializedTransaction[];
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [payingId, setPayingId] = React.useState<string | null>(null);
  const [payError, setPayError] = React.useState<{ id: string; message: string } | null>(null);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  // Pay off the remaining balance on a partial transaction
  async function handlePayRemaining(transactionId: string) {
    setPayError(null);
    setPayingId(transactionId);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId,
          paymentChoice: "FULL",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to settle remaining balance.");
      }

      router.refresh();
    } catch (err: unknown) {
      setPayError({
        id: transactionId,
        message: err instanceof Error ? err.message : "Payment execution failed.",
      });
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {transactions.map((tx) => {
        const isExpanded = expandedId === tx.id;
        const isPayingThis = payingId === tx.id;
        const hasBalance = tx.remainingBalancePaise > 0 && tx.paymentStatus !== "PENDING";

        return (
          <div
            key={tx.id}
            className={cn(
              "rounded border bg-card transition-all",
              hasBalance
                ? "border-amber-500/40"
                : "border-border hover:border-muted-foreground/30"
            )}
          >
            {/* Invoice Summary Header */}
            <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono font-bold text-base text-foreground tracking-tight">
                    {tx.invoiceNumber}
                  </span>

                  {tx.paymentStatus === "COMPLETED" && (
                    <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 gap-1 text-[11px]">
                      <CheckCircle2 className="h-3 w-3" />
                      Paid in Full
                    </Badge>
                  )}

                  {tx.paymentStatus === "PARTIAL" && (
                    <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400 gap-1 text-[11px]">
                      <Clock className="h-3 w-3" />
                      Balance Due: {formatPaiseToRupees(tx.remainingBalancePaise)}
                    </Badge>
                  )}

                  {tx.paymentStatus === "PENDING" && (
                    <Badge variant="outline" className="border-muted text-muted-foreground gap-1 text-[11px]">
                      Awaiting Payment
                    </Badge>
                  )}

                  {tx.overriddenAt && (
                    <Badge variant="accent" className="text-[10px] py-0 font-mono">
                      Admin Adjusted
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {tx.planSnapshot.name}
                  </span>
                  <span>•</span>
                  <span>{formatDurationMonths(tx.planSnapshot.durationMonths)}</span>
                  <span>•</span>
                  <span>Issued on {formatDate(tx.createdAt)}</span>
                </div>
              </div>

              {/* Price & Actions */}
              <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                <div className="text-left md:text-right">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider block">
                    Invoice Total
                  </span>
                  <span className="font-display font-bold text-lg text-foreground">
                    {formatPaiseToRupees(tx.totalAmountPaise)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {tx.paymentStatus === "PARTIAL" && (
                    <Button
                      size="sm"
                      disabled={isPayingThis}
                      onClick={() => handlePayRemaining(tx.id)}
                      className="gap-1.5 font-semibold text-xs bg-amber-600 hover:bg-amber-500 text-black whitespace-nowrap"
                    >
                      {isPayingThis ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Paying...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-3.5 w-3.5" />
                          Pay {formatPaiseToRupees(tx.remainingBalancePaise)}
                        </>
                      )}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(tx.id)}
                    className="gap-1 text-xs text-muted-foreground hover:text-foreground h-8 px-2"
                  >
                    <span>{isExpanded ? "Hide Details" : "Details"}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Error banner if payment settlement failed */}
            {payError && payError.id === tx.id && (
              <div className="mx-4 sm:mx-5 mb-4 rounded border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{payError.message}</span>
              </div>
            )}

            {/* Expanded Detailed Audit Log */}
            {isExpanded && (
              <div className="border-t border-border/60 bg-muted/20 p-4 sm:p-5 space-y-5 text-xs">
                {/* Historical Snapshot Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded border border-border/50 bg-background/50 p-3 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider block">
                      Base Rate at Purchase
                    </span>
                    <p className="font-mono text-sm font-semibold text-foreground">
                      {formatPaiseToRupees(tx.planSnapshot.baseMonthlyPricePaise)} / mo
                    </p>
                    {tx.planSnapshot.discountPercentage > 0 && (
                      <p className="text-[11px] text-emerald-400">
                        {tx.planSnapshot.discountPercentage}% multi-month rate applied
                      </p>
                    )}
                  </div>

                  <div className="rounded border border-border/50 bg-background/50 p-3 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider block">
                      Coupon Applied
                    </span>
                    {tx.couponSnapshot ? (
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {tx.couponSnapshot.code}
                        </span>
                        <p className="text-[11px] text-muted-foreground">
                          {tx.couponSnapshot.type === "PERCENTAGE"
                            ? `${tx.couponSnapshot.percentage}% discount`
                            : `${formatPaiseToRupees(tx.couponSnapshot.flatAmountPaise)} flat discount`}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No promo code used</p>
                    )}
                  </div>

                  <div className="rounded border border-border/50 bg-background/50 p-3 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider block">
                      Settlement Balance
                    </span>
                    <p className="font-mono text-sm font-semibold text-foreground">
                      {formatPaiseToRupees(tx.amountPaidPaise)} paid of {formatPaiseToRupees(tx.totalAmountPaise)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Remaining: {formatPaiseToRupees(tx.remainingBalancePaise)}
                    </p>
                  </div>
                </div>

                {/* Overridden Administrative Note (if any) */}
                {tx.overriddenAt && (
                  <div className="rounded border border-primary/30 bg-primary/5 p-3 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-primary font-bold tracking-wider flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Administrative Ledger Adjustment
                    </span>
                    <p className="text-muted-foreground">
                      Adjusted on {formatDateTime(tx.overriddenAt)}
                      {tx.overrideNote ? `: "${tx.overrideNote}"` : ""}
                    </p>
                  </div>
                )}

                {/* Individual Payment History (Audit Trail) */}
                <div className="space-y-2">
                  <span className="font-mono uppercase font-bold text-[10px] text-muted-foreground tracking-wider block">
                    Payment Installment Log ({tx.payments.length})
                  </span>

                  {tx.payments.length === 0 ? (
                    <p className="text-muted-foreground italic">
                      No payments recorded yet for this invoice.
                    </p>
                  ) : (
                    <div className="rounded border border-border/50 overflow-hidden divide-y divide-border/40">
                      {tx.payments.map((p, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-background/40 hover:bg-background/80 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <Receipt className="h-3.5 w-3.5 text-primary shrink-0" />
                            <div>
                              <span className="font-mono font-medium text-foreground">
                                {formatPaiseToRupees(p.amountPaise)}
                              </span>
                              <span className="text-muted-foreground text-[11px] ml-2">
                                Ref: {p.reference}
                              </span>
                            </div>
                          </div>
                          <span className="text-muted-foreground text-[11px] font-mono">
                            {formatDateTime(p.paidAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}