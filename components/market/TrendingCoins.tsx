"use client";

import { useEffect, useState } from "react";
import { formatChange } from "@/lib/crypto";
import type { TrendingCoin } from "@/lib/crypto";
import { TrendingUp } from "lucide-react";

export function TrendingCoins() {
  const [coins, setCoins] = useState<TrendingCoin[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/market-trending")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d)) setCoins(d);
        else setError(true);
      })
      .catch(() => setError(true));
  }, []);

  if (error) return null;

  return (
    <section className="mt-10 border-t border-foreground/8 pt-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <TrendingUp size={11} className="text-muted/40" />
        <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted/50">
          トレンド / Trending by Search
        </span>
        <span className="w-1 h-1 bg-foreground/15" />
        <span className="text-[9px] font-mono text-muted/30 uppercase tracking-wider">
          top 7 · 24h · CoinGecko
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {coins
          ? coins.map((coin, idx) => {
              const isPos = coin.price_change_24h >= 0;
              return (
                <div
                  key={coin.id}
                  className="relative border border-foreground/6 bg-background/30 px-3 py-3 space-y-2 hover:border-foreground/12 transition-colors duration-200"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[8px] font-mono text-muted/25 tracking-widest">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    {coin.market_cap_rank && (
                      <span className="text-[8px] font-mono text-muted/30 tracking-wider">
                        #{coin.market_cap_rank}
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-mono font-bold text-foreground/75 tracking-wider leading-none">
                      {coin.symbol.toUpperCase()}
                    </p>
                    <p className="text-[9px] font-mono text-muted/40 tracking-wide mt-0.5 truncate">
                      {coin.name}
                    </p>
                  </div>

                  <div className="border-t border-foreground/5 pt-2 space-y-0.5">
                    <p className="text-[10px] font-mono text-foreground/60 leading-none">
                      {coin.price_usd}
                    </p>
                    <p
                      className={`text-[9px] font-mono font-bold leading-none ${
                        isPos ? "text-accent-primary" : "text-muted/50"
                      }`}
                    >
                      {formatChange(coin.price_change_24h)}
                    </p>
                  </div>

                  <span className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-foreground/6" />
                </div>
              );
            })
          : Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="border border-foreground/5 bg-background/20 px-3 py-3 space-y-2"
              >
                <div className="h-2 w-4 bg-foreground/6" />
                <div className="h-3 w-8 bg-foreground/6" />
                <div className="h-2 w-12 bg-foreground/4 mt-2" />
              </div>
            ))}
      </div>
    </section>
  );
}
