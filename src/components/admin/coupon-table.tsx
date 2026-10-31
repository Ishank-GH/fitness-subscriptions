"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit2,
  Archive,
  RefreshCw,
  Tag,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { formatPaiseToRupees, formatDate } from "@/lib/format";
import {
  CouponDialog,
  SerializedAdminCoupon,
} from "@/components/admin/coupon-dialog";

export function CouponTable({
  coupons,
}: {
  coupons: SerializedAdminCoupon[];
}) {
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

      if (res.ok) {
        router.refresh();
      }
    } finally {
      setActionLoadingId(null);
    }
  }

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Coupons ({coupons.length})
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Active and archived discount codes and limits.
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm" className="gap-2 font-medium shrink-0">
          <Plus className="h-4 w-4" />
          Add coupon
        </Button>
      </div>

      {coupons.length === 0 ? (
        <EmptyState
          title="No coupons found"
          description="Create your first discount coupon for member checkouts."
          action={{
            label: "Add coupon",
            onClick: handleOpenCreate,
          }}
        />
      ) : (
        <div className="rounded border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-mono text-[11px] text-left">
                  <th className="py-3 px-4">Coupon code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Uses</th>
                  <th className="py-3 px-4">Validity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {coupons.map((c) => {
                  const isExpired = new Date(c.validUntil) <= now;
                  const isMaxedOut = c.maxRedemptions !== null && c.currentRedemptions >= c.maxRedemptions;
                  const isLoading = actionLoadingId === c.id;

                  return (
                    <tr
                      key={c.id}
                      className={c.isActive && !isExpired && !isMaxedOut ? "hover:bg-muted/20 transition-colors" : "opacity-60 bg-muted/10"}
                    >
                      <td className="py-3.5 px-4 font-bold text-foreground text-sm flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{c.code}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {c.type === "PERCENTAGE" ? (
                          <span className="text-emerald-400">{c.percentage}% OFF</span>
                        ) : (
                          <span className="text-emerald-400">{formatPaiseToRupees(c.flatAmountPaise)} OFF</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        <span className="text-foreground font-medium">{c.currentRedemptions}</span>
                        <span> / </span>
                        <span>{c.maxRedemptions !== null ? c.maxRedemptions : "Unlimited"}</span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        <span>{formatDate(c.validFrom)}</span>
                        <span> → </span>
                        <span className={isExpired ? "text-destructive font-medium" : "text-foreground font-medium"}>
                          {formatDate(c.validUntil)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {!c.isActive ? (
                          <Badge variant="outline" className="border-muted text-muted-foreground text-[10px]">
                            Archived
                          </Badge>
                        ) : isExpired ? (
                          <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive text-[10px] gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            Expired
                          </Badge>
                        ) : isMaxedOut ? (
                          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400 text-[10px] gap-1">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Exhausted
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[10px] gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Active
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(c)}
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isLoading}
                            onClick={() => handleToggleStatus(c)}
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                            title={c.isActive ? "Archive coupon" : "Restore coupon"}
                          >
                            {isLoading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : c.isActive ? (
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

      <CouponDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        couponToEdit={editingCoupon}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}