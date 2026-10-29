import { getAuthSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { SubscriptionPlan } from "@/lib/db/models/subscription-plan";
import { User } from "@/lib/db/models/user";
import { deriveSubscriptionStatus } from "@/lib/subscription-status";
import { PlanCard, PlanItem } from "@/components/plan-card";
import { Info, ShieldCheck, Zap, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

const DEFAULT_FEATURES: Record<number, string[]> = {
  1: [
    "Full facility access (5:30 AM – 10:00 PM)",
    "Competition barbells and bumper plates",
    "Locker room and cold plunge access",
    "No initiation fees or lock-in contracts",
  ],
  3: [
    "All 1-Month Foundation benefits",
    "10% commitment discount",
    "Partial payment: 50% upfront, rest before plan ends",
    "Bi-weekly coach check-in and technique review",
    "Priority platform reservation",
  ],
  12: [
    "All 3-Month Progression benefits",
    "20% annual athlete discount",
    "Partial payment: 50% upfront, rest before plan ends",
    "Complimentary locker and kit storage",
    "Dedicated program design and monthly 1-on-1 review",
  ],
};

const FALLBACK_PLANS: PlanItem[] = [
  {
    id: "plan-1m",
    name: "1-Month Foundation",
    durationMonths: 1,
    baseMonthlyPricePaise: 450000,
    discountPercentage: 0,
    allowPartialPayment: false,
    features: DEFAULT_FEATURES[1],
  },
  {
    id: "plan-3m",
    name: "3-Month Progression",
    durationMonths: 3,
    baseMonthlyPricePaise: 400000,
    discountPercentage: 10,
    allowPartialPayment: true,
    isPopular: true,
    features: DEFAULT_FEATURES[3],
  },
  {
    id: "plan-12m",
    name: "12-Month Athlete",
    durationMonths: 12,
    baseMonthlyPricePaise: 350000,
    discountPercentage: 20,
    allowPartialPayment: true,
    features: DEFAULT_FEATURES[12],
  },
];

export default async function PlansPage() {
  await connectToDatabase();

  const dbPlans = await SubscriptionPlan.find({ isActive: true })
    .sort({ durationMonths: 1 })
    .lean();

  const plansToDisplay: PlanItem[] =
    dbPlans.length > 0
      ? dbPlans.map((p) => ({
          id: p._id.toString(),
          name: p.name,
          durationMonths: p.durationMonths,
          baseMonthlyPricePaise: p.baseMonthlyPricePaise,
          discountPercentage: p.discountPercentage,
          allowPartialPayment: p.allowPartialPayment,
          isPopular: p.durationMonths === 3,
          features:
            DEFAULT_FEATURES[p.durationMonths] || [
              "Full facility access during gym operating hours",
              "Access to free weights and Olympic lifting platforms",
              "Locker room amenities",
            ],
        }))
      : FALLBACK_PLANS;

  // Check if current authenticated user already has an active subscription
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

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">
          Membership Tiers
        </span>
        <h1 className="text-3xl sm:text-5xl font-black uppercase font-display tracking-tight text-foreground">
          Built For Dedicated Training
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Transparent pricing in Indian Rupees with zero initiation fees. Choose full payment or flexible 50% upfront partial payment on multi-month training blocks.
        </p>
      </div>

      {/* One-subscription policy alert */}
      {hasActiveSubscription && (
        <div className="max-w-3xl mx-auto rounded border border-primary/40 bg-primary/10 p-4 text-xs sm:text-sm flex items-start gap-3">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground font-mono uppercase tracking-wider">
              Active Subscription In Progress
            </p>
            <p className="text-muted-foreground mt-0.5 leading-relaxed">
              You currently have an active membership. In accordance with Ironvale policy, athletes maintain one active plan at a time. You can choose a new tier once your existing plan expires.
            </p>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-4">
        {plansToDisplay.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            disabled={hasActiveSubscription}
            disabledReason="Already Subscribed"
            ctaText={session ? "Select Plan" : "Join Now"}
          />
        ))}
      </div>

      {/* Policy & Features Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-border">
        <div className="flex items-start gap-3.5">
          <div className="h-9 w-9 rounded bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <Zap className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground font-display uppercase tracking-tight">
              Instant Platform Access
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your facility access activates immediately upon initial payment with digital access keys.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="h-9 w-9 rounded bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <RefreshCw className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground font-display uppercase tracking-tight">
              Flexible 50% Upfront Split
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Pay half upfront on 3-month and 12-month commitments; clear the remaining balance before your plan expires.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="h-9 w-9 rounded bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground font-display uppercase tracking-tight">
              Immutable Audit Billing
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Plan snapshots preserve your original purchase price permanently against future gym rate revisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

