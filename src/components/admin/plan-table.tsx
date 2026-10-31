"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit2,
  Archive,
  RefreshCw,
  CheckCircle2,
  Clock,
  Loader2,
  Dumbbell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPaiseToRupees, formatDurationMonths } from "@/lib/format";
import { PlanDialog, SerializedAdminPlan } from "@/components/admin/plan-dialog";

export function PlanTable({
  plans,
}: {
  plans: SerializedAdminPlan[];
}) {
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

      if (res.ok) {
        router.refresh();
      }
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display uppercase tracking-tight text-foreground">
            Current Tier Catalog ({plans.length})
          </h2>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Active and archived memberships configured in the database.
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm" className="gap-2 font-semibold shrink-0">
          <Plus className="h-4 w-4" />
          Add Membership Plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <div className="rounded border border-border bg-card p-12 text-center space-y-4">
          <div className="h-10 w-10 rounded bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Dumbbell className="h-5 w-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            No subscription tiers found in the catalog.
          </p>
          <Button onClick={handleOpenCreate} size="sm" variant="outline">
            Create First Plan
          </Button>
        </div>
      ) : (
        <div className="rounded border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-mono uppercase text-[11px] text-left">
                  <th className="py-3 px-4">Plan Name</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Base Rate</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Net Price</th>
                  <th className="py-3 px-4">Installments</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {plans.map((p) => {
                  const gross = p.durationMonths * p.baseMonthlyPricePaise;
                  const discount = Math.floor((gross * p.discountPercentage) / 100);
                  const net = gross - discount;
                  const isLoading = actionLoadingId === p.id;

                  return (
                    <tr
                      key={p.id}
                      className={p.isActive ? "hover:bg-muted/20 transition-colors" : "opacity-60 bg-muted/10"}
                    >
                      <td className="py-3.5 px-4 font-sans font-semibold text-foreground text-sm">
                        {p.name}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {formatDurationMonths(p.durationMonths)}
                      </td>
                      <td className="py-3.5 px-4 text-foreground">
                        {formatPaiseToRupees(p.baseMonthlyPricePaise)} / mo
                      </td>
                      <td className="py-3.5 px-4">
                        {p.discountPercentage > 0 ? (
                          <span className="text-emerald-400 font-semibold">
                            {p.discountPercentage}% OFF
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {formatPaiseToRupees(net)}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.allowPartialPayment ? (
                          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400 text-[10px] gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            50% Split
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">
                            Full only
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.isActive ? (
                          <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[10px] gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-muted text-muted-foreground text-[10px]">
                            Archived
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(p)}
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isLoading}
                            onClick={() => handleToggleStatus(p)}
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                            title={p.isActive ? "Archive Plan" : "Restore Plan"}
                          >
                            {isLoading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : p.isActive ? (
                              <Archive className="h-3.5 w-3.5" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                          </Button>
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