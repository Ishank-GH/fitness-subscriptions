"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPaiseToRupees, paiseToRupees, rupeesToPaise } from "@/lib/format";

export interface SerializedAdminPlan {
  id: string;
  name: string;
  durationMonths: number;
  baseMonthlyPricePaise: number;
  discountPercentage: number;
  allowPartialPayment: boolean;
  isActive: boolean;
}

interface PlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  planToEdit?: SerializedAdminPlan | null;
  onSaved: () => void;
}

export function PlanDialog({ isOpen, onClose, planToEdit, onSaved }: PlanDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-sm border border-border bg-card p-6 shadow-none space-y-6">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <h2 className="text-lg font-bold font-display text-foreground">
            {planToEdit ? `Edit ${planToEdit.name}` : "New plan"}
          </h2>
        </div>
        <PlanForm key={planToEdit?.id ?? "create"} planToEdit={planToEdit} onClose={onClose} onSaved={onSaved} />
      </div>
    </div>
  );
}

function PlanForm({ planToEdit, onClose, onSaved }: { planToEdit?: SerializedAdminPlan | null; onClose: () => void; onSaved: () => void; }) {
  const isEditing = Boolean(planToEdit);
  const [name, setName] = React.useState(planToEdit?.name ?? "");
  const [durationMonths, setDurationMonths] = React.useState<string | number>(planToEdit?.durationMonths ?? 1);
  const [monthlyRupees, setMonthlyRupees] = React.useState<string | number>(planToEdit ? paiseToRupees(planToEdit.baseMonthlyPricePaise) : 4000);
  const [discountPercentage, setDiscountPercentage] = React.useState<string | number>(planToEdit?.discountPercentage ?? 0);
  const [allowPartialPayment, setAllowPartialPayment] = React.useState(planToEdit?.allowPartialPayment ?? false);
  const [isActive, setIsActive] = React.useState(planToEdit?.isActive ?? true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        durationMonths: Math.round(Number(durationMonths)),
        baseMonthlyPricePaise: rupeesToPaise(Number(monthlyRupees)),
        discountPercentage: Number(discountPercentage) || 0,
        allowPartialPayment,
        ...(isEditing ? { isActive } : {}),
      };
      const url = isEditing ? `/api/plans/${planToEdit!.id}` : "/api/plans";
      const res = await fetch(url, { method: isEditing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Failed to save plan.");
      onSaved();
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5 text-xs font-mono">
        <label htmlFor="planName">Plan title</label>
        <Input id="planName" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
        <div className="space-y-1.5"><label>Duration (months)</label><Input type="number" required value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)} /></div>
        <div className="space-y-1.5"><label>Monthly rate (₹)</label><Input type="number" required value={monthlyRupees} onChange={(e) => setMonthlyRupees(e.target.value)} /></div>
      </div>
      <div className="space-y-1.5 text-xs font-mono">
        <label>Commitment discount (%)</label>
        <Input type="number" value={discountPercentage} onChange={(e) => setDiscountPercentage(e.target.value)} />
      </div>
      <div className="space-y-2 pt-2 text-xs font-mono flex flex-col gap-2">
        <label className="flex items-center gap-2"><input type="checkbox" checked={allowPartialPayment} onChange={(e) => setAllowPartialPayment(e.target.checked)} /> 50% upfront payment allowed</label>
        {isEditing && <label className="flex items-center gap-2"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active plan</label>}
      </div>
      {errorMessage && <div className="text-xs text-destructive font-mono border-t border-border pt-2">{errorMessage}</div>}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" size="sm" disabled={isSubmitting || !name.trim()}>{isSubmitting ? "Saving..." : "Save"}</Button>
      </div>
    </form>
  );
}