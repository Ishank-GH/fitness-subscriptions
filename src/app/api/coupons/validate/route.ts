import { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { SubscriptionPlan } from "@/lib/db/models/subscription-plan";
import { Coupon } from "@/lib/db/models/coupon";
import { calculatePricing, validateCoupon } from "@/lib/pricing/engine";
import { validateCouponSchema } from "@/lib/validators/coupon";
import { apiSuccess, handleApiError, notFound } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * Validates a coupon code against an active plan and returns a pricing preview.
 * This endpoint is read-only and performs zero state mutations or redemptions.
 */
export async function POST(req: NextRequest) {
  try {
    await requireApiUser();

    const body = await req.json();
    const { code, planId } = validateCouponSchema.parse(body);

    await connectToDatabase();

    const plan = await SubscriptionPlan.findById(planId).lean();
    if (!plan || !plan.isActive) {
      notFound("Subscription plan not found or is no longer active", "PLAN_NOT_FOUND");
    }

    const coupon = await Coupon.findOne({ code }).lean();
    if (!coupon) {
      notFound("Coupon code not found", "COUPON_NOT_FOUND");
    }

    const now = new Date();
    validateCoupon(coupon, now, coupon.currentRedemptions);

    const pricing = calculatePricing({
      plan: {
        baseMonthlyPricePaise: plan.baseMonthlyPricePaise,
        durationMonths: plan.durationMonths,
        discountPercentage: plan.discountPercentage,
        allowPartialPayment: plan.allowPartialPayment,
      },
      coupon: {
        type: coupon.type,
        flatAmountPaise: coupon.flatAmountPaise,
        percentage: coupon.percentage,
      },
    });

    return apiSuccess({
      coupon: {
        code: coupon.code,
        type: coupon.type,
        flatAmountPaise: coupon.flatAmountPaise,
        percentage: coupon.percentage,
      },
      pricing: {
        grossPaise: pricing.grossPaise,
        commitmentDiscountPaise: pricing.commitmentDiscountPaise,
        couponDiscountPaise: pricing.couponDiscountPaise,
        totalPaise: pricing.totalPaise,
        effectiveMonthlyPaise: pricing.effectiveMonthlyPaise,
        allowPartialPayment: pricing.allowPartialPayment,
        minimumUpfrontPaise: pricing.minimumUpfrontPaise,
        remainderPaise: pricing.remainderPaise,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}