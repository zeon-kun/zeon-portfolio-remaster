import { NextResponse } from "next/server";
import { COIN_IDS } from "@/lib/crypto";
import type { CoinId, PriceData } from "@/lib/crypto";

const IDS = COIN_IDS.join(",");
const DEMO_KEY = process.env.COINGECKO_API_KEY;
const PRO_KEY  = process.env.COINGECKO_PRO_API_KEY;

const BASE = PRO_KEY
  ? "https://pro-api.coingecko.com/api/v3"
  : "https://api.coingecko.com/api/v3";

const COINGECKO_URL =
  `${BASE}/coins/markets` +
  `?ids=${IDS}` +
  `&vs_currency=usd` +
  `&order=market_cap_desc` +
  `&per_page=10&page=1` +
  `&sparkline=true` +
  `&price_change_percentage=24h`;

export async function GET() {
  const headers: Record<string, string> = { accept: "application/json" };
  if (PRO_KEY)       headers["x-cg-pro-api-key"]  = PRO_KEY;
  else if (DEMO_KEY) headers["x-cg-demo-api-key"] = DEMO_KEY;

  try {
    const res = await fetch(COINGECKO_URL, {
      headers,
      next: { revalidate: 60 },
    });

    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      return NextResponse.json(
        { error: "rate_limited", retryAfter: retryAfter ? parseInt(retryAfter) : 60 },
        {
          status: 429,
          headers: retryAfter ? { "Retry-After": retryAfter } : {},
        }
      );
    }

    if (!res.ok) {
      return NextResponse.json({ error: "upstream" }, { status: 502 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any[] = await res.json();

    // Transform array → map keyed by coin ID (backward-compatible with CryptoTicker)
    const map: Partial<Record<CoinId, PriceData>> = {};
    for (const coin of raw) {
      if (COIN_IDS.includes(coin.id)) {
        map[coin.id as CoinId] = {
          usd: coin.current_price ?? 0,
          usd_24h_change: coin.price_change_percentage_24h ?? 0,
          market_cap: coin.market_cap ?? 0,
          market_cap_rank: coin.market_cap_rank ?? 0,
          total_volume: coin.total_volume ?? 0,
          circulating_supply: coin.circulating_supply ?? 0,
          total_supply: coin.total_supply ?? null,
          ath: coin.ath ?? 0,
          ath_change_percentage: coin.ath_change_percentage ?? 0,
          sparkline: coin.sparkline_in_7d?.price ?? [],
        };
      }
    }

    return NextResponse.json(map, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}
