import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Facility | Ironvale",
  description:
    "Calibrated equipment, operating hours, and membership terms at Ironvale.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      <section className="border-b border-border py-16 md:py-20 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground font-display">
            Built for heavy lifting
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
            Ironvale is a dedicated barbell facility where members train with calibrated equipment without commercial gym friction.
          </p>
        </div>
      </section>

      <section className="border-b border-border py-16 bg-card">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-sm border border-border bg-background p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-bold text-foreground font-display">
                Opening hours
              </h2>
              <div className="space-y-2 text-sm text-muted-foreground font-mono">
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span>Monday – Friday</span>
                  <span className="text-foreground font-medium">05:30 – 22:00</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span>Saturday</span>
                  <span className="text-foreground font-medium">06:00 – 21:00</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>Sunday</span>
                  <span className="text-foreground font-medium">07:00 – 20:00</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pt-2">
                Open every day of the year. Peak lifting hours are monitored to avoid overcrowded platforms.
              </p>
            </div>

            <div className="rounded-sm border border-border bg-background p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-bold text-foreground font-display">
                Facility specs
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                8 flush Olympic lifting platforms with hardwood inserts, 12 heavy-duty power cages with safety arms, calibrated steel competition plates, standard 20kg and 15kg bars, specialized barbells, machined dumbbells up to 60kg, a 30m turf sprint lane, conditioning ergometers, cedar sauna, and cold plunge.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Chalk, belts, and bands are stocked for all members.
              </p>
            </div>

            <div className="rounded-sm border border-border bg-background p-6 md:p-8 space-y-4">
              <h2 className="text-xl font-bold text-foreground font-display">
                Membership terms
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Choose a 1-month, 3-month, or 12-month training block. Eligible multi-month plans allow 50% upfront payment, with the remainder settled anytime before your term concludes.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                No initiation charges, no termination penalties, and immutable invoice receipts.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground font-display">
            The floor standard
          </h2>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              Ironvale is built for lifters who respect their training and the space they train in. Re-rack every plate, wipe down equipment after use, and leave platforms clean.
            </p>
            <p>
              We do not permit commercial filming or tripods blocking walkways. When you step onto the floor, the focus is entirely on training.
            </p>
          </div>
          <div className="pt-4">
            <Link href="/plans">
              <Button size="lg" className="gap-2">
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