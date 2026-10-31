"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";

const LINES = ["Heavy iron.", "Zero", "distractions."];
const LIFTS = ["Squat", "Hinge", "Press", "Pull", "Carry"];
const WEIGHT_BASE = 640;
const WEIGHT_PEAK = 900;
const BONE = [232, 230, 224];
const RED = [215, 38, 30];

function mix(t: number) {
  const c = BONE.map((v, i) => Math.round(v + (RED[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export function HeroSection() {
  const rootRef = React.useRef<HTMLElement>(null);
  const headRef = React.useRef<HTMLHeadingElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const head = headRef.current;
    const track = trackRef.current;
    if (!head || !track) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const chars = Array.from(head.querySelectorAll<HTMLElement>("[data-ch]"));
    const level = chars.map(() => 0);
    const pointer = { x: -1e4, y: -1e4, at: -1e5 };
    let visible = true;
    let half = 0;
    let x = 0;
    let dir = -1;
    let vel = 0;
    let lastY = window.scrollY;
    let raf = 0;
    let resizeTimer = 0;
    let cancelled = false;

    // Fix each letter's width at its heaviest weight so changing weight never shifts the layout.
    const fit = () => {
      chars.forEach((c) => {
        c.style.width = "";
        c.style.fontVariationSettings = `"wght" ${WEIGHT_PEAK}`;
      });
      const widths = chars.map((c) => c.getBoundingClientRect().width);
      chars.forEach((c, i) => {
        c.style.width = `${widths[i]}px`;
        c.style.fontVariationSettings = `"wght" ${WEIGHT_BASE}`;
      });
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.at = performance.now();
    };

    const frame = (now: number) => {
      if (visible) {
        const active = now - pointer.at < 2500;
        chars.forEach((c, i) => {
          let target: number;
          if (active) {
            const r = c.getBoundingClientRect();
            const d = Math.hypot(pointer.x - (r.left + r.width / 2), pointer.y - (r.top + r.height / 2));
            const p = Math.max(0, 1 - d / 280);
            target = p * p * (3 - 2 * p);
          } else {
            target = (0.5 + 0.5 * Math.sin(now / 700 - i * 0.45)) * 0.5;
          }
          level[i] += (target - level[i]) * 0.1;
          c.style.fontVariationSettings = `"wght" ${Math.round(WEIGHT_BASE + (WEIGHT_PEAK - WEIGHT_BASE) * level[i])}`;
          c.style.color = mix(level[i]);
        });
      }

      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      vel += (dy - vel) * 0.12;
      if (Math.abs(dy) > 0.5) dir = dy > 0 ? -1 : 1;
      x += dir * (1.1 + Math.min(Math.abs(vel), 60) * 0.35);
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      const skew = Math.max(-10, Math.min(10, -vel * 0.25));
      track.style.transform = `translate3d(${x}px,0,0) skewX(${skew}deg)`;
      raf = requestAnimationFrame(frame);
    };

    const ctx = gsap.context(() => {
      if (reduced) return;
      gsap.from(chars, { yPercent: 110, duration: 0.9, ease: "power4.out", stagger: 0.025, delay: 0.1 });
      gsap.from("[data-reveal]", { opacity: 0, y: 14, duration: 0.7, ease: "power3.out", delay: 0.7, stagger: 0.12 });
    }, rootRef);

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(head);

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        fit();
        half = track.scrollWidth / 2;
      }, 150);
    };

    document.fonts.ready.then(() => {
      if (cancelled) return;
      fit();
      half = track.scrollWidth / 2;
      if (reduced) {
        chars.forEach((c) => (c.style.fontVariationSettings = `"wght" 800`));
        return;
      }
      raf = requestAnimationFrame(frame);
    });

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      observer.disconnect();
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative w-full overflow-hidden border-b border-[#25272B] bg-[#0E0F11] text-[#E8E6E0]"
    >
      <div className="mx-auto flex min-h-[calc(100svh-4.1rem)] max-w-[110rem] flex-col px-4 sm:px-6 lg:px-10">
        <div className="flex flex-1 flex-col justify-center py-10 md:py-14">
          <p data-reveal className="mb-4 text-sm text-[#8E9094] md:mb-7">
            Open 5:30 AM to 10:00 PM, seven days.
          </p>

          <h1
            ref={headRef}
            aria-label="Heavy iron. Zero distractions."
            className="font-display font-extrabold leading-[0.88] tracking-[-0.035em]"
            style={{ fontSize: "clamp(3.1rem, 13.4vw, 13rem)" }}
          >
            {LINES.map((line) => (
              <span
                key={line}
                aria-hidden="true"
                className="block overflow-hidden whitespace-nowrap pb-[0.06em] pt-[0.04em]"
              >
                {Array.from(line).map((ch, i) => (
                  <span
                    key={i}
                    data-ch
                    className="inline-block whitespace-pre text-center"
                    style={{ fontVariationSettings: `"wght" ${WEIGHT_BASE}` }}
                  >
                    {ch}
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <div data-reveal className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-5 md:mt-11">
            <p className="max-w-[44ch] text-base text-[#B9B8B2] sm:text-lg">
              Competition platforms, power racks and a 30 m turf track. Pay in full, or pay half
              now and the rest before your plan ends.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/plans">
                <Button
                  size="lg"
                  className="h-11 gap-1.5 rounded-sm bg-[#E8E6E0] px-6 text-xs font-medium text-[#0E0F11] hover:bg-white sm:text-sm"
                >
                  View memberships
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/about">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 rounded-sm border-[#25272B] bg-transparent px-6 text-xs text-[#E8E6E0] hover:bg-[#18191D] hover:text-white sm:text-sm"
                >
                  Facility specs
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div aria-hidden="true" className="overflow-hidden border-t border-[#26282B] py-4 md:py-6">
          <div ref={trackRef} className="flex w-max will-change-transform">
            {Array.from({ length: 4 }).flatMap((_, k) =>
              LIFTS.map((word) => (
                <span key={`${k}-${word}`} className="hero-lift">
                  {word}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}