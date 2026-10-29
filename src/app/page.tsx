import Link from "next/link";
import { ArrowRight, Dumbbell, Calendar, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanCard, PlanItem } from "@/components/plan-card";

// Fallback plan data for marketing display before MongoDB seed is applied.
const SAMPLE_PLANS: PlanItem[] = [
  {
    id: "plan-1m",
    name: "1-Month Foundation",
    durationMonths: 1,
    baseMonthlyPricePaise: 450000, // ₹4,500
    discountPercentage: 0,
    allowPartialPayment: false,
    features: [
      "Full facility access (5:30 AM – 10:00 PM)",
      "Competition barbells and bumper plates",
      "Locker room and cold plunge access",
      "No initiation fees",
    ],
  },
  {
    id: "plan-3m",
    name: "3-Month Progression",
    durationMonths: 3,
    baseMonthlyPricePaise: 400000, // ₹4,000/mo = ₹12,000 gross
    discountPercentage: 10, // ₹10,800 net (effective ₹3,600/mo)
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
    baseMonthlyPricePaise: 350000, // ₹3,500/mo = ₹42,000 gross
    discountPercentage: 20, // ₹33,600 net (effective ₹2,800/mo)
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
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative border-b border-border py-20 md:py-28 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-5xl font-black uppercase tracking-tight text-foreground sm:text-6xl lg:text-7xl font-display leading-[0.95]">
              Heavy Iron. <br />
              <span className="text-primary">Zero Distractions.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Calibrated plates, competition barbells, turf sprint lanes, and coaches who know what they&apos;re doing. Simple memberships with flexible installment options.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link href="/plans">
                <Button size="lg" className="gap-2 font-semibold">
                  View memberships
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="font-semibold">
                  Explore facility
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Facility Highlights Bar */}
      <section className="border-b border-border bg-card/60 py-6">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-extrabold font-display text-foreground">8</div>
              <div className="text-xs text-muted-foreground">Olympic platforms</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-extrabold font-display text-foreground">12</div>
              <div className="text-xs text-muted-foreground">Power racks</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-extrabold font-display text-foreground">30m</div>
              <div className="text-xs text-muted-foreground">Turf sprint track</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl md:text-3xl font-extrabold font-display text-foreground">7 days</div>
              <div className="text-xs text-muted-foreground">5:30 AM – 10:00 PM</div>
            </div>
          </div>
        </div>
      </section>

      {/* Gym Values / Pillars */}
      <section className="border-b border-border py-16 md:py-24 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider font-mono">
              Facility standard
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Built for those who lift heavy
            </h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              We stripped away the clutter of commercial gyms to build the cleanest, best-equipped barbell club in the city.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded border border-border bg-card p-6 space-y-3">
              <div className="h-10 w-10 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Dumbbell className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Competition equipment
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Standard 20kg and 15kg bars, calibrated competition plates, machined dumbbells up to 60kg, and band-pegged power racks.
              </p>
            </div>

            <div className="rounded border border-border bg-card p-6 space-y-3">
              <div className="h-10 w-10 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Flexible payment options
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Choose full payment or take advantage of partial payments. Pay 50% upfront to activate your pass and settle the rest during your term.
              </p>
            </div>

            <div className="rounded border border-border bg-card p-6 space-y-3">
              <div className="h-10 w-10 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Clear billing and renewals
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No hidden auto-charges or surprise termination fees. Real-time invoice history and 3-day renewal alerts directly in your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Plan Summaries Section */}
      <section className="border-b border-border py-16 md:py-24 bg-card/40">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-3 max-w-2xl">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider font-mono">
                Memberships
              </span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Choose your training block
              </h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                All memberships include unrestricted access to platforms, turf, and recovery zones.
              </p>
            </div>
            <Link href="/plans">
              <Button variant="outline" size="sm" className="gap-1.5 font-semibold">
                Compare all features
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SAMPLE_PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} ctaText="Join this plan" ctaHref="/plans" />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded border border-border bg-card p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Ready to get under the bar?
              </h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-xl">
                Select your block online and visit Ironvale today. Your access starts on your first payment.
              </p>
            </div>
            <Link href="/plans">
              <Button size="lg" className="font-semibold whitespace-nowrap">
                Join Ironvale now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
