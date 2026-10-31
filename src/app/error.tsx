"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
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
      <div className="h-14 w-14 rounded-full bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center">
        <AlertTriangle className="h-7 w-7" />
      </div>

      <div className="space-y-2 max-w-md">
        <span className="text-xs font-mono uppercase tracking-widest text-destructive font-semibold">
          System Notice
        </span>
        <h1 className="text-2xl sm:text-3xl font-black uppercase font-display tracking-tight text-foreground">
          Application Error
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          An unexpected system issue prevented this section from rendering properly. Please try reloading or return to the platform homepage.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={() => reset()} size="sm" className="gap-2">
          <RotateCcw className="h-3.5 w-3.5" />
          Try Again
        </Button>
        <Link href="/">
          <Button variant="outline" size="sm" className="gap-2">
            <Home className="h-3.5 w-3.5" />
            Home
          </Button>
        </Link>
      </div>
    </div>
  );
}