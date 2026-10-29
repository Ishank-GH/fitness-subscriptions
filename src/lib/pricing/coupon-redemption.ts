import { Coupon, ICoupon } from "@/lib/db/models/coupon";
import { badRequest } from "@/lib/errors";

/**
 * Atomically increments the redemption count for a coupon if it is still active,
 * valid, and below its maximum redemption cap.
 *
 * This operation is executed when the first payment succeeds (or on immediate
 * zero-total completion), NOT when a pending transaction is created.
 */
export async function redeemCouponAtomically(
  couponCode: string,
  now: Date = new Date()
): Promise<ICoupon> {
  const normalizedCode = couponCode.trim().toUpperCase();

  const coupon = await Coupon.findOneAndUpdate(
    {
      code: normalizedCode,
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gt: now },
      $or: [
        { maxRedemptions: null },
        { $expr: { $lt: ["$currentRedemptions", "$maxRedemptions"] } },
      ],
    },
    {
      $inc: { currentRedemptions: 1 },
    },
    { new: true }
  );

  if (!coupon) {
    badRequest(
      "Coupon is invalid, expired, or has reached its maximum redemptions",
      "COUPON_REDEEM_FAILED"
    );
  }

  return coupon;
}

