import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/hero-section";
import { PlanCard, PlanItem } from "@/components/plan-card";

const SAMPLE_PLANS: PlanItem[] = [
  {
    id: "plan-1m",
    name: "1-Month Foundation",
    durationMonths: 1,
    baseMonthlyPricePaise: 450000,
    discountPercentage: 0,
    allowPartialPayment: false,
    features: [
      "Full facility access (05:30 – 22:00)",
      "Competition barbells and bumper plates",
      "Locker room and cold plunge access",
      "No initiation fees",
    ],
  },
  {
    id: "plan-3m",
    name: "3-Month Progression",
    durationMonths: 3,
    baseMonthlyPricePaise: 400000,
    discountPercentage: 10,
    allowPartialPayment: true,
    isPopular: true,
    features: [
      "All 1-Month Foundation benefits",
      "10% commitment discount",
      "Partial payment: 50% upfront, rest before plan ends",
      "Bi-weekly coach check-in and technique review",
      "Priority platform reservation",
    ],
  },
  {
    id: "plan-12m",
    name: "12-Month Athlete",
    durationMonths: 12,
    baseMonthlyPricePaise: 350000,
    discountPercentage: 20,
    allowPartialPayment: true,
    features: [
      "All 3-Month Progression benefits",
      "20% annual athlete discount",
      "Partial payment: 50% upfront, rest before plan ends",
      "Complimentary locker and kit storage",
      "Free guest passes (2 per month)",
    ],
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col bg-background">
      {/* 1. Hero: kinetic headline and lift strip */}
      <HeroSection />

      {/* 2. Facility Pillars */}
      <section className="border-b border-border py-16 md:py-24 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground font-display">
              Built for calibrated strength
            </h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              We stripped away commercial gym friction to build the cleanest barbell facility in the city.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-sm border border-border bg-card p-6 space-y-3">
              <h3 className="text-lg font-bold text-foreground font-display">
                Competition equipment
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Standard 20kg and 15kg bars, calibrated plates, machined dumbbells up to 60kg, and band-pegged power racks.
              </p>
            </div>

            <div className="rounded-sm border border-border bg-card p-6 space-y-3">
              <h3 className="text-lg font-bold text-foreground font-display">
                Flexible payment terms
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Pay in full or opt for 50% upfront on multi-month blocks. Settle the balance before your term ends.
              </p>
            </div>

            <div className="rounded-sm border border-border bg-card p-6 space-y-3">
              <h3 className="text-lg font-bold text-foreground font-display">
                Clear billing records
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                No automatic card debits or cancellation hurdles. Immutable receipts and audit breakdowns on every transaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Plan Preview Section */}
      <section className="border-b border-border py-16 md:py-24 bg-card">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground font-display">
                Training blocks
              </h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Every pass includes unrestricted access to platforms, turf, and recovery zones.
              </p>
            </div>
            <Link href="/plans">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-mono">
                Compare plans
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SAMPLE_PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} ctaText="Join plan" ctaHref="/plans" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}