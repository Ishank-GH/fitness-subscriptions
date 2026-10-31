import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Facility & equipment | Ironvale",
  description:
    "Operating hours, calibrated competition equipment, and membership terms at Ironvale.",
};

const SCHEDULE = [
  { days: "Monday – Friday", hours: "05:30 – 22:00" },
  { days: "Saturday", hours: "06:00 – 21:00" },
  { days: "Sunday", hours: "07:00 – 20:00" },
];

const INVENTORY = [
  {
    category: "Platforms",
    spec: "8 flush Olympic lifting platforms with hardwood inserts and competition collars.",
  },
  {
    category: "Racks",
    spec: "12 heavy-duty power cages with pin safeties, pull-up stations, and band pegs.",
  },
  {
    category: "Bars",
    spec: "Standard 20kg and 15kg competition barbells, safety squat bars, and trap bars.",
  },
  {
    category: "Plates",
    spec: "Calibrated steel competition plates and heavy-duty competition bumper sets.",
  },
  {
    category: "Dumbbells",
    spec: "Machined urethane dumbbells from 2.5kg to 60kg in 2.5kg increments.",
  },
  {
    category: "Turf & conditioning",
    spec: "30m turf sprint lane, sleds, rowing ergometers, SkiErgs, and air bikes.",
  },
  {
    category: "Recovery",
    spec: "Traditional cedar dry sauna and cold plunge bath kept between 5°C and 8°C.",
  },
];

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-16 sm:space-y-24 bg-background">
      {/* Page Header */}
      <div className="space-y-4 max-w-3xl">
        <Link
          href="/"
          className="font-mono text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Home
        </Link>
        <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl tracking-tight text-foreground">
          The facility
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          Ironvale was built on a simple premise: a dedicated strength space where lifters can train with calibrated equipment without commercial gym friction.
        </p>
      </div>

      {/* Section 1: Operating Hours */}
      <section className="border-t border-border pt-12 sm:pt-16 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-4 space-y-2">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-foreground">
            Operating hours
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Open every day of the year. Platform capacity is monitored during peak hours to ensure open lifting space.
          </p>
        </div>

        <div className="md:col-span-8 space-y-4">
          <div className="rounded-sm border border-border bg-card divide-y divide-border font-mono text-xs sm:text-sm">
            {SCHEDULE.map((s) => (
              <div
                key={s.days}
                className="flex items-center justify-between p-4 sm:px-6"
              >
                <span className="text-muted-foreground">{s.days}</span>
                <span className="text-foreground font-semibold tabular-nums">
                  {s.hours}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs font-mono text-muted-foreground">
            Digital access keys function throughout all open hours. Coaching staff on site from 06:00.
          </p>
        </div>
      </section>

      {/* Section 2: What Is on the Floor */}
      <section className="border-t border-border pt-12 sm:pt-16 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-4 space-y-2">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-foreground">
            What is on the floor
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Calibrated competition equipment maintained daily. Chalk, leather lifting belts, and bands are stocked for all members.
          </p>
        </div>

        <div className="md:col-span-8">
          <div className="rounded-sm border border-border bg-card divide-y divide-border text-xs sm:text-sm">
            {INVENTORY.map((item) => (
              <div
                key={item.category}
                className="grid grid-cols-1 sm:grid-cols-12 p-4 sm:px-6 gap-2 sm:gap-4 items-baseline"
              >
                <span className="sm:col-span-4 font-mono font-semibold text-foreground">
                  {item.category}
                </span>
                <span className="sm:col-span-8 text-muted-foreground leading-relaxed">
                  {item.spec}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: How Membership Works */}
      <section className="border-t border-border pt-12 sm:pt-16 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-4 space-y-2">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-foreground">
            How membership works
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Simple training blocks with zero sign-up fees, lock-in contracts, or cancellation fees.
          </p>
        </div>

        <div className="md:col-span-8 space-y-6 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <div className="rounded-sm border border-border bg-card p-6 sm:p-8 space-y-4">
            <h3 className="font-display font-bold text-lg sm:text-xl text-foreground">
              Training commitments & installment terms
            </h3>
            <p>
              Choose a 1-month, 3-month, or 12-month training block. Every pass grants complete access to platforms, power racks, conditioning turf, sauna, and cold plunge.
            </p>
            <p>
              On eligible multi-month commitments, you can pay 50% upfront to activate your facility pass immediately. The remaining balance can be settled at your convenience from your account anytime before your training block ends.
            </p>
            <p>
              We do not run recurring auto-charges or hidden renewal fees. Official invoice receipts for all payments are permanently stored in your account.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: The Floor Standard */}
      <section className="border-t border-border pt-12 sm:pt-16 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-4 space-y-2">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-foreground">
            The floor standard
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            A serious training atmosphere requires shared standards.
          </p>
        </div>

        <div className="md:col-span-8 space-y-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <div className="rounded-sm border border-border bg-card p-6 sm:p-8 space-y-3">
            <p>
              <strong className="text-foreground">Re-rack every plate and dumbbell.</strong> Leave every bar empty and every rack ready for the next lifter.
            </p>
            <p>
              <strong className="text-foreground">Keep chalk on the platforms.</strong> Chalk belongs on hands and bars, not the floors or walkways. Wipe down benches and bars after heavy training.
            </p>
            <p>
              <strong className="text-foreground">No tripods in aisles.</strong> Commercial video shoots, tripods obstructing walkways, and loud filming are not permitted. When you step onto the floor, the focus is strictly on training.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="border-t border-border pt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs font-mono text-muted-foreground">
          Ready to train? Choose your block online.
        </p>
        <Link href="/plans">
          <Button size="lg" className="w-full sm:w-auto gap-2 text-xs font-mono">
            View membership plans
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}