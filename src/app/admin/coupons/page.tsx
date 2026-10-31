import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { Coupon } from "@/lib/db/models/coupon";
import { CouponTable } from "@/components/admin/coupon-table";
import { SerializedAdminCoupon } from "@/components/admin/coupon-dialog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Coupons | Ironvale Admin",
  description: "Create, inspect, and manage promotional discount codes and redemption caps.",
};

export default async function AdminCouponsPage() {
  await requireAdmin();
  await connectToDatabase();

  const rawCoupons = await Coupon.find().sort({ createdAt: -1 }).lean();

  const coupons: SerializedAdminCoupon[] = rawCoupons.map((c) => ({
    id: c._id.toString(),
    code: c.code,
    type: c.type,
    flatAmountPaise: c.flatAmountPaise,
    percentage: c.percentage,
    maxRedemptions: c.maxRedemptions,
    currentRedemptions: c.currentRedemptions,
    validFrom: c.validFrom.toISOString(),
    validUntil: c.validUntil.toISOString(),
    isActive: c.isActive,
  }));

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Coupons
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage discount codes, redemption limits, and expiration dates.
        </p>
      </div>

      <CouponTable coupons={coupons} />
    </div>
  );
}