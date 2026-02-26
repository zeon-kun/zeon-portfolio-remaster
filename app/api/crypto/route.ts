import { NextResponse } from "next/server";
import { COIN_IDS } from "@/lib/crypto";

const IDS = COIN_IDS.join(",");
const DEMO_KEY = process.env.COINGECKO_API_KEY;
const PRO_KEY  = process.env.COINGECKO_PRO_API_KEY;

// Pro API uses a different base URL
const BASE = PRO_KEY
  ? "https://pro-api.coingecko.com/api/v3"
  : "https://api.coingecko.com/api/v3";

const COINGECKO_URL = `${BASE}/simple/price?ids=${IDS}&vs_currencies=usd&include_24hr_change=true`;

export async function GET() {
  const headers: Record<string, string> = { accept: "application/json" };
  if (PRO_KEY)       headers["x-cg-pro-api-key"]  = PRO_KEY;
  else if (DEMO_KEY) headers["x-cg-demo-api-key"] = DEMO_KEY;

  try {
    const res = await fetch(COINGECKO_URL, {
      headers,
      next: { revalidate: 60 }, // cache upstream response 60s in Next.js data cache
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

    const data = await res.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}
