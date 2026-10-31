"use client";

import * as React from "react";
import Link from "next/link";
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
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-foreground">
          Admin console error
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          An error occurred while loading platform metrics or records.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button
          onClick={() => reset()}
          variant="outline"
          size="sm"
          className="font-mono text-xs"
        >
          Retry operation
        </Button>
        <Link href="/admin/dashboard">
          <Button size="sm" className="font-mono text-xs">
            Admin overview
          </Button>
        </Link>
      </div>
    </div>
  );
}
