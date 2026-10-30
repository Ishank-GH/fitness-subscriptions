import { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { User } from "@/lib/db/models/user";
import { Transaction } from "@/lib/db/models/transaction";
import { SubscriptionPlan } from "@/lib/db/models/subscription-plan";
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
 * Processes a simulated payment for an existing transaction.
 * - Validates payment amount against the pricing engine rules.
 * - On first successful payment: atomically consumes any applied coupon and activates
 *   the member's subscription with calculated end date.
 * - On subsequent installment payments: decrements outstanding balance and shifts
 *   derived subscription status to ACTIVE once balance reaches zero.
 * - Preserves the invariant: amountPaidPaise === sum(payments[].amountPaise).
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

    // Retrieve plan to determine partial payment eligibility
    const plan = await SubscriptionPlan.findById(transaction.planId);
    const allowPartialPayment = plan?.allowPartialPayment ?? false;

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

    // Atomically redeem coupon on first successful payment if one was applied
    if (isFirstPayment && transaction.couponSnapshot?.code) {
      await redeemCouponAtomically(transaction.couponSnapshot.code, now);
    }

    // Generate unique simulated payment reference
    const reference = `SIM-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;

    // Update balances and append to immutable payment history
    const newAmountPaidPaise = transaction.amountPaidPaise + paymentPaise;
    const newRemainingBalancePaise = transaction.totalAmountPaise - newAmountPaidPaise;
    const newPaymentStatus = newRemainingBalancePaise === 0 ? "COMPLETED" : "PARTIAL";

    transaction.payments.push({
      amountPaise: paymentPaise,
      paidAt: now,
      reference,
    });

    transaction.amountPaidPaise = newAmountPaidPaise;
    transaction.remainingBalancePaise = newRemainingBalancePaise;
    transaction.paymentStatus = newPaymentStatus;
    if (!transaction.paymentDate) {
      transaction.paymentDate = now;
    }

    await transaction.save();

    // Start membership on first payment, or settle balanceDuePaise on subsequent payment
    if (isFirstPayment) {
      const startDate = now;
      const endDate = addMonths(startDate, transaction.planSnapshot.durationMonths);

      user.subscription = {
        planId: transaction.planId,
        startDate,
        endDate,
        balanceDuePaise: newRemainingBalancePaise,
      };
      await user.save();
    } else if (user.subscription) {
      user.subscription.balanceDuePaise = newRemainingBalancePaise;
      await user.save();
    }

    const derivedStatus = deriveSubscriptionStatus(
      user.subscription?.endDate,
      user.subscription?.balanceDuePaise
    );

    return apiSuccess({
      transactionId: transaction._id.toString(),
      invoiceNumber: transaction.invoiceNumber,
      payment: {
        amountPaise: paymentPaise,
        paidAt: now,
        reference,
      },
      paymentStatus: transaction.paymentStatus,
      amountPaidPaise: transaction.amountPaidPaise,
      remainingBalancePaise: transaction.remainingBalancePaise,
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