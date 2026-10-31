"use client";

import * as React from "react";
import { X, Loader2, Sparkles, AlertCircle } from "lucide-react";
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

export function PlanDialog({
  isOpen,
  onClose,
  planToEdit,
  onSaved,
}: PlanDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded border border-border bg-card p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <h2 className="text-lg font-bold text-foreground">
            {planToEdit ? `Edit ${planToEdit.name}` : "New plan"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <PlanForm
          key={planToEdit?.id ?? "create"}
          planToEdit={planToEdit}
          onClose={onClose}
          onSaved={onSaved}
        />
      </div>
    </div>
  );
}

function PlanForm({
  planToEdit,
  onClose,
  onSaved,
}: {
  planToEdit?: SerializedAdminPlan | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = Boolean(planToEdit);

  const [name, setName] = React.useState(planToEdit?.name ?? "");
  const [durationMonths, setDurationMonths] = React.useState<string | number>(
    planToEdit?.durationMonths ?? 1
  );
  const [monthlyRupees, setMonthlyRupees] = React.useState<string | number>(
    planToEdit ? paiseToRupees(planToEdit.baseMonthlyPricePaise) : 4000
  );
  const [discountPercentage, setDiscountPercentage] = React.useState<string | number>(
    planToEdit?.discountPercentage ?? 0
  );
  const [allowPartialPayment, setAllowPartialPayment] = React.useState(
    planToEdit?.allowPartialPayment ?? false
  );
  const [isActive, setIsActive] = React.useState(planToEdit?.isActive ?? true);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const parsedDuration = Number(durationMonths) || 0;
  const parsedMonthlyRupees = Number(monthlyRupees) || 0;
  const parsedDiscount = Number(discountPercentage) || 0;

  const grossRupees = parsedDuration * parsedMonthlyRupees;
  const commitmentDiscountRupees = Math.floor((grossRupees * parsedDiscount) / 100);
  const totalRupees = Math.max(0, grossRupees - commitmentDiscountRupees);
  const minimumUpfrontRupees = allowPartialPayment ? Math.round(totalRupees * 0.5) : totalRupees;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const validDuration = Math.round(Number(durationMonths));
    const validMonthly = Number(monthlyRupees);
    const validDiscount = Number(discountPercentage) || 0;

    if (!name.trim()) {
      setErrorMessage("Plan title is required.");
      return;
    }

    if (isNaN(validDuration) || validDuration < 1 || validDuration > 36) {
      setErrorMessage("Duration must be between 1 and 36 months.");
      return;
    }

    if (isNaN(validMonthly) || validMonthly < 0) {
      setErrorMessage("Base monthly rate cannot be negative.");
      return;
    }

    if (isNaN(validDiscount) || validDiscount < 0 || validDiscount > 100) {
      setErrorMessage("Discount must be between 0% and 100%.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        durationMonths: validDuration,
        baseMonthlyPricePaise: rupeesToPaise(validMonthly),
        discountPercentage: validDiscount,
        allowPartialPayment,
        ...(isEditing ? { isActive } : {}),
      };

      const url = isEditing ? `/api/plans/${planToEdit!.id}` : "/api/plans";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to save plan.");
      }

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
      <div className="space-y-1.5">
        <label htmlFor="planName" className="text-xs font-medium text-foreground">
          Plan title
        </label>
        <Input
          id="planName"
          type="text"
          required
          placeholder="e.g. 6-Month Progression"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-xs sm:text-sm font-medium"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="durationMonths" className="text-xs font-medium text-foreground">
            Duration (months)
          </label>
          <Input
            id="durationMonths"
            type="number"
            min="1"
            max="36"
            required
            value={durationMonths}
            onChange={(e) => setDurationMonths(e.target.value)}
            className="font-mono text-xs sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="monthlyRate" className="text-xs font-medium text-foreground">
            Monthly rate (₹)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold pointer-events-none">
              ₹
            </span>
            <Input
              id="monthlyRate"
              type="number"
              min="0"
              step="50"
              required
              value={monthlyRupees}
              onChange={(e) => setMonthlyRupees(e.target.value)}
              className="pl-7 font-mono text-xs sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <label htmlFor="discountPercentage" className="font-medium text-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Commitment discount (%)
          </label>
          <span className="font-mono text-muted-foreground">{parsedDiscount}%</span>
        </div>
        <div className="relative">
          <Input
            id="discountPercentage"
            type="number"
            min="0"
            max="100"
            value={discountPercentage}
            onChange={(e) => setDiscountPercentage(e.target.value)}
            className="pr-7 font-mono text-xs sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold pointer-events-none">
            %
          </span>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allowPartialPayment}
            onChange={(e) => setAllowPartialPayment(e.target.checked)}
            className="h-4 w-4 rounded border-border bg-background text-primary accent-primary"
          />
          <span>Allow 50% upfront payment</span>
        </label>

        {isEditing && (
          <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-border bg-background text-primary accent-primary"
            />
            <span>Active plan (visible to members)</span>
          </label>
        )}
      </div>

      {/* Pricing Calculation Preview */}
      <div className="rounded border border-border/80 bg-muted/30 p-3.5 space-y-2 text-xs font-mono">
        <div className="flex justify-between text-muted-foreground">
          <span>Gross total:</span>
          <span className="text-foreground">{formatPaiseToRupees(rupeesToPaise(grossRupees))}</span>
        </div>
        {parsedDiscount > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>Discount ({parsedDiscount}%):</span>
            <span>-{formatPaiseToRupees(rupeesToPaise(commitmentDiscountRupees))}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border/50">
          <span>Net price:</span>
          <span>{formatPaiseToRupees(rupeesToPaise(totalRupees))}</span>
        </div>
        {allowPartialPayment && (
          <div className="flex justify-between text-amber-400 text-[11px]">
            <span>50% upfront:</span>
            <span>{formatPaiseToRupees(rupeesToPaise(minimumUpfrontRupees))}</span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
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
          disabled={isSubmitting || !name.trim()}
          className="font-medium gap-1.5"
        >
          {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {isEditing ? "Save changes" : "Create plan"}
        </Button>
      </div>
    </form>
  );
}