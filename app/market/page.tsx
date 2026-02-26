"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { COIN_IDS, COIN_META, PriceMap, formatPrice, formatChange } from "@/lib/crypto";
import type { CoinId } from "@/lib/crypto";

export const dynamic = "force-static";

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

export default function MarketPage() {
  const [prices, setPrices] = useState<PriceMap>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [retryIn, setRetryIn] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCountdown(seconds: number) {
    setRetryIn(seconds);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setRetryIn((s) => {
        if (s <= 1) { clearInterval(countdownRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
  }

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    const result = await fetchPrices();
    if (result.ok) {
      setPrices(result.data);
      setLastUpdated(new Date());
      setRateLimited(false);
      setRetryIn(0);
      if (countdownRef.current) clearInterval(countdownRef.current);
    } else if (result.rateLimited) {
      setRateLimited(true);
      startCountdown(result.retryAfter);
      // keep existing prices — stale data is better than blank
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => load(), 60_000);
    return () => {
      clearInterval(id);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [load]);

  const hasData = Object.keys(prices).length > 0;

  return (
    <main className="min-h-screen pt-28 pb-24 md:pb-12 px-6 md:px-12">
      <div className="max-w-5xl mx-auto">

        {/* ── Page header ── */}
        <header className="mb-12 relative">
          <span aria-hidden="true" className="absolute -left-5 md:-left-8 top-0 writing-vertical text-[10px] font-mono text-foreground/10 tracking-widest select-none">
            相場
          </span>
          <span aria-hidden="true" className="absolute right-0 top-0 text-[9px] font-mono text-muted/40 tracking-[0.2em] uppercase">
            市場 / Market
          </span>

          <h1 className="text-3xl md:text-4xl font-black kanji-brutal text-foreground mb-2">市場</h1>
          <p className="text-xs font-mono uppercase tracking-[0.15em] text-muted">Watchlist — prices via CoinGecko</p>

          {/* Status row */}
          <div className="flex items-center gap-4 mt-5">
            {lastUpdated && (
              <span className="text-[9px] font-mono text-muted/40 uppercase tracking-wider">
                Updated {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
            <button
              onClick={() => load(true)}
              disabled={refreshing || rateLimited}
              aria-label="Refresh prices"
              className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-muted/50 hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <RefreshCw size={10} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            {!rateLimited && (
              <span className="text-[9px] font-mono text-muted/25 uppercase tracking-wider hidden sm:block">
                Auto-refresh 60s
              </span>
            )}
          </div>
        </header>

        {/* ── Rate limit banner ── */}
        {rateLimited && (
          <div className="flex items-center gap-3 border border-foreground/8 bg-foreground/3 px-4 py-3 mb-6">
            <AlertTriangle size={13} className="text-muted/50 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono text-muted/60 uppercase tracking-wider">
                CoinGecko rate limit reached
                {hasData && " — showing last known prices"}
              </p>
            </div>
            {retryIn > 0 && (
              <span className="text-[10px] font-mono text-muted/40 uppercase tracking-wider shrink-0">
                Retry in {retryIn}s
              </span>
            )}
          </div>
        )}

        {/* ── Coin grid ── */}
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 transition-opacity duration-500 ${rateLimited && hasData ? "opacity-50" : "opacity-100"}`}>
          {COIN_IDS.map((id: CoinId, idx) => {
            const meta = COIN_META[id];
            const data = prices[id];
            const isPos = data ? data.usd_24h_change >= 0 : null;
            const padIdx = String(idx + 1).padStart(2, "0");

            return (
              <div
                key={id}
                className="relative border border-foreground/8 bg-background/40 backdrop-blur-sm p-4 md:p-5 space-y-3 hover:border-foreground/15 transition-colors duration-200"
              >
                {/* Top row: index + change badge */}
                <div className="flex items-start justify-between">
                  <span className="text-[9px] font-mono text-muted/30 tracking-widest">{padIdx}</span>
                  {data ? (
                    <span className={`text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 border ${
                      isPos
                        ? "text-accent-primary border-accent-primary/20 bg-accent-primary/5"
                        : "text-muted/60 border-foreground/8"
                    }`}>
                      {formatChange(data.usd_24h_change)}
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-muted/20 border border-foreground/5 px-1.5 py-0.5">
                      — %
                    </span>
                  )}
                </div>

                {/* Price — hero number */}
                <div>
                  {loading && !data ? (
                    <div className="h-7 flex items-center">
                      <span className="text-[10px] font-mono text-muted/20 tracking-wider">loading...</span>
                    </div>
                  ) : data ? (
                    <p className="text-xl md:text-2xl font-mono font-bold text-foreground leading-none tracking-tight">
                      {formatPrice(data.usd)}
                    </p>
                  ) : (
                    <p className="text-xl md:text-2xl font-mono font-bold text-foreground/20 leading-none">—</p>
                  )}
                </div>

                {/* Coin identity */}
                <div className="flex items-baseline gap-2 border-t border-foreground/6 pt-3">
                  <span className="text-xs font-black tracking-widest text-foreground/70">{meta.symbol}</span>
                  <span className="text-[10px] font-mono text-muted/40 uppercase tracking-wide">{meta.name}</span>
                </div>

                <span className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-foreground/8" />
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <p className="mt-10 text-[10px] font-mono text-muted/30 uppercase tracking-[0.2em] text-center">
          Prices in USD · Data from CoinGecko · Not financial advice
        </p>
      </div>
    </main>
  );
}
