"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { formatPaiseToRupees, formatDurationMonths } from "@/lib/format";
import { PlanDialog, SerializedAdminPlan } from "@/components/admin/plan-dialog";

export function PlanTable({ plans }: { plans: SerializedAdminPlan[] }) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingPlan, setEditingPlan] = React.useState<SerializedAdminPlan | null>(null);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  function handleOpenCreate() {
    setEditingPlan(null);
    setIsDialogOpen(true);
  }

  function handleOpenEdit(plan: SerializedAdminPlan) {
    setEditingPlan(plan);
    setIsDialogOpen(true);
  }

  async function handleToggleStatus(plan: SerializedAdminPlan) {
    setActionLoadingId(plan.id);
    try {
      const res = await fetch(`/api/plans/${plan.id}`, {
        method: plan.isActive ? "DELETE" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: plan.isActive ? undefined : JSON.stringify({ isActive: true }),
      });
      if (res.ok) router.refresh();
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-display text-foreground">Plans ({plans.length})</h2>
          <p className="text-sm text-muted-foreground">Active and archived membership plans.</p>
        </div>
        <Button onClick={handleOpenCreate} size="sm" className="font-mono text-xs">
          New plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          title="No plans found"
          description="Create your first training plan."
          action={{ label: "Add plan", onClick: handleOpenCreate }}
        />
      ) : (
        <div className="rounded-sm border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-background/50 text-muted-foreground font-mono text-xs">
                  <th className="py-3 px-5 font-normal">Plan name</th>
                  <th className="py-3 px-5 font-normal">Duration</th>
                  <th className="py-3 px-5 font-normal">Base rate</th>
                  <th className="py-3 px-5 font-normal">Discount</th>
                  <th className="py-3 px-5 font-normal">Net price</th>
                  <th className="py-3 px-5 font-normal">Installments</th>
                  <th className="py-3 px-5 font-normal">Status</th>
                  <th className="py-3 px-5 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-xs">
                {plans.map((p) => {
                  const gross = p.durationMonths * p.baseMonthlyPricePaise;
                  const discount = Math.floor((gross * p.discountPercentage) / 100);
                  const net = gross - discount;
                  const isLoading = actionLoadingId === p.id;

                  return (
                    <tr key={p.id} className={p.isActive ? "hover:bg-background/50" : "opacity-50"}>
                      <td className="py-3.5 px-5 font-sans font-medium text-foreground">{p.name}</td>
                      <td className="py-3.5 px-5 text-muted-foreground">{formatDurationMonths(p.durationMonths)}</td>
                      <td className="py-3.5 px-5 text-foreground tabular-nums">{formatPaiseToRupees(p.baseMonthlyPricePaise)}</td>
                      <td className="py-3.5 px-5 text-foreground">{p.discountPercentage > 0 ? `${p.discountPercentage}%` : "—"}</td>
                      <td className="py-3.5 px-5 font-bold text-foreground tabular-nums">{formatPaiseToRupees(net)}</td>
                      <td className="py-3.5 px-5 text-muted-foreground">{p.allowPartialPayment ? "50% Split" : "Full"}</td>
                      <td className="py-3.5 px-5 text-foreground">{p.isActive ? "Active" : "Archived"}</td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => handleOpenEdit(p)} className="text-muted-foreground hover:text-foreground">Edit</button>
                          <button disabled={isLoading} onClick={() => handleToggleStatus(p)} className="text-muted-foreground hover:text-foreground">
                            {isLoading ? "..." : p.isActive ? "Archive" : "Restore"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PlanDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        planToEdit={editingPlan}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}