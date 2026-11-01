"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPaiseToRupees, formatDurationMonths, paiseToRupees, rupeesToPaise } from "@/lib/format";
import type { PricingBreakdown } from "@/lib/pricing/engine";
import { cn } from "@/lib/utils";

export interface CheckoutPlanData {
  id: string;
  name: string;
  durationMonths: number;
  baseMonthlyPricePaise: number;
  discountPercentage: number;
  allowPartialPayment: boolean;
  pricing: PricingBreakdown;
}

interface AppliedCouponState {
  code: string;
  type: "FLAT" | "PERCENTAGE";
  flatAmountPaise: number;
  percentage: number;
}

export function CheckoutForm({ plan }: { plan: CheckoutPlanData }) {
  const router = useRouter();

  const [pricing, setPricing] = React.useState<PricingBreakdown>(plan.pricing);
  const [appliedCoupon, setAppliedCoupon] = React.useState<AppliedCouponState | null>(null);

  const [couponInput, setCouponInput] = React.useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = React.useState(false);
  const [couponError, setCouponError] = React.useState<string | null>(null);

  const [paymentChoice, setPaymentChoice] = React.useState<"FULL" | "PARTIAL">("FULL");
  const [customUpfrontRupees, setCustomUpfrontRupees] = React.useState<string>(
    String(paiseToRupees(plan.pricing.minimumUpfrontPaise))
  );

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setIsValidatingCoupon(true);
    setCouponError(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          code: couponInput.trim().toUpperCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setCouponError(data.error?.message || "Invalid or ineligible coupon code.");
        return;
      }

      const updatedPricing: PricingBreakdown = data.data.pricing;
      setAppliedCoupon(data.data.coupon);
      setPricing(updatedPricing);
      setCouponInput("");

      if (updatedPricing.allowPartialPayment) {
        setCustomUpfrontRupees(String(paiseToRupees(updatedPricing.minimumUpfrontPaise)));
      }

      if (updatedPricing.totalPaise === 0) {
        setPaymentChoice("FULL");
      }
    } catch {
      setCouponError("Unable to validate coupon. Please check your connection.");
    } finally {
      setIsValidatingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setPricing(plan.pricing);
    if (plan.pricing.allowPartialPayment) {
      setCustomUpfrontRupees(String(paiseToRupees(plan.pricing.minimumUpfrontPaise)));
    }
    setCouponError(null);
  }

  const isZeroTotal = pricing.totalPaise === 0;
  const isPartialSelected = paymentChoice === "PARTIAL" && pricing.allowPartialPayment && !isZeroTotal;
  const upfrontPaise = isPartialSelected ? rupeesToPaise(Number(customUpfrontRupees) || 0) : pricing.totalPaise;  const remainderPaise = Math.max(0, pricing.totalPaise - upfrontPaise);
  const isUpfrontValid = !isPartialSelected || (upfrontPaise >= pricing.minimumUpfrontPaise && upfrontPaise <= pricing.totalPaise);

  async function handleCompleteCheckout() {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const subRes = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          couponCode: appliedCoupon?.code || undefined,
        }),
      });

      const subData = await subRes.json();

      if (!subRes.ok || !subData.success) {
        throw new Error(subData.error?.message || "Failed to initialize checkout transaction.");
      }

      if (subData.data.subscriptionActivated) {
        router.push("/dashboard?checkout=success");
        return;
      }

      const payRes = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: subData.data.transactionId,
          paymentChoice,
          amountPaise: isPartialSelected ? upfrontPaise : undefined,
        }),
      });

      const payData = await payRes.json();

      if (!payRes.ok || !payData.success) {
        throw new Error(payData.error?.message || "Payment execution failed.");
      }

      router.push("/dashboard?checkout=success");
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Left Column: Plan, Coupon, Payment */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Selected Plan */}
        <div className="rounded-sm border border-border bg-card p-5 sm:p-6 space-y-4">
          <h2 className="font-display font-bold text-xl text-foreground">Selected plan</h2>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{plan.name} ({formatDurationMonths(plan.durationMonths)})</span>
              <span className="text-foreground tabular-nums">{formatPaiseToRupees(plan.baseMonthlyPricePaise)} / mo</span>
            </div>
            {plan.discountPercentage > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Commitment discount ({plan.discountPercentage}%)</span>
                <span className="text-foreground tabular-nums">-{formatPaiseToRupees(pricing.commitmentDiscountPaise)}</span>
              </div>
            )}
            <div className="pt-3 mt-3 border-t border-border/50 text-xs text-muted-foreground font-sans">
              Access begins on your first successful payment. No initiation fees.
            </div>
          </div>
        </div>

        {/* Promotional Code */}
        <div className="rounded-sm border border-border bg-card p-5 sm:p-6 space-y-4">
          <h2 className="font-display font-bold text-xl text-foreground">Promotional code</h2>
          {appliedCoupon ? (
            <div className="flex items-center justify-between rounded-sm border border-border bg-background p-3">
              <div>
                <span className="font-mono font-bold text-foreground text-sm block">
                  {appliedCoupon.code}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Saved {formatPaiseToRupees(pricing.couponDiscountPaise)} on this training block
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveCoupon}
                className="text-xs font-mono"
              >
                Remove
              </Button>
            </div>
          ) : (
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                disabled={isValidatingCoupon}
                className="font-mono text-sm uppercase placeholder:normal-case placeholder:font-sans"
              />
              <Button
                type="submit"
                variant="outline"
                disabled={!couponInput.trim() || isValidatingCoupon}
              >
                Apply
              </Button>
            </form>
          )}
          {couponError && <p className="text-xs text-destructive">{couponError}</p>}
        </div>

        {/* Payment Options */}
        {pricing.allowPartialPayment && !isZeroTotal && (
          <div className="rounded-sm border border-border bg-card p-5 sm:p-6 space-y-4">
            <h2 className="font-display font-bold text-xl text-foreground">Payment options</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentChoice("FULL")}
                className={cn(
                  "rounded-sm border p-4 text-left transition-colors",
                  paymentChoice === "FULL"
                    ? "border-foreground bg-background"
                    : "border-border hover:bg-background/50"
                )}
              >
                <div className="font-semibold text-sm text-foreground">Pay in full</div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Single payment of {formatPaiseToRupees(pricing.totalPaise)}. Zero balance due.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentChoice("PARTIAL")}
                className={cn(
                  "rounded-sm border p-4 text-left transition-colors",
                  paymentChoice === "PARTIAL"
                    ? "border-foreground bg-background"
                    : "border-border hover:bg-background/50"
                )}
              >
                <div className="font-semibold text-sm text-foreground">50% upfront split</div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Pay minimum {formatPaiseToRupees(pricing.minimumUpfrontPaise)} today. Settle balance later.
                </p>
              </button>
            </div>

            {paymentChoice === "PARTIAL" && (
              <div className="rounded-sm border border-border bg-background p-4 space-y-3 mt-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="upfrontAmount" className="font-medium text-foreground">
                    Upfront payment (₹)
                  </label>
                  <span className="text-muted-foreground font-mono">
                    Min: {formatPaiseToRupees(pricing.minimumUpfrontPaise)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-muted-foreground font-mono">₹</span>
                  <Input
                    id="upfrontAmount"
                    type="number"
                    min={paiseToRupees(pricing.minimumUpfrontPaise)}
                    max={paiseToRupees(pricing.totalPaise)}
                    step="1"
                    value={customUpfrontRupees}
                    onChange={(e) => setCustomUpfrontRupees(e.target.value)}
                    onBlur={(e) => {
                      const val = Number(e.target.value);
                      if (!e.target.value || isNaN(val)) {
                        setCustomUpfrontRupees(String(paiseToRupees(pricing.minimumUpfrontPaise)));
                      }
                    }}
                    className="pl-7 font-mono font-semibold"
                  />
                </div>
                {!isUpfrontValid ? (
                  <p className="text-xs text-destructive">
                    Must be between {formatPaiseToRupees(pricing.minimumUpfrontPaise)} and {formatPaiseToRupees(pricing.totalPaise)}.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Remaining balance of <strong className="font-mono font-semibold text-foreground">{formatPaiseToRupees(remainderPaise)}</strong> is payable anytime from your dashboard.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sandbox Note */}
        <div className="text-xs text-muted-foreground bg-card p-4 rounded-sm border border-border">
          <strong className="text-foreground block mb-1 font-mono uppercase tracking-wider">Test environment</strong>
          No real card information is collected. Clicking the button below simulates a cleared transaction and activates your access.
        </div>
      </div>

      {/* Right Column: Order Summary */}
      <div className="lg:col-span-5 sticky top-24">
        <div className="rounded-sm border border-border bg-card p-5 sm:p-6 space-y-6">
          <h2 className="font-display font-bold text-xl text-foreground border-b border-border pb-4">Order summary</h2>
          
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Gross</span>
              <span className="tabular-nums">{formatPaiseToRupees(pricing.grossPaise)}</span>
            </div>
            {pricing.commitmentDiscountPaise > 0 && (
              <div className="flex justify-between text-foreground">
                <span>Discount</span>
                <span className="tabular-nums">-{formatPaiseToRupees(pricing.commitmentDiscountPaise)}</span>
              </div>
            )}
            {pricing.couponDiscountPaise > 0 && (
              <div className="flex justify-between text-foreground">
                <span>Coupon</span>
                <span className="tabular-nums">-{formatPaiseToRupees(pricing.couponDiscountPaise)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-border/60 flex justify-between font-bold text-foreground">
              <span className="font-sans">Total plan price</span>
              <span className="tabular-nums">{formatPaiseToRupees(pricing.totalPaise)}</span>
            </div>
          </div>

          {isPartialSelected && (
            <div className="rounded-sm border border-border bg-background p-4 space-y-2 text-sm font-mono">
              <div className="flex justify-between font-semibold text-foreground">
                <span className="font-sans">Due today</span>
                <span className="tabular-nums">{formatPaiseToRupees(upfrontPaise)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span className="font-sans text-xs">Remaining balance</span>
                <span className="tabular-nums text-xs">{formatPaiseToRupees(remainderPaise)}</span>
              </div>
            </div>
          )}

          {!isPartialSelected && (
            <div className="rounded-sm border border-border bg-background p-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block">
                Total due today
              </span>
              <div className="text-3xl font-bold font-display text-foreground mt-1 tabular-nums">
                {formatPaiseToRupees(upfrontPaise)}
              </div>
            </div>
          )}

          {submitError && <div className="text-xs text-destructive">{submitError}</div>}

          <Button
            type="button"
            size="lg"
            disabled={isSubmitting || !isUpfrontValid}
            onClick={handleCompleteCheckout}
            className="w-full font-mono text-xs"
          >
            {isSubmitting ? "Processing..." : isZeroTotal ? "Activate membership (₹0)" : `Pay ${formatPaiseToRupees(upfrontPaise)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}