import { NextRequest } from "next/server";
import { requireApiAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { SubscriptionPlan } from "@/lib/db/models/subscription-plan";
import { updatePlanSchema, objectIdSchema } from "@/lib/validators";
import { apiSuccess, handleApiError, notFound, conflict } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * Administrative endpoint to update an existing plan's parameters.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    objectIdSchema.parse(id);

    const body = await req.json();
    const data = updatePlanSchema.parse(body);

    await connectToDatabase();

    if (data.name) {
      const duplicate = await SubscriptionPlan.findOne({
        name: data.name,
        _id: { $ne: id },
      });
      if (duplicate) {
        conflict(
          `Another plan with name "${data.name}" already exists`,
          "DUPLICATE_PLAN_NAME"
        );
      }
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!plan) {
      notFound("Subscription plan not found", "PLAN_NOT_FOUND");
    }

    return apiSuccess({
      id: plan._id.toString(),
      name: plan.name,
      durationMonths: plan.durationMonths,
      baseMonthlyPricePaise: plan.baseMonthlyPricePaise,
      discountPercentage: plan.discountPercentage,
      allowPartialPayment: plan.allowPartialPayment,
      isActive: plan.isActive,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Administrative endpoint to soft-delete a plan by marking it inactive.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiAdmin();
    const { id } = await params;
    objectIdSchema.parse(id);

    await connectToDatabase();

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!plan) {
      notFound("Subscription plan not found", "PLAN_NOT_FOUND");
    }

    return apiSuccess({
      id: plan._id.toString(),
      message: `Plan "${plan.name}" has been archived successfully`,
      isActive: false,
    });
  } catch (error) {
    return handleApiError(error);
  }
}