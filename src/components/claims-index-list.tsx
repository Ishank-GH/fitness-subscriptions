"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface Claim {
  number: string;
  title: string;
  description: string;
}

const CLAIMS: Claim[] = [
  {
    number: "01",
    title: "Competition equipment",
    description:
      "Calibrated steel competition plates, standard 20kg and 15kg barbells, machined dumbbells up to 60kg, and band-pegged power cages. Kept chalked and maintained daily.",
  },
  {
    number: "02",
    title: "Pay in two parts",
    description:
      "Pay 50% upfront to activate your training pass on multi-month commitments. Settle the remaining balance anytime before your plan concludes.",
  },
  {
    number: "03",
    title: "Clear billing",
    description:
      "No auto-renewal traps, hidden initiation charges, or cancellation hurdles. Transparent invoice receipts with line-item breakdowns on every payment.",
  },
];

export function ClaimsIndexList() {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [isTouch, setIsTouch] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener("change", handler);
    
    // Defer initial state update to avoid synchronous cascading renders
    const raf = requestAnimationFrame(() => setIsTouch(mq.matches));

    return () => {
      cancelAnimationFrame(raf);
      mq.removeEventListener("change", handler);
    };
  }, []);

  return (
    <div className="w-full divide-y divide-border border-y border-border">
      {CLAIMS.map((claim, idx) => {
        const isOpen = isTouch || hoveredIndex === idx;
        const isDimmed = !isTouch && hoveredIndex !== null && hoveredIndex !== idx;

        return (
          <div
            key={claim.number}
            tabIndex={0}
            onMouseEnter={() => !isTouch && setHoveredIndex(idx)}
            onMouseLeave={() => !isTouch && setHoveredIndex(null)}
            onFocus={() => !isTouch && setHoveredIndex(idx)}
            onBlur={() => !isTouch && setHoveredIndex(null)}
            className={cn(
              "group py-8 sm:py-10 transition-opacity duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none focus-visible:bg-card/50",
              isDimmed ? "opacity-40" : "opacity-100"
            )}
          >
            {/* Row Number & Title */}
            <div
              className={cn(
                "flex items-baseline gap-4 sm:gap-8 transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none",
                !isTouch && hoveredIndex === idx && "translate-x-4"
              )}
            >
              <span className="font-mono text-xs sm:text-sm text-muted-foreground tabular-nums select-none">
                {claim.number}
              </span>
              <h3 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-foreground tracking-tight">
                {claim.title}
              </h3>
            </div>

            {/* Collapsible description via grid-template-rows: 0fr -> 1fr (400ms) */}
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <p
                  className={cn(
                    "text-sm sm:text-base text-muted-foreground leading-relaxed pt-3 sm:pt-4 max-w-2xl pl-8 sm:pl-12 transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none",
                    !isTouch && hoveredIndex === idx && "translate-x-4"
                  )}
                >
                  {claim.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}