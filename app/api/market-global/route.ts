import { NextResponse } from "next/server";
import type { GlobalMarket } from "@/lib/crypto";

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
    const res = await fetch(`${BASE}/global`, {
      headers,
      next: { revalidate: 300 }, // global stats change slowly — cache 5 min
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
    const { data }: { data: any } = await res.json();

    const payload: GlobalMarket = {
      total_market_cap_usd: data.total_market_cap?.usd ?? 0,
      total_volume_usd: data.total_volume?.usd ?? 0,
      btc_dominance: data.market_cap_percentage?.btc ?? 0,
      eth_dominance: data.market_cap_percentage?.eth ?? 0,
      market_cap_change_24h: data.market_cap_change_percentage_24h_usd ?? 0,
      active_cryptocurrencies: data.active_cryptocurrencies ?? 0,
    };

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}
