import { NextRequest } from "next/server";
import { requireApiAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { Transaction } from "@/lib/db/models/transaction";
import { adminOverrideSchema, objectIdSchema } from "@/lib/validators";
import { apiSuccess, handleApiError, notFound, badRequest, conflict } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * Administrative override endpoint for PARTIAL transactions.
 * - Appends an adjustment payment entry for the remaining balance with reference "ADMIN_OVERRIDE".
 * - Sets amountPaidPaise to totalAmountPaise and remainingBalancePaise to 0.
 * - Updates paymentStatus to "COMPLETED" and records audit fields (overriddenBy, overriddenAt, overrideNote).
 * - Updates the athlete's subscription balanceDuePaise to 0 to derive an ACTIVE status.
 * - Preserves the invariant: sum(payments[].amountPaise) === amountPaidPaise.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireApiAdmin();
    const { id } = await params;
    objectIdSchema.parse(id);

    const body = await req.json();
    const { overrideNote } = adminOverrideSchema.parse(body);

    await connectToDatabase();

    const adminUser = await User.findOne({ clerkId: session.userId });
    if (!adminUser) {
      notFound("Admin user profile not found", "ADMIN_NOT_FOUND");
    }

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      notFound("Transaction not found", "TRANSACTION_NOT_FOUND");
    }

    if (transaction.paymentStatus !== "PARTIAL") {
      badRequest(
        "Only transactions with a PARTIAL payment status can be administratively overridden",
        "INVALID_TRANSACTION_STATUS"
      );
    }

    if (transaction.remainingBalancePaise <= 0) {
      badRequest("This transaction has no outstanding balance to override", "NO_BALANCE_DUE");
    }

    const now = new Date();
    const balanceToForgive = transaction.remainingBalancePaise;

    // Atomic conditional update ensuring transaction remains in PARTIAL status and amountPaidPaise has not shifted
    const updated = await Transaction.findOneAndUpdate(
      {
        _id: transaction._id,
        paymentStatus: "PARTIAL",
        amountPaidPaise: transaction.amountPaidPaise,
      },
      {
        $push: {
          payments: {
            amountPaise: balanceToForgive,
            paidAt: now,
            reference: "ADMIN_OVERRIDE",
          },
        },
        $set: {
          amountPaidPaise: transaction.totalAmountPaise,
          remainingBalancePaise: 0,
          paymentStatus: "COMPLETED",
          overriddenBy: adminUser._id,
          overriddenAt: now,
          overrideNote,
        },
      },
      { new: true }
    );

    if (!updated) {
      conflict("Transaction status was modified concurrently. Please refresh.", "OVERRIDE_CONFLICT");
    }

    // Clear the athlete's subscription balance if it matches this transaction
    const athlete = await User.findById(transaction.userId);
    if (
      athlete?.subscription &&
      athlete.subscription.transactionId?.toString() === transaction._id.toString()
    ) {
      athlete.subscription.balanceDuePaise = 0;
      await athlete.save();
    }

    return apiSuccess({
      id: updated._id.toString(),
      invoiceNumber: updated.invoiceNumber,
      paymentStatus: updated.paymentStatus,
      amountPaidPaise: updated.amountPaidPaise,
      remainingBalancePaise: updated.remainingBalancePaise,
      overriddenAt: updated.overriddenAt,
      overrideNote: updated.overrideNote,
      overriddenBy: {
        id: adminUser._id.toString(),
        name: adminUser.firstName ? `${adminUser.firstName} ${adminUser.lastName || ""}`.trim() : adminUser.email,
        email: adminUser.email,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}