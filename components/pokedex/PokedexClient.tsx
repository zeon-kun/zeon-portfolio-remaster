"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "@/lib/motion";
import type { PokemonListEntry, PokemonDetail } from "@/lib/pokemon";
import { POKEMON_TYPES_GEN1 } from "@/lib/pokemon";
import { PokemonGrid } from "./PokemonGrid";
import { PokemonDetail as PokemonDetailPanel } from "./PokemonDetail";

gsap.registerPlugin(useGSAP);

const WIDE_MIN = 672; // px of panel width needed for list + pinned detail side by side
const SHEET_LEAVE_MS = 220; // matches .sheet-leave

interface Props {
  initialList: PokemonListEntry[];
}

export function PokedexClient({ initialList }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonDetail | null>(null);
  const [flavorText, setFlavorText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTypeFilter, setActiveTypeFilter] = useState<string | null>(null);

  const pokemonCache = useRef<Map<number, PokemonDetail>>(new Map());
  const flavorCache = useRef<Map<number, string>>(new Map());
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Two columns when the panel itself is wide enough (not the viewport — the panel shares the
  // screen with the chat). Below that the detail opens over the list as a sheet, never under it.
  const layoutRef = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(false);
  const [sheet, setSheet] = useState<"closed" | "open" | "closing">("closed");

  useEffect(() => {
    const el = layoutRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWide(entry.contentRect.width >= WIDE_MIN));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const closeSheet = useCallback(() => {
    setSheet((state) => (state === "open" ? "closing" : state));
    window.setTimeout(() => setSheet("closed"), prefersReducedMotion() ? 0 : SHEET_LEAVE_MS);
  }, []);

  const sheetVisible = !wide && sheet !== "closed";

  useEffect(() => {
    if (!sheetVisible) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && closeSheet();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sheetVisible, closeSheet]);

  const filteredList = initialList.filter((entry) => {
    const matchesSearch = !searchQuery || entry.name.includes(searchQuery.toLowerCase());
    const matchesType = !activeTypeFilter || (POKEMON_TYPES_GEN1[entry.id] ?? []).includes(activeTypeFilter);
    return matchesSearch && matchesType;
  });

  // Page entrance animation
  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set("[data-pokedex-kanji]", { yPercent: 0 });
        gsap.set("[data-pokedex-header]", { opacity: 1, y: 0 });
        gsap.set("[data-pokemon-card]", { opacity: 1, y: 0 });
        return;
      }

      const tl = gsap.timeline();

      tl.from("[data-pokedex-kanji]", {
        yPercent: 100,
        duration: 1.2,
        ease: "expo.out",
      });

      tl.from(
        "[data-pokedex-header]",
        {
          opacity: 0,
          y: 20,
          duration: 0.7,
          ease: "power3.out",
        },
        "-=0.8"
      );

      tl.from(
        "[data-pokemon-card]",
        {
          opacity: 0,
          y: 20,
          // Spread across all 151 cards in a fixed time — a per-card delay left the last ones
          // invisible for seconds now that the whole list is on the page.
          stagger: { amount: 0.5 },
          duration: 0.5,
          ease: "power3.out",
        },
        "-=0.5"
      );
    },
    { scope: containerRef }
  );

  const fetchPokemon = useCallback(async (id: number) => {
    // Check cache first
    if (pokemonCache.current.has(id)) {
      setSelectedPokemon(pokemonCache.current.get(id)!);
      setFlavorText(flavorCache.current.get(id) ?? "");
      return;
    }

    setIsFetching(true);
    try {
      const [pokeRes, speciesRes] = await Promise.all([
        fetch(`https://pokeapi.co/api/v2/pokemon/${id}`),
        fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`),
      ]);

      if (!pokeRes.ok) return;
      const pokeData = await pokeRes.json();

      const detail: PokemonDetail = {
        id: pokeData.id,
        name: pokeData.name,
        types: (pokeData.types as { type: { name: string } }[]).map((t) => t.type.name),
        stats: (pokeData.stats as { stat: { name: string }; base_stat: number }[]).map((s) => ({
          name: s.stat.name,
          base_stat: s.base_stat,
        })),
        height: pokeData.height,
        weight: pokeData.weight,
        sprites: { front_default: pokeData.sprites.front_default ?? "" },
      };

      let flavor = "";
      if (speciesRes.ok) {
        const speciesData = await speciesRes.json();
        const englishEntry = (
          speciesData.flavor_text_entries as { flavor_text: string; language: { name: string } }[]
        ).find((e) => e.language.name === "en");
        flavor = englishEntry?.flavor_text.replace(/\f|\n/g, " ") ?? "";
      }

      pokemonCache.current.set(id, detail);
      flavorCache.current.set(id, flavor);

      setSelectedPokemon(detail);
      setFlavorText(flavor);
    } catch {
      // silently fail
    } finally {
      setIsFetching(false);
    }
  }, []);

  const handleSelect = useCallback(
    (id: number) => {
      setSheet("open");
      if (id === selectedId) return;
      setSelectedId(id);

      // Debounce fetch — cancel pending timer so rapid clicks don't spam the API
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
      fetchTimerRef.current = setTimeout(() => fetchPokemon(id), 500);
    },
    [selectedId, fetchPokemon]
  );

  // Previous / next within whatever the search and type filter currently show.
  const neighbour = (offset: -1 | 1) => {
    const index = filteredList.findIndex((entry) => entry.id === selectedId);
    return index === -1 ? undefined : filteredList[index + offset];
  };
  const step = (offset: -1 | 1) => {
    const next = neighbour(offset);
    if (next) handleSelect(next.id);
  };
  const pad = (id: number) => "#" + String(id).padStart(3, "0");
  const sheetNavClass =
    "px-1 py-1 transition-[color,transform] duration-150 ease-out hover:text-accent-primary active:scale-[0.96] disabled:opacity-0";

  return (
    <div ref={containerRef} className="pt-6 pb-12 px-6 md:px-12">
      <div ref={layoutRef} className="max-w-6xl mx-auto">
        {/* ── Page header ── */}
        <header className="mb-8 relative overflow-hidden">
          <span
            aria-hidden="true"
            className="absolute -left-5 md:-left-8 top-0 writing-vertical text-[10px] font-mono text-foreground/10 tracking-widest select-none"
          >
            ずかん
          </span>
          <span
            aria-hidden="true"
            className="absolute right-0 top-0 text-[9px] font-mono text-muted/40 tracking-[0.2em] uppercase"
          >
            図鑑 / Pokédex
          </span>

          <div className="overflow-hidden">
            <h1 data-pokedex-kanji className="text-3xl md:text-4xl font-black kanji-brutal text-foreground mb-2">
              図鑑
            </h1>
          </div>

          <div data-pokedex-header>
            <p className="text-xs font-mono uppercase tracking-[0.15em] text-muted">
              Pokédex — {initialList.length} species registered
            </p>
          </div>
        </header>

        {/* ── List + detail ── */}
        <div className={wide ? "grid grid-cols-[minmax(0,1fr)_320px] gap-8" : ""}>
          <PokemonGrid
            entries={filteredList}
            selectedId={selectedId}
            onSelect={handleSelect}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeTypeFilter={activeTypeFilter}
            onTypeFilter={setActiveTypeFilter}
          />

          {/* Wide: pinned beside the list, so it stays put while the list scrolls past. */}
          {wide && (
            <div className="sticky top-24 max-h-[calc(100dvh-7rem)] self-start overflow-y-auto overscroll-contain">
              <PokemonDetailPanel selectedPokemon={selectedPokemon} isFetching={isFetching} flavorText={flavorText} />
            </div>
          )}
        </div>

        {/* Narrow: the detail rises over the list as a sheet; the list keeps its scroll position. */}
        {sheetVisible && (
          <>
            <div
              aria-hidden="true"
              onClick={closeSheet}
              className={`fixed inset-0 z-[60] bg-foreground/25 ${sheet === "closing" ? "scrim-leave" : "fade-in"}`}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label={selectedPokemon?.name ?? "Pokémon"}
              className={`fixed inset-x-0 bottom-0 z-[61] max-h-[85dvh] overflow-y-auto overscroll-contain border-t border-foreground/15 bg-background px-5 pb-6 ${
                sheet === "closing" ? "sheet-leave" : "sheet-enter"
              }`}
            >
              <div className="sticky top-0 z-10 -mx-5 mb-4 flex items-center justify-between border-b border-foreground/8 bg-background px-5 py-3 text-[10px] font-mono uppercase tracking-[0.18em] text-muted">
                <button type="button" onClick={() => step(-1)} disabled={!neighbour(-1)} aria-label="Previous Pokémon" className={sheetNavClass}>
                  ← {neighbour(-1) ? pad(neighbour(-1)!.id) : ""}
                </button>
                <button type="button" onClick={closeSheet} className={sheetNavClass}>
                  Close ✕
                </button>
                <button type="button" onClick={() => step(1)} disabled={!neighbour(1)} aria-label="Next Pokémon" className={sheetNavClass}>
                  {neighbour(1) ? pad(neighbour(1)!.id) : ""} →
                </button>
              </div>
              <PokemonDetailPanel selectedPokemon={selectedPokemon} isFetching={isFetching} flavorText={flavorText} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
