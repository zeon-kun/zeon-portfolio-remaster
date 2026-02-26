"use client";

import { useEffect, useState, useRef } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { COIN_IDS, COIN_META, PriceMap, formatPrice, formatChange } from "@/lib/crypto";
import type { CoinId } from "@/lib/crypto";
import { TransitionLink } from "@/components/layout/TransitionLink";

type FetchResult =
  | { ok: true; data: PriceMap }
  | { ok: false; rateLimited: true; retryAfter: number }
  | { ok: false; rateLimited: false };

async function fetchPrices(): Promise<FetchResult> {
  try {
    const res = await fetch("/api/crypto", { cache: "no-store" });
    if (res.status === 429) {
      const ra = res.headers.get("Retry-After");
      return { ok: false, rateLimited: true, retryAfter: ra ? parseInt(ra) : 60 };
    }
    if (!res.ok) return { ok: false, rateLimited: false };
    return { ok: true, data: await res.json() };
  } catch {
    return { ok: false, rateLimited: false };
  }
}

export function CryptoTicker() {
  const [prices, setPrices] = useState<PriceMap>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [retryIn, setRetryIn] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCountdown(seconds: number) {
    setRetryIn(seconds);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setRetryIn((s) => {
        if (s <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  async function load() {
    const result = await fetchPrices();
    if (result.ok) {
      setPrices(result.data);
      setLastUpdated(new Date());
      setRateLimited(false);
      setRetryIn(0);
    } else if (result.rateLimited) {
      setRateLimited(true);
      startCountdown(result.retryAfter);
      // prices stay as-is — stale data is better than blank
    }
    // on generic error: also keep existing prices, just stop loading
    setLoading(false);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => {
      clearInterval(id);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasData = Object.keys(prices).length > 0;

  return (
    <div className="border-t border-foreground/8 pt-8 mt-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted/50">市場 / Market Pulse</span>
          <span className="w-1 h-1 bg-accent-primary/50" />

          {rateLimited ? (
            <span className="flex items-center gap-1 text-[9px] font-mono text-muted/40 uppercase tracking-wider">
              <AlertTriangle size={9} className="text-muted/40" />
              {retryIn > 0 ? `stale · retry in ${retryIn}s` : "stale data"}
            </span>
          ) : (
            <span className="text-[9px] font-mono text-muted/35 uppercase tracking-wider">via CoinGecko</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && !rateLimited && (
            <span className="text-[9px] font-mono text-muted/30 uppercase tracking-wider hidden sm:block">
              {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <TransitionLink
            href="/market"
            className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted/50 hover:text-accent-primary transition-colors border border-foreground/10 px-2 py-1 hover:border-accent-primary/30"
          >
            Full view →
          </TransitionLink>
        </div>
      </div>

      {/* Coin strip */}
      <div className={`flex flex-wrap gap-x-5 gap-y-3 transition-opacity duration-300 ${rateLimited && hasData ? "opacity-60" : "opacity-100"}`}>
        {COIN_IDS.map((id: CoinId) => {
          const meta = COIN_META[id];
          const data = prices[id];
          const isPos = data ? data.usd_24h_change >= 0 : null;

          return (
            <div key={id} className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-[10px] font-mono font-bold text-foreground/60 tracking-wider shrink-0">
                {meta.symbol}
              </span>
              {loading && !data ? (
                <span className="text-[10px] font-mono text-muted/30">—</span>
              ) : data ? (
                <>
                  <span className="text-[10px] font-mono text-foreground/80">{formatPrice(data.usd)}</span>
                  <span className={`text-[9px] font-mono shrink-0 ${isPos ? "text-accent-primary" : "text-muted/60"}`}>
                    {formatChange(data.usd_24h_change)}
                  </span>
                </>
              ) : (
                <span className="text-[10px] font-mono text-muted/30">—</span>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-1 text-muted/30">
            <RefreshCw size={9} className="animate-spin" />
            <span className="text-[9px] font-mono uppercase tracking-wider">updating</span>
          </div>
        )}
      </div>
    </div>
  );
}
