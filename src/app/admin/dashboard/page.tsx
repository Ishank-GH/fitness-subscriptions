import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { Transaction } from "@/lib/db/models/transaction";
import { formatPaiseToRupees, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Overview | Ironvale",
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

  const totalAthletes = await User.countDocuments({ role: "USER" });
  const activeFullSubs = await User.countDocuments({
    "subscription.endDate": { $gt: now },
    "subscription.balanceDuePaise": 0,
  });
  const activePartialSubs = await User.countDocuments({
    "subscription.endDate": { $gt: now },
    "subscription.balanceDuePaise": { $gt: 0 },
  });
  const totalActiveSubs = activeFullSubs + activePartialSubs;

  const revenueAggregation = await Transaction.aggregate([
    {
      $project: {
        remainingBalancePaise: 1,
        collectedFromPayments: {
          $reduce: {
            input: {
              $filter: {
                input: { $ifNull: ["$payments", []] },
                as: "p",
                cond: { $ne: ["$$p.reference", "ADMIN_OVERRIDE"] },
              },
            },
            initialValue: 0,
            in: { $add: ["$$value", "$$this.amountPaise"] },
          },
        },
        writtenOffFromPayments: {
          $reduce: {
            input: {
              $filter: {
                input: { $ifNull: ["$payments", []] },
                as: "p",
                cond: { $eq: ["$$p.reference", "ADMIN_OVERRIDE"] },
              },
            },
            initialValue: 0,
            in: { $add: ["$$value", "$$this.amountPaise"] },
          },
        },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenuePaise: { $sum: "$collectedFromPayments" },
        totalWrittenOffPaise: { $sum: "$writtenOffFromPayments" },
        outstandingReceivablesPaise: { $sum: "$remainingBalancePaise" },
        totalTransactionsCount: { $sum: 1 },
      },
    },
  ]);

  const totalRevenuePaise = revenueAggregation[0]?.totalRevenuePaise || 0;
  const totalWrittenOffPaise = revenueAggregation[0]?.totalWrittenOffPaise || 0;
  const outstandingReceivablesPaise = revenueAggregation[0]?.outstandingReceivablesPaise || 0;

  const recentTransactions = await Transaction.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("userId", "email firstName lastName")
    .lean();

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
            Overview
          </h1>
          <p className="text-sm text-muted-foreground">
            Platform health and revenue metrics.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="rounded-sm border border-border bg-card p-5 space-y-2">
          <span className="text-xs text-muted-foreground font-mono">Collected revenue</span>
          <div className="text-2xl font-bold font-display text-foreground tabular-nums">
            {formatPaiseToRupees(totalRevenuePaise)}
          </div>
        </div>
        <div className="rounded-sm border border-border bg-card p-5 space-y-2">
          <span className="text-xs text-muted-foreground font-mono">Receivables</span>
          <div className="text-2xl font-bold font-display text-foreground tabular-nums">
            {formatPaiseToRupees(outstandingReceivablesPaise)}
          </div>
        </div>
        <div className="rounded-sm border border-border bg-card p-5 space-y-2">
          <span className="text-xs text-muted-foreground font-mono">Written off by admin</span>
          <div className="text-2xl font-bold font-display text-foreground tabular-nums">
            {formatPaiseToRupees(totalWrittenOffPaise)}
          </div>
        </div>
        <div className="rounded-sm border border-border bg-card p-5 space-y-2">
          <span className="text-xs text-muted-foreground font-mono">Active subscriptions</span>
          <div className="text-2xl font-bold font-display text-foreground tabular-nums">
            {totalActiveSubs}
          </div>
        </div>
        <div className="rounded-sm border border-border bg-card p-5 space-y-2">
          <span className="text-xs text-muted-foreground font-mono">Registered athletes</span>
          <div className="text-2xl font-bold font-display text-foreground tabular-nums">
            {totalAthletes}
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="rounded-sm border border-border bg-card">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold font-display text-lg text-foreground">Recent payments</h2>
          <Link href="/admin/transactions">
            <Button variant="outline" size="sm" className="font-mono text-xs">View all</Button>
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border bg-background/50 text-muted-foreground font-mono text-xs">
                  <th className="py-3 px-5 font-normal">Invoice</th>
                  <th className="py-3 px-5 font-normal">Athlete</th>
                  <th className="py-3 px-5 font-normal">Plan</th>
                  <th className="py-3 px-5 font-normal">Amount</th>
                  <th className="py-3 px-5 font-normal">Status</th>
                  <th className="py-3 px-5 font-normal text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-xs">
                {recentTransactions.map((tx) => {
                  const athlete = tx.userId as unknown as PopulatedUser | null;
                  const athleteDisplay = athlete?.firstName
                    ? `${athlete.firstName} ${athlete.lastName || ""}`
                    : athlete?.email || "Unassigned";

                  return (
                    <tr key={tx._id.toString()} className="hover:bg-background/50 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-foreground">{tx.invoiceNumber}</td>
                      <td className="py-3.5 px-5 text-foreground">{athleteDisplay}</td>
                      <td className="py-3.5 px-5 text-muted-foreground">{tx.planSnapshot.name}</td>
                      <td className="py-3.5 px-5 text-foreground tabular-nums">
                        {formatPaiseToRupees(tx.amountPaidPaise)} / {formatPaiseToRupees(tx.totalAmountPaise)}
                      </td>
                      <td className="py-3.5 px-5 text-foreground">{tx.paymentStatus}</td>
                      <td className="py-3.5 px-5 text-muted-foreground text-right tabular-nums">
                        {formatDate(tx.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}