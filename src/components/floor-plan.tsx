"use client";

import * as React from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

type ZoneKey = "platforms" | "racks" | "recovery" | "turf";

const ZONE_CAPTIONS: Record<ZoneKey, string> = {
  platforms: "8 Olympic platforms with chalk and bumper plates.",
  racks: "12 power racks with adjustable safeties.",
  turf: "30 m turf sprint track with sled lanes.",
  recovery: "Cold plunge and locker rooms.",
};

const DEFAULT_CAPTION = "5:30 AM to 10:00 PM, seven days. Hover a zone.";

// Fixed center coordinates for platforms (two columns x: 28, 112; four rows y: 28, 90, 152, 214; size: 70x48)
const PLATFORM_CENTERS: Array<{ x: number; y: number }> = [
  { x: 63, y: 52 },   // Row 0, Col 0 (index 0) - OCCUPIED
  { x: 147, y: 52 },  // Row 0, Col 1 (index 1)
  { x: 63, y: 114 },  // Row 1, Col 0 (index 2) - OCCUPIED
  { x: 147, y: 114 }, // Row 1, Col 1 (index 3) - OCCUPIED
  { x: 63, y: 176 },  // Row 2, Col 0 (index 4)
  { x: 147, y: 176 }, // Row 2, Col 1 (index 5) - OCCUPIED
  { x: 63, y: 238 },  // Row 3, Col 0 (index 6) - OCCUPIED
  { x: 147, y: 238 }, // Row 3, Col 1 (index 7)
];

const OCCUPIED_PLATFORM_INDICES = [0, 2, 3, 5, 6];

// Fixed center coordinates for racks (six columns x: 214, 256, 298, 340, 382, 424; two rows y: 28, 76; size: 36x36)
const RACK_CENTERS: Array<{ x: number; y: number }> = [
  { x: 232, y: 46 }, // Row 0, Col 0 (idx 0)
  { x: 274, y: 46 }, // Row 0, Col 1 (idx 1) - OCCUPIED
  { x: 316, y: 46 }, // Row 0, Col 2 (idx 2) - OCCUPIED
  { x: 358, y: 46 }, // Row 0, Col 3 (idx 3)
  { x: 400, y: 46 }, // Row 0, Col 4 (idx 4) - OCCUPIED
  { x: 442, y: 46 }, // Row 0, Col 5 (idx 5)
  { x: 232, y: 94 }, // Row 1, Col 0 (idx 6) - OCCUPIED
  { x: 274, y: 94 }, // Row 1, Col 1 (idx 7) - OCCUPIED
  { x: 316, y: 94 }, // Row 1, Col 2 (idx 8)
  { x: 358, y: 94 }, // Row 1, Col 3 (idx 9) - OCCUPIED
  { x: 400, y: 94 }, // Row 1, Col 4 (idx 10) - OCCUPIED
  { x: 442, y: 94 }, // Row 1, Col 5 (idx 11)
];

const OCCUPIED_RACK_INDICES = [1, 2, 4, 6, 7, 9, 10];

export function FloorPlan() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const wallRef = React.useRef<SVGRectElement>(null);
  const sprinterRef = React.useRef<SVGCircleElement>(null);
  const [activeZone, setActiveZone] = React.useState<ZoneKey | null>(null);

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // 1. Wall draw animation
      if (wallRef.current) {
        if (prefersReducedMotion) {
          gsap.set(wallRef.current, { strokeDashoffset: 0 });
          gsap.set(".floor-zone", { opacity: 1, y: 0 });
        } else {
          const tl = gsap.timeline();
          tl.fromTo(
            wallRef.current,
            { strokeDashoffset: 1 },
            { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut" }
          );
          tl.fromTo(
            ".floor-zone",
            { opacity: 0, y: 6 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.04, ease: "power3.out" },
            "-=0.2"
          );
        }
      }

      // 2. Occupancy dots pulsing
      if (!prefersReducedMotion) {
        const dotElements = gsap.utils.toArray<SVGCircleElement>(".occupancy-dot");
        dotElements.forEach((dot, idx) => {
          gsap.to(dot, {
            opacity: 0.35,
            duration: 1.4,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: idx * 0.17,
          });
        });
      }

      // 3. Turf sprinter timeline
      if (sprinterRef.current && !prefersReducedMotion) {
        const sprinterTl = gsap.timeline({ repeat: -1, repeatDelay: 2.5 });
        sprinterTl
          .fromTo(
            sprinterRef.current,
            { x: 40, opacity: 1 },
            { x: 440, duration: 3.4, ease: "power2.in" }
          )
          .to(sprinterRef.current, { opacity: 0, duration: 0.3 })
          .set(sprinterRef.current, { x: 40, opacity: 1 });
      }
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[560px] mx-auto select-none"
      role="group"
      aria-label="Gym floor plan"
    >
      <svg
        viewBox="0 0 480 400"
        className="w-full h-auto overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer perimeter wall with pathLength for dashoffset draw */}
        <rect
          ref={wallRef}
          x="10"
          y="10"
          width="460"
          height="380"
          rx="4"
          fill="none"
          stroke="#E8E6E0"
          strokeOpacity="0.5"
          strokeWidth="2"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset="1"
        />

        {/* 1. Platforms Zone (8 platforms) */}
        <g
          tabIndex={0}
          className="floor-zone cursor-pointer outline-none group"
          onMouseEnter={() => setActiveZone("platforms")}
          onMouseLeave={() => setActiveZone(null)}
          onFocus={() => setActiveZone("platforms")}
          onBlur={() => setActiveZone(null)}
          onClick={() => setActiveZone("platforms")}
        >
          <text
            x="28"
            y="22"
            fill="#E8E6E0"
            fontSize="11"
            className="font-mono tracking-wider"
          >
            Platforms 8
          </text>

          {[28, 112].map((x) =>
            [28, 90, 152, 214].map((y) => (
              <rect
                key={`platform-${x}-${y}`}
                x={x}
                y={y}
                width="70"
                height="48"
                rx="2"
                fill="#D7261E"
                fillOpacity={activeZone === "platforms" ? 0.22 : 0.1}
                stroke="#D7261E"
                strokeOpacity="0.9"
                strokeWidth={activeZone === "platforms" ? 3 : 2}
                className="transition-[fill-opacity,stroke-width] duration-250 ease-out"
              />
            ))
          )}
        </g>

        {/* 2. Racks Zone (12 racks) */}
        <g
          tabIndex={0}
          className="floor-zone cursor-pointer outline-none group"
          onMouseEnter={() => setActiveZone("racks")}
          onMouseLeave={() => setActiveZone(null)}
          onFocus={() => setActiveZone("racks")}
          onBlur={() => setActiveZone(null)}
          onClick={() => setActiveZone("racks")}
        >
          <text
            x="214"
            y="22"
            fill="#E8E6E0"
            fontSize="11"
            className="font-mono tracking-wider"
          >
            Racks 12
          </text>

          {[214, 256, 298, 340, 382, 424].map((x) =>
            [28, 76].map((y) => (
              <rect
                key={`rack-${x}-${y}`}
                x={x}
                y={y}
                width="36"
                height="36"
                rx="2"
                fill="#1D4FD8"
                fillOpacity={activeZone === "racks" ? 0.22 : 0.1}
                stroke="#1D4FD8"
                strokeOpacity="0.9"
                strokeWidth={activeZone === "racks" ? 3 : 2}
                className="transition-[fill-opacity,stroke-width] duration-250 ease-out"
              />
            ))
          )}
        </g>

        {/* 3. Recovery Zone */}
        <g
          tabIndex={0}
          className="floor-zone cursor-pointer outline-none group"
          onMouseEnter={() => setActiveZone("recovery")}
          onMouseLeave={() => setActiveZone(null)}
          onFocus={() => setActiveZone("recovery")}
          onBlur={() => setActiveZone(null)}
          onClick={() => setActiveZone("recovery")}
        >
          <rect
            x="214"
            y="130"
            width="246"
            height="132"
            rx="2"
            fill="#F2C230"
            fillOpacity={activeZone === "recovery" ? 0.22 : 0.1}
            stroke="#F2C230"
            strokeOpacity="0.9"
            strokeWidth={activeZone === "recovery" ? 3 : 2}
            className="transition-[fill-opacity,stroke-width] duration-250 ease-out"
          />
          <text
            x="226"
            y="150"
            fill="#E8E6E0"
            fontSize="11"
            className="font-mono font-medium tracking-wider"
          >
            Recovery
          </text>
          <text
            x="226"
            y="170"
            fill="#8A8D91"
            fontSize="10"
            className="font-mono"
          >
            Cold plunge · lockers
          </text>
        </g>

        {/* 4. Turf Sprint Track (30m) */}
        <g
          tabIndex={0}
          className="floor-zone cursor-pointer outline-none group"
          onMouseEnter={() => setActiveZone("turf")}
          onMouseLeave={() => setActiveZone(null)}
          onFocus={() => setActiveZone("turf")}
          onBlur={() => setActiveZone(null)}
          onClick={() => setActiveZone("turf")}
        >
          <text
            x="28"
            y="286"
            fill="#E8E6E0"
            fontSize="11"
            className="font-mono tracking-wider"
          >
            Turf 30 m
          </text>

          <rect
            x="28"
            y="292"
            width="424"
            height="70"
            rx="2"
            fill="#1F9D55"
            fillOpacity={activeZone === "turf" ? 0.22 : 0.1}
            stroke="#1F9D55"
            strokeOpacity="0.9"
            strokeWidth={activeZone === "turf" ? 3 : 2}
            className="transition-[fill-opacity,stroke-width] duration-250 ease-out"
          />

          {/* Center dashed running lane guide */}
          <line
            x1="28"
            y1="327"
            x2="452"
            y2="327"
            stroke="#1F9D55"
            strokeOpacity="0.5"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />

          {/* Meter ticks every 5 meters (0m to 30m) */}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const tickX = 28 + i * (424 / 6);
            return (
              <g key={`tick-${i}`}>
                <line
                  x1={tickX}
                  y1="345"
                  x2={tickX}
                  y2="355"
                  stroke="#8A8D91"
                  strokeWidth="1"
                />
                <text
                  x={tickX}
                  y="372"
                  fill="#8A8D91"
                  fontSize="10"
                  textAnchor="middle"
                  className="font-mono"
                >
                  {i * 5}
                </text>
              </g>
            );
          })}
        </g>

        {/* Occupancy dots: fixed positions, pulse animation */}
        <g className="pointer-events-none">
          {OCCUPIED_PLATFORM_INDICES.map((idx) => {
            const { x, y } = PLATFORM_CENTERS[idx];
            return (
              <circle
                key={`occ-platform-${idx}`}
                cx={x}
                cy={y}
                r="4"
                fill="#F2C230"
                className="occupancy-dot"
                opacity="1"
              />
            );
          })}

          {OCCUPIED_RACK_INDICES.map((idx) => {
            const { x, y } = RACK_CENTERS[idx];
            return (
              <circle
                key={`occ-rack-${idx}`}
                cx={x}
                cy={y}
                r="4"
                fill="#F2C230"
                className="occupancy-dot"
                opacity="1"
              />
            );
          })}
        </g>

        {/* Sprinter dot on turf lane (y = 327) */}
        <circle
          ref={sprinterRef}
          cx="0"
          cy="327"
          r="5"
          fill="#F2C230"
          className="pointer-events-none motion-reduce:hidden"
        />
      </svg>

      {/* Interactive HTML caption */}
      <div className="mt-4 font-mono text-[13px] text-[#8A8D91] min-h-[20px] transition-colors duration-200">
        {activeZone ? (
          <span className="text-[#E8E6E0]">{ZONE_CAPTIONS[activeZone]}</span>
        ) : (
          DEFAULT_CAPTION
        )}
      </div>
    </div>
  );
}