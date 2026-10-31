"use client";

import * as React from "react";
import { X, Loader2, ShieldAlert, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPaiseToRupees } from "@/lib/format";

export interface OverrideTransactionTarget {
  id: string;
  invoiceNumber: string;
  planName: string;
  athleteName: string;
  remainingBalancePaise: number;
}

interface OverrideDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: OverrideTransactionTarget | null;
  onSuccess: () => void;
}

export function OverrideDialog({
  isOpen,
  onClose,
  transaction,
  onSuccess,
}: OverrideDialogProps) {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded border border-border bg-card p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Override balance for {transaction.invoiceNumber}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <OverrideForm
          key={transaction.id}
          transaction={transaction}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      </div>
    </div>
  );
}

function OverrideForm({
  transaction,
  onClose,
  onSuccess,
}: {
  transaction: OverrideTransactionTarget;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [overrideNote, setOverrideNote] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const cleanNote = overrideNote.trim();
    if (cleanNote.length < 3) {
      setErrorMessage("Please enter an override reason (minimum 3 characters).");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/transactions/${transaction.id}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrideNote: cleanNote }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to complete balance override.");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Transaction Details Callout */}
      <div className="rounded border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Athlete:</span>
          <span className="font-medium text-foreground">{transaction.athleteName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Plan:</span>
          <span className="font-mono text-foreground">{transaction.planName}</span>
        </div>
        <div className="flex justify-between border-t border-amber-500/20 pt-1.5 font-bold">
          <span className="text-amber-400">Balance to forgive:</span>
          <span className="font-mono text-amber-400">
            {formatPaiseToRupees(transaction.remainingBalancePaise)}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="auditReason" className="text-xs font-medium text-foreground">
          Reason for override
        </label>
        <textarea
          id="auditReason"
          required
          rows={3}
          placeholder="e.g. Paid in cash at reception / Manager fee waiver approved"
          value={overrideNote}
          onChange={(e) => setOverrideNote(e.target.value)}
          className="w-full rounded border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-sans"
        />
        <p className="text-[11px] text-muted-foreground">
          This note will be recorded with the payment record.
        </p>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed bg-muted/20 p-2.5 rounded border border-border/50">
        This action adds an adjustment entry of{" "}
        <strong className="text-foreground">{formatPaiseToRupees(transaction.remainingBalancePaise)}</strong>{" "}
        with reference <span className="font-mono text-primary font-bold">ADMIN_OVERRIDE</span>, marks the invoice as COMPLETED, and clears the athlete&apos;s remaining dues.
      </p>

      {errorMessage && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/50">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || overrideNote.trim().length < 3}
          className="font-medium gap-1.5 bg-amber-600 hover:bg-amber-500 text-black"
        >
          {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Confirm override
        </Button>
      </div>
    </form>
  );
}