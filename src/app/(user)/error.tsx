"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UserPortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[Athlete Portal Error]", error);
  }, [error]);

  return (
    <div className="container mx-auto max-w-xl px-4 py-16 sm:py-24 text-center space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-foreground">
          Member portal error
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We were unable to load your membership profile or billing records.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button
          onClick={() => reset()}
          variant="outline"
          size="sm"
          className="font-mono text-xs"
        >
          Retry
        </Button>
        <Link href="/plans">
          <Button size="sm" className="font-mono text-xs">
            View plans
          </Button>
        </Link>
      </div>
    </div>
  );
}
