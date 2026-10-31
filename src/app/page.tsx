import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { connectToDatabase } from "@/lib/db/connection";
import { SubscriptionPlan } from "@/lib/db/models/subscription-plan";
import { calculatePricing } from "@/lib/pricing/engine";
import { formatPaiseToRupees, formatDurationMonths } from "@/lib/format";
import { HeroSection } from "@/components/hero-section";
import { ClaimsIndexList } from "@/components/claims-index-list";

export const dynamic = "force-dynamic";

const FALLBACK_PLANS = [
  {
    id: "plan-1m",
    name: "1-Month Foundation",
    durationMonths: 1,
    baseMonthlyPricePaise: 450000,
    discountPercentage: 0,
    allowPartialPayment: false,
  },
  {
    id: "plan-3m",
    name: "3-Month Progression",
    durationMonths: 3,
    baseMonthlyPricePaise: 400000,
    discountPercentage: 10,
    allowPartialPayment: true,
  },
  {
    id: "plan-12m",
    name: "12-Month Athlete",
    durationMonths: 12,
    baseMonthlyPricePaise: 350000,
    discountPercentage: 20,
    allowPartialPayment: true,
  },
];

export default async function HomePage() {
  await connectToDatabase();

  const dbPlans = await SubscriptionPlan.find({ isActive: true })
    .sort({ durationMonths: 1 })
    .lean();

  const plansSource =
    dbPlans.length > 0
      ? dbPlans.map((p) => ({
          id: p._id.toString(),
          name: p.name,
          durationMonths: p.durationMonths,
          baseMonthlyPricePaise: p.baseMonthlyPricePaise,
          discountPercentage: p.discountPercentage,
          allowPartialPayment: p.allowPartialPayment,
        }))
      : FALLBACK_PLANS;

  const plansWithPricing = plansSource.map((p) => {
    const pricing = calculatePricing({
      plan: {
        baseMonthlyPricePaise: p.baseMonthlyPricePaise,
        durationMonths: p.durationMonths,
        discountPercentage: p.discountPercentage,
        allowPartialPayment: p.allowPartialPayment,
      },
    });

    return {
      id: p.id,
      name: p.name,
      durationText: formatDurationMonths(p.durationMonths),
      discountPercentage: p.discountPercentage,
      allowPartialPayment: p.allowPartialPayment,
      effectiveMonthly: formatPaiseToRupees(pricing.effectiveMonthlyPaise),
      total: formatPaiseToRupees(pricing.totalPaise),
    };
  });

  return (
    <div className="flex flex-col bg-background">
      {/* Hero: kinetic headline and lift strip */}
      <HeroSection />

      {/* Claims Index List */}
      <section className="border-b border-border py-16 md:py-24 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl space-y-2">
            <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-foreground">
              Built for real training
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              No commercial gym noise or lock-in contracts. A barbell facility designed around calibrated strength.
            </p>
          </div>

          <ClaimsIndexList />
        </div>
      </section>

      {/* Compact Plan Index */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-foreground">
                Training blocks
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Every membership includes unrestricted access to platforms, racks, turf, and recovery.
              </p>
            </div>
            <Link
              href="/plans"
              className="font-mono text-xs text-foreground hover:underline inline-flex items-center gap-1 shrink-0"
            >
              Compare plan details
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Plan index rows */}
          <div className="w-full divide-y divide-border border-y border-border">
            {plansWithPricing.map((plan) => (
              <Link
                key={plan.id}
                href="/plans"
                className="group flex flex-col sm:flex-row sm:items-center justify-between py-6 px-3 sm:px-4 -mx-3 sm:-mx-4 hover:bg-card transition-colors duration-200 gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-display font-bold text-xl sm:text-2xl text-foreground tracking-tight">
                      {plan.name}
                    </h3>
                    {plan.discountPercentage > 0 && (
                      <span className="font-mono text-xs px-2 py-0.5 rounded-sm border border-border bg-background text-foreground font-medium">
                        {plan.discountPercentage}% off
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {plan.durationText}
                    {plan.allowPartialPayment && " · 50% upfront available"}
                  </p>
                </div>

                <div className="flex items-baseline sm:items-center justify-between sm:justify-end gap-6 sm:gap-8 font-mono">
                  <div className="text-left sm:text-right">
                    <span className="text-base sm:text-lg font-semibold text-foreground block tabular-nums">
                      {plan.effectiveMonthly}
                      <span className="text-xs text-muted-foreground font-normal"> / mo</span>
                    </span>
                    <span className="text-xs text-muted-foreground block tabular-nums">
                      {plan.total} total
                    </span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}