export const COIN_IDS = [
  "bitcoin",
  "ethereum",
  "solana",
  "sui",
  "ripple",
  "hyperliquid",
  "render-token",
  "uniswap",
  "chainlink",
  "bittensor",
] as const;

export type CoinId = (typeof COIN_IDS)[number];

export const COIN_META: Record<CoinId, { symbol: string; name: string }> = {
  bitcoin: { symbol: "BTC", name: "Bitcoin" },
  ethereum: { symbol: "ETH", name: "Ethereum" },
  solana: { symbol: "SOL", name: "Solana" },
  sui: { symbol: "SUI", name: "Sui" },
  ripple: { symbol: "XRP", name: "XRP" },
  hyperliquid: { symbol: "HYPE", name: "Hyperliquid" },
  "render-token": { symbol: "RENDER", name: "Render" },
  uniswap: { symbol: "UNI", name: "Uniswap" },
  chainlink: { symbol: "LINK", name: "Chainlink" },
  bittensor: { symbol: "TAO", name: "Bittensor" },
};

export type PriceData = { usd: number; usd_24h_change: number };
export type PriceMap = Partial<Record<CoinId, PriceData>>;

export function formatPrice(price: number): string {
  if (price >= 10_000) {
    return "$" + price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  if (price >= 100) {
    return "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (price >= 1) {
    return "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
  }
  if (price < 0.001) return "$" + price.toFixed(6);
  return "$" + price.toFixed(4);
}

export function formatChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}
