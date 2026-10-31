"use client";

import * as React from "react";
import { CheckCircle2, X, Clock } from "lucide-react";
import { formatPaiseToRupees } from "@/lib/format";

interface CheckoutSuccessAlertProps {
  status: "ACTIVE" | "PARTIAL" | "EXPIRED" | "NONE";
  balanceDuePaise?: number;
}

export function CheckoutSuccessAlert({
  status,
  balanceDuePaise = 0,
}: CheckoutSuccessAlertProps) {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  return (
    <div className="rounded border border-emerald-500/40 bg-emerald-500/10 p-4 sm:p-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3.5">
        {status === "PARTIAL" ? (
          <Clock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        )}
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground text-sm uppercase tracking-wider font-mono">
            {status === "PARTIAL"
              ? "Payment Recorded — Installment Balance Remaining"
              : "Membership Activated Successfully"}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {status === "PARTIAL"
              ? `Your upfront payment was processed. An outstanding balance of ${formatPaiseToRupees(
                  balanceDuePaise
                )} remains due before your training block ends.`
              : "Your membership is now active. Welcome to Ironvale! Facility and platform privileges are unlocked."}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/40 transition-colors shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}