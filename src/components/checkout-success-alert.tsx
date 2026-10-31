"use client";

import * as React from "react";
import { X } from "lucide-react";
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
    <div className="rounded-sm border border-border bg-card p-4 sm:p-5 flex items-start justify-between gap-4">
      <div className="space-y-1">
        <p className="font-bold text-foreground text-sm font-display tracking-tight">
          {status === "PARTIAL" ? "Payment successful. Balance remaining." : "Membership active"}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {status === "PARTIAL"
            ? `Your upfront payment was processed. An outstanding balance of ${formatPaiseToRupees(
                balanceDuePaise
              )} remains due before your training block ends.`
            : "Your membership is now active. Welcome to Ironvale. Facility access is unlocked."}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}