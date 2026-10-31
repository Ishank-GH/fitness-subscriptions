import { requireAdmin } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connection";
import { SubscriptionPlan } from "@/lib/db/models/subscription-plan";
import { PlanTable } from "@/components/admin/plan-table";
import { SerializedAdminPlan } from "@/components/admin/plan-dialog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Subscription Plans Manager | Ironvale Admin",
  description: "Create, modify, and archive membership plans and installment policies.",
};

export default async function AdminPlansPage() {
  await requireAdmin();
  await connectToDatabase();

  const rawPlans = await SubscriptionPlan.find()
    .sort({ durationMonths: 1, createdAt: -1 })
    .lean();

  const plans: SerializedAdminPlan[] = rawPlans.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    durationMonths: p.durationMonths,
    baseMonthlyPricePaise: p.baseMonthlyPricePaise,
    discountPercentage: p.discountPercentage,
    allowPartialPayment: p.allowPartialPayment,
    isActive: p.isActive,
  }));

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="border-b border-border pb-6">
        <span className="text-xs uppercase font-mono tracking-widest text-primary font-semibold">
          Membership Administration
        </span>
        <h1 className="text-2xl sm:text-3xl font-black uppercase font-display tracking-tight text-foreground mt-1">
          Subscription Plans Manager
        </h1>
        <p className="text-xs text-muted-foreground font-mono mt-1">
          Configure gym access blocks, commitment discount percentages, and 50% partial payment eligibility.
        </p>
      </div>

      <PlanTable plans={plans} />
    </div>
  );
}