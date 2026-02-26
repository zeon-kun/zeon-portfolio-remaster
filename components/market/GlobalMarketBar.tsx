"use client";

import { useEffect, useState } from "react";
import { formatCompact, formatChange } from "@/lib/crypto";
import type { GlobalMarket } from "@/lib/crypto";

export function GlobalMarketBar() {
  const [data, setData] = useState<GlobalMarket | null>(null);

  useEffect(() => {
    fetch("/api/market-global")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && !d.error) setData(d); })
      .catch(() => {});
  }, []);

  const stats = data
    ? [
        { label: "Total MCap", value: formatCompact(data.total_market_cap_usd) },
        { label: "BTC Dom", value: `${data.btc_dominance.toFixed(1)}%` },
        { label: "ETH Dom", value: `${data.eth_dominance.toFixed(1)}%` },
        { label: "24H Vol", value: formatCompact(data.total_volume_usd) },
        { label: "Coins", value: data.active_cryptocurrencies.toLocaleString("en-US") },
        {
          label: "MCap 24H",
          value: formatChange(data.market_cap_change_24h),
          positive: data.market_cap_change_24h >= 0,
        },
      ]
    : null;

  return (
    <div className="border border-foreground/8 mb-8 overflow-x-auto">
      <div className="flex min-w-max md:min-w-0">
        {stats
          ? stats.map((s, i) => (
              <div
                key={s.label}
                className={`flex-1 px-4 py-3 space-y-1 ${i > 0 ? "border-l border-foreground/8" : ""}`}
              >
                <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted/40 whitespace-nowrap">
                  {s.label}
                </p>
                <p
                  className={`text-[11px] font-mono font-bold tracking-wide whitespace-nowrap ${
                    "positive" in s
                      ? s.positive
                        ? "text-accent-primary"
                        : "text-muted/70"
                      : "text-foreground/80"
                  }`}
                >
                  {s.value}
                </p>
              </div>
            ))
          : Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 px-4 py-3 space-y-1 ${i > 0 ? "border-l border-foreground/8" : ""}`}
              >
                <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted/20">
                  &nbsp;
                </p>
                <p className="text-[11px] font-mono text-muted/15">——</p>
              </div>
            ))}
      </div>
    </div>
  );
}
