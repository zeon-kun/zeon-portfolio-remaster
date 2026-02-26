import { formatStatName, statBarColor } from "@/lib/pokemon";
import type { PokemonStat } from "@/lib/pokemon";

interface Props {
  stat: PokemonStat;
}

export function StatBar({ stat }: Props) {
  const color = statBarColor(stat.base_stat);
  const label = formatStatName(stat.name);

  return (
    <div className="flex items-center gap-3">
      {/* Label */}
      <span className="w-8 text-[9px] font-mono uppercase tracking-widest text-muted/60 shrink-0">
        {label}
      </span>

      {/* Bar track */}
      <div className="flex-1 h-[3px] bg-foreground/8 overflow-hidden">
        <div
          data-stat-bar
          data-value={stat.base_stat}
          style={{
            backgroundColor: color,
            height: "100%",
            width: "100%",
            transformOrigin: "left center",
            transform: "scaleX(0)",
          }}
        />
      </div>

      {/* Value */}
      <span className="w-7 text-right text-[9px] font-mono text-muted/50 shrink-0">
        {stat.base_stat}
      </span>
    </div>
  );
}
