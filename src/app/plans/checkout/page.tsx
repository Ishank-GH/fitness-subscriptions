import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { SubscriptionPlan } from "@/lib/db/models/subscription-plan";
import { User } from "@/lib/db/models/user";
import { calculatePricing } from "@/lib/pricing/engine";
import { deriveSubscriptionStatus } from "@/lib/subscription-status";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { CheckoutForm, CheckoutPlanData } from "@/components/checkout-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Checkout | Ironvale",
  description: "Complete your training block registration with full or flexible installment options.",
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

  const user = await User.findOne({ clerkId: session.userId });
  const subscriptionStatus = deriveSubscriptionStatus(
    user?.subscription?.endDate,
    user?.subscription?.balanceDuePaise
  );

  const hasActiveSubscription =
    subscriptionStatus === "ACTIVE" || subscriptionStatus === "PARTIAL";

  if (hasActiveSubscription && user?.subscription) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 sm:py-24 space-y-6">
        <Link
          href="/plans"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to plans
        </Link>

        <div className="rounded-sm border border-border bg-card p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-display font-bold text-foreground">
            Active subscription in progress
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your account currently has an active training pass valid through{" "}
            <strong className="text-foreground">{formatDate(user.subscription.endDate)}</strong>.
            Athletes maintain one active membership block at a time.
          </p>
          <div className="pt-4 flex flex-wrap gap-3">
            <Link href="/dashboard">
              <Button size="sm" className="font-mono text-xs">
                Member dashboard
              </Button>
            </Link>
            <Link href="/billing">
              <Button variant="outline" size="sm" className="font-mono text-xs">
                View invoices
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const plan = await SubscriptionPlan.findById(planId).lean();
  if (!plan || !plan.isActive) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold font-display text-foreground">
          Plan unavailable
        </h2>
        <p className="text-sm text-muted-foreground">
          The requested training tier does not exist or has been archived.
        </p>
        <Link href="/plans">
          <Button size="sm">Explore available plans</Button>
        </Link>
      </div>
    );
  }

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
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <div>
        <Link
          href="/plans"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to plans
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
          Complete registration
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Review training block terms, apply coupons, and choose full or 50% upfront payment.
        </p>
      </div>

      <CheckoutForm plan={planData} />
    </div>
  );
}