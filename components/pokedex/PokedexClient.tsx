"use client";

import { useState, useRef, useCallback } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "@/lib/motion";
import type { PokemonListEntry, PokemonDetail } from "@/lib/pokemon";
import { POKEMON_TYPES_GEN1 } from "@/lib/pokemon";
import { PokemonGrid } from "./PokemonGrid";
import { PokemonDetail as PokemonDetailPanel } from "./PokemonDetail";

gsap.registerPlugin(useGSAP);

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
          stagger: 0.04,
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
      if (id === selectedId) return;
      setSelectedId(id);

      // Debounce fetch — cancel pending timer so rapid clicks don't spam the API
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
      fetchTimerRef.current = setTimeout(() => fetchPokemon(id), 500);
    },
    [selectedId, fetchPokemon]
  );

  return (
    <main ref={containerRef} className="min-h-screen pt-28 pb-24 md:pb-12 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
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

        {/* ── Main split layout ── */}
        <div className="flex flex-col lg:grid lg:grid-cols-[300px_1fr] gap-6 lg:gap-8">
          {/* ── Left: Pokémon grid ── */}
          <div>
            <PokemonGrid
              entries={filteredList}
              selectedId={selectedId}
              onSelect={handleSelect}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeTypeFilter={activeTypeFilter}
              onTypeFilter={setActiveTypeFilter}
            />
          </div>

          {/* ── Right: Detail panel ── */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <PokemonDetailPanel selectedPokemon={selectedPokemon} isFetching={isFetching} flavorText={flavorText} />
          </div>
        </div>
      </div>
    </main>
  );
}
