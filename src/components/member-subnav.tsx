"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/plans", label: "Plans" },
  { href: "/billing", label: "Billing" },
];

export function MemberSubnav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border bg-background sticky top-16 z-40">
      <div className="container mx-auto flex max-w-7xl items-center px-4 sm:px-6 lg:px-8 py-2.5">
        <nav className="flex items-center gap-4 overflow-x-auto py-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
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