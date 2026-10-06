import { getRealtimeStockData } from "../src/data/realtimeQuote.js";
import { enrichWithFinancials } from "../src/data/financialData.js";
import { calculateFundamentalScan, generateLocalReport } from "../src/utils/stockCalculator.js";
import type { StockData } from "../src/types/stock.js";

// DeepSeek 统一 AI 客户端 (OpenAI 兼容 chat/completions 接口)
const DEEPSEEK_BASE_URL = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "");
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callDeepSeek(options: {
  system: string;
  user: string;
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  history?: DeepSeekMessage[];
}): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const messages: DeepSeekMessage[] = [
    { role: "system", content: options.system },
    ...(options.history || []),
    { role: "user", content: options.user },
  ];

  const body: Record<string, unknown> = {
    model: DEEPSEEK_MODEL,
    messages,
    temperature: options.temperature ?? 0.2,
    stream: false,
  };
  if (options.json) {
    body.response_format = { type: "json_object" };
  }
  if (options.maxTokens) {
    body.max_tokens = options.maxTokens;
  }

  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`DeepSeek API error ${response.status}: ${raw.slice(0, 500)}`);
  }

  const data = JSON.parse(raw);
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek returned an empty response");
  }
  return content;
}

const VERDICT_ZH = ['强烈推荐建仓', '建议分批逢低吸纳', '观望/持有', '风险偏高谨慎观望'] as const;
const VERDICT_EN: Record<(typeof VERDICT_ZH)[number], string> = {
  '强烈推荐建仓': 'Strong Buy',
  '建议分批逢低吸纳': 'Accumulate',
  '观望/持有': 'Hold',
  '风险偏高谨慎观望': 'Caution / Wait',
};

export async function loadCanonicalStock(symbol: string): Promise<StockData> {
  const clean = String(symbol || '').trim().toUpperCase();
  if (!clean) {
    throw new Error('缺少股票代码');
  }
  const raw = await getRealtimeStockData(clean);
  const enriched = await enrichWithFinancials(raw);
  return { ...enriched, fundamentals: calculateFundamentalScan(enriched) };
}

export function clampMacroSlider(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 5;
  return Math.min(10, Math.max(1, n));
}

export function sanitizeAiReport(report: any, stock: StockData, macroSlider: number) {
  const local = generateLocalReport(stock, macroSlider);
  const verdictZh = VERDICT_ZH.includes(report?.verdictZh) ? report.verdictZh : local.verdictZh;
  const score = Number(report?.fiveStepScore);
  const text = (value: unknown, fallback: string) => (typeof value === 'string' && value.trim() ? value : fallback);
  return {
    summary: text(report?.summary, local.summary),
    macroDiagnosis: text(report?.macroDiagnosis, local.macroDiagnosis),
    fundamentalDiagnosis: text(report?.fundamentalDiagnosis, local.fundamentalDiagnosis),
    valuationDiagnosis: text(report?.valuationDiagnosis, local.valuationDiagnosis),
    technicalDiagnosis: text(report?.technicalDiagnosis, local.technicalDiagnosis),
    fiveStepScore: Number.isFinite(score) ? Math.min(100, Math.max(0, Math.round(score))) : local.fiveStepScore,
    verdict: VERDICT_EN[verdictZh as (typeof VERDICT_ZH)[number]],
    verdictZh,
    keyRisksToWatch: Array.isArray(report?.keyRisksToWatch)
      ? report.keyRisksToWatch.filter((item: unknown) => typeof item === 'string').slice(0, 5)
      : local.keyRisksToWatch,
    recommendedAction: text(report?.recommendedAction, local.recommendedAction),
    source: 'ai' as const,
  };
}

export function parseJsonResponse(text: string): any {
  let cleaned = text.trim();
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    cleaned = fence[1].trim();
  }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }
  return JSON.parse(cleaned);
}
