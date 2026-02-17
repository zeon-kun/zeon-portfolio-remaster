import { PageOverlays } from "@/components/layout/PageOverlays";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <PageOverlays>{children}</PageOverlays>;
}
