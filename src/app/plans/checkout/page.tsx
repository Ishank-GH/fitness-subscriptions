import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldAlert, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { SubscriptionPlan } from "@/lib/db/models/subscription-plan";
import { User } from "@/lib/db/models/user";
import { calculatePricing } from "@/lib/pricing/engine";
import { deriveSubscriptionStatus } from "@/lib/subscription-status";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckoutForm, CheckoutPlanData } from "@/components/checkout-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Checkout | Ironvale Strength & Conditioning",
  description: "Complete your training block registration with full or flexible partial installment options.",
};

interface CheckoutPageProps {
  searchParams: Promise<{ planId?: string }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const session = await requireUser();
  const { planId } = await searchParams;

  if (!planId || !/^[0-9a-fA-F]{24}$/.test(planId)) {
    redirect("/plans");
  }

  await connectToDatabase();

  // 1. Fetch user to verify single-subscription policy
  const user = await User.findOne({ clerkId: session.userId });
  const subscriptionStatus = deriveSubscriptionStatus(
    user?.subscription?.endDate,
    user?.subscription?.balanceDuePaise
  );

  const hasActiveSubscription =
    subscriptionStatus === "ACTIVE" || subscriptionStatus === "PARTIAL";

  // If athlete already has an active subscription, block purchase gracefully
  if (hasActiveSubscription && user?.subscription) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 sm:py-24 space-y-6">
        <Link
          href="/plans"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono uppercase"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Plans
        </Link>

        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-display uppercase tracking-tight">
                  Active Subscription In Progress
                </CardTitle>
                <p className="text-xs text-muted-foreground font-mono">
                  Ironvale One-Subscription Policy
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your athlete account currently maintains an active training pass valid through{" "}
              <strong className="text-foreground">{formatDate(user.subscription.endDate)}</strong>.
              In accordance with facility guidelines, athletes may hold one active membership tier at a time.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You can renew or choose a different training block once your current membership concludes.
            </p>
            <div className="pt-3 flex flex-wrap gap-3">
              <Link href="/dashboard">
                <Button size="sm" className="gap-2">
                  View Member Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/billing">
                <Button variant="outline" size="sm">
                  View Invoices
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. Fetch the plan
  const plan = await SubscriptionPlan.findById(planId).lean();
  if (!plan || !plan.isActive) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold font-display uppercase tracking-tight text-foreground">
          Plan Unavailable
        </h2>
        <p className="text-sm text-muted-foreground">
          The requested training tier does not exist or has been retired.
        </p>
        <Link href="/plans">
          <Button size="sm">Explore Available Plans</Button>
        </Link>
      </div>
    );
  }

  // 3. Precalculate plan baseline pricing
  const baselinePricing = calculatePricing({
    plan: {
      baseMonthlyPricePaise: plan.baseMonthlyPricePaise,
      durationMonths: plan.durationMonths,
      discountPercentage: plan.discountPercentage,
      allowPartialPayment: plan.allowPartialPayment,
    },
  });

  const planData: CheckoutPlanData = {
    id: plan._id.toString(),
    name: plan.name,
    durationMonths: plan.durationMonths,
    baseMonthlyPricePaise: plan.baseMonthlyPricePaise,
    discountPercentage: plan.discountPercentage,
    allowPartialPayment: plan.allowPartialPayment,
    pricing: baselinePricing,
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <div>
        <Link
          href="/plans"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono uppercase mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Membership Plans
        </Link>
        <h1 className="text-3xl sm:text-4xl font-black uppercase font-display tracking-tight text-foreground">
          Complete Membership Registration
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Review your training block details, apply discount codes, and choose your payment structure.
        </p>
      </div>

      <CheckoutForm plan={planData} />
    </div>
  );
}