// ── Ratecard scoring engine — pure functions, no React ──────────────────────

export type Lang = "jp" | "en";
export type Bilingual = { jp: string; en: string };

export type DimensionId =
  | "scope"
  | "stackMatch"
  | "frontend"
  | "backend"
  | "integrations"
  | "infra"
  | "engagement";

export type TierPoints = 0 | 1 | 2 | 3;

export type Tier = {
  readonly points: TierPoints;
  readonly label: Bilingual;
};

export type Dimension = {
  readonly id: DimensionId;
  readonly weight: number;
  readonly question: Bilingual;
  readonly tiers: readonly [Tier, Tier, Tier, Tier];
};

export type Selections = Record<DimensionId, TierPoints>;

export type Tier4 = "simple" | "standard" | "complex" | "special";

export type ScoreResult = {
  score100: number;
  tier: Tier4;
  tierLabel: Bilingual;
  contributions: ReadonlyArray<{
    id: DimensionId;
    label: Bilingual;
    points: TierPoints;
    weighted: number; // normalised 0–1 contribution
  }>;
};

export type RateEstimate = {
  hours: { low: number; mid: number; high: number };
  idr: { low: number; high: number };
  idrFee: { low: number; high: number };
  usd: { low: number; high: number };
  weeks: { low: number; high: number };
};

// ── Dimensions ───────────────────────────────────────────────────────────────
// Weights sum to 1.00
export const DIMENSIONS: readonly Dimension[] = [
  {
    id: "scope",
    weight: 0.20,
    question: { jp: "プロジェクトの規模は？", en: "How large is the project scope?" },
    tiers: [
      { points: 0, label: { jp: "単一ページ・単一機能", en: "Single page or one feature" } },
      { points: 1, label: { jp: "数ページ・基本CRUD", en: "A few pages, basic CRUD" } },
      { points: 2, label: { jp: "複数モジュール・複数ロール", en: "Multiple modules, several user roles" } },
      { points: 3, label: { jp: "大規模プラットフォーム", en: "Large multi-domain platform" } },
    ],
  },
  {
    id: "stackMatch",
    weight: 0.10,
    question: {
      jp: "技術スタックの一致度は？",
      en: "How well does it match my core stack (Next.js + Laravel)?",
    },
    tiers: [
      // Tier 0 = exact match = least additional risk/effort
      { points: 0, label: { jp: "完全一致 (Next.js + Laravel)", en: "Exact match (Next.js + Laravel)" } },
      { points: 1, label: { jp: "ほぼ一致 (Inertia・Livewire等)", en: "Mostly match (Inertia/Livewire/Tailwind)" } },
      { points: 2, label: { jp: "部分的に異なる", en: "Partially different stack" } },
      { points: 3, label: { jp: "未知のスタック", en: "Unfamiliar stack / heavy learning curve" } },
    ],
  },
  {
    id: "frontend",
    weight: 0.15,
    question: { jp: "フロントエンドの複雑さは？", en: "How complex is the frontend / UX?" },
    tiers: [
      { points: 0, label: { jp: "静的・テンプレート流用", en: "Static / template-based" } },
      { points: 1, label: { jp: "標準フォーム・ダッシュボード", en: "Standard forms & dashboards" } },
      { points: 2, label: { jp: "カスタムUI・状態管理多め", en: "Custom UI, rich state, some animation" } },
      { points: 3, label: { jp: "高度なインタラクション・アニメ", en: "Heavy interaction / motion / realtime UI" } },
    ],
  },
  {
    id: "backend",
    weight: 0.20,
    question: { jp: "バックエンド・APIの複雑さは？", en: "How complex is the backend / API?" },
    tiers: [
      { points: 0, label: { jp: "なし・ヘッドレスCMSのみ", en: "None / headless CMS only" } },
      { points: 1, label: { jp: "REST CRUD・基本認証", en: "REST CRUD + basic auth" } },
      { points: 2, label: { jp: "複雑なロジック・複数ロール", en: "Complex logic, roles, jobs/queues" } },
      { points: 3, label: { jp: "高負荷・マルチサービス連携", en: "High-scale, multi-service, realtime" } },
    ],
  },
  {
    id: "integrations",
    weight: 0.15,
    question: { jp: "外部連携はどの程度？", en: "How much third-party integration?" },
    tiers: [
      { points: 0, label: { jp: "なし", en: "None" } },
      { points: 1, label: { jp: "1つの単純API", en: "One simple API" } },
      { points: 2, label: { jp: "決済 または 複数API", en: "Payment gateway OR several APIs" } },
      { points: 3, label: { jp: "決済 + 複数の重要連携", en: "Payment + multiple critical integrations" } },
    ],
  },
  {
    id: "infra",
    weight: 0.10,
    question: { jp: "デプロイ・インフラは？", en: "Deployment & infra requirements?" },
    tiers: [
      { points: 0, label: { jp: "Vercel・共有ホスティング", en: "Vercel / managed hosting" } },
      { points: 1, label: { jp: "単純なVPSデプロイ", en: "Simple VPS deploy" } },
      { points: 2, label: { jp: "VPS + DB + CI セットアップ", en: "VPS + DB + CI pipeline setup" } },
      { points: 3, label: { jp: "複雑なインフラ・コンテナ運用", en: "Complex infra / containers / ops" } },
    ],
  },
  {
    id: "engagement",
    weight: 0.10,
    question: { jp: "関与タイプと納期は？", en: "Engagement type & timeline?" },
    tiers: [
      { points: 0, label: { jp: "新規・余裕ある納期", en: "Greenfield, relaxed timeline" } },
      { points: 1, label: { jp: "新規・通常納期", en: "Greenfield, normal timeline" } },
      { points: 2, label: { jp: "既存改修 または タイトな納期", en: "Maintenance / legacy OR tight deadline" } },
      { points: 3, label: { jp: "レガシー改修 + 急ぎ + 高連携負荷", en: "Legacy + rush + heavy coordination" } },
    ],
  },
] as const;

// Verify weights sum (dev sanity check — values are fixed at compile time)
// 0.20 + 0.10 + 0.15 + 0.20 + 0.15 + 0.10 + 0.10 = 1.00 ✓

export const DEFAULT_SELECTIONS: Selections = {
  scope: 1,
  stackMatch: 1,
  frontend: 1,
  backend: 1,
  integrations: 1,
  infra: 1,
  engagement: 1,
};

// ── Rate constants ────────────────────────────────────────────────────────────
export const IDR_PER_HOUR = 200_000;
export const USD_PER_HOUR_LOW = 30;
export const USD_PER_HOUR_HIGH = 45;
// ⚠️ FX RATE — update manually. Last set: 2026-05. 1 USD ≈ IDR:
export const USD_TO_IDR = 16_000;

export const BASE_HOURS = 20;
export const MAX_MARGINAL_HOURS = 380;
export const HOURS_RANGE_SPREAD = 0.3;
export const HOURS_PER_WEEK = 25;

const FEE_MULTIPLIER: Record<Tier4, number> = {
  simple: 1.0,
  standard: 1.05,
  complex: 1.1,
  special: 1.15,
};

const TIER4_LABELS: Record<Tier4, Bilingual> = {
  simple: { jp: "簡単", en: "Simple" },
  standard: { jp: "標準", en: "Standard" },
  complex: { jp: "複雑", en: "Complex" },
  special: { jp: "特殊", en: "Specialized" },
};

// ── Heuristic pre-fill ────────────────────────────────────────────────────────

type PrefillRule = {
  keywords: string[];
  dimension: DimensionId;
  tier: TierPoints;
};

// Rules applied in order; each bumps dimension to at least `tier` (Math.max).
// Covers EN + Indonesian aliases.
const PREFILL_RULES: PrefillRule[] = [
  // scope
  { keywords: ["landing", "single page", "satu halaman", "halaman tunggal"], dimension: "scope", tier: 0 },
  {
    keywords: ["dashboard", "admin", "modul", "module", "multi-role", "peran", "multi modul", "multi-modul"],
    dimension: "scope",
    tier: 2,
  },
  {
    keywords: ["platform", "marketplace", "ekosistem", "ecosystem", "saas", "erp"],
    dimension: "scope",
    tier: 3,
  },

  // stackMatch — detect exact match (both next.js and laravel = tier 0 already default)
  { keywords: ["next.js", "nextjs", "next js"], dimension: "stackMatch", tier: 0 },
  { keywords: ["laravel"], dimension: "stackMatch", tier: 0 },
  { keywords: ["inertia", "livewire", "filament"], dimension: "stackMatch", tier: 1 },
  { keywords: ["wordpress", "vue", "angular", "django", "rails", "nuxt", "svelte"], dimension: "stackMatch", tier: 2 },

  // frontend
  { keywords: ["html/css", "html css", "html, css", "template", "tampilan"], dimension: "frontend", tier: 1 },
  {
    keywords: [
      "tailwind",
      "ui/ux",
      "ui ux",
      "design system",
      "animasi",
      "animation",
      "interaktif",
      "interactive",
      "figma",
      "responsive",
      "desain",
    ],
    dimension: "frontend",
    tier: 2,
  },
  {
    keywords: ["realtime ui", "real-time", "websocket", "micro-frontend", "motion"],
    dimension: "frontend",
    tier: 3,
  },

  // backend
  { keywords: ["api", "rest api", "rest", "endpoint", "backend", "back-end"], dimension: "backend", tier: 1 },
  {
    keywords: ["laravel", "php", "queue", "job", "auth", "role", "peran", "business logic", "logika bisnis"],
    dimension: "backend",
    tier: 2,
  },
  {
    keywords: ["websocket", "realtime", "real-time", "microservice", "micro service", "kafka", "redis"],
    dimension: "backend",
    tier: 3,
  },

  // integrations
  {
    keywords: [
      "third-party api",
      "third party",
      "pihak ketiga",
      "integrasi",
      "integration",
      "webhook",
      "sms",
      "whatsapp",
      "wa api",
    ],
    dimension: "integrations",
    tier: 2,
  },
  {
    keywords: [
      "payment gateway",
      "payment",
      "pembayaran",
      "midtrans",
      "xendit",
      "stripe",
      "paypal",
      "doku",
      "nicepay",
      "tripay",
    ],
    dimension: "integrations",
    tier: 2,
  },

  // infra
  { keywords: ["deploy", "vps", "hosting", "server"], dimension: "infra", tier: 1 },
  {
    keywords: ["docker", "ci/cd", "ci cd", "pipeline", "nginx", "ssl", "certbot", "pm2"],
    dimension: "infra",
    tier: 2,
  },
  { keywords: ["kubernetes", "k8s", "container orches", "cloud run", "ecs"], dimension: "infra", tier: 3 },

  // engagement
  {
    keywords: [
      "maintenance",
      "maintenanc",
      "debugging",
      "debug",
      "optimasi",
      "optimization",
      "legacy",
      "refactor",
      "perbaikan",
      "pemeliharaan",
    ],
    dimension: "engagement",
    tier: 2,
  },
  {
    keywords: [
      "deadline",
      "cepat",
      "mendesak",
      "urgent",
      "asap",
      "rush",
      "segera",
      "koordinasi",
      "coordination",
      "tim",
      "team",
    ],
    dimension: "engagement",
    tier: 2,
  },

  // scope elevators from backend/frontend signals
  { keywords: ["mysql", "postgresql", "postgres", "database", "db"], dimension: "backend", tier: 1 },
];

export function prefillFromText(text: string): Selections {
  if (!text.trim()) return { ...DEFAULT_SELECTIONS };

  const normalized = text.toLowerCase().replace(/\s+/g, " ");

  // Start from defaults; stackMatch starts at tier 0 only if BOTH Next.js AND Laravel detected
  const result: Selections = { ...DEFAULT_SELECTIONS };

  // Detect Next.js + Laravel co-occurrence for exact stackMatch=0
  const hasNext =
    normalized.includes("next.js") || normalized.includes("nextjs") || normalized.includes("next js");
  const hasLaravel = normalized.includes("laravel");
  if (hasNext && hasLaravel) {
    result.stackMatch = 0;
  } else if (hasNext || hasLaravel) {
    result.stackMatch = Math.max(result.stackMatch, 1) as TierPoints;
  }

  // Detect payment + third-party co-occurrence → integrations tier 3
  const hasPayment =
    normalized.includes("payment") ||
    normalized.includes("pembayaran") ||
    normalized.includes("midtrans") ||
    normalized.includes("xendit") ||
    normalized.includes("stripe");
  const hasThirdParty =
    normalized.includes("third") ||
    normalized.includes("pihak ketiga") ||
    normalized.includes("integrasi") ||
    normalized.includes("integration") ||
    normalized.includes("webhook");

  if (hasPayment && hasThirdParty) {
    result.integrations = 3;
  }

  for (const rule of PREFILL_RULES) {
    if (rule.keywords.some((kw) => normalized.includes(kw))) {
      result[rule.dimension] = Math.max(result[rule.dimension], rule.tier) as TierPoints;
    }
  }

  return result;
}

// ── Score computation ─────────────────────────────────────────────────────────

function toTier4(score100: number): Tier4 {
  if (score100 <= 24) return "simple";
  if (score100 <= 49) return "standard";
  if (score100 <= 74) return "complex";
  return "special";
}

export function computeScore(selections: Selections): ScoreResult {
  let rawWeighted = 0;
  const contributions: ScoreResult["contributions"][number][] = [];

  for (const dim of DIMENSIONS) {
    const points = selections[dim.id];
    const contribution = (points / 3) * dim.weight;
    rawWeighted += contribution;

    contributions.push({
      id: dim.id,
      label: dim.tiers[points].label,
      points,
      weighted: contribution,
    });
  }

  const score100 = Math.round(rawWeighted * 100);
  const tier = toTier4(score100);

  return { score100, tier, tierLabel: TIER4_LABELS[tier], contributions };
}

// ── Rate estimation ───────────────────────────────────────────────────────────

function roundToNearest(n: number, nearest: number): number {
  return Math.round(n / nearest) * nearest;
}

export function estimateRates(result: ScoreResult): RateEstimate {
  const midHours = BASE_HOURS + (result.score100 / 100) * MAX_MARGINAL_HOURS;
  const low = Math.round(midHours * (1 - HOURS_RANGE_SPREAD));
  const high = Math.round(midHours * (1 + HOURS_RANGE_SPREAD));

  const feeMulti = FEE_MULTIPLIER[result.tier];

  const idrLow = low * IDR_PER_HOUR;
  const idrHigh = high * IDR_PER_HOUR;

  return {
    hours: { low, mid: Math.round(midHours), high },
    idr: { low: idrLow, high: idrHigh },
    idrFee: {
      low: roundToNearest(idrLow * feeMulti, 100_000),
      high: roundToNearest(idrHigh * feeMulti, 100_000),
    },
    usd: { low: low * USD_PER_HOUR_LOW, high: high * USD_PER_HOUR_HIGH },
    weeks: {
      low: Math.ceil(low / HOURS_PER_WEEK),
      high: Math.ceil(high / HOURS_PER_WEEK),
    },
  };
}

// ── Formatting ────────────────────────────────────────────────────────────────

export function formatIDR(n: number): string {
  if (n >= 1_000_000) {
    const jt = n / 1_000_000;
    const formatted = Number.isInteger(jt) ? jt.toString() : jt.toFixed(1);
    return `Rp ${formatted} jt`;
  }
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export function formatUSD(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}
