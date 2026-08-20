import { PageOverlays } from "@/components/layout/PageOverlays";

export const metadata = { title: "予約 — Booking | Zeon" };

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <PageOverlays>{children}</PageOverlays>;
}
