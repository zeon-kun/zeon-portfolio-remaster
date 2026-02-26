import { PageOverlays } from "@/components/layout/PageOverlays";

export const metadata = { title: "支払い — Pay Me | Zeon" };

export default function PayMeLayout({ children }: { children: React.ReactNode }) {
  return <PageOverlays>{children}</PageOverlays>;
}
