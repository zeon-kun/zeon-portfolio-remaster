"use client";

import type { PokemonListEntry } from "@/lib/pokemon";
import { ALL_TYPES, TYPE_COLORS } from "@/lib/pokemon";
import { PokemonCard } from "./PokemonCard";

interface Props {
  entries: PokemonListEntry[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeTypeFilter: string | null;
  onTypeFilter: (type: string | null) => void;
}

export function PokemonGrid({
  entries,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  activeTypeFilter,
  onTypeFilter,
}: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="mb-3">
        <input
          type="search"
          placeholder="Search Pokémon..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-transparent border border-foreground/10 px-3 py-2 text-[11px] font-mono text-foreground placeholder:text-muted/40 focus:outline-none focus:border-foreground/25 transition-colors"
        />
      </div>

      {/* Type filter chips */}
      <div
        className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3"
        style={{ scrollbarWidth: "none" }}
      >
        <button
          onClick={() => onTypeFilter(null)}
          className={`shrink-0 px-2.5 py-0.5 text-[8px] font-mono uppercase tracking-widest border transition-colors duration-150 ${
            !activeTypeFilter
              ? "bg-foreground text-background border-foreground"
              : "border-foreground/15 text-muted/60 hover:border-foreground/30"
          }`}
        >
          All
        </button>
        {ALL_TYPES.map((type) => {
          const isActive = activeTypeFilter === type;
          const color = TYPE_COLORS[type]?.bg ?? "#6e6860";
          return (
            <button
              key={type}
              onClick={() => onTypeFilter(isActive ? null : type)}
              style={isActive ? { backgroundColor: color, color: "#f5f0eb", borderColor: color } : {}}
              className={`shrink-0 px-2.5 py-0.5 text-[8px] font-mono uppercase tracking-widest border transition-colors duration-150 ${
                isActive
                  ? "border-transparent"
                  : "border-foreground/10 text-muted/50 hover:border-foreground/25"
              }`}
            >
              {type}
            </button>
          );
        })}
      </div>

      {/* Count */}
      <p className="text-[8px] font-mono text-muted/30 uppercase tracking-widest mb-2">
        {entries.length} / 151
      </p>

      {/* Scrollable grid */}
      <div
        className="grid grid-cols-2 gap-1.5 overflow-y-auto flex-1 max-h-[calc(100vh-22rem)] md:max-h-[calc(100vh-20rem)] pr-1"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(26,26,26,0.15) transparent" }}
      >
        {entries.map((entry) => (
          <PokemonCard
            key={entry.id}
            entry={entry}
            isSelected={selectedId === entry.id}
            onClick={() => onSelect(entry.id)}
          />
        ))}

        {entries.length === 0 && (
          <div className="col-span-2 py-12 text-center">
            <p className="text-[10px] font-mono text-muted/30 uppercase tracking-widest">No results</p>
          </div>
        )}
      </div>
    </div>
  );
}
