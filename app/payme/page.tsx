import type { Metadata } from "next";
import { CopyAddress } from "@/components/payme/CopyAddress";
import { QrisCard } from "@/components/payme/QrisCard";
// import { SphereDecoration } from "@/components/payme/SphereDecoration";

export const metadata: Metadata = {
  title: "支払い — Pay Me | Zeon",
  description: "Payment options: QRIS (Indonesia) and Ethereum mainnet.",
};

export const dynamic = "force-static";

const ETH_ADDRESS = "0x821E2294f4413f88a458299914db394Ea3471C64";

export default function PayMePage() {
  return (
    <main className="min-h-screen pt-28 pb-24 md:pb-12 px-6 md:px-12 relative overflow-hidden">
      {/* Sphere decoration — EVE/planetarium backdrop */}
      {/* <div className="absolute inset-0 pointer-events-none">
        <SphereDecoration />
      </div> */}

      <div className="max-w-3xl mx-auto relative">
        {/* Page header */}
        <header className="mb-14 relative">
          {/* Vertical kanji — left edge */}
          <span
            aria-hidden="true"
            className="absolute -left-5 md:-left-8 top-0 writing-vertical text-[10px] font-mono text-foreground/10 tracking-widest select-none"
          >
            支払
          </span>

          {/* Top-right annotation */}
          <span
            aria-hidden="true"
            className="absolute right-0 top-0 text-[9px] font-mono text-muted/40 tracking-[0.2em] uppercase"
          >
            支払い / Payment
          </span>

          <h1 className="text-3xl md:text-4xl font-black kanji-brutal text-foreground mb-2">支払い</h1>
          <p className="text-xs font-mono uppercase tracking-[0.15em] text-muted">Pay Me — direct transfers only</p>
        </header>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* ── QRIS Card ── */}
          <QrisCard />

          {/* ── Ethereum Card ── */}
          <div className="border border-foreground/10 bg-background/40 backdrop-blur-sm p-6 space-y-5">
            {/* Card header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted/50 mb-1">Method 02</p>
                <h2 className="text-base font-black tracking-wider text-foreground">ETHEREUM</h2>
              </div>
              {/* ETH diamond accent */}
              <svg
                width="22"
                height="24"
                viewBox="0 0 22 24"
                aria-hidden="true"
                className="text-accent-primary/30 shrink-0"
              >
                <polygon points="11,0 22,8 11,12 0,8" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <polygon points="11,12 22,8 11,24 0,8" fill="none" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </div>

            {/* Network badge */}
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary/60" />
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted/50">Ethereum Mainnet</span>
            </div>

            {/* Address + copy */}
            <CopyAddress address={ETH_ADDRESS} />

            {/* Info note */}
            <p className="text-[10px] font-mono text-muted/40 leading-relaxed">
              ERC-20 compatible. Verify network before sending.
            </p>
          </div>
        </div>

        {/* Bottom annotation */}
        <p className="mt-10 text-[10px] font-mono text-muted/35 uppercase tracking-[0.2em] text-center">
          Direct transfer - dm me if you already paid.
        </p>
      </div>
    </main>
  );
}
