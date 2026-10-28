import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card text-muted-foreground text-sm">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground font-black text-sm font-display">
                IV
              </div>
              <span className="font-extrabold tracking-tight text-foreground text-base uppercase font-display">
                IRON<span className="text-primary font-normal">VALE</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Dedicated barbell, conditioning, and athletic facility. Heavy barbells, calibrated plates, turf lanes, and expert coaching.
            </p>
            <div className="text-xs text-muted-foreground/80 pt-1">
              Open 7 days a week · 5:30 AM – 10:00 PM
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground font-mono">
              Gym
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/plans" className="hover:text-foreground transition-colors">
                  Memberships
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  Facility & Equipment
                </Link>
              </li>
              <li>
                <Link href="/billing" className="hover:text-foreground transition-colors">
                  Billing History
                </Link>
              </li>
            </ul>
          </div>

          {/* Member Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground font-mono">
              Account
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/sign-in" className="hover:text-foreground transition-colors">
                  Member Login
                </Link>
              </li>
              <li>
                <Link href="/plans" className="hover:text-foreground transition-colors">
                  Join Ironvale
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground/80 gap-4">
          <p>© {new Date().getFullYear()} Ironvale Strength & Conditioning. All rights reserved.</p>
          <div className="flex gap-6">
            <span>Flexible payment terms</span>
            <span>No hidden fees</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
