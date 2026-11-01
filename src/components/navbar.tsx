"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const signInClassName =
  "group relative inline-flex h-9 items-center justify-center px-3 text-xs font-medium text-muted-foreground transition-colors duration-200 ease-out hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background active:text-foreground after:absolute after:bottom-1.5 after:left-3 after:right-3 after:h-px after:origin-left after:scale-x-0 after:bg-foreground after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.22,1,0.36,1)] hover:after:scale-x-100 motion-reduce:after:transition-none";

const signUpClassName =
  "group relative isolate inline-flex h-9 items-center justify-center gap-2 overflow-hidden border border-foreground/30 bg-transparent px-3.5 text-xs font-medium text-foreground transition-[color,border-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-px hover:border-foreground hover:text-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:bg-foreground before:transition-transform before:duration-[420ms] before:ease-[cubic-bezier(0.22,1,0.36,1)] hover:before:scale-y-100 motion-reduce:transform-none motion-reduce:transition-none motion-reduce:before:transition-none";

const joinClassName =
  "group inline-flex h-9 items-center justify-center gap-2 px-4 text-xs font-medium transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.14)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 active:shadow-none motion-reduce:transform-none motion-reduce:transition-none";

function AuthActions({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className={cn(mobile ? "grid w-full grid-cols-2 gap-2" : "flex items-center gap-2")}>
      <Link
        href="/sign-in"
        className={cn(signInClassName, mobile && "justify-center border border-border/70")}
      >
        Sign in
      </Link>
      <Link
        href="/sign-up"
        className={cn(signUpClassName, mobile && "w-full")}
      >
        Sign up
        <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center">
          <ArrowUpRight
            aria-hidden="true"
            className="h-3.5 w-3.5 opacity-65 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-[2px] group-hover:translate-x-[2px] group-hover:opacity-100 motion-reduce:transition-none"
          />
        </span>
      </Link>
      <Link href="/plans" className={cn(mobile && "col-span-2 w-full")}>
        <Button size="sm" className={cn(joinClassName, mobile && "w-full")}>
          Join
          <ArrowUpRight
            aria-hidden="true"
            className="h-3.5 w-3.5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-[2px] group-hover:translate-x-[2px] motion-reduce:transition-none"
          />
        </Button>
      </Link>
    </div>
  );
}

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
        <Link href="/" className="group flex items-center">
          <span className="font-display text-xl font-extrabold tracking-tight text-foreground transition-opacity duration-200 group-hover:opacity-70">
            Ironvale
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                data-active={isActive ? "true" : undefined}
                className={cn(
                  "nav-link-underline rounded-sm text-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground",
                  isActive
                    ? "font-semibold text-foreground"
                    : "font-normal text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center md:flex">
          {isSignedIn ? (
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button
                  size="sm"
                  variant="outline"
                  className="group h-9 gap-1.5 text-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/60"
                >
                  Dashboard
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
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
            <AuthActions />
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {isSignedIn && <UserButton />}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
            className="text-foreground"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-b border-border bg-card px-4 py-6 md:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                data-active={pathname === link.href ? "true" : undefined}
                className={cn(
                  "nav-link-underline border-b border-border/50 py-2 text-sm transition-colors",
                  pathname === link.href
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}

            <div className="flex flex-col gap-2 pt-3">
              {isSignedIn ? (
                <Link href="/dashboard" className="w-full">
                  <Button
                    className="group h-9 w-full justify-between text-xs"
                    size="sm"
                    variant="outline"
                  >
                    Dashboard
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Button>
                </Link>
              ) : (
                <AuthActions mobile />
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
