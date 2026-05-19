"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import type { Bilingual, Lang } from "@/lib/ratecard";

interface ScoreGaugeProps {
  score: number;
  tierLabel: Bilingual;
  lang: Lang;
}

// Semicircular arc geometry
const W = 280;
const H = 156;
const CX = W / 2;
const CY = 140;
const R = 124;
const STROKE = 10;

function polar(pct: number) {
  // pct 0..1 maps to 180deg (left) -> 0deg (right)
  const a = Math.PI - pct * Math.PI;
  return { x: CX + R * Math.cos(a), y: CY - R * Math.sin(a) };
}

const TRACK_LEN = Math.PI * R;

export function ScoreGauge({ score, tierLabel, lang }: ScoreGaugeProps) {
  const label = lang === "jp" ? tierLabel.jp : tierLabel.en;
  const pct = Math.max(0, Math.min(1, score / 100));

  const arcRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const arc = arcRef.current;
    if (!arc) return;
    const offsetTarget = TRACK_LEN * (1 - pct);

    if (prefersReducedMotion()) {
      gsap.set(arc, { strokeDashoffset: offsetTarget });
      return;
    }
    gsap.fromTo(
      arc,
      { strokeDashoffset: TRACK_LEN },
      { strokeDashoffset: offsetTarget, duration: 1, ease: "power3.out", delay: 0.1 }
    );
  }, [pct]);

  const end = polar(pct);
  const trackPath = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

  const ticks = [0, 25, 50, 75, 100];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: W, height: H }}>
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          aria-hidden="true"
          className="overflow-visible"
        >
          {/* tick marks */}
          {ticks.map((t) => {
            const p = t / 100;
            const inner = R - STROKE / 2 - 4;
            const outer = R + STROKE / 2 + 4;
            const a = Math.PI - p * Math.PI;
            const cos = Math.cos(a);
            const sin = Math.sin(a);
            return (
              <g key={t}>
                <line
                  x1={CX + inner * cos}
                  y1={CY - inner * sin}
                  x2={CX + outer * cos}
                  y2={CY - outer * sin}
                  stroke="var(--foreground)"
                  strokeOpacity={0.18}
                  strokeWidth={1}
                />
                <text
                  x={CX + (outer + 9) * cos}
                  y={CY - (outer + 9) * sin + 3}
                  textAnchor="middle"
                  className="fill-muted"
                  style={{ fontFamily: "var(--font-mono)", fontSize: 9 }}
                  opacity={0.5}
                >
                  {t}
                </text>
              </g>
            );
          })}

          {/* track */}
          <path
            d={trackPath}
            fill="none"
            stroke="var(--foreground)"
            strokeOpacity={0.1}
            strokeWidth={STROKE}
            strokeLinecap="butt"
          />
          {/* value arc */}
          <path
            ref={arcRef}
            d={trackPath}
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth={STROKE}
            strokeLinecap="butt"
            strokeDasharray={TRACK_LEN}
            strokeDashoffset={TRACK_LEN}
          />
          {/* end marker notch */}
          <line
            x1={CX + (R - STROKE / 2 - 2) * Math.cos(Math.PI - pct * Math.PI)}
            y1={CY - (R - STROKE / 2 - 2) * Math.sin(Math.PI - pct * Math.PI)}
            x2={end.x + (STROKE / 2 + 2) * Math.cos(Math.PI - pct * Math.PI)}
            y2={end.y - (STROKE / 2 + 2) * Math.sin(Math.PI - pct * Math.PI)}
            stroke="var(--accent-primary)"
            strokeWidth={2}
          />
        </svg>

        {/* centered number */}
        <div
          className="absolute inset-x-0 flex flex-col items-center"
          style={{ top: 64 }}
        >
          <span
            className="text-5xl md:text-6xl font-black tabular-nums leading-none text-foreground"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {score}
          </span>
        </div>
      </div>

      <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted mt-1">
        / 100 — {label}
      </div>
    </div>
  );
}
