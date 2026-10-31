import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { Transaction } from "@/lib/db/models/transaction";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import {
  BillingInvoiceList,
  SerializedTransaction,
} from "@/components/billing-invoice-list";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Billing & invoices | Ironvale",
  description: "View your payment history and settle outstanding balances.",
};

export default async function BillingPage() {
  const session = await requireUser();
  await connectToDatabase();

  const user = await User.findOne({ clerkId: session.userId }).lean();
  let transactions: SerializedTransaction[] = [];

  if (user) {
    const rawTransactions = await Transaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    transactions = rawTransactions.map((t) => ({
      id: t._id.toString(),
      invoiceNumber: t.invoiceNumber,
      planSnapshot: {
        name: t.planSnapshot.name,
        durationMonths: t.planSnapshot.durationMonths,
        baseMonthlyPricePaise: t.planSnapshot.baseMonthlyPricePaise,
        discountPercentage: t.planSnapshot.discountPercentage,
      },
      couponSnapshot: t.couponSnapshot
        ? {
            code: t.couponSnapshot.code,
            type: t.couponSnapshot.type,
            flatAmountPaise: t.couponSnapshot.flatAmountPaise,
            percentage: t.couponSnapshot.percentage,
          }
        : null,
      totalAmountPaise: t.totalAmountPaise,
      amountPaidPaise: t.amountPaidPaise,
      remainingBalancePaise: t.remainingBalancePaise,
      paymentStatus: t.paymentStatus,
      paymentDate: t.paymentDate ? t.paymentDate.toISOString() : null,
      payments: t.payments.map((p) => ({
        amountPaise: p.amountPaise,
        paidAt: p.paidAt.toISOString(),
        reference: p.reference,
      })),
      overriddenAt: t.overriddenAt ? t.overriddenAt.toISOString() : null,
      overrideNote: t.overrideNote || null,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
            Billing & invoices
          </h1>
          <p className="text-sm text-muted-foreground">
            View your payment history and settle outstanding balances.
          </p>
        </div>
        <Link href="/plans">
          <Button variant="outline" size="sm" className="font-mono text-xs">
            Explore plans
          </Button>
        </Link>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          title="No billing history"
          description="You haven't initiated any membership purchases yet. Once you enroll in a training block, your receipts will appear here."
          action={{
            label: "Browse plans",
            href: "/plans",
          }}
        />
      ) : (
        <BillingInvoiceList transactions={transactions} />
      )}
    </div>
  );
}