"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ADMIN_NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/plans", label: "Plans" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/transactions", label: "Payments" },
];

export function AdminSubnav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border bg-background sticky top-16 z-40">
      <div className="container mx-auto flex max-w-7xl items-center px-4 sm:px-6 lg:px-8 py-2.5">
        <nav className="flex items-center gap-4 overflow-x-auto py-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-active={isActive ? "true" : undefined}
                className={cn(
                  "nav-link-underline py-1.5 text-sm transition-colors whitespace-nowrap",
                  isActive
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}