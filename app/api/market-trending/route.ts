import { NextResponse } from "next/server";
import type { TrendingCoin } from "@/lib/crypto";

const DEMO_KEY = process.env.COINGECKO_API_KEY;
const PRO_KEY  = process.env.COINGECKO_PRO_API_KEY;

const BASE = PRO_KEY
  ? "https://pro-api.coingecko.com/api/v3"
  : "https://api.coingecko.com/api/v3";

export async function GET() {
  const headers: Record<string, string> = { accept: "application/json" };
  if (PRO_KEY)       headers["x-cg-pro-api-key"]  = PRO_KEY;
  else if (DEMO_KEY) headers["x-cg-demo-api-key"] = DEMO_KEY;

  try {
    const res = await fetch(`${BASE}/search/trending`, {
      headers,
      next: { revalidate: 600 }, // trending changes every ~10 min
    });

    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      return NextResponse.json(
        { error: "rate_limited" },
        { status: 429, headers: retryAfter ? { "Retry-After": retryAfter } : {} }
      );
    }

    if (!res.ok) {
      return NextResponse.json({ error: "upstream" }, { status: 502 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coins: TrendingCoin[] = (raw.coins ?? []).slice(0, 7).map((entry: any) => {
      const item = entry.item;
      return {
        id: item.id,
        name: item.name,
        symbol: item.symbol,
        market_cap_rank: item.market_cap_rank ?? null,
        price_usd: item.data?.price ?? "—",
        price_change_24h: item.data?.price_change_percentage_24h?.usd ?? 0,
        market_cap: item.data?.market_cap ?? "—",
      };
    });

    return NextResponse.json(coins, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" },
    });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}
