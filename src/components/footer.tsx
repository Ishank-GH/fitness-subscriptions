import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-[#25272B] bg-[#0E0F11] text-[#E8E6E0] text-xs">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Identity & summary */}
          <div className="space-y-2 md:col-span-2">
            <span className="font-display font-extrabold text-base tracking-tight text-[#E8E6E0] block">
              Ironvale
            </span>
            <p className="text-[#8E9094] max-w-sm leading-relaxed">
              Equipped with calibrated competition plates, standard and specialized bars, turf sprint lane, and cold recovery.
            </p>
          </div>

          {/* Operating hours */}
          <div className="space-y-2">
            <span className="font-mono uppercase tracking-wider text-[#E8E6E0] block font-medium">
              Hours
            </span>
            <ul className="space-y-1 font-mono text-[#8E9094]">
              <li className="flex justify-between max-w-[200px]">
                <span>Mon – Fri</span>
                <span className="text-[#E8E6E0]">05:30 – 22:00</span>
              </li>
              <li className="flex justify-between max-w-[200px]">
                <span>Saturday</span>
                <span className="text-[#E8E6E0]">06:00 – 21:00</span>
              </li>
              <li className="flex justify-between max-w-[200px]">
                <span>Sunday</span>
                <span className="text-[#E8E6E0]">07:00 – 20:00</span>
              </li>
            </ul>
          </div>

          {/* Navigation */}
          <div className="space-y-2">
            <span className="font-mono uppercase tracking-wider text-[#E8E6E0] block font-medium">
              Portal
            </span>
            <ul className="space-y-1.5 text-[#8E9094]">
              <li>
                <Link href="/plans" className="hover:text-[#E8E6E0] transition-colors">
                  Membership plans
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#E8E6E0] transition-colors">
                  Facility
                </Link>
              </li>
              <li>
                <Link href="/billing" className="hover:text-[#E8E6E0] transition-colors">
                  Billing & receipts
                </Link>
              </li>
              <li>
                <Link href="/sign-in" className="hover:text-[#E8E6E0] transition-colors">
                  Member sign in
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#25272B] flex flex-col sm:flex-row items-baseline justify-between gap-4 font-mono text-[11px] text-[#8E9094]">
          <p>© {new Date().getFullYear()} Ironvale. All prices in INR.</p>
          <span>Calibrated competition plates. Flexible installments.</span>
        </div>
      </div>
    </footer>
  );
}