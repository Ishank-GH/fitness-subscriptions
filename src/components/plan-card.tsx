import Link from "next/link";
import { Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PlanItem {
  id: string;
  name: string;
  durationMonths: number;
  baseMonthlyPricePaise: number;
  discountPercentage: number;
  allowPartialPayment: boolean;
  features: string[];
  isPopular?: boolean;
}

interface PlanCardProps {
  plan: PlanItem;
  ctaText?: string;
  ctaHref?: string;
}

export function PlanCard({ plan, ctaText = "Select plan", ctaHref }: PlanCardProps) {
  const grossTotalPaise = plan.durationMonths * plan.baseMonthlyPricePaise;
  const discountPaise = Math.round((grossTotalPaise * plan.discountPercentage) / 100);
  const finalTotalPaise = Math.max(0, grossTotalPaise - discountPaise);
  const effectiveMonthlyPaise = Math.round(finalTotalPaise / plan.durationMonths);

  const effectiveMonthlyRupees = Math.round(effectiveMonthlyPaise / 100).toLocaleString("en-IN");
  const totalRupees = Math.round(finalTotalPaise / 100).toLocaleString("en-IN");
  const grossRupees = Math.round(grossTotalPaise / 100).toLocaleString("en-IN");

  const destination = ctaHref || `/checkout/${plan.id}`;

  return (
    <Card
      className={cn(
        "relative flex flex-col justify-between transition-all hover:border-muted-foreground/40",
        plan.isPopular && "border-primary shadow-lg shadow-primary/5"
      )}
    >
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="default" className="text-[11px] font-semibold px-3 py-0.5 normal-case tracking-normal">
            Most popular
          </Badge>
        </div>
      )}

      <div>
        <CardHeader className="space-y-3 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
            {plan.discountPercentage > 0 && (
              <Badge variant="accent" className="normal-case tracking-normal text-xs">
                {plan.discountPercentage}% off
              </Badge>
            )}
          </div>
          <CardDescription>
            {plan.durationMonths === 1
              ? "Single month access with no long-term commitment."
              : `${plan.durationMonths}-month training block for progressive strength work.`}
          </CardDescription>

          <div className="pt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-extrabold font-display tracking-tight text-foreground">
                ₹{effectiveMonthlyRupees}
              </span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>

            <div className="text-xs text-muted-foreground mt-1">
              {plan.durationMonths === 1 ? (
                <span>Billed monthly</span>
              ) : (
                <span>
                  ₹{totalRupees} total for {plan.durationMonths} months
                  {plan.discountPercentage > 0 && (
                    <span className="line-through text-muted-foreground/70 ml-1.5">
                      ₹{grossRupees}
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {plan.allowPartialPayment ? (
            <div className="rounded border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
              <span className="font-semibold text-primary block">Partial payment available</span>
              <span className="text-muted-foreground">
                Pay 50% upfront to activate; settle the remaining balance any time before your plan ends.
              </span>
            </div>
          ) : (
            <div className="rounded border border-border/80 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Single upfront payment on checkout.
            </div>
          )}

          <div className="space-y-2 pt-2">
            <span className="text-xs font-semibold text-foreground/80">
              What&apos;s included:
            </span>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground/90">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </div>

      <CardFooter className="pt-4">
        <Link href={destination} className="w-full">
          <Button
            variant={plan.isPopular ? "default" : "outline"}
            className="w-full font-semibold"
          >
            {ctaText}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
