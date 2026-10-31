import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import {
  Calendar,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  Dumbbell,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckoutSuccessAlert } from "@/components/checkout-success-alert";

export const dynamic = "force-dynamic";

interface MemberDashboardPageProps {
  searchParams: Promise<{ checkout?: string }>;
}

export default async function MemberDashboardPage({
  searchParams,
}: MemberDashboardPageProps) {
  const { checkout } = await searchParams;
  const session = await requireUser();
  await connectToDatabase();

  let user = await User.findOne({ clerkId: session.userId }).populate({
    path: "subscription.planId",
    model: SubscriptionPlan,
  });

  // Lazy sync fallback if user record is missing in MongoDB
  if (!user) {
    const clerkUser = await currentUser();
    const primaryEmail =
      clerkUser?.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress ||
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
  const status = deriveSubscriptionStatus(
    subscription?.endDate,
    subscription?.balanceDuePaise
  );
  const expiringSoon = isExpiringSoon(
    subscription?.endDate,
    subscription?.balanceDuePaise
  );

  const daysRemaining = calculateDaysRemaining(subscription?.endDate);

  const populatedPlan = subscription?.planId as unknown as ISubscriptionPlan | undefined;
  const planName = populatedPlan?.name || "Ironvale Training Plan";
  const planDuration = populatedPlan?.durationMonths || 1;

  const athleteName = user.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user.email.split("@")[0];

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Checkout Success Banner */}
      {checkout === "success" && (
        <CheckoutSuccessAlert
          status={status}
          balanceDuePaise={subscription?.balanceDuePaise}
        />
      )}

      {/* 3-Day Expiry Urgent Banner */}
      {expiringSoon && (
        <div className="rounded border border-amber-500/40 bg-amber-500/10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground text-sm uppercase tracking-wider font-mono">
                Membership Expiring Soon
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Your membership expires in{" "}
                <span className="font-bold text-foreground">
                  {daysRemaining} {daysRemaining === 1 ? "day" : "days"}
                </span>{" "}
                (on {formatDate(subscription!.endDate)}). Renew before expiry to maintain continuous platform access.
              </p>
            </div>
          </div>
          <Link href="/plans">
            <Button size="sm" className="whitespace-nowrap bg-amber-600 hover:bg-amber-500 text-black font-semibold">
              Renew Membership
            </Button>
          </Link>
        </div>
      )}

      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="text-xs uppercase font-mono tracking-widest text-primary font-semibold">
            Member Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase font-display tracking-tight text-foreground mt-1">
            Welcome, {athleteName}
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Registered: {formatDate(user.createdAt)} • Athlete Account
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/plans">
            <Button variant="outline" size="sm" className="gap-2">
              <Dumbbell className="h-4 w-4" />
              All Plans
            </Button>
          </Link>
          <Link href="/billing">
            <Button variant="outline" size="sm" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Invoices
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Subscription Status Card (Takes 2 Columns on Large Screens) */}
        <Card className="lg:col-span-2 border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Current Access Tier
              </span>
              <CardTitle className="text-xl font-display uppercase tracking-tight mt-0.5">
                Subscription Status
              </CardTitle>
            </div>
            <div>
              {status === "ACTIVE" && (
                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 gap-1.5">
                  <CheckCircle2 className="h-3 w-3" />
                  Active Membership
                </Badge>
              )}
              {status === "PARTIAL" && (
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400 gap-1.5">
                  <Clock className="h-3 w-3" />
                  Partial Payment — Balance Due
                </Badge>
              )}
              {status === "EXPIRED" && (
                <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive gap-1.5">
                  <ShieldAlert className="h-3 w-3" />
                  Expired
                </Badge>
              )}
              {status === "NONE" && (
                <Badge variant="outline" className="border-muted text-muted-foreground">
                  No Active Plan
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Status: ACTIVE */}
            {status === "ACTIVE" && subscription && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded border border-border/60 bg-muted/20 p-4">
                    <span className="text-[11px] font-mono uppercase text-muted-foreground tracking-wider">
                      Plan Enrolled
                    </span>
                    <p className="text-lg font-bold text-foreground font-display uppercase mt-1">
                      {planName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDurationMonths(planDuration)} duration
                    </p>
                  </div>

                  <div className="rounded border border-border/60 bg-muted/20 p-4">
                    <span className="text-[11px] font-mono uppercase text-muted-foreground tracking-wider">
                      Valid Through
                    </span>
                    <p className="text-lg font-bold text-foreground font-display uppercase mt-1">
                      {formatDate(subscription.endDate)}
                    </p>
                    <p className="text-xs text-emerald-400 mt-0.5">
                      {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining
                    </p>
                  </div>

                  <div className="rounded border border-border/60 bg-muted/20 p-4">
                    <span className="text-[11px] font-mono uppercase text-muted-foreground tracking-wider">
                      Outstanding Dues
                    </span>
                    <p className="text-lg font-bold text-emerald-400 font-display mt-1">
                      ₹0
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Paid in full
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/40">
                  <div className="text-xs text-muted-foreground">
                    Started on {formatDate(subscription.startDate)}
                  </div>
                  <Link href="/billing">
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-primary hover:text-primary">
                      View Invoices & Receipts
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Status: PARTIAL */}
            {status === "PARTIAL" && subscription && (
              <div className="space-y-6">
                <div className="rounded border border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-semibold">
                        Outstanding Balance
                      </span>
                      <p className="text-3xl font-black text-amber-400 font-display mt-0.5">
                        {formatPaiseToRupees(subscription.balanceDuePaise)}
                      </p>
                    </div>
                    <Link href="/billing">
                      <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                        Pay Remaining Balance
                      </Button>
                    </Link>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You made an upfront partial payment for <strong className="text-foreground">{planName}</strong>. 
                    The remaining balance of {formatPaiseToRupees(subscription.balanceDuePaise)} must be paid in full 
                    before <strong className="text-foreground">{formatDate(subscription.endDate)}</strong> to maintain continuous facility privileges.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded border border-border/60 bg-muted/20 p-4">
                    <span className="text-[11px] font-mono uppercase text-muted-foreground tracking-wider">
                      Start Date
                    </span>
                    <p className="text-sm font-semibold text-foreground font-mono mt-1">
                      {formatDate(subscription.startDate)}
                    </p>
                  </div>
                  <div className="rounded border border-border/60 bg-muted/20 p-4">
                    <span className="text-[11px] font-mono uppercase text-muted-foreground tracking-wider">
                      Balance Deadline
                    </span>
                    <p className="text-sm font-semibold text-foreground font-mono mt-1">
                      {formatDate(subscription.endDate)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status: EXPIRED */}
            {status === "EXPIRED" && subscription && (
              <div className="space-y-6">
                <div className="rounded border border-destructive/30 bg-destructive/5 p-5 space-y-3">
                  <p className="text-sm text-foreground font-semibold">
                    Your {planName} membership concluded on {formatDate(subscription.endDate)}.
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Facility access, platform bookings, and coaching reviews are currently suspended. 
                    Re-enroll in a training plan to regain immediate access.
                  </p>
                  <div className="pt-2">
                    <Link href="/plans">
                      <Button size="sm" className="gap-2">
                        Renew Membership
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Status: NONE */}
            {status === "NONE" && (
              <div className="space-y-6">
                <div className="rounded border border-border/60 bg-muted/10 p-6 sm:p-8 text-center space-y-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
                    <Dumbbell className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-bold text-foreground font-display uppercase tracking-tight">
                      No Active Training Membership
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                      You are registered in the Ironvale portal, but have not yet selected a membership tier. 
                      Choose a plan to get started.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link href="/plans">
                      <Button size="sm" className="gap-2">
                        Explore Membership Plans
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Facility & Policy Card */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-4 border-b border-border/50">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Facility Guidelines
            </span>
            <CardTitle className="text-xl font-display uppercase tracking-tight mt-0.5">
              Ironvale Hours & Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5 text-sm">
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                Operating Hours
              </span>
              <p className="text-xs text-foreground font-medium">
                Mon – Sat: 5:30 AM – 10:00 PM
              </p>
              <p className="text-xs text-muted-foreground">
                Sunday: 7:00 AM – 6:00 PM
              </p>
            </div>

            <div className="border-t border-border/40 pt-4 space-y-2">
              <span className="text-[11px] font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Membership Policy
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                One active subscription per athlete. Partial payment option allows 50% upfront, with the remainder payable anytime before the plan expiration date.
              </p>
            </div>

            <div className="border-t border-border/40 pt-4 space-y-2">
              <span className="text-[11px] font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-primary" />
                Payment Record
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every transaction issues an immutable invoice snapshot with real-time audit logs in your billing tab.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}