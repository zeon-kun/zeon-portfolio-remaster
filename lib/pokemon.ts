// ── Types ──────────────────────────────────────────────────────────────────

export interface PokemonListEntry {
  id: number;
  name: string;
}

export interface PokemonStat {
  name: string;
  base_stat: number;
}

export interface PokemonDetail {
  id: number;
  name: string;
  types: string[];
  stats: PokemonStat[];
  height: number;
  weight: number;
  sprites: {
    front_default: string;
  };
}

// ── Type color map (muted palette) ─────────────────────────────────────────

export const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  normal:   { bg: "#8a7f75", text: "#f5f0eb" },
  fire:     { bg: "#c46a4d", text: "#f5f0eb" },
  water:    { bg: "#4a6b7a", text: "#f5f0eb" },
  electric: { bg: "#8a7c3f", text: "#f5f0eb" },
  grass:    { bg: "#5c6b52", text: "#f5f0eb" },
  ice:      { bg: "#5a7580", text: "#f5f0eb" },
  fighting: { bg: "#7a4a42", text: "#f5f0eb" },
  poison:   { bg: "#6b5270", text: "#f5f0eb" },
  ground:   { bg: "#7a6847", text: "#f5f0eb" },
  flying:   { bg: "#4a5d7a", text: "#f5f0eb" },
  psychic:  { bg: "#8a4a5c", text: "#f5f0eb" },
  bug:      { bg: "#6b7a42", text: "#f5f0eb" },
  rock:     { bg: "#7a7060", text: "#f5f0eb" },
  ghost:    { bg: "#4a4a6b", text: "#f5f0eb" },
  dragon:   { bg: "#4a4a8a", text: "#f5f0eb" },
  dark:     { bg: "#3d3630", text: "#f5f0eb" },
  steel:    { bg: "#606870", text: "#f5f0eb" },
  fairy:    { bg: "#8a5a70", text: "#f5f0eb" },
};

export const ALL_TYPES = Object.keys(TYPE_COLORS);

// ── Static gen-1 type mapping (avoids fetching all 151 for filtering) ──────

export const POKEMON_TYPES_GEN1: Record<number, string[]> = {
  1:   ["grass", "poison"],
  2:   ["grass", "poison"],
  3:   ["grass", "poison"],
  4:   ["fire"],
  5:   ["fire"],
  6:   ["fire", "flying"],
  7:   ["water"],
  8:   ["water"],
  9:   ["water"],
  10:  ["bug"],
  11:  ["bug"],
  12:  ["bug", "flying"],
  13:  ["bug", "poison"],
  14:  ["bug", "poison"],
  15:  ["bug", "poison"],
  16:  ["normal", "flying"],
  17:  ["normal", "flying"],
  18:  ["normal", "flying"],
  19:  ["normal"],
  20:  ["normal"],
  21:  ["normal", "flying"],
  22:  ["normal", "flying"],
  23:  ["poison"],
  24:  ["poison"],
  25:  ["electric"],
  26:  ["electric"],
  27:  ["ground"],
  28:  ["ground"],
  29:  ["poison"],
  30:  ["poison"],
  31:  ["poison", "ground"],
  32:  ["poison"],
  33:  ["poison"],
  34:  ["poison", "ground"],
  35:  ["normal"],
  36:  ["normal"],
  37:  ["fire"],
  38:  ["fire"],
  39:  ["normal"],
  40:  ["normal"],
  41:  ["poison", "flying"],
  42:  ["poison", "flying"],
  43:  ["grass", "poison"],
  44:  ["grass", "poison"],
  45:  ["grass", "poison"],
  46:  ["bug", "grass"],
  47:  ["bug", "grass"],
  48:  ["bug", "poison"],
  49:  ["bug", "poison"],
  50:  ["ground"],
  51:  ["ground"],
  52:  ["normal"],
  53:  ["normal"],
  54:  ["water"],
  55:  ["water"],
  56:  ["fighting"],
  57:  ["fighting"],
  58:  ["fire"],
  59:  ["fire"],
  60:  ["water"],
  61:  ["water"],
  62:  ["water", "fighting"],
  63:  ["psychic"],
  64:  ["psychic"],
  65:  ["psychic"],
  66:  ["fighting"],
  67:  ["fighting"],
  68:  ["fighting"],
  69:  ["grass", "poison"],
  70:  ["grass", "poison"],
  71:  ["grass", "poison"],
  72:  ["water", "poison"],
  73:  ["water", "poison"],
  74:  ["rock", "ground"],
  75:  ["rock", "ground"],
  76:  ["rock", "ground"],
  77:  ["fire"],
  78:  ["fire"],
  79:  ["water", "psychic"],
  80:  ["water", "psychic"],
  81:  ["electric", "steel"],
  82:  ["electric", "steel"],
  83:  ["normal", "flying"],
  84:  ["normal", "flying"],
  85:  ["normal", "flying"],
  86:  ["water"],
  87:  ["water", "ice"],
  88:  ["poison"],
  89:  ["poison"],
  90:  ["water"],
  91:  ["water", "ice"],
  92:  ["ghost", "poison"],
  93:  ["ghost", "poison"],
  94:  ["ghost", "poison"],
  95:  ["rock", "ground"],
  96:  ["psychic"],
  97:  ["psychic"],
  98:  ["water"],
  99:  ["water"],
  100: ["electric"],
  101: ["electric"],
  102: ["grass", "psychic"],
  103: ["grass", "psychic"],
  104: ["ground"],
  105: ["ground"],
  106: ["fighting"],
  107: ["fighting"],
  108: ["normal"],
  109: ["poison"],
  110: ["poison"],
  111: ["ground", "rock"],
  112: ["ground", "rock"],
  113: ["normal"],
  114: ["grass"],
  115: ["normal"],
  116: ["water"],
  117: ["water"],
  118: ["water"],
  119: ["water"],
  120: ["water"],
  121: ["water", "psychic"],
  122: ["psychic"],
  123: ["bug", "flying"],
  124: ["ice", "psychic"],
  125: ["electric"],
  126: ["fire"],
  127: ["bug"],
  128: ["normal"],
  129: ["water"],
  130: ["water", "flying"],
  131: ["water", "ice"],
  132: ["normal"],
  133: ["normal"],
  134: ["water"],
  135: ["electric"],
  136: ["fire"],
  137: ["normal"],
  138: ["rock", "water"],
  139: ["rock", "water"],
  140: ["rock", "water"],
  141: ["rock", "water"],
  142: ["rock", "flying"],
  143: ["normal"],
  144: ["ice", "flying"],
  145: ["electric", "flying"],
  146: ["fire", "flying"],
  147: ["dragon"],
  148: ["dragon"],
  149: ["dragon", "flying"],
  150: ["psychic"],
  151: ["psychic"],
};

// ── Utilities ───────────────────────────────────────────────────────────────

export function getLocalSprite(id: number): string {
  return `/pokemon/${id}.svg`;
}

export function formatStatName(stat: string): string {
  const MAP: Record<string, string> = {
    hp:                  "HP",
    attack:              "ATK",
    defense:             "DEF",
    "special-attack":    "SPA",
    "special-defense":   "SPD",
    speed:               "SPE",
  };
  return MAP[stat] ?? stat.toUpperCase().slice(0, 3);
}

export function statBarColor(value: number): string {
  if (value > 100) return "#5c6b52"; // high — olive
  if (value >= 50)  return "#a35b42"; // mid — terracotta
  return "#6e6860";                   // low — muted
}
