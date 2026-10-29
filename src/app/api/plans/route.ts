import { connectToDatabase } from "@/lib/db/connection";
import { SubscriptionPlan } from "@/lib/db/models/subscription-plan";
import { calculatePricing } from "@/lib/pricing/engine";
import { apiSuccess, handleApiError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/plans
 *
 * Public endpoint to fetch all active subscription plans with
 * pre-calculated pricing breakdowns (effective monthly rates, gross,
 * commitment discounts, and minimum upfront splits).
 */
export async function GET() {
  try {
    await connectToDatabase();

    const plans = await SubscriptionPlan.find({ isActive: true })
      .sort({ durationMonths: 1 })
      .lean();

    const plansWithPricing = plans.map((plan) => {
      const pricing = calculatePricing({
        plan: {
          baseMonthlyPricePaise: plan.baseMonthlyPricePaise,
          durationMonths: plan.durationMonths,
          discountPercentage: plan.discountPercentage,
          allowPartialPayment: plan.allowPartialPayment,
        },
      });

      return {
        id: plan._id.toString(),
        name: plan.name,
        durationMonths: plan.durationMonths,
        baseMonthlyPricePaise: plan.baseMonthlyPricePaise,
        discountPercentage: plan.discountPercentage,
        allowPartialPayment: plan.allowPartialPayment,
        isActive: plan.isActive,
        pricing: {
          grossPaise: pricing.grossPaise,
          commitmentDiscountPaise: pricing.commitmentDiscountPaise,
          totalPaise: pricing.totalPaise,
          effectiveMonthlyPaise: pricing.effectiveMonthlyPaise,
          minimumUpfrontPaise: pricing.minimumUpfrontPaise,
          remainderPaise: pricing.remainderPaise,
        },
      };
    });

    return apiSuccess(plansWithPricing);
  } catch (error) {
    return handleApiError(error);
  }
}

