"use client";

import * as React from "react";
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

export function OverrideDialog({ isOpen, onClose, transaction, onSuccess }: OverrideDialogProps) {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-sm border border-border bg-card p-6 shadow-none space-y-5">
        <h2 className="text-lg font-bold font-display text-foreground border-b border-border/50 pb-3">
          Override balance for {transaction.invoiceNumber}
        </h2>
        <OverrideForm key={transaction.id} transaction={transaction} onClose={onClose} onSuccess={onSuccess} />
      </div>
    </div>
  );
}

function OverrideForm({ transaction, onClose, onSuccess }: { transaction: OverrideTransactionTarget; onClose: () => void; onSuccess: () => void; }) {
  const [overrideNote, setOverrideNote] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}/override`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrideNote: overrideNote.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Failed to complete override.");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
      <div className="rounded-sm border border-border bg-background p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Athlete:</span>
          <span className="text-foreground">{transaction.athleteName}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 font-bold text-foreground">
          <span>Balance to forgive:</span>
          <span>{formatPaiseToRupees(transaction.remainingBalancePaise)}</span>
        </div>
      </div>
      <div className="space-y-1.5">
        <label>Reason for override</label>
        <textarea required rows={3} placeholder="Manager fee waiver approved" value={overrideNote} onChange={(e) => setOverrideNote(e.target.value)} className="w-full rounded-sm border border-input bg-background p-2.5 focus:outline-none focus:border-foreground" />
      </div>
      {errorMessage && <div className="text-destructive pt-1">{errorMessage}</div>}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" size="sm" disabled={isSubmitting || overrideNote.trim().length < 3}>{isSubmitting ? "Processing..." : "Confirm override"}</Button>
      </div>
    </form>
  );
}