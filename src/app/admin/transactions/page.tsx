import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Transaction } from "@/lib/db/models/transaction";
import { AdminTransactionTable, SerializedAdminTransaction } from "@/components/admin/transaction-table";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Payments | Ironvale Admin",
  description: "View platform transactions, payment records, and handle balance overrides.",
};

interface PopulatedUserLean {
  _id: unknown;
  email: string;
  firstName?: string;
  lastName?: string;
}

export default async function AdminTransactionsPage() {
  await requireAdmin();
  await connectToDatabase();

  const rawTransactions = await Transaction.find()
    .sort({ createdAt: -1 })
    .populate("userId", "email firstName lastName")
    .populate("overriddenBy", "email firstName lastName")
    .lean();

  const transactions: SerializedAdminTransaction[] = rawTransactions.map((tx) => {
    const athlete = tx.userId as unknown as PopulatedUserLean | null;
    const admin = tx.overriddenBy as unknown as PopulatedUserLean | null;

    return {
      id: tx._id.toString(),
      invoiceNumber: tx.invoiceNumber,
      planSnapshot: {
        name: tx.planSnapshot.name,
        durationMonths: tx.planSnapshot.durationMonths,
        baseMonthlyPricePaise: tx.planSnapshot.baseMonthlyPricePaise,
        discountPercentage: tx.planSnapshot.discountPercentage,
        allowPartialPayment: tx.planSnapshot.allowPartialPayment ?? false,
      },
      couponSnapshot: tx.couponSnapshot
        ? {
            code: tx.couponSnapshot.code,
            type: tx.couponSnapshot.type,
            flatAmountPaise: tx.couponSnapshot.flatAmountPaise,
            percentage: tx.couponSnapshot.percentage,
          }
        : null,
      totalAmountPaise: tx.totalAmountPaise,
      amountPaidPaise: tx.amountPaidPaise,
      remainingBalancePaise: tx.remainingBalancePaise,
      paymentStatus: tx.paymentStatus,
      paymentDate: tx.paymentDate ? tx.paymentDate.toISOString() : null,
      payments: tx.payments.map((p) => ({
        amountPaise: p.amountPaise,
        paidAt: p.paidAt.toISOString(),
        reference: p.reference,
      })),
      overriddenBy: admin
        ? {
            name: admin.firstName ? `${admin.firstName} ${admin.lastName || ""}`.trim() : admin.email,
            email: admin.email,
          }
        : null,
      overriddenAt: tx.overriddenAt ? tx.overriddenAt.toISOString() : null,
      overrideNote: tx.overrideNote || null,
      createdAt: tx.createdAt.toISOString(),
      athlete: athlete
        ? {
            id: String(athlete._id),
            name: athlete.firstName ? `${athlete.firstName} ${athlete.lastName || ""}`.trim() : athlete.email,
            email: athlete.email,
          }
        : null,
    };
  });

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Payments
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          View all transactions, payment records, and handle balance overrides.
        </p>
      </div>

      <AdminTransactionTable transactions={transactions} />
    </div>
  );
}