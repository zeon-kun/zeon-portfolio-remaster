"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "@/lib/motion";
import type { PokemonDetail as PokemonDetailType } from "@/lib/pokemon";
import { getLocalSprite } from "@/lib/pokemon";
import { StatBar } from "./StatBar";
import { TypeBadge } from "./TypeBadge";

gsap.registerPlugin(useGSAP);

// ── Skeleton ────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="w-36 h-36 bg-foreground/6 shrink-0 animate-pulse" />
        <div className="flex-1 space-y-3 pt-2">
          <div className="h-2 w-10 bg-foreground/6 animate-pulse" />
          <div className="h-7 w-36 bg-foreground/8 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-5 w-14 bg-foreground/6 animate-pulse" />
            <div className="h-5 w-14 bg-foreground/6 animate-pulse" />
          </div>
          <div className="flex gap-4 pt-1">
            <div className="h-3 w-10 bg-foreground/5 animate-pulse" />
            <div className="h-3 w-10 bg-foreground/5 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="h-px bg-foreground/6" />

      <div className="space-y-3">
        <div className="h-2 w-16 bg-foreground/5 animate-pulse" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-2 bg-foreground/5 animate-pulse" />
            <div className="flex-1 h-[3px] bg-foreground/6 animate-pulse" />
            <div className="w-7 h-2 bg-foreground/5 animate-pulse" />
          </div>
        ))}
      </div>

      <div className="h-px bg-foreground/6" />

      <div className="space-y-2">
        <div className="h-2 w-full bg-foreground/5 animate-pulse" />
        <div className="h-2 w-4/5 bg-foreground/5 animate-pulse" />
        <div className="h-2 w-3/5 bg-foreground/5 animate-pulse" />
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

interface Props {
  selectedPokemon: PokemonDetailType | null;
  isFetching: boolean;
  flavorText: string;
}

export function PokemonDetail({ selectedPokemon, isFetching, flavorText }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const skeletonRef = useRef<HTMLDivElement>(null);

  const [displayed, setDisplayed] = useState<PokemonDetailType | null>(null);
  const [displayedFlavor, setDisplayedFlavor] = useState("");
  const [spriteError, setSpriteError] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);

  // Mirror showSkeleton in a ref so effects can read it synchronously
  const showSkeletonRef = useRef(false);

  // ── Step 1: show skeleton when fetch starts ──────────────────────────────
  useEffect(() => {
    if (!isFetching) return;
    showSkeletonRef.current = true;
    setShowSkeleton(true);
  }, [isFetching]);

  // Fade skeleton in after it mounts
  useEffect(() => {
    if (!showSkeleton || !skeletonRef.current || prefersReducedMotion()) return;
    gsap.fromTo(
      skeletonRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
    );
  }, [showSkeleton]);

  // ── Step 2: data arrived — fade out skeleton, then deliver content ────────
  useEffect(() => {
    if (!selectedPokemon) return;

    const deliver = () => {
      setDisplayed(selectedPokemon);
      setDisplayedFlavor(flavorText);
      setSpriteError(false);
    };

    if (showSkeletonRef.current && skeletonRef.current && !prefersReducedMotion()) {
      gsap.to(skeletonRef.current, {
        opacity: 0,
        y: -10,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          showSkeletonRef.current = false;
          setShowSkeleton(false);
          deliver();
        },
      });
    } else {
      showSkeletonRef.current = false;
      setShowSkeleton(false);
      deliver();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPokemon?.id]);

  // ── Step 3: entrance animations after content mounts ─────────────────────
  useGSAP(() => {
    if (!displayed) return;
    const inner = containerRef.current?.querySelector<HTMLElement>("[data-detail-inner]");
    if (!inner) return;

    if (prefersReducedMotion()) {
      gsap.set(inner, { opacity: 1, y: 0 });
      inner.querySelectorAll<HTMLElement>("[data-stat-bar]").forEach((el) => {
        gsap.set(el, { scaleX: +(el.dataset.value ?? 0) / 255, transformOrigin: "left center" });
      });
      return;
    }

    // Wrapper fade + lift
    gsap.fromTo(inner,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
    );

    // Sprite pop-in + wobble, then play cry on settle
    const sprite = inner.querySelector("[data-sprite]");
    if (sprite) {
      const id = displayed.id;
      gsap.timeline()
        .fromTo(sprite,
          { opacity: 0, scale: 0.55, rotation: 0 },
          { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2.2)" }
        )
        .to(sprite, { rotation: -11, duration: 0.07, ease: "power1.out" })
        .to(sprite, { rotation: 9,   duration: 0.08 })
        .to(sprite, { rotation: -6,  duration: 0.07 })
        .to(sprite, { rotation: 5,   duration: 0.07 })
        .to(sprite, { rotation: -2,  duration: 0.06 })
        .to(sprite, {
          rotation: 0, duration: 0.1, ease: "power1.out",
          onComplete: () => {
            const cry = new Audio(
              `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`
            );
            cry.volume = 0.4;
            cry.play().catch(() => {});
          },
        });
    }

    // Type badges stagger
    const badges = inner.querySelectorAll("[data-type-badge]");
    if (badges.length) {
      gsap.from(badges, {
        opacity: 0, y: 8, scale: 0.9,
        stagger: 0.08, duration: 0.4, ease: "power2.out",
      });
    }

    // Stat bar fill
    const bars = inner.querySelectorAll<HTMLElement>("[data-stat-bar]");
    if (bars.length) {
      gsap.fromTo(bars,
        { scaleX: 0, transformOrigin: "left center" },
        {
          scaleX: (_i, el) => +(el as HTMLElement).dataset.value! / 255,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          delay: 0.35,
        }
      );
    }
  }, { scope: containerRef, dependencies: [displayed?.id] });

  return (
    <div ref={containerRef} className="relative min-h-[400px]">

      {/* ── Empty state ── */}
      {!displayed && !showSkeleton && (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 border border-foreground/6">
          <span className="text-6xl font-black kanji-brutal text-foreground/6 select-none">図</span>
          <p className="text-[10px] font-mono text-muted/40 uppercase tracking-[0.2em]">
            Select a Pokémon
          </p>
        </div>
      )}

      {/* ── Skeleton ── */}
      {showSkeleton && (
        <div ref={skeletonRef}>
          <DetailSkeleton />
        </div>
      )}

      {/* ── Content ── */}
      {displayed && !showSkeleton && (
        <div data-detail-inner>
          {/* Sprite + identity */}
          <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
            <div className="relative shrink-0 w-36 h-36 flex items-center justify-center bg-foreground/3 border border-foreground/6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                data-sprite
                src={spriteError ? displayed.sprites.front_default : getLocalSprite(displayed.id)}
                alt={displayed.name}
                width={128}
                height={128}
                className="w-32 h-32 object-contain"
                onError={() => setSpriteError(true)}
              />
            </div>

            <div className="flex-1 min-w-0">
              <span className="block text-[10px] font-mono text-muted/40 tracking-widest mb-1">
                #{String(displayed.id).padStart(3, "0")}
              </span>

              <h2 className="text-2xl md:text-3xl font-black kanji-brutal capitalize text-foreground mb-3 leading-none">
                {displayed.name}
              </h2>

              <div className="flex items-center gap-2 flex-wrap">
                {displayed.types.map((t) => (
                  <TypeBadge key={t} type={t} />
                ))}
              </div>

              <div className="flex items-center gap-4 mt-3">
                <div>
                  <span className="block text-[8px] font-mono text-muted/30 uppercase tracking-widest">HT</span>
                  <span className="text-[10px] font-mono text-muted/60">
                    {(displayed.height * 0.1).toFixed(1)} m
                  </span>
                </div>
                <div>
                  <span className="block text-[8px] font-mono text-muted/30 uppercase tracking-widest">WT</span>
                  <span className="text-[10px] font-mono text-muted/60">
                    {(displayed.weight * 0.1).toFixed(1)} kg
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-foreground/6 mb-5" />

          {/* Stat bars */}
          <div className="space-y-3 mb-6">
            <span className="block text-[9px] font-mono text-muted/30 uppercase tracking-[0.2em] mb-3">
              Base Stats
            </span>
            {displayed.stats.map((s) => (
              <StatBar key={s.name} stat={s} />
            ))}
          </div>

          {/* Flavor text */}
          {displayedFlavor && (
            <>
              <div className="border-t border-foreground/6 mb-4" />
              <p className="text-[11px] font-mono text-muted/60 leading-relaxed italic">
                &ldquo;{displayedFlavor}&rdquo;
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
