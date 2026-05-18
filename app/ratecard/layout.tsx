import { PageOverlays } from "@/components/layout/PageOverlays";

export default function RatecardLayout({ children }: { children: React.ReactNode }) {
  return <PageOverlays>{children}</PageOverlays>;
}
