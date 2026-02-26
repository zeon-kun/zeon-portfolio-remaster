import { TYPE_COLORS } from "@/lib/pokemon";

interface Props {
  type: string;
}

export function TypeBadge({ type }: Props) {
  const colors = TYPE_COLORS[type] ?? { bg: "#6e6860", text: "#f5f0eb" };
  return (
    <span
      data-type-badge
      style={{ backgroundColor: colors.bg, color: colors.text }}
      className="inline-block px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-[0.15em]"
    >
      {type}
    </span>
  );
}
