import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { SubscriptionPlan } from "@/lib/db/models/subscription-plan";
import { User } from "@/lib/db/models/user";
import { deriveSubscriptionStatus } from "@/lib/subscription-status";
import { calculatePricing } from "@/lib/pricing/engine";
import { formatDurationMonths } from "@/lib/format";
import { MemberSubnav } from "@/components/member-subnav";
import {
  PlanSelector,
  SerializedPlanWithPricing,
} from "@/components/plan-selector";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Membership plans | Ironvale",
  description:
    "Choose your training block. Pay in full or pay half upfront on multi-month plans.",
};

const DEFAULT_FEATURES: Record<number, string[]> = {
  1: [
    "Full facility access (05:30 – 22:00, 7 days)",
    "Competition barbells and calibrated steel plates",
    "Finnish cedar sauna and cold plunge access",
    "No initiation fees or lock-in contracts",
  ],
  3: [
    "All 1-Month Foundation benefits",
    "10% commitment discount",
    "Two-part payment: 50% upfront, rest before plan ends",
    "Bi-weekly platform technique review",
    "Priority platform reservation during peak hours",
  ],
  12: [
    "All 3-Month Progression benefits",
    "20% annual athlete discount",
    "Two-part payment: 50% upfront, rest before plan ends",
    "Dedicated gear and kit locker included",
    "Monthly 1-on-1 programming review",
  ],
};

export default async function PlansPage() {
  await connectToDatabase();

  const dbPlans = await SubscriptionPlan.find({ isActive: true })
    .sort({ durationMonths: 1 })
    .lean();

  const plansSource = dbPlans.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    durationMonths: p.durationMonths,
    baseMonthlyPricePaise: p.baseMonthlyPricePaise,
    discountPercentage: p.discountPercentage,
    allowPartialPayment: p.allowPartialPayment,
  }));

  // Run calculatePricing strictly on the server; pass plain serialized numbers
  const serializedPlans: SerializedPlanWithPricing[] = plansSource.map((plan) => {
    const pricing = calculatePricing({
      plan: {
        baseMonthlyPricePaise: plan.baseMonthlyPricePaise,
        durationMonths: plan.durationMonths,
        discountPercentage: plan.discountPercentage,
        allowPartialPayment: plan.allowPartialPayment,
      },
    });

    return {
      id: plan.id,
      name: plan.name,
      durationMonths: plan.durationMonths,
      durationText: formatDurationMonths(plan.durationMonths),
      baseMonthlyPricePaise: plan.baseMonthlyPricePaise,
      discountPercentage: plan.discountPercentage,
      allowPartialPayment: plan.allowPartialPayment,
      features:
        DEFAULT_FEATURES[plan.durationMonths] || [
          "Full facility access during gym operating hours",
          "Competition barbells and Olympic lifting platforms",
          "Locker room and cold plunge amenities",
        ],
      pricing: {
        grossPaise: pricing.grossPaise,
        commitmentDiscountPaise: pricing.commitmentDiscountPaise,
        couponDiscountPaise: pricing.couponDiscountPaise,
        totalPaise: pricing.totalPaise,
        effectiveMonthlyPaise: pricing.effectiveMonthlyPaise,
        minimumUpfrontPaise: pricing.minimumUpfrontPaise,
        remainderPaise: pricing.remainderPaise,
      },
    };
  });

  // Verify whether the signed-in user already holds an active training block
  const session = await getAuthSession();
  let hasActiveSubscription = false;

  if (session) {
    const user = await User.findOne({ clerkId: session.userId }).lean();
    if (user?.subscription?.endDate) {
      const status = deriveSubscriptionStatus(
        user.subscription.endDate,
        user.subscription.balanceDuePaise
      );
      if (status === "ACTIVE" || status === "PARTIAL") {
        hasActiveSubscription = true;
      }
    }
  }

  const isMember = Boolean(session && session.role !== "ADMIN");

  return (
    <div className="flex-1 flex flex-col bg-background">
      {isMember && <MemberSubnav />}
      <div
        className={
          isMember
            ? "container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8"
            : "container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12"
        }
      >
        {/* Header */}
        <div className="max-w-2xl space-y-3">
          {!isMember && (
            <Link
              href="/"
              className="font-mono text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </Link>
          )}
          <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight text-foreground">
            Membership plans
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Transparent rates in Indian Rupees with zero initiation fees. Pay in full or choose a 50% upfront installment on multi-month training blocks.
          </p>
        </div>

        {serializedPlans.length === 0 ? (
          <EmptyState
            title="No active plans"
            description="Membership options will appear here when a plan is live."
          />
        ) : (
          <PlanSelector
            plans={serializedPlans}
            hasActiveSubscription={hasActiveSubscription}
          />
        )}
      </div>
    </div>
  );
}