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

export type PriceData = {
  usd: number;
  usd_24h_change: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  circulating_supply: number;
  total_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  sparkline: number[];
};

export type PriceMap = Partial<Record<CoinId, PriceData>>;

export type GlobalMarket = {
  total_market_cap_usd: number;
  total_volume_usd: number;
  btc_dominance: number;
  eth_dominance: number;
  market_cap_change_24h: number;
  active_cryptocurrencies: number;
};

export type TrendingCoin = {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number | null;
  price_usd: string;
  price_change_24h: number;
  market_cap: string;
};

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

export function formatCompact(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString("en-US")}`;
}
