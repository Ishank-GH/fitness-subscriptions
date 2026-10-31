import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { requireApiUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { ensureUserDocument } from "@/lib/db/ensure-user";
import { SubscriptionPlan } from "@/lib/db/models/subscription-plan";
import { Coupon } from "@/lib/db/models/coupon";
import { Counter } from "@/lib/db/models/counter";
import { Transaction, IPlanSnapshot, ICouponSnapshot } from "@/lib/db/models/transaction";
import { calculatePricing, validateCoupon } from "@/lib/pricing/engine";
import { addMonths } from "@/lib/pricing/dates";
import { redeemCouponAtomically } from "@/lib/pricing/coupon-redemption";
import { deriveSubscriptionStatus } from "@/lib/subscription-status";
import { createSubscriptionSchema } from "@/lib/validators/subscription";
import { apiSuccess, handleApiError, notFound, conflict, badRequest } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * Initiates a membership checkout. Generates an immutable transaction snapshot with
 * an atomic invoice sequence. If the purchase total is ₹0 (e.g., 100% discount),
 * the transaction is created first, the coupon redeemed after, and access activated immediately.
 * Otherwise, creates a PENDING transaction where access and coupon redemption await initial payment.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireApiUser();

    const body = await req.json();
    const { planId, couponCode } = createSubscriptionSchema.parse(body);

    await connectToDatabase();

    const clerkUser = await currentUser();
    const primaryEmail =
      clerkUser?.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
      clerkUser?.emailAddresses[0]?.emailAddress ||
      `${session.userId}@athlete.ironvale.com`;

    const user = await ensureUserDocument({
      clerkId: session.userId,
      email: primaryEmail,
      firstName: clerkUser?.firstName || undefined,
      lastName: clerkUser?.lastName || undefined,
      role: session.role,
    });

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

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      notFound("Subscription plan not found or is no longer active", "PLAN_NOT_FOUND");
    }

    const now = new Date();
    let coupon = null;

    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode });
      if (!coupon) {
        badRequest("Coupon code not found", "COUPON_NOT_FOUND");
      }
      validateCoupon(coupon, now, coupon.currentRedemptions);
    }

    const pricing = calculatePricing({
      plan: {
        baseMonthlyPricePaise: plan.baseMonthlyPricePaise,
        durationMonths: plan.durationMonths,
        discountPercentage: plan.discountPercentage,
        allowPartialPayment: plan.allowPartialPayment,
      },
      coupon: coupon
        ? {
            type: coupon.type,
            flatAmountPaise: coupon.flatAmountPaise,
            percentage: coupon.percentage,
          }
        : null,
    });

    const planSnapshot: IPlanSnapshot = {
      name: plan.name,
      durationMonths: plan.durationMonths,
      baseMonthlyPricePaise: plan.baseMonthlyPricePaise,
      discountPercentage: plan.discountPercentage,
      allowPartialPayment: plan.allowPartialPayment,
    };

    const couponSnapshot: ICouponSnapshot | null = coupon
      ? {
          code: coupon.code,
          type: coupon.type,
          flatAmountPaise: coupon.flatAmountPaise,
          percentage: coupon.percentage,
        }
      : null;

    const invoiceNumber = await Counter.getNextInvoiceNumber();

    // Zero-total purchase: create transaction first, then redeem coupon and activate subscription
    if (pricing.totalPaise === 0) {
      const transaction = await Transaction.create({
        userId: user._id,
        planId: plan._id,
        invoiceNumber,
        planSnapshot,
        couponSnapshot,
        totalAmountPaise: 0,
        amountPaidPaise: 0,
        remainingBalancePaise: 0,
        paymentStatus: "COMPLETED",
        paymentDate: now,
        payments: [],
      });

      if (coupon) {
        try {
          await redeemCouponAtomically(coupon.code, now);
        } catch (err) {
          console.error("Failed to redeem coupon after zero-total subscription creation:", err);
        }
      }

      const startDate = now;
      const endDate = addMonths(startDate, plan.durationMonths);

      user.subscription = {
        transactionId: transaction._id,
        planId: plan._id,
        startDate,
        endDate,
        balanceDuePaise: 0,
      };
      await user.save();

      return apiSuccess(
        {
          transactionId: transaction._id.toString(),
          invoiceNumber: transaction.invoiceNumber,
          paymentStatus: transaction.paymentStatus,
          totalAmountPaise: 0,
          amountPaidPaise: 0,
          remainingBalancePaise: 0,
          allowPartialPayment: plan.allowPartialPayment,
          minimumUpfrontPaise: 0,
          subscriptionActivated: true,
        },
        201
      );
    }

    // Paid purchase: transaction stays PENDING until initial payment
    const transaction = await Transaction.create({
      userId: user._id,
      planId: plan._id,
      invoiceNumber,
      planSnapshot,
      couponSnapshot,
      totalAmountPaise: pricing.totalPaise,
      amountPaidPaise: 0,
      remainingBalancePaise: pricing.totalPaise,
      paymentStatus: "PENDING",
      payments: [],
    });

    return apiSuccess(
      {
        transactionId: transaction._id.toString(),
        invoiceNumber: transaction.invoiceNumber,
        paymentStatus: transaction.paymentStatus,
        totalAmountPaise: pricing.totalPaise,
        amountPaidPaise: 0,
        remainingBalancePaise: pricing.totalPaise,
        allowPartialPayment: plan.allowPartialPayment,
        minimumUpfrontPaise: pricing.minimumUpfrontPaise,
        subscriptionActivated: false,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}