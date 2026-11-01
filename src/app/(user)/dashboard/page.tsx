import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { requireUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { User, IUserSubscription } from "@/lib/db/models/user";
import { SubscriptionPlan, ISubscriptionPlan } from "@/lib/db/models/subscription-plan";
import { ensureUserDocument } from "@/lib/db/ensure-user";
import {
  deriveSubscriptionStatus,
  isExpiringSoon,
  calculateDaysRemaining,
} from "@/lib/subscription-status";
import { formatDate, formatPaiseToRupees, formatDurationMonths } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { CheckoutSuccessAlert } from "@/components/checkout-success-alert";

export const dynamic = "force-dynamic";

interface MemberDashboardPageProps {
  searchParams: Promise<{ checkout?: string }>;
}

export default async function MemberDashboardPage({ searchParams }: MemberDashboardPageProps) {
  const { checkout } = await searchParams;
  const session = await requireUser();
  await connectToDatabase();

  let user = await User.findOne({ clerkId: session.userId }).populate({
    path: "subscription.planId",
    model: SubscriptionPlan,
  });

  if (!user) {
    const clerkUser = await currentUser();
    const primaryEmail =
      clerkUser?.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
      clerkUser?.emailAddresses[0]?.emailAddress ||
      "athlete@ironvale.com";

    await ensureUserDocument({
      clerkId: session.userId,
      email: primaryEmail,
      firstName: clerkUser?.firstName || undefined,
      lastName: clerkUser?.lastName || undefined,
    });

    user = await User.findOne({ clerkId: session.userId }).populate({
      path: "subscription.planId",
      model: SubscriptionPlan,
    });
  }

  if (!user) {
    throw new Error("Unable to load member profile");
  }

  const subscription: IUserSubscription | null | undefined = user.subscription;
  const status = deriveSubscriptionStatus(subscription?.endDate, subscription?.balanceDuePaise);
  const expiringSoon = isExpiringSoon(subscription?.endDate, subscription?.balanceDuePaise);
  const daysRemaining = calculateDaysRemaining(subscription?.endDate);

  const populatedPlan = subscription?.planId as unknown as ISubscriptionPlan | undefined;
  const planName = populatedPlan?.name || "Ironvale Training Plan";
  const planDuration = populatedPlan?.durationMonths || 1;

  const athleteName = user.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user.email.split("@")[0];

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      {checkout === "success" && (
        <CheckoutSuccessAlert status={status} balanceDuePaise={subscription?.balanceDuePaise} />
      )}

      {expiringSoon && (
        <div className="rounded-sm border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-bold text-foreground font-display">Membership expiring soon</p>
            <p className="text-sm text-muted-foreground">
              Your block ends in <span className="font-mono">{daysRemaining}</span> days (on {formatDate(subscription!.endDate)}).
            </p>
          </div>
          <Link href="/plans">
            <Button size="sm" className="font-mono text-xs">Renew plan</Button>
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
            Welcome, {athleteName}
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            Registered {formatDate(user.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Subscription Status */}
        <div className="md:col-span-2 rounded-sm border border-border bg-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <h2 className="text-xl font-bold font-display text-foreground">Subscription</h2>
            <span className="font-mono text-xs uppercase px-2 py-0.5 border border-border rounded-sm text-foreground">
              {status}
            </span>
          </div>

          {status === "ACTIVE" && subscription && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono text-sm">
              <div className="space-y-1">
                <span className="text-muted-foreground block text-xs">Plan</span>
                <p className="text-foreground font-semibold">{planName}</p>
                <p className="text-muted-foreground text-xs">{formatDurationMonths(planDuration)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground block text-xs">Valid through</span>
                <p className="text-foreground font-semibold">{formatDate(subscription.endDate)}</p>
                <p className="text-muted-foreground text-xs">{daysRemaining} days left</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground block text-xs">Balance due</span>
                <p className="text-foreground font-semibold">₹0</p>
                <p className="text-muted-foreground text-xs">Paid in full</p>
              </div>
            </div>
          )}

          {status === "PARTIAL" && subscription && (
            <div className="space-y-6">
              <div className="rounded-sm border border-border bg-background p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-mono">Balance due</span>
                  <p className="text-2xl font-bold font-display text-foreground tabular-nums">
                    {formatPaiseToRupees(subscription.balanceDuePaise)}
                  </p>
                </div>
                <Link href="/billing">
                  <Button size="sm" className="font-mono text-xs">Pay balance</Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">
                Settle the remaining balance before {formatDate(subscription.endDate)} to maintain access.
              </p>
            </div>
          )}

          {status === "EXPIRED" && (
            <div className="space-y-4">
              <p className="text-sm text-foreground">
                Your {planName} membership concluded on {formatDate(subscription!.endDate)}.
              </p>
              <Link href="/plans">
                <Button size="sm" className="font-mono text-xs">Renew plan</Button>
              </Link>
            </div>
          )}

          {status === "NONE" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You are registered but do not have an active training plan.
              </p>
              <Link href="/plans">
                <Button size="sm" className="font-mono text-xs">View plans</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Facility Rules */}
        <div className="rounded-sm border border-border bg-card p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold font-display text-foreground border-b border-border/60 pb-4">
            Facility rules
          </h2>
          <div className="space-y-4 text-sm font-mono text-muted-foreground">
            <div className="space-y-1">
              <span className="text-foreground block font-sans font-semibold">Hours</span>
              <p>Mon–Fri: 05:30 – 22:00</p>
              <p>Sat: 06:00 – 21:00</p>
              <p>Sun: 07:00 – 20:00</p>
            </div>
            <div className="space-y-1">
              <span className="text-foreground block font-sans font-semibold">Policy</span>
              <p className="font-sans text-sm leading-relaxed">
                One active block per athlete. Re-rack plates after use. Chalk stays on the platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}