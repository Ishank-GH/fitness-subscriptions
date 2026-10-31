import { NextRequest } from "next/server";
import { requireApiAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Coupon } from "@/lib/db/models/coupon";
import { updateCouponSchema, objectIdSchema } from "@/lib/validators";
import { apiSuccess, handleApiError, notFound, conflict } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * PUT /api/coupons/[id]
 *
 * Administrative endpoint to modify an existing coupon's terms.
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
    const data = updateCouponSchema.parse(body);

    await connectToDatabase();

    if (data.code) {
      const duplicate = await Coupon.findOne({
        code: data.code,
        _id: { $ne: id },
      });
      if (duplicate) {
        conflict(
          `Another coupon with code "${data.code}" already exists`,
          "DUPLICATE_COUPON_CODE"
        );
      }
    }

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!coupon) {
      notFound("Coupon not found", "COUPON_NOT_FOUND");
    }

    return apiSuccess({
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
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/coupons/[id]
 *
 * Administrative endpoint to soft-delete/deactivate a coupon.
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

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!coupon) {
      notFound("Coupon not found", "COUPON_NOT_FOUND");
    }

    return apiSuccess({
      id: coupon._id.toString(),
      message: `Coupon "${coupon.code}" has been archived successfully`,
      isActive: false,
    });
  } catch (error) {
    return handleApiError(error);
  }
}