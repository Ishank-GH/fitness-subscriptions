"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
        message: err instanceof Error ? err.message : "Payment failed.",
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
        
        // Calculate progress bar percentage safely
        const percent = tx.totalAmountPaise > 0 
          ? Math.min(100, Math.max(0, (tx.amountPaidPaise / tx.totalAmountPaise) * 100)) 
          : 100;

        return (
          <div key={tx.id} className="rounded-sm border border-border bg-card">
            <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
              
              <div className="w-full md:max-w-md space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-base text-foreground tabular-nums tracking-tight">
                    {tx.invoiceNumber}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider px-1.5 py-0.5 border border-border rounded-sm">
                    {tx.paymentStatus.toLowerCase()}
                  </span>
                  {tx.overriddenAt && (
                    <span className="font-mono text-[10px] text-foreground bg-background px-1.5 py-0.5 border border-border rounded-sm">
                      Admin override
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-foreground font-medium pt-1">
                  {tx.planSnapshot.name}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {formatDurationMonths(tx.planSnapshot.durationMonths)} · Issued {formatDate(tx.createdAt)}
                </p>

                <div className="pt-5">
                  <div className="w-full h-1.5 bg-background rounded-sm overflow-hidden">
                    <div 
                      className="h-full bg-foreground transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" 
                      style={{ width: `${percent}%` }} 
                    />
                  </div>
                  <p className="font-mono text-xs text-muted-foreground mt-2.5">
                    {formatPaiseToRupees(tx.amountPaidPaise)} paid of {formatPaiseToRupees(tx.totalAmountPaise)}, {formatPaiseToRupees(tx.remainingBalancePaise)} left
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {hasBalance && (
                  <Button
                    size="sm"
                    disabled={isPayingThis}
                    onClick={() => handlePayRemaining(tx.id)}
                    className="font-mono text-xs"
                  >
                    {isPayingThis ? "Processing..." : `Pay ${formatPaiseToRupees(tx.remainingBalancePaise)}`}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleExpand(tx.id)}
                  className="font-mono text-xs"
                >
                  {isExpanded ? "Hide history" : "View history"}
                </Button>
              </div>
            </div>

            {payError && payError.id === tx.id && (
              <div className="mx-5 mb-5 text-xs text-destructive">
                {payError.message}
              </div>
            )}

            {isExpanded && (
              <div className="border-t border-border p-5 sm:p-6 space-y-6 bg-background/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
                  
                  {/* Plan pricing at purchase */}
                  <div className="space-y-3 font-mono text-xs">
                    <span className="font-semibold text-foreground block font-sans text-sm">Plan details at purchase</span>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Base rate:</span>
                      <span className="text-foreground tabular-nums">{formatPaiseToRupees(tx.planSnapshot.baseMonthlyPricePaise)} / mo</span>
                    </div>
                    {tx.planSnapshot.discountPercentage > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Commitment discount:</span>
                        <span className="text-foreground">{tx.planSnapshot.discountPercentage}%</span>
                      </div>
                    )}
                    {tx.couponSnapshot && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Coupon applied ({tx.couponSnapshot.code}):</span>
                        <span className="text-foreground">
                          {tx.couponSnapshot.type === "PERCENTAGE"
                            ? `${tx.couponSnapshot.percentage}%`
                            : formatPaiseToRupees(tx.couponSnapshot.flatAmountPaise)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Payment Log */}
                  <div className="space-y-3 font-mono text-xs">
                    <span className="font-semibold text-foreground block font-sans text-sm">Payment history</span>
                    
                    {tx.payments.length === 0 ? (
                      <p className="text-muted-foreground">No payments recorded.</p>
                    ) : (
                      <div className="space-y-2 border-l border-border pl-3">
                        {tx.payments.map((p, idx) => (
                          <div key={idx} className="flex justify-between items-baseline gap-4">
                            <div className="space-y-0.5">
                              <span className="text-foreground block tabular-nums">{formatPaiseToRupees(p.amountPaise)}</span>
                              <span className="text-muted-foreground text-[10px] block">Ref: {p.reference}</span>
                            </div>
                            <span className="text-muted-foreground text-[10px] text-right">
                              {formatDateTime(p.paidAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {tx.overriddenAt && (
                      <div className="pt-2 text-[11px] text-muted-foreground">
                        <span className="block text-foreground mb-1">Admin override</span>
                        Adjusted on {formatDateTime(tx.overriddenAt)}
                        {tx.overrideNote ? ` — "${tx.overrideNote}"` : ""}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}