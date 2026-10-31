"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = React.useState(pathname);
  const { isSignedIn } = useAuth();

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  const navLinks = [
    { href: "/plans", label: "Plans" },
    { href: "/about", label: "Facility" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand: "Ironvale" only */}
        <Link href="/" className="flex items-center group">
          <span className="font-display font-extrabold text-xl tracking-tight text-foreground">
            Ironvale
          </span>
        </Link>

        {/* Desktop navigation with directional underline micro-interaction */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                data-active={isActive ? "true" : undefined}
                className={cn(
                  "nav-link-underline text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground rounded-sm",
                  isActive
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground font-normal"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          {isSignedIn ? (
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                  Dashboard
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8 border border-border",
                  },
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="text-xs">
                  Sign in
                </Button>
              </Link>
              <Link href="/plans">
                <Button size="sm" className="text-xs gap-1">
                  Join
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          {isSignedIn && <UserButton />}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
            className="text-foreground"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-card px-4 py-6 md:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                data-active={pathname === link.href ? "true" : undefined}
                className={cn(
                  "nav-link-underline text-sm py-2 border-b border-border/50 transition-colors",
                  pathname === link.href
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-3 flex flex-col gap-2">
              {isSignedIn ? (
                <Link href="/dashboard" className="w-full">
                  <Button className="w-full justify-between text-xs" size="sm" variant="outline">
                    Dashboard
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" className="w-full">
                    <Button variant="outline" className="w-full justify-center text-xs" size="sm">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/plans" className="w-full">
                    <Button className="w-full justify-center text-xs gap-1" size="sm">
                      Join
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}