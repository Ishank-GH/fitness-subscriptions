import Link from "next/link";
import { Receipt, Dumbbell, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { Transaction } from "@/lib/db/models/transaction";
import { Button } from "@/components/ui/button";
import {
  BillingInvoiceList,
  SerializedTransaction,
} from "@/components/billing-invoice-list";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Billing & Invoices | Ironvale",
  description: "View invoice receipts, payment installment history, and settle outstanding balances.",
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
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="text-xs uppercase font-mono tracking-widest text-primary font-semibold">
            Member Financials
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase font-display tracking-tight text-foreground mt-1">
            Billing & Invoices
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Immutable invoice snapshots, payment installment records, and outstanding dues.
          </p>
        </div>
        <Link href="/plans">
          <Button variant="outline" size="sm" className="gap-2">
            <Dumbbell className="h-4 w-4" />
            Explore Plans
          </Button>
        </Link>
      </div>

      {/* Transactions List or Empty State */}
      {transactions.length === 0 ? (
        <div className="rounded border border-border bg-card p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto my-8">
          <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
            <Receipt className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold font-display uppercase tracking-tight text-foreground">
              No Billing History Found
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You haven&apos;t initiated any membership purchases yet. Once you enroll in a training tier, your immutable invoice receipts and installment logs will appear here.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/plans">
              <Button size="sm" className="gap-2">
                Browse Membership Plans
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <BillingInvoiceList transactions={transactions} />
      )}
    </div>
  );
}