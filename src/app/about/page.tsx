import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "About & Facility | Ironvale Strength & Conditioning",
  description:
    "Learn about our mission, equipment, operating hours, and how memberships work at Ironvale.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="border-b border-border py-16 md:py-20 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-primary">
            Mission & facility
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Built for real strength
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
            Ironvale was founded on a simple premise: a dedicated strength club where athletes, lifters, and anyone serious about their training can train with calibrated equipment without commercial gym friction.
          </p>
        </div>
      </section>

      {/* Main Content Sections */}
      <section className="border-b border-border py-16 bg-card/30">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Opening hours */}
            <div className="rounded border border-border bg-card p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-bold text-foreground">
                Opening hours
              </h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span>Monday – Friday</span>
                  <span className="font-mono text-foreground font-medium">5:30 AM – 10:00 PM</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span>Saturday</span>
                  <span className="font-mono text-foreground font-medium">6:00 AM – 9:00 PM</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>Sunday</span>
                  <span className="font-mono text-foreground font-medium">7:00 AM – 8:00 PM</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pt-2">
                Open every day of the year. Peak lifting hours are monitored to avoid overcrowded platforms.
              </p>
            </div>

            {/* What is in the facility */}
            <div className="rounded border border-border bg-card p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-bold text-foreground">
                What is in the facility
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                8 flush Olympic lifting platforms with hardwood inserts, 12 heavy-duty power cages with safety arms, calibrated steel competition plates, standard 20kg and 15kg bars, specialized barbells, machined dumbbells up to 60kg, a 30m turf sprint lane, conditioning ergometers, Finnish dry cedar sauna, and cold plunge.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Chalk, lifting belts, and resistance bands are fully stocked and available for all members.
              </p>
            </div>

            {/* How membership works */}
            <div className="rounded border border-border bg-card p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-bold text-foreground">
                How membership works
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Choose a 1-month, 3-month, or 12-month training block. You can pay in full or take advantage of partial payments on eligible plans: pay 50% upfront to activate your pass, then settle the rest any time before your plan ends.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                No sign-up fees, no automatic termination penalties, and full access to invoice receipts from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Facility Etiquette & Values */}
      <section className="border-b border-border py-16 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            The Ironvale standard
          </h2>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              We believe great gyms are defined by their atmosphere. Ironvale is built for people who respect their training and the space they train in. That means re-racking every plate, wiping down equipment after use, and treating other lifters with respect.
            </p>
            <p>
              We do not permit commercial video shoots or tripods blocking aisles. When you step onto our floor, the focus is entirely on your workout.
            </p>
          </div>
          <div className="pt-4">
            <Link href="/plans">
              <Button size="lg" className="gap-2 font-semibold">
                View membership options
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
