import { PageOverlays } from "@/components/layout/PageOverlays";

export default function IkenbakoLayout({ children }: { children: React.ReactNode }) {
  return <PageOverlays>{children}</PageOverlays>;
}
