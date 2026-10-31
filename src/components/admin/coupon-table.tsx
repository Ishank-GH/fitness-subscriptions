"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { formatPaiseToRupees, formatDate } from "@/lib/format";
import { CouponDialog, SerializedAdminCoupon } from "@/components/admin/coupon-dialog";

export function CouponTable({ coupons }: { coupons: SerializedAdminCoupon[] }) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingCoupon, setEditingCoupon] = React.useState<SerializedAdminCoupon | null>(null);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  function handleOpenCreate() {
    setEditingCoupon(null);
    setIsDialogOpen(true);
  }

  function handleOpenEdit(coupon: SerializedAdminCoupon) {
    setEditingCoupon(coupon);
    setIsDialogOpen(true);
  }

  async function handleToggleStatus(coupon: SerializedAdminCoupon) {
    setActionLoadingId(coupon.id);
    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: coupon.isActive ? "DELETE" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: coupon.isActive ? undefined : JSON.stringify({ isActive: true }),
      });
      if (res.ok) router.refresh();
    } finally {
      setActionLoadingId(null);
    }
  }

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-display text-foreground">Coupons ({coupons.length})</h2>
          <p className="text-sm text-muted-foreground">Active and archived discount codes.</p>
        </div>
        <Button onClick={handleOpenCreate} size="sm" className="font-mono text-xs">
          New coupon
        </Button>
      </div>

      {coupons.length === 0 ? (
        <EmptyState
          title="No coupons found"
          description="Create your first discount coupon."
          action={{ label: "Add coupon", onClick: handleOpenCreate }}
        />
      ) : (
        <div className="rounded-sm border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-background/50 text-muted-foreground font-mono text-xs">
                  <th className="py-3 px-5 font-normal">Code</th>
                  <th className="py-3 px-5 font-normal">Discount</th>
                  <th className="py-3 px-5 font-normal">Uses</th>
                  <th className="py-3 px-5 font-normal">Validity</th>
                  <th className="py-3 px-5 font-normal">Status</th>
                  <th className="py-3 px-5 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-xs">
                {coupons.map((c) => {
                  const isExpired = new Date(c.validUntil) <= now;
                  const isMaxedOut = c.maxRedemptions !== null && c.currentRedemptions >= c.maxRedemptions;
                  const isLoading = actionLoadingId === c.id;

                  return (
                    <tr key={c.id} className={c.isActive && !isExpired && !isMaxedOut ? "hover:bg-background/50" : "opacity-50"}>
                      <td className="py-3.5 px-5 font-bold text-foreground">{c.code}</td>
                      <td className="py-3.5 px-5 text-foreground tabular-nums">
                        {c.type === "PERCENTAGE" ? `${c.percentage}%` : formatPaiseToRupees(c.flatAmountPaise)}
                      </td>
                      <td className="py-3.5 px-5 text-muted-foreground tabular-nums">
                        {c.currentRedemptions} / {c.maxRedemptions !== null ? c.maxRedemptions : "∞"}
                      </td>
                      <td className="py-3.5 px-5 text-muted-foreground tabular-nums">
                        {formatDate(c.validUntil)}
                      </td>
                      <td className="py-3.5 px-5 text-foreground">
                        {!c.isActive ? "Archived" : isExpired ? "Expired" : isMaxedOut ? "Exhausted" : "Active"}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => handleOpenEdit(c)} className="text-muted-foreground hover:text-foreground">Edit</button>
                          <button disabled={isLoading} onClick={() => handleToggleStatus(c)} className="text-muted-foreground hover:text-foreground">
                            {isLoading ? "..." : c.isActive ? "Archive" : "Restore"}
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

      <CouponDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        couponToEdit={editingCoupon}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}