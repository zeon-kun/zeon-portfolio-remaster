import { POKEMON_TYPES_GEN1, TYPE_COLORS } from "@/lib/pokemon";
import type { PokemonListEntry } from "@/lib/pokemon";

interface Props {
  entry: PokemonListEntry;
  isSelected: boolean;
  onClick: () => void;
}

export function PokemonCard({ entry, isSelected, onClick }: Props) {
  const paddedId = String(entry.id).padStart(3, "0");
  const types = POKEMON_TYPES_GEN1[entry.id] ?? [];

  return (
    <button
      data-pokemon-card
      onClick={onClick}
      aria-pressed={isSelected}
      className={`
        relative w-full text-left p-3 border transition-colors duration-150
        ${isSelected
          ? "border-accent-primary bg-accent-primary/5"
          : "border-foreground/8 bg-background/40 hover:border-foreground/15 hover:bg-background/60"
        }
      `}
    >
      {/* ID */}
      <span className="block text-[8px] font-mono text-muted/30 tracking-widest mb-1">
        {paddedId}
      </span>

      {/* Name */}
      <span className="block text-[11px] font-bold tracking-wide capitalize text-foreground/80 truncate mb-2">
        {entry.name}
      </span>

      {/* Type dots */}
      {types.length > 0 && (
        <div className="flex items-center gap-1">
          {types.map((t) => {
            const color = TYPE_COLORS[t]?.bg ?? "#6e6860";
            return (
              <span
                key={t}
                title={t}
                style={{ backgroundColor: color }}
                className="w-2 h-2 rounded-full"
              />
            );
          })}
        </div>
      )}

      {/* Selected corner accent */}
      {isSelected && (
        <span className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-accent-primary" />
      )}
    </button>
  );
}
