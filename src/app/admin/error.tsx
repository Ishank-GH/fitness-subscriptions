"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldAlert, RotateCcw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[Administrative Portal Error]", error);
  }, [error]);

  return (
    <div className="container mx-auto max-w-xl px-4 py-16 sm:py-24 text-center space-y-6">
      <div className="h-12 w-12 rounded-full bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mx-auto">
        <ShieldAlert className="h-6 w-6" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-black uppercase font-display tracking-tight text-foreground">
          Administrative Console Error
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          An error occurred while loading platform metrics or administrative records. Verify database availability and try again.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button onClick={() => reset()} size="sm" className="gap-2">
          <RotateCcw className="h-3.5 w-3.5" />
          Retry Operation
        </Button>
        <Link href="/admin/dashboard">
          <Button variant="outline" size="sm" className="gap-2">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Admin Overview
          </Button>
        </Link>
      </div>
    </div>
  );
}