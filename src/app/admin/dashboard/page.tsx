import Link from "next/link";
import {
  Users,
  CreditCard,
  CalendarCheck,
  ClockAlert,
  ArrowRight,
  Dumbbell,
  Tag,
  Receipt,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { Transaction } from "@/lib/db/models/transaction";
import { formatPaiseToRupees, formatDate } from "@/lib/format";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Overview | Ironvale Strength & Conditioning",
  description: "Platform health, active subscriptions, revenue metrics, and recent billing activity.",
};

interface PopulatedUser {
  email: string;
  firstName?: string;
  lastName?: string;
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  await connectToDatabase();

  const now = new Date();

  // Total registered athletes
  const totalAthletes = await User.countDocuments({ role: "USER" });

  // Active memberships derived from unexpired endDates
  const activeFullSubs = await User.countDocuments({
    "subscription.endDate": { $gt: now },
    "subscription.balanceDuePaise": 0,
  });

  const activePartialSubs = await User.countDocuments({
    "subscription.endDate": { $gt: now },
    "subscription.balanceDuePaise": { $gt: 0 },
  });

  const totalActiveSubs = activeFullSubs + activePartialSubs;

  // Aggregate revenue and outstanding balances across all transactions
  const revenueAggregation = await Transaction.aggregate([
    {
      $group: {
        _id: null,
        totalRevenuePaise: { $sum: "$amountPaidPaise" },
        outstandingReceivablesPaise: { $sum: "$remainingBalancePaise" },
        totalTransactionsCount: { $sum: 1 },
      },
    },
  ]);

  const totalRevenuePaise = revenueAggregation[0]?.totalRevenuePaise || 0;
  const outstandingReceivablesPaise = revenueAggregation[0]?.outstandingReceivablesPaise || 0;
  const totalTransactionsCount = revenueAggregation[0]?.totalTransactionsCount || 0;

  // Latest 5 transactions
  const recentTransactions = await Transaction.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("userId", "email firstName lastName")
    .lean();

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="text-xs uppercase font-mono tracking-widest text-primary font-semibold">
            Administrative Oversight
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase font-display tracking-tight text-foreground mt-1">
            Platform Analytics & Operations
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Real-time subscriber metrics, gross revenue, and facility ledger.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/plans">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <Dumbbell className="h-3.5 w-3.5" />
              Manage Plans
            </Button>
          </Link>
          <Link href="/admin/transactions">
            <Button size="sm" className="gap-1.5 text-xs">
              <Receipt className="h-3.5 w-3.5" />
              Audit Ledger
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Collected Revenue */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Collected Revenue
            </span>
            <div className="h-8 w-8 rounded bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <CreditCard className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
              {formatPaiseToRupees(totalRevenuePaise)}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Across {totalTransactionsCount} total billing events
            </p>
          </CardContent>
        </Card>

        {/* Active Memberships */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Active Subscriptions
            </span>
            <div className="h-8 w-8 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
              {totalActiveSubs}
            </div>
            <p className="text-[11px] text-emerald-400">
              {activeFullSubs} fully paid • {activePartialSubs} partial
            </p>
          </CardContent>
        </Card>

        {/* Total Registered Athletes */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Registered Athletes
            </span>
            <div className="h-8 w-8 rounded bg-muted/40 border border-border text-foreground flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
              {totalAthletes}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Member platform profiles in database
            </p>
          </CardContent>
        </Card>

        {/* Outstanding Receivables */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Receivables Balance
            </span>
            <div className="h-8 w-8 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <ClockAlert className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold font-display text-amber-400">
              {formatPaiseToRupees(outstandingReceivablesPaise)}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Across {activePartialSubs} installment plans due
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/plans" className="group">
          <Card className="bg-card border-border hover:border-primary/50 transition-all h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Dumbbell className="h-5 w-5 text-primary" />
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <CardTitle className="text-base font-display uppercase tracking-tight mt-2">
                Subscription Plans Manager
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Create new training tiers, adjust base rates in paise, configure commitment discounts, and enable partial installments.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/coupons" className="group">
          <Card className="bg-card border-border hover:border-primary/50 transition-all h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Tag className="h-5 w-5 text-primary" />
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <CardTitle className="text-base font-display uppercase tracking-tight mt-2">
                Promo Coupons Manager
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Issue flat or percentage coupon codes, enforce maximum redemption limits, and manage expiration windows.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/transactions" className="group">
          <Card className="bg-card border-border hover:border-primary/50 transition-all h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Receipt className="h-5 w-5 text-primary" />
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <CardTitle className="text-base font-display uppercase tracking-tight mt-2">
                Audit Ledger & Overrides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Review platform invoices, inspect immutable historical snapshots, and apply management payment balance overrides.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Ledger Activity */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
              Real-time Ledger
            </span>
            <CardTitle className="text-lg font-display uppercase tracking-tight mt-0.5">
              Recent Transactions
            </CardTitle>
          </div>
          <Link href="/admin/transactions">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              View All Invoices
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="pt-4">
          {recentTransactions.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center italic">
              No platform transactions recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground font-mono uppercase text-[11px] text-left">
                    <th className="py-2.5 px-3">Invoice</th>
                    <th className="py-2.5 px-3">Athlete</th>
                    <th className="py-2.5 px-3">Plan</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {recentTransactions.map((tx) => {
                    const athlete = tx.userId as unknown as PopulatedUser | null;
                    const athleteDisplay = athlete
                      ? athlete.firstName
                        ? `${athlete.firstName} ${athlete.lastName || ""}`
                        : athlete.email
                      : "Unassigned";

                    return (
                      <tr key={tx._id.toString()} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-foreground">
                          {tx.invoiceNumber}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-foreground font-medium block">
                            {athleteDisplay}
                          </span>
                          {athlete?.email && (
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {athlete.email}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-foreground">
                          {tx.planSnapshot.name}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span className="text-foreground font-semibold">
                            {formatPaiseToRupees(tx.amountPaidPaise)}
                          </span>
                          <span className="text-muted-foreground ml-1">
                            / {formatPaiseToRupees(tx.totalAmountPaise)}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {tx.paymentStatus === "COMPLETED" && (
                            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 gap-1 text-[10px]">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              COMPLETED
                            </Badge>
                          )}
                          {tx.paymentStatus === "PARTIAL" && (
                            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400 gap-1 text-[10px]">
                              <Clock className="h-2.5 w-2.5" />
                              PARTIAL
                            </Badge>
                          )}
                          {tx.paymentStatus === "PENDING" && (
                            <Badge variant="outline" className="border-muted text-muted-foreground text-[10px]">
                              PENDING
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right text-muted-foreground font-mono text-[11px]">
                          {formatDate(tx.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}