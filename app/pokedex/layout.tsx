import { PageOverlays } from "@/components/layout/PageOverlays";

export const metadata = { title: "図鑑 — Pokédex | Zeon" };

export default function PokedexLayout({ children }: { children: React.ReactNode }) {
  return <PageOverlays>{children}</PageOverlays>;
}
