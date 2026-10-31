"use client";

import * as React from "react";
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

export function CouponDialog({ isOpen, onClose, couponToEdit, onSaved }: CouponDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-sm border border-border bg-card p-6 shadow-none space-y-6">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <h2 className="text-lg font-bold font-display text-foreground">
            {couponToEdit ? `Edit ${couponToEdit.code}` : "New coupon"}
          </h2>
        </div>
        <CouponForm key={couponToEdit?.id ?? "create"} couponToEdit={couponToEdit} onClose={onClose} onSaved={onSaved} />
      </div>
    </div>
  );
}

function CouponForm({ couponToEdit, onClose, onSaved }: { couponToEdit?: SerializedAdminCoupon | null; onClose: () => void; onSaved: () => void; }) {
  const isEditing = Boolean(couponToEdit);
  const defaultDate = React.useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split("T")[0]; }, []);
  const [code, setCode] = React.useState(couponToEdit?.code ?? "");
  const [type, setType] = React.useState<"FLAT" | "PERCENTAGE">(couponToEdit?.type ?? "PERCENTAGE");
  const [discountValue, setDiscountValue] = React.useState<string | number>(couponToEdit ? (couponToEdit.type === "FLAT" ? paiseToRupees(couponToEdit.flatAmountPaise) : couponToEdit.percentage) : 10);
  const [hasMax, setHasMax] = React.useState(couponToEdit ? couponToEdit.maxRedemptions !== null : false);
  const [maxRedemptions, setMaxRedemptions] = React.useState<string | number>(couponToEdit?.maxRedemptions ?? 100);
  const [validUntil, setValidUntil] = React.useState(couponToEdit ? couponToEdit.validUntil.split("T")[0] : defaultDate);
  const [isActive, setIsActive] = React.useState(couponToEdit?.isActive ?? true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        type,
        flatAmountPaise: type === "FLAT" ? rupeesToPaise(Number(discountValue)) : 0,
        percentage: type === "PERCENTAGE" ? Number(discountValue) : 0,
        maxRedemptions: hasMax ? Number(maxRedemptions) : null,
        validUntil: new Date(`${validUntil}T23:59:59.999Z`),
        ...(isEditing ? { isActive } : {}),
      };
      const url = isEditing ? `/api/coupons/${couponToEdit!.id}` : "/api/coupons";
      const res = await fetch(url, { method: isEditing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || "Failed to save coupon.");
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
        <label>Coupon code</label>
        <Input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="uppercase" />
      </div>
      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
        <div className="space-y-1.5">
          <label>Type</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setType("PERCENTAGE")} className={`px-2 py-1.5 border rounded-sm w-full ${type === "PERCENTAGE" ? "bg-foreground text-background" : "bg-transparent border-border text-foreground"}`}>%</button>
            <button type="button" onClick={() => setType("FLAT")} className={`px-2 py-1.5 border rounded-sm w-full ${type === "FLAT" ? "bg-foreground text-background" : "bg-transparent border-border text-foreground"}`}>Flat ₹</button>
          </div>
        </div>
        <div className="space-y-1.5"><label>Value</label><Input type="number" required value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
        <div className="space-y-1.5"><label>Expiry</label><Input type="date" required value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></div>
        <div className="space-y-1.5"><label>Cap</label><Input type="number" disabled={!hasMax} value={hasMax ? maxRedemptions : ""} placeholder="∞" onChange={(e) => setMaxRedemptions(e.target.value)} /></div>
      </div>
      <div className="space-y-2 pt-2 text-xs font-mono flex flex-col gap-2">
        <label className="flex items-center gap-2"><input type="checkbox" checked={hasMax} onChange={(e) => setHasMax(e.target.checked)} /> Limit redemptions</label>
        {isEditing && <label className="flex items-center gap-2"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active</label>}
      </div>
      {errorMessage && <div className="text-xs text-destructive font-mono border-t border-border pt-2">{errorMessage}</div>}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" size="sm" disabled={isSubmitting || !code.trim()}>{isSubmitting ? "Saving..." : "Save"}</Button>
      </div>
    </form>
  );
}