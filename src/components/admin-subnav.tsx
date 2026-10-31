"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  Tag,
  ReceiptText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_NAV_ITEMS = [
  {
    href: "/admin/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/plans",
    label: "Plans",
    icon: Dumbbell,
  },
  {
    href: "/admin/coupons",
    label: "Coupons",
    icon: Tag,
  },
  {
    href: "/admin/transactions",
    label: "Payments",
    icon: ReceiptText,
  },
];

export function AdminSubnav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-16 z-40">
      <div className="container mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-2.5">
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}