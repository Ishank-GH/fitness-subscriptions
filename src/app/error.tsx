"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[Application Error]", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-6">
      <div className="space-y-2 max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
          Application error
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          An unexpected issue prevented this page from loading. Please try
          reloading or return to the homepage.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={() => reset()}
          variant="outline"
          size="sm"
          className="font-mono text-xs"
        >
          Try again
        </Button>
        <Link href="/">
          <Button size="sm" className="font-mono text-xs">
            Return home
          </Button>
        </Link>
      </div>
    </div>
  );
}
