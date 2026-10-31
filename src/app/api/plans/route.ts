import { NextRequest } from "next/server";
import { requireApiAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { SubscriptionPlan } from "@/lib/db/models/subscription-plan";
import { calculatePricing } from "@/lib/pricing/engine";
import { createPlanSchema } from "@/lib/validators/plan";
import { apiSuccess, handleApiError, conflict } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * Public endpoint to fetch all active subscription plans with
 * pre-calculated pricing breakdowns.
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

/**
 * Administrative endpoint to create a new subscription plan.
 * Enforces admin authorization and unique plan naming.
 */
export async function POST(req: NextRequest) {
  try {
    await requireApiAdmin();

    const body = await req.json();
    const data = createPlanSchema.parse(body);

    await connectToDatabase();

    const existing = await SubscriptionPlan.findOne({ name: data.name });
    if (existing) {
      conflict(`A plan with the name "${data.name}" already exists`, "DUPLICATE_PLAN_NAME");
    }

    const plan = await SubscriptionPlan.create({
      ...data,
      isActive: true,
    });

    return apiSuccess(
      {
        id: plan._id.toString(),
        name: plan.name,
        durationMonths: plan.durationMonths,
        baseMonthlyPricePaise: plan.baseMonthlyPricePaise,
        discountPercentage: plan.discountPercentage,
        allowPartialPayment: plan.allowPartialPayment,
        isActive: plan.isActive,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}