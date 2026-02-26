import { PageOverlays } from "@/components/layout/PageOverlays";

export const metadata = { title: "市場 — Market | Zeon" };

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return <PageOverlays>{children}</PageOverlays>;
}
