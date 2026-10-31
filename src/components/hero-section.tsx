"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";

const LIFTS = ["Squat", "Hinge", "Press", "Pull", "Carry"];

export function HeroSection() {
  const rootRef = React.useRef<HTMLElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);

  // Smooth slide-up reveal animation
  useGSAP(
    () => {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduced) return;

      gsap.from(".hero-line-inner", {
        yPercent: 110,
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.08,
        delay: 0.1,
      });

      gsap.from("[data-reveal]", {
        opacity: 0,
        y: 16,
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.08,
        delay: 0.3,
      });
    },
    { scope: rootRef },
  );

  // Infinite ticker that responds to scroll velocity
  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return;

    let half = 0;
    let x = 0;
    let dir = -1;
    let vel = 0;
    let lastY = window.scrollY;
    let raf = 0;
    let resizeTimer = 0;
    let cancelled = false;

    const frame = () => {
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      vel += (dy - vel) * 0.12; // Smoothing

      if (Math.abs(dy) > 0.5) dir = dy > 0 ? -1 : 1;

      x += dir * (1.1 + Math.min(Math.abs(vel), 60) * 0.35);
      if (x <= -half) x += half;
      if (x > 0) x -= half;

      const skew = Math.max(-10, Math.min(10, -vel * 0.25));
      track.style.transform = `translate3d(${x}px,0,0) skewX(${skew}deg)`;

      raf = requestAnimationFrame(frame);
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        half = track.scrollWidth / 2;
      }, 150);
    };

    document.fonts.ready.then(() => {
      if (cancelled) return;
      half = track.scrollWidth / 2;
      raf = requestAnimationFrame(frame);
    });

    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative w-full overflow-hidden border-b border-border bg-background text-foreground"
    >
      <div className="container mx-auto flex min-h-[calc(100svh-4.1rem)] max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 flex-col justify-center py-12 md:py-16">
          <p
            data-reveal
            className="mb-4 text-xs sm:text-sm font-mono text-muted-foreground uppercase tracking-wider md:mb-6"
          >
            Open 5:30 AM to 10:00 PM, seven days.
          </p>

          <h1
            aria-label="Heavy iron. Zero distractions."
            className="font-display font-extrabold leading-[0.9] tracking-[-0.035em] text-5xl sm:text-7xl md:text-8xl lg:text-[7.5rem]"
          >
            <span className="block overflow-hidden pb-1 sm:pb-2">
              <span className="hero-line-inner block">Heavy iron.</span>
            </span>
            <span className="block overflow-hidden pb-1 sm:pb-2">
              <span className="hero-line-inner block">Zero</span>
            </span>
            <span className="block overflow-hidden pb-1 sm:pb-2">
              <span className="hero-line-inner block">distractions.</span>
            </span>
          </h1>

          <div
            data-reveal
            className="mt-8 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10 md:mt-12"
          >
            <p className="max-w-md text-sm sm:text-base text-muted-foreground leading-relaxed">
              Competition platforms, power racks and a 30m turf track. Pay in
              full, or pay half now and the rest before your plan ends.
            </p>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link href="/plans">
                <Button
                  size="lg"
                  className="w-full sm:w-auto gap-1.5 font-mono text-xs"
                >
                  View memberships
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/about">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto font-mono text-xs"
                >
                  Facility specs
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* The scrolling lifts ticker */}
        <div
          aria-hidden="true"
          className="overflow-hidden border-t border-border py-5 md:py-8"
        >
          <div ref={trackRef} className="flex w-max will-change-transform">
            {Array.from({ length: 4 }).flatMap((_, k) =>
              LIFTS.map((word) => (
                <span key={`${k}-${word}`} className="hero-lift">
                  {word}
                </span>
              )),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
