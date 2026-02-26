import type { PokemonListEntry } from "@/lib/pokemon";
import { PokedexClient } from "@/components/pokedex/PokedexClient";

export const dynamic = "force-static";

async function fetchGen1List(): Promise<PokemonListEntry[]> {
  try {
    const res = await fetch(
      "https://pokeapi.co/api/v2/pokemon?limit=151&offset=0",
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results as { name: string; url: string }[]).map((entry) => {
      const parts = entry.url.replace(/\/$/, "").split("/");
      const id = parseInt(parts[parts.length - 1], 10);
      return { id, name: entry.name };
    });
  } catch {
    return [];
  }
}

export default async function PokedexPage() {
  const initialList = await fetchGen1List();
  return <PokedexClient initialList={initialList} />;
}
