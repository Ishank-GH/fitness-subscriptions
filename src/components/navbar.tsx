"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = React.useState(pathname);
  const { isSignedIn } = useAuth();

  // Close mobile drawer when the route changes during rendering
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  const navLinks = [
    { href: "/plans", label: "Plans & Pricing" },
    { href: "/about", label: "About & Facility" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground font-black text-lg tracking-tighter transition-transform group-hover:scale-105 font-display">
            IV
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-foreground text-base uppercase font-display leading-none">
              IRON<span className="text-primary font-normal">VALE</span>
            </span>
            <span className="text-[10px] tracking-widest text-muted-foreground uppercase font-mono mt-0.5">
              Strength & Conditioning
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground",
                  isActive ? "text-foreground font-semibold" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Action (Clerk useAuth) */}
        <div className="hidden md:flex items-center gap-4">
          {isSignedIn ? (
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button size="sm" className="gap-1.5 font-medium">
                  Dashboard
                  <ArrowRight className="h-4 w-4" />
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
            <div className="flex items-center gap-2.5">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="outline" size="sm" className="font-medium">
                  Sign Up
                </Button>
              </Link>
              <Link href="/plans">
                <Button size="sm" className="font-medium">
                  Join Now
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          {isSignedIn && <UserButton />}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="text-muted-foreground hover:text-foreground"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-card px-4 py-6 md:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-base font-medium transition-colors py-2 border-b border-border/50",
                  pathname === link.href ? "text-foreground font-bold" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 flex flex-col gap-3">
              {isSignedIn ? (
                <Link href="/dashboard" className="w-full">
                  <Button className="w-full justify-center gap-2">
                    Member Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" className="w-full">
                    <Button variant="outline" className="w-full justify-center">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up" className="w-full">
                    <Button variant="outline" className="w-full justify-center">
                      Sign Up
                    </Button>
                  </Link>
                  <Link href="/plans" className="w-full">
                    <Button className="w-full justify-center">
                      View Plans
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}