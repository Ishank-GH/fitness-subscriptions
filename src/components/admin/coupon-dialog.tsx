"use client";

import * as React from "react";
import { X, Loader2, AlertCircle, Percent, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { paiseToRupees, rupeesToPaise } from "@/lib/format";

export interface SerializedAdminCoupon {
  id: string;
  code: string;
  type: "FLAT" | "PERCENTAGE";
  flatAmountPaise: number;
  percentage: number;
  maxRedemptions: number | null;
  currentRedemptions: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

interface CouponDialogProps {
  isOpen: boolean;
  onClose: () => void;
  couponToEdit?: SerializedAdminCoupon | null;
  onSaved: () => void;
}

export function CouponDialog({
  isOpen,
  onClose,
  couponToEdit,
  onSaved,
}: CouponDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded border border-border bg-card p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
              {couponToEdit ? "Modify Promotional Code" : "Issue New Discount Code"}
            </span>
            <h2 className="text-xl font-bold font-display uppercase tracking-tight text-foreground">
              {couponToEdit ? `Edit ${couponToEdit.code}` : "New Promo Coupon"}
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

        <CouponForm
          key={couponToEdit?.id ?? "create"}
          couponToEdit={couponToEdit}
          onClose={onClose}
          onSaved={onSaved}
        />
      </div>
    </div>
  );
}

function CouponForm({
  couponToEdit,
  onClose,
  onSaved,
}: {
  couponToEdit?: SerializedAdminCoupon | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = Boolean(couponToEdit);

  // Default expiration: 30 days from now
  const defaultValidUntil = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  }, []);

  const [code, setCode] = React.useState(couponToEdit?.code ?? "");
  const [type, setType] = React.useState<"FLAT" | "PERCENTAGE">(
    couponToEdit?.type ?? "PERCENTAGE"
  );
  const [discountValue, setDiscountValue] = React.useState<string | number>(
    couponToEdit
      ? couponToEdit.type === "FLAT"
        ? paiseToRupees(couponToEdit.flatAmountPaise)
        : couponToEdit.percentage
      : 10
  );
  const [hasMaxRedemptions, setHasMaxRedemptions] = React.useState(
    couponToEdit ? couponToEdit.maxRedemptions !== null : false
  );
  const [maxRedemptions, setMaxRedemptions] = React.useState<string | number>(
    couponToEdit?.maxRedemptions ?? 100
  );
  const [validUntil, setValidUntil] = React.useState(
    couponToEdit ? couponToEdit.validUntil.split("T")[0] : defaultValidUntil
  );
  const [isActive, setIsActive] = React.useState(couponToEdit?.isActive ?? true);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length < 3 || cleanCode.length > 20) {
      setErrorMessage("Coupon code must be between 3 and 20 alphanumeric characters.");
      return;
    }

    const numValue = Number(discountValue);
    if (isNaN(numValue) || numValue <= 0) {
      setErrorMessage("Discount value must be greater than zero.");
      return;
    }

    if (type === "PERCENTAGE" && numValue > 100) {
      setErrorMessage("Percentage discount cannot exceed 100%.");
      return;
    }

    let parsedMax: number | null = null;
    if (hasMaxRedemptions) {
      parsedMax = parseInt(String(maxRedemptions), 10);
      if (isNaN(parsedMax) || parsedMax < 1) {
        setErrorMessage("Max redemptions must be an integer of at least 1.");
        return;
      }
    }

    if (!validUntil) {
      setErrorMessage("Expiration date is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        code: cleanCode,
        type,
        flatAmountPaise: type === "FLAT" ? rupeesToPaise(numValue) : 0,
        percentage: type === "PERCENTAGE" ? numValue : 0,
        maxRedemptions: parsedMax,
        validUntil: new Date(`${validUntil}T23:59:59.999Z`),
        ...(isEditing ? { isActive } : {}),
      };

      const url = isEditing ? `/api/coupons/${couponToEdit!.id}` : "/api/coupons";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to save promotional coupon.");
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
      {/* Code */}
      <div className="space-y-1.5">
        <label htmlFor="couponCode" className="text-xs font-semibold text-foreground">
          Coupon Code
        </label>
        <Input
          id="couponCode"
          type="text"
          required
          placeholder="e.g. SUMMER25"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="font-mono uppercase text-xs sm:text-sm font-bold tracking-wider placeholder:normal-case placeholder:font-normal h-10"
        />
      </div>

      {/* Row 1: Type & Value */}
      <div className="grid grid-cols-2 gap-4 items-start">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between h-5">
            <span className="text-xs font-semibold text-foreground">
              Discount Structure
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 h-10">
            <button
              type="button"
              onClick={() => setType("PERCENTAGE")}
              className={`h-10 rounded border px-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                type === "PERCENTAGE"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
              }`}
            >
              <Percent className="h-3.5 w-3.5" />
              Percent
            </button>
            <button
              type="button"
              onClick={() => setType("FLAT")}
              className={`h-10 rounded border px-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                type === "FLAT"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
              }`}
            >
              <DollarSign className="h-3.5 w-3.5" />
              Flat (₹)
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between h-5">
            <label htmlFor="discountVal" className="text-xs font-semibold text-foreground">
              {type === "PERCENTAGE" ? "Discount Percentage" : "Flat Amount"}
            </label>
            <span className="text-[10px] font-mono text-muted-foreground">
              {type === "PERCENTAGE" ? "% rate" : "INR (₹)"}
            </span>
          </div>
          <div className="relative">
            {type === "FLAT" && (
              <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold pointer-events-none">
                ₹
              </span>
            )}
            <Input
              id="discountVal"
              type="number"
              min="1"
              max={type === "PERCENTAGE" ? "100" : undefined}
              step={type === "FLAT" ? "50" : "1"}
              required
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className={`h-10 font-mono text-xs sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                type === "FLAT" ? "pl-7" : "pr-7"
              }`}
            />
            {type === "PERCENTAGE" && (
              <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold pointer-events-none">
                %
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Valid Until & Max Redemptions (Uniform header heights) */}
      <div className="grid grid-cols-2 gap-4 items-start">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between h-5">
            <label htmlFor="validUntil" className="text-xs font-semibold text-foreground">
              Valid Through (Expiry)
            </label>
          </div>
          <Input
            id="validUntil"
            type="date"
            required
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="h-10 font-mono text-xs sm:text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between h-5">
            <label htmlFor="maxUses" className="text-xs font-semibold text-foreground">
              Redemption Cap
            </label>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {hasMaxRedemptions ? "Limited" : "Unlimited"}
            </span>
          </div>
          <Input
            id="maxUses"
            type="number"
            min="1"
            disabled={!hasMaxRedemptions}
            value={hasMaxRedemptions ? maxRedemptions : ""}
            placeholder="Unlimited"
            onChange={(e) => setMaxRedemptions(e.target.value)}
            className="h-10 font-mono text-xs sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-40"
          />
        </div>
      </div>

      <div className="space-y-2.5 pt-1">
        <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasMaxRedemptions}
            onChange={(e) => setHasMaxRedemptions(e.target.checked)}
            className="h-4 w-4 rounded border-border bg-background text-primary accent-primary"
          />
          <span>Cap maximum allowed lifetime redemptions</span>
        </label>

        {isEditing && (
          <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-border bg-background text-primary accent-primary"
            />
            <span>Coupon is Active (eligible for member checkout)</span>
          </label>
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
          disabled={isSubmitting || !code.trim()}
          className="font-semibold gap-1.5"
        >
          {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {isEditing ? "Save Changes" : "Create Coupon"}
        </Button>
      </div>
    </form>
  );
}