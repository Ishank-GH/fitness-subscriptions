"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Info } from "lucide-react";
import gsap from "gsap";
import { formatPaiseToRupees } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SerializedPlanWithPricing {
  id: string;
  name: string;
  durationMonths: number;
  durationText: string;
  baseMonthlyPricePaise: number;
  discountPercentage: number;
  allowPartialPayment: boolean;
  features: string[];
  pricing: {
    grossPaise: number;
    commitmentDiscountPaise: number;
    couponDiscountPaise: number;
    totalPaise: number;
    effectiveMonthlyPaise: number;
    minimumUpfrontPaise: number;
    remainderPaise: number;
  };
}

interface PlanSelectorProps {
  plans: SerializedPlanWithPricing[];
  hasActiveSubscription?: boolean;
}

export function PlanSelector({
  plans,
  hasActiveSubscription = false,
}: PlanSelectorProps) {
  const defaultIndex = plans.findIndex((p) => p.durationMonths === 3);
  const [selectedIndex, setSelectedIndex] = React.useState(
    defaultIndex >= 0 ? defaultIndex : 0
  );

  const selectedPlan = plans[selectedIndex] || plans[0];

  const totalTweenRef = React.useRef<{ value: number }>({
    value: selectedPlan.pricing.totalPaise,
  });
  const [displayTotal, setDisplayTotal] = React.useState<number>(
    selectedPlan.pricing.totalPaise
  );

  React.useEffect(() => {
    const target = selectedPlan.pricing.totalPaise;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      totalTweenRef.current.value = target;
      // Defer synchronous state update
      const raf = requestAnimationFrame(() => setDisplayTotal(target));
      return () => cancelAnimationFrame(raf);
    }

    const tween = gsap.to(totalTweenRef.current, {
      value: target,
      duration: 0.6,
      ease: "power2.out",
      onUpdate: () => {
        setDisplayTotal(Math.round(totalTweenRef.current.value));
      },
    });

    return () => {
      tween.kill();
    };
  }, [selectedPlan.id, selectedPlan.pricing.totalPaise]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div
        role="tablist"
        aria-label="Training blocks"
        className="flex w-full flex-wrap sm:flex-nowrap p-1 rounded-sm bg-card border border-border gap-1"
      >
        {plans.map((p, idx) => {
          const isSelected = selectedIndex === idx;
          return (
            <button
              key={p.id}
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedIndex(idx)}
              className={cn(
                "flex-1 py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium rounded-sm transition-colors font-mono outline-none focus-visible:ring-2 focus-visible:ring-foreground flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-0",
                isSelected
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              )}
            >
              <span className="text-center">{p.name}</span>
              {p.discountPercentage > 0 && (
                <span
                  className={cn(
                    "sm:ml-2 text-[10px] px-1.5 py-0.5 rounded-sm border whitespace-nowrap shrink-0",
                    isSelected
                      ? "border-primary-foreground/30 text-primary-foreground"
                      : "border-border text-foreground"
                  )}
                >
                  {p.discountPercentage}% off
                </span>
              )}
            </button>
          );
        })}
      </div>

      {hasActiveSubscription && (
        <div className="rounded-sm border border-border bg-card p-4 text-xs sm:text-sm flex items-start gap-3">
          <Info className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              Active subscription in progress
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Your account currently holds an active training block. Athletes maintain one active membership at a time.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-sm border border-border bg-card p-6 sm:p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-7 space-y-6">
            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
                {selectedPlan.name}
              </h3>
              <p className="font-mono text-xs text-muted-foreground">
                {selectedPlan.durationText} full facility access
                {selectedPlan.allowPartialPayment && " · Eligible for 50% upfront payment"}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground block">
                Included in this block
              </span>
              <ul className="space-y-2 text-xs sm:text-sm text-foreground/90">
                {selectedPlan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="md:col-span-5 rounded-sm border border-border/80 bg-background/50 p-5 sm:p-6 space-y-4 font-mono text-xs">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground block font-medium">
              Price breakdown
            </span>

            <div className="space-y-2 pt-1 border-t border-border/60">
              <div className="flex justify-between text-muted-foreground">
                <span>Base rate ({selectedPlan.durationText}):</span>
                <span className="text-foreground tabular-nums">
                  {formatPaiseToRupees(selectedPlan.pricing.grossPaise)}
                </span>
              </div>

              {selectedPlan.pricing.commitmentDiscountPaise > 0 && (
                <div className="flex justify-between text-foreground">
                  <span>Commitment discount:</span>
                  <span className="tabular-nums">
                    -{formatPaiseToRupees(selectedPlan.pricing.commitmentDiscountPaise)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-muted-foreground">
                <span>Effective monthly:</span>
                <span className="text-foreground tabular-nums">
                  {formatPaiseToRupees(selectedPlan.pricing.effectiveMonthlyPaise)} / mo
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
                Total amount
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-foreground font-display tracking-tight mt-0.5 tabular-nums">
                {formatPaiseToRupees(displayTotal)}
              </div>
            </div>

            {selectedPlan.allowPartialPayment && (
              <div className="rounded-sm border border-border bg-card p-3 space-y-1.5 text-[11px]">
                <span className="font-semibold text-foreground block">
                  Two-part installment schedule
                </span>
                <div className="flex justify-between text-muted-foreground">
                  <span>Due today (50% upfront):</span>
                  <span className="text-foreground font-semibold tabular-nums">
                    {formatPaiseToRupees(selectedPlan.pricing.minimumUpfrontPaise)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Remaining balance:</span>
                  <span className="text-foreground tabular-nums">
                    {formatPaiseToRupees(selectedPlan.pricing.remainderPaise)}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground pt-1 leading-normal">
                  Settle the remaining balance anytime before your {selectedPlan.durationText} conclude.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-mono">
            Access starts immediately on your first payment. No cancellation hurdles.
          </p>

          {hasActiveSubscription ? (
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-xs font-mono">
                View member dashboard
              </Button>
            </Link>
          ) : (
            <Link
              href={`/plans/checkout?planId=${selectedPlan.id}`}
              className="w-full sm:w-auto"
            >
              <Button size="lg" className="w-full sm:w-auto gap-2 text-xs font-mono">
                Continue to checkout
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}