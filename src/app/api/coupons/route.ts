import { NextRequest } from "next/server";
import { requireApiAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Coupon } from "@/lib/db/models/coupon";
import { createCouponSchema } from "@/lib/validators/coupon";
import { apiSuccess, handleApiError, conflict } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * POST /api/coupons
 *
 * Administrative endpoint to create a new promotional discount coupon.
 * Enforces admin authorization, uppercase code uniqueness, and validity boundaries.
 */
export async function POST(req: NextRequest) {
  try {
    await requireApiAdmin();

    const body = await req.json();
    const data = createCouponSchema.parse(body);

    await connectToDatabase();

    const existing = await Coupon.findOne({ code: data.code });
    if (existing) {
      conflict(`Coupon with code "${data.code}" already exists`, "DUPLICATE_COUPON_CODE");
    }

    const coupon = await Coupon.create({
      ...data,
      currentRedemptions: 0,
    });

    return apiSuccess(
      {
        id: coupon._id.toString(),
        code: coupon.code,
        type: coupon.type,
        flatAmountPaise: coupon.flatAmountPaise,
        percentage: coupon.percentage,
        maxRedemptions: coupon.maxRedemptions,
        currentRedemptions: coupon.currentRedemptions,
        validFrom: coupon.validFrom.toISOString(),
        validUntil: coupon.validUntil.toISOString(),
        isActive: coupon.isActive,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}