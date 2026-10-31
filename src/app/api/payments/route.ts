import { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { Transaction } from "@/lib/db/models/transaction";
import { validatePayment } from "@/lib/pricing/engine";
import { addMonths } from "@/lib/pricing/dates";
import { redeemCouponAtomically } from "@/lib/pricing/coupon-redemption";
import { deriveSubscriptionStatus } from "@/lib/subscription-status";
import { createPaymentSchema } from "@/lib/validators/payment";
import {
  apiSuccess,
  handleApiError,
  badRequest,
  notFound,
  forbidden,
  conflict,
} from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * Processes a simulated payment for an existing transaction using an atomic conditional update.
 * Prevents double-submits from recording duplicate payments.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireApiUser();
    const body = await req.json();
    const { transactionId, paymentChoice, amountPaise } =
      createPaymentSchema.parse(body);

    await connectToDatabase();

    const user = await User.findOne({ clerkId: session.userId });
    if (!user) {
      notFound("User profile not found", "USER_NOT_FOUND");
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      notFound("Transaction record not found", "TRANSACTION_NOT_FOUND");
    }

    if (transaction.userId.toString() !== user._id.toString()) {
      forbidden("You are not authorized to pay for this transaction", "FORBIDDEN");
    }

    if (
      transaction.paymentStatus === "COMPLETED" ||
      transaction.remainingBalancePaise === 0
    ) {
      badRequest("This transaction is already fully paid", "ALREADY_PAID");
    }

    const isFirstPayment = transaction.amountPaidPaise === 0;

    // Enforce one-subscription-at-a-time policy when activating a new subscription
    if (isFirstPayment) {
      const currentStatus = deriveSubscriptionStatus(
        user.subscription?.endDate,
        user.subscription?.balanceDuePaise
      );
      if (currentStatus === "ACTIVE" || currentStatus === "PARTIAL") {
        conflict(
          "You already have an active subscription. Only one subscription can be active at a time.",
          "ACTIVE_SUBSCRIPTION_EXISTS"
        );
      }
    }

    // Use allowPartialPayment directly from the snapshot
    const allowPartialPayment = transaction.planSnapshot.allowPartialPayment;

    // Server-controlled payment amount for FULL choice to avoid trusting client figures
    const paymentPaise =
      paymentChoice === "FULL"
        ? transaction.remainingBalancePaise
        : (amountPaise as number);

    // Validate payment math against pricing engine
    validatePayment({
      totalPaise: transaction.totalAmountPaise,
      amountPaidPaise: transaction.amountPaidPaise,
      paymentPaise,
      allowPartialPayment,
    });

    const now = new Date();

    // Generate unique simulated payment reference
    const reference = `SIM-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;

    const newPaid = transaction.amountPaidPaise + paymentPaise;
    const newRemaining = transaction.totalAmountPaise - newPaid;

    // Atomic conditional update to guard against concurrent double submission
    const updated = await Transaction.findOneAndUpdate(
      { _id: transaction._id, amountPaidPaise: transaction.amountPaidPaise },
      {
        $push: { payments: { amountPaise: paymentPaise, paidAt: now, reference } },
        $set: {
          amountPaidPaise: newPaid,
          remainingBalancePaise: newRemaining,
          paymentStatus: newRemaining === 0 ? "COMPLETED" : "PARTIAL",
          ...(isFirstPayment ? { paymentDate: now } : {}),
        },
      },
      { new: true }
    );

    if (!updated) {
      conflict("This payment was already processed. Refresh and try again.", "PAYMENT_CONFLICT");
    }

    // Redeem coupon atomically after recording payment; do not fail payment if redemption fails
    if (isFirstPayment && updated.couponSnapshot?.code) {
      try {
        await redeemCouponAtomically(updated.couponSnapshot.code, now);
      } catch (err) {
        console.error("Failed to redeem coupon after payment recorded:", err);
      }
    }

    // Start membership on first payment, or settle balanceDuePaise if transaction matches
    if (isFirstPayment) {
      const startDate = now;
      const endDate = addMonths(startDate, updated.planSnapshot.durationMonths);

      user.subscription = {
        transactionId: updated._id,
        planId: updated.planId,
        startDate,
        endDate,
        balanceDuePaise: updated.remainingBalancePaise,
      };
      await user.save();
    } else if (
      user.subscription &&
      user.subscription.transactionId?.toString() === updated._id.toString()
    ) {
      user.subscription.balanceDuePaise = updated.remainingBalancePaise;
      await user.save();
    }

    const derivedStatus = deriveSubscriptionStatus(
      user.subscription?.endDate,
      user.subscription?.balanceDuePaise
    );

    return apiSuccess({
      transactionId: updated._id.toString(),
      invoiceNumber: updated.invoiceNumber,
      payment: {
        amountPaise: paymentPaise,
        paidAt: now,
        reference,
      },
      paymentStatus: updated.paymentStatus,
      amountPaidPaise: updated.amountPaidPaise,
      remainingBalancePaise: updated.remainingBalancePaise,
      subscription: {
        startDate: user.subscription?.startDate,
        endDate: user.subscription?.endDate,
        balanceDuePaise: user.subscription?.balanceDuePaise,
        status: derivedStatus,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}