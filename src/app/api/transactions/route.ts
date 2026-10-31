import { requireApiUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { Transaction } from "@/lib/db/models/transaction";
import { apiSuccess, handleApiError } from "@/lib/errors";

export const dynamic = "force-dynamic";

// Public REST surface for user transactions; application pages query the database directly.
export async function GET() {
  try {
    const session = await requireApiUser();
    await connectToDatabase();

    const user = await User.findOne({ clerkId: session.userId }).lean();
    if (!user) {
      return apiSuccess([]);
    }

    const transactions = await Transaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    const formattedTransactions = transactions.map((t) => ({
      id: t._id.toString(),
      invoiceNumber: t.invoiceNumber,
      planSnapshot: t.planSnapshot,
      couponSnapshot: t.couponSnapshot || null,
      totalAmountPaise: t.totalAmountPaise,
      amountPaidPaise: t.amountPaidPaise,
      remainingBalancePaise: t.remainingBalancePaise,
      paymentStatus: t.paymentStatus,
      paymentDate: t.paymentDate || null,
      payments: t.payments.map((p) => ({
        amountPaise: p.amountPaise,
        paidAt: p.paidAt,
        reference: p.reference,
      })),
      overriddenAt: t.overriddenAt || null,
      overrideNote: t.overrideNote || null,
      createdAt: t.createdAt,
    }));

    return apiSuccess(formattedTransactions);
  } catch (error) {
    return handleApiError(error);
  }
}