"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Tag,
  Check,
  X,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  // Pricing breakdown state
  const [pricing, setPricing] = React.useState<PricingBreakdown>(plan.pricing);
  const [appliedCoupon, setAppliedCoupon] = React.useState<AppliedCouponState | null>(null);

  // Coupon input state
  const [couponInput, setCouponInput] = React.useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = React.useState(false);
  const [couponError, setCouponError] = React.useState<string | null>(null);

  // Payment choice: FULL or PARTIAL
  const [paymentChoice, setPaymentChoice] = React.useState<"FULL" | "PARTIAL">("FULL");

  // Custom partial upfront amount in Rupees (defaults to minimum upfront)
  const [customUpfrontRupees, setCustomUpfrontRupees] = React.useState<number>(
    paiseToRupees(plan.pricing.minimumUpfrontPaise)
  );

  // Submission state
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Handle coupon validation
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
        setCustomUpfrontRupees(paiseToRupees(updatedPricing.minimumUpfrontPaise));
      }

      // If coupon reduces total to 0, force FULL choice
      if (updatedPricing.totalPaise === 0) {
        setPaymentChoice("FULL");
      }
    } catch {
      setCouponError("Unable to validate coupon. Please check your connection.");
    } finally {
      setIsValidatingCoupon(false);
    }
  }

  // Handle removing applied coupon
  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setPricing(plan.pricing);
    if (plan.pricing.allowPartialPayment) {
      setCustomUpfrontRupees(paiseToRupees(plan.pricing.minimumUpfrontPaise));
    }
    setCouponError(null);
  }

  // Calculate upfront and remainder in paise based on current selection
  const isZeroTotal = pricing.totalPaise === 0;
  const isPartialSelected = paymentChoice === "PARTIAL" && pricing.allowPartialPayment && !isZeroTotal;

  const upfrontPaise = isPartialSelected
    ? rupeesToPaise(Number(customUpfrontRupees) || 0)
    : pricing.totalPaise;

  const remainderPaise = Math.max(0, pricing.totalPaise - upfrontPaise);

  // Input validation for partial payment
  const isUpfrontValid =
    !isPartialSelected ||
    (upfrontPaise >= pricing.minimumUpfrontPaise && upfrontPaise <= pricing.totalPaise);

  // Handle Complete Payment execution (Subscriptions API -> Payments API)
  async function handleCompleteCheckout() {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      // 1. Create Transaction Snapshot
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

      // If zero-total plan, subscription activated immediately in Step 12a
      if (subData.data.subscriptionActivated) {
        router.push("/dashboard?checkout=success");
        return;
      }

      // 2. Process Simulated Payment
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
      {/* Left Column: Plan Summary, Coupon, Payment Method */}
      <div className="lg:col-span-7 space-y-6">
        {/* Plan Header Card */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
                  Selected Training Block
                </span>
                <CardTitle className="text-2xl font-display uppercase tracking-tight mt-0.5">
                  {plan.name}
                </CardTitle>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {formatDurationMonths(plan.durationMonths)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Standard Base Rate</span>
              <span className="font-mono text-foreground">
                {formatPaiseToRupees(plan.baseMonthlyPricePaise)} / mo
              </span>
            </div>
            {plan.discountPercentage > 0 && (
              <div className="flex items-center justify-between text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  {plan.discountPercentage}% Multi-month Discount
                </span>
                <span className="font-mono font-semibold">
                  -{formatPaiseToRupees(pricing.commitmentDiscountPaise)}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Access begins on first successful payment
              </span>
              <span>No initiation fees</span>
            </div>
          </CardContent>
        </Card>

        {/* Coupon Discount Section */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display uppercase tracking-tight flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              Promotional Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded border border-emerald-500/40 bg-emerald-500/10 p-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {appliedCoupon.code}
                    </span>
                    <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 text-[10px] py-0">
                      Applied
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Saved {formatPaiseToRupees(pricing.couponDiscountPaise)} on this training block
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCoupon}
                  className="h-8 text-xs text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Remove
                </Button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="e.g. WELCOME10"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  disabled={isValidatingCoupon}
                  className="font-mono uppercase text-xs sm:text-sm uppercase placeholder:normal-case"
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="default"
                  disabled={!couponInput.trim() || isValidatingCoupon}
                  className="shrink-0"
                >
                  {isValidatingCoupon ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </Button>
              </form>
            )}

            {couponError && (
              <p className="text-xs text-destructive flex items-center gap-1.5 pt-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {couponError}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Payment Type Selection (Full vs 50% Upfront Installment) */}
        {pricing.allowPartialPayment && !isZeroTotal && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display uppercase tracking-tight flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Payment Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentChoice("FULL")}
                  className={cn(
                    "rounded border p-3.5 text-left transition-all",
                    paymentChoice === "FULL"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:border-muted-foreground/30 bg-muted/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground">Pay in Full</span>
                    {paymentChoice === "FULL" && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Single payment of {formatPaiseToRupees(pricing.totalPaise)}. Zero balance due.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentChoice("PARTIAL")}
                  className={cn(
                    "rounded border p-3.5 text-left transition-all",
                    paymentChoice === "PARTIAL"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:border-muted-foreground/30 bg-muted/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground">50% Upfront Split</span>
                    {paymentChoice === "PARTIAL" && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pay minimum {formatPaiseToRupees(pricing.minimumUpfrontPaise)} upfront. Settle balance later.
                  </p>
                </button>
              </div>

              {/* Installment Amount Input */}
              {paymentChoice === "PARTIAL" && (
                <div className="rounded border border-border/70 bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="upfrontAmount" className="font-medium text-foreground">
                      Upfront Payment Amount (₹)
                    </label>
                    <span className="text-muted-foreground font-mono">
                      Min: {formatPaiseToRupees(pricing.minimumUpfrontPaise)}
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm text-muted-foreground font-semibold">
                      ₹
                    </span>
                    <Input
                      id="upfrontAmount"
                      type="number"
                      min={paiseToRupees(pricing.minimumUpfrontPaise)}
                      max={paiseToRupees(pricing.totalPaise)}
                      step="1"
                      value={customUpfrontRupees}
                      onChange={(e) => setCustomUpfrontRupees(Number(e.target.value))}
                      className="pl-7 font-mono font-semibold"
                    />
                  </div>

                  {!isUpfrontValid ? (
                    <p className="text-xs text-destructive">
                      Upfront amount must be between {formatPaiseToRupees(pricing.minimumUpfrontPaise)} and {formatPaiseToRupees(pricing.totalPaise)}.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Remaining balance of{" "}
                      <strong className="text-amber-400 font-mono">
                        {formatPaiseToRupees(remainderPaise)}
                      </strong>{" "}
                      payable anytime from your dashboard before your membership block ends.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Simulated Sandbox Disclosure */}
        <div className="rounded border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <span className="font-semibold text-foreground block font-mono uppercase tracking-wider">
              Simulated Platform Gateway
            </span>
            <p className="text-muted-foreground leading-relaxed">
              No real bank or card information is collected. Clicking the button below simulates an immediate cleared transaction, generates an official immutable invoice, and activates your Ironvale access.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Order Summary & Checkout Action */}
      <div className="lg:col-span-5 sticky top-24">
        <Card className="bg-card border-border shadow-lg">
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="text-lg font-display uppercase tracking-tight">
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{plan.name} Gross</span>
                <span className="font-mono text-foreground">
                  {formatPaiseToRupees(pricing.grossPaise)}
                </span>
              </div>

              {pricing.commitmentDiscountPaise > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Commitment Discount</span>
                  <span className="font-mono">
                    -{formatPaiseToRupees(pricing.commitmentDiscountPaise)}
                  </span>
                </div>
              )}

              {pricing.couponDiscountPaise > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Coupon ({appliedCoupon?.code})</span>
                  <span className="font-mono">
                    -{formatPaiseToRupees(pricing.couponDiscountPaise)}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-border/60 flex justify-between font-bold text-foreground">
                <span>Total Plan Price</span>
                <span className="font-mono text-base">
                  {formatPaiseToRupees(pricing.totalPaise)}
                </span>
              </div>
            </div>

            {/* Split breakdown if partial selected */}
            {isPartialSelected && (
              <div className="rounded border border-amber-500/30 bg-amber-500/5 p-3 space-y-2 text-xs">
                <div className="flex justify-between font-semibold text-amber-400">
                  <span>Due Today (Upfront)</span>
                  <span className="font-mono text-sm">{formatPaiseToRupees(upfrontPaise)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Remaining Balance</span>
                  <span className="font-mono">{formatPaiseToRupees(remainderPaise)}</span>
                </div>
              </div>
            )}

            {/* Amount Due Today Callout */}
            <div className="rounded bg-muted/40 p-4 border border-border/60">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block">
                Total Due Today
              </span>
              <div className="text-3xl font-black font-display text-foreground mt-0.5">
                {formatPaiseToRupees(upfrontPaise)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Effective: {formatPaiseToRupees(pricing.effectiveMonthlyPaise)} / month
              </p>
            </div>

            {submitError && (
              <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <Button
              type="button"
              size="lg"
              disabled={isSubmitting || !isUpfrontValid}
              onClick={handleCompleteCheckout}
              className="w-full font-bold uppercase tracking-wider text-sm gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing Activation...
                </>
              ) : isZeroTotal ? (
                "Activate Membership (₹0)"
              ) : (
                `Pay & Activate Pass (${formatPaiseToRupees(upfrontPaise)})`
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}