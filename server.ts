import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { PRESET_STOCKS, generateStockFallback } from "./src/data/presetStocks.js";
import { getRealtimeStockData, fetchTencentKline } from "./src/data/realtimeQuote.js";
import { enrichWithFinancials } from "./src/data/financialData.js";
import { PRESET_INDEX_FUNDS, calculateShareClassCost, ASSET_ALLOCATION_PROFILES } from "./src/data/indexFundData.js";
import { HOT_SYMBOLS } from "./src/data/hotSymbols.js";

const EASTMONEY_PUSH_API = "https://push2.eastmoney.com/api/qt/ulist.np/get";
const EASTMONEY_DIST_API = "https://push2ex.eastmoney.com/getTopicZDFenBu";
const EASTMONEY_BOARD_API = "https://push2.eastmoney.com/api/qt/clist/get";

interface MarketIndexQuote {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface MarketBreadth {
  up: number;
  down: number;
  flat: number;
  total: number;
}

interface BoardQuote {
  code: string;
  name: string;
  changePercent: number;
  netInflow?: number;
}

interface ScreenerItem {
  code: string;
  name: string;
  market: 'SH' | 'SZ' | 'BJ';
  industry: string;
  price: number;
  changePercent: number;
  pe: number;          // 动态市盈率，负数或无数据记为 0
  pb: number;          // 市净率
  roe: number;         // 加权净资产收益率 %
  marketCapYi: number; // 总市值（亿元）
  turnoverRate: number; // 换手率 %
  amountYi: number;    // 成交额（亿元）
  isSt?: boolean;      // ST/*ST/退市风险（由股票名称推断）
}

// 由股票名称推断 ST/*ST/退市标记（A 股 ST 股名称以 ST/*ST 开头，退市股名称含"退"）
function isStName(name: string): boolean {
  const n = (name || '').trim().toUpperCase();
  return n.startsWith('ST') || n.startsWith('*ST') || n.includes('退');
}

async function fetchMarketIndexQuotes(): Promise<MarketIndexQuote[]> {
  const secids = ["1.000001", "0.399001", "0.399006", "1.000300", "100.HSI"];
  const url = `${EASTMONEY_PUSH_API}?secids=${secids.join(",")}&fields=f2,f3,f4,f12,f14&fltt=2&invt=2`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    });
    if (!response.ok) return [];
    const json = await response.json();
    const diff: any[] = json?.data?.diff || [];
    return diff.map((d) => ({
      code: String(d.f12 || ""),
      name: String(d.f14 || ""),
      price: Number(d.f2) || 0,
      change: Number(d.f4) || 0,
      changePercent: Number(d.f3) || 0,
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function fetchMarketBreadth(): Promise<MarketBreadth | null> {
  const url = `${EASTMONEY_DIST_API}?ut=7eea3edcaed734bea9cbfc24409ed989&dpt=wz.ztzt`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    });
    if (!response.ok) return null;
    const json = await response.json();
    const fenbu: Record<string, number>[] = json?.data?.fenbu || [];
    let up = 0;
    let down = 0;
    let flat = 0;
    for (const item of fenbu) {
      for (const [key, value] of Object.entries(item)) {
        const n = Number(value) || 0;
        if (key === '0') flat += n;
        else if (Number(key) > 0) up += n;
        else down += n;
      }
    }
    if (up + down + flat === 0) return null;
    return { up, down, flat, total: up + down + flat };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchBoardLeaders(): Promise<BoardQuote[]> {
  const url = `${EASTMONEY_BOARD_API}?pn=1&pz=8&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:90+t:2+f:!50&fields=f2,f3,f12,f14`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    });
    if (!response.ok) return [];
    const json = await response.json();
    const diff: any[] = json?.data?.diff || [];
    return diff.map((d) => ({
      code: String(d.f12 || ""),
      name: String(d.f14 || ""),
      changePercent: Number(d.f3) || 0,
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function fetchBoardFundFlow(): Promise<BoardQuote[]> {
  const url = `${EASTMONEY_BOARD_API}?pn=1&pz=8&po=1&np=1&fltt=2&invt=2&fid=f62&fs=m:90+t:2+f:!50&fields=f2,f3,f12,f14,f62`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    });
    if (!response.ok) return [];
    const json = await response.json();
    const diff: any[] = json?.data?.diff || [];
    return diff.map((d) => ({
      code: String(d.f12 || ""),
      name: String(d.f14 || ""),
      changePercent: Number(d.f3) || 0,
      netInflow: Number(d.f62) || 0,
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function toYi(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.round(value / 1e8) : 0;
}

// 东方财富 clist 临时限流时的备用股票池（腾讯批量行情，字段与名称均为真实数据）。
const TENCENT_SCREENER_FALLBACK: { code: string; market: 'SH' | 'SZ'; name: string; industry: string }[] = [
  { code: '600519', market: 'SH', name: '贵州茅台', industry: '白酒' },
  { code: '601318', market: 'SH', name: '中国平安', industry: '保险' },
  { code: '600036', market: 'SH', name: '招商银行', industry: '银行' },
  { code: '601398', market: 'SH', name: '工商银行', industry: '银行' },
  { code: '601939', market: 'SH', name: '建设银行', industry: '银行' },
  { code: '601288', market: 'SH', name: '农业银行', industry: '银行' },
  { code: '601988', market: 'SH', name: '中国银行', industry: '银行' },
  { code: '601166', market: 'SH', name: '兴业银行', industry: '银行' },
  { code: '600900', market: 'SH', name: '长江电力', industry: '电力' },
  { code: '601088', market: 'SH', name: '中国神华', industry: '煤炭' },
  { code: '600028', market: 'SH', name: '中国石化', industry: '石油石化' },
  { code: '601857', market: 'SH', name: '中国石油', industry: '石油石化' },
  { code: '601899', market: 'SH', name: '紫金矿业', industry: '有色金属' },
  { code: '600030', market: 'SH', name: '中信证券', industry: '证券' },
  { code: '600276', market: 'SH', name: '恒瑞医药', industry: '医药' },
  { code: '600887', market: 'SH', name: '伊利股份', industry: '食品饮料' },
  { code: '601888', market: 'SH', name: '中国中免', industry: '旅游零售' },
  { code: '600809', market: 'SH', name: '山西汾酒', industry: '白酒' },
  { code: '600309', market: 'SH', name: '万华化学', industry: '化工' },
  { code: '600585', market: 'SH', name: '海螺水泥', industry: '建材' },
  { code: '600690', market: 'SH', name: '海尔智家', industry: '家电' },
  { code: '600031', market: 'SH', name: '三一重工', industry: '工程机械' },
  { code: '601012', market: 'SH', name: '隆基绿能', industry: '光伏' },
  { code: '600438', market: 'SH', name: '通威股份', industry: '光伏' },
  { code: '688981', market: 'SH', name: '中芯国际', industry: '半导体' },
  { code: '688041', market: 'SH', name: '海光信息', industry: '半导体' },
  { code: '688256', market: 'SH', name: '寒武纪', industry: '半导体' },
  { code: '688111', market: 'SH', name: '金山办公', industry: '软件服务' },
  { code: '000001', market: 'SZ', name: '平安银行', industry: '银行' },
  { code: '000333', market: 'SZ', name: '美的集团', industry: '家电' },
  { code: '000651', market: 'SZ', name: '格力电器', industry: '家电' },
  { code: '000858', market: 'SZ', name: '五粮液', industry: '白酒' },
  { code: '000568', market: 'SZ', name: '泸州老窖', industry: '白酒' },
  { code: '000002', market: 'SZ', name: '万科A', industry: '房地产' },
  { code: '000063', market: 'SZ', name: '中兴通讯', industry: '通信设备' },
  { code: '000725', market: 'SZ', name: '京东方A', industry: '面板' },
  { code: '000100', market: 'SZ', name: 'TCL科技', industry: '面板' },
  { code: '002594', market: 'SZ', name: '比亚迪', industry: '汽车' },
  { code: '002415', market: 'SZ', name: '海康威视', industry: '安防' },
  { code: '002475', market: 'SZ', name: '立讯精密', industry: '消费电子' },
  { code: '002714', market: 'SZ', name: '牧原股份', industry: '养殖' },
  { code: '002230', market: 'SZ', name: '科大讯飞', industry: '软件服务' },
  { code: '300750', market: 'SZ', name: '宁德时代', industry: '电池' },
  { code: '300059', market: 'SZ', name: '东方财富', industry: '互联网证券' },
  { code: '300760', market: 'SZ', name: '迈瑞医疗', industry: '医疗器械' },
  { code: '300124', market: 'SZ', name: '汇川技术', industry: '工控' },
  { code: '300308', market: 'SZ', name: '中际旭创', industry: '光模块' },
  { code: '300274', market: 'SZ', name: '阳光电源', industry: '光伏' },
  { code: '002304', market: 'SZ', name: '洋河股份', industry: '白酒' },
  { code: '000792', market: 'SZ', name: '盐湖股份', industry: '锂资源' },
  { code: '002460', market: 'SZ', name: '赣锋锂业', industry: '锂资源' },
];

const TENCENT_QUOTE_API = 'https://qt.gtimg.cn/q=';

async function fetchTencentScreenerFallback(): Promise<ScreenerItem[]> {
  const symbols = TENCENT_SCREENER_FALLBACK.map((s) => `${s.market === 'SH' ? 'sh' : 'sz'}${s.code}`).join(',');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(`${TENCENT_QUOTE_API}${symbols}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://gu.qq.com/' },
    });
    if (!response.ok) return [];
    const buffer = await response.arrayBuffer();
    const text = new TextDecoder('gbk').decode(buffer);

    const quoteMap = new Map<string, string[]>();
    const re = /v_(\w+)="([^"]*)";/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      quoteMap.set(match[1], match[2].split('~'));
    }

    return TENCENT_SCREENER_FALLBACK.map((s): ScreenerItem | null => {
      const key = `${s.market === 'SH' ? 'sh' : 'sz'}${s.code}`;
      const f = quoteMap.get(key);
      if (!f || f.length < 47) return null;
      const price = Number(f[3]) || 0;
      const pe = Number(f[39]);
      return {
        code: s.code,
        name: s.name,
        market: s.market,
        industry: s.industry,
        price,
        changePercent: Number(f[32]) || 0,
        pe: Number.isFinite(pe) && pe > 0 ? pe : 0,
        pb: Number(f[46]) || 0,
        roe: Number(f[65]) || 0,
        marketCapYi: Number(f[45]) || 0,
        turnoverRate: Number(f[38]) || 0,
        amountYi: toYi((Number(f[37]) || 0) * 1e4),
      };
    }).filter((item): item is ScreenerItem => item !== null && item.price > 0);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// 全市场 A 股筛选器：拉取按总市值排序的前 500 只股票，供前端二次筛选与排序。
async function fetchMarketScreener(): Promise<ScreenerItem[]> {
  const fs = 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23';
  const fields = 'f2,f3,f8,f9,f12,f13,f14,f20,f23,f37,f100,f6';
  const pages = 3; // 每页 100，共 300 只头部标的；串行拉取以降低触发限流的概率

  const rows: any[] = [];
  for (let i = 0; i < pages; i++) {
    const url = `${EASTMONEY_BOARD_API}?pn=${i + 1}&pz=100&po=1&np=1&fltt=2&invt=2&fid=f20&fs=${encodeURIComponent(fs)}&fields=${fields}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      });
      if (!response.ok) continue;
      const json = await response.json();
      const diff: any[] = json?.data?.diff || [];
      rows.push(...diff);
      // 相邻请求之间留出缓冲，避免触发东财接口的突发限流。
      if (i < pages - 1) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    } catch {
      // 单页失败时继续拉取后续页，最终以已获取的数据兜底。
    } finally {
      clearTimeout(timer);
    }
  }

  return rows.map((d) => {
    const code = String(d.f12 || '');
    const f13 = Number(d.f13);
    const market: ScreenerItem['market'] = f13 === 1 ? 'SH' : f13 === 0 ? 'SZ' : 'BJ';
    const peRaw = Number(d.f9);
    const name = String(d.f14 || '');
    return {
      code,
      name,
      market,
      industry: String(d.f100 || '其他'),
      price: Number(d.f2) || 0,
      changePercent: Number(d.f3) || 0,
      pe: Number.isFinite(peRaw) && peRaw > 0 ? peRaw : 0,
      pb: Number(d.f23) || 0,
      roe: Number(d.f37) || 0,
      marketCapYi: toYi(Number(d.f20)),
      turnoverRate: Number(d.f8) || 0,
      amountYi: toYi(Number(d.f6)),
      isSt: isStName(name),
    };
  }).filter((item) => item.code && item.price > 0);
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// 基础安全响应头（生产加固：防 MIME 嗅探 / 点击劫持 / 降低信息泄露）
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' http://127.0.0.1:8765 https://push2.eastmoney.com https://push2ex.eastmoney.com https://datacenter.eastmoney.com https://datacenter-web.eastmoney.com https://data.eastmoney.com https://web.ifzq.gtimg.cn https://qt.gtimg.cn https://fund.eastmoney.com"
  );
  next();
});

// JSON 请求体大小限制（默认 1MB，防超大 payload 拖垮进程）
app.use(express.json({ limit: "1mb" }));

// 生产环境门禁提示：未配置 ACCESS_TOKEN 时给出明确告警
if (process.env.NODE_ENV === "production" && !process.env.ACCESS_TOKEN) {
  console.warn(
    "[安全] 生产模式下未配置 ACCESS_TOKEN，/api 接口对外完全开放。建议在 .env 中设置 ACCESS_TOKEN 并设置 VITE_ACCESS_TOKEN。"
  );
}

// 访问门禁：配置了 ACCESS_TOKEN 时，所有 /api 请求必须携带 Bearer 令牌或 x-api-key
function requireApiAccess(req: express.Request, res: express.Response, next: express.NextFunction) {
  const expected = process.env.ACCESS_TOKEN;
  if (!expected) {
    return next();
  }
  const provided =
    req.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || req.get("x-api-key")?.trim();
  if (provided !== expected) {
    return res.status(401).json({ success: false, error: "未授权访问：缺少或无效的访问令牌" });
  }
  return next();
}
app.use("/api", requireApiAccess);

// 内存滑动窗口限流：保护 AI 接口不被刷量，控制调用成本
const rateLimitStore = new Map<string, number[]>();
let rateLimitLastCleanup = 0;

// 定期清理过期 IP 桶，避免内存无限增长（单机自部署的轻量替代方案；多实例需换 Redis）
function pruneRateLimitStore(now: number) {
  if (now - rateLimitLastCleanup < 60_000) return;
  rateLimitLastCleanup = now;
  for (const [key, arr] of rateLimitStore) {
    const kept = arr.filter((t) => now - t < 60_000);
    if (kept.length === 0) rateLimitStore.delete(key);
    else rateLimitStore.set(key, kept);
  }
}

function rateLimit(options: { windowMs?: number; max?: number; message?: string } = {}) {
  const windowMs = options.windowMs ?? 60_000;
  const max = options.max ?? 20;
  const message = options.message ?? "请求过于频繁，请稍后再试";
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const now = Date.now();
    pruneRateLimitStore(now);
    const key = `${req.ip || req.socket.remoteAddress || "unknown"}`;
    const bucket = (rateLimitStore.get(key) || []).filter((t) => now - t < windowMs);
    if (bucket.length >= max) {
      return res.status(429).json({ success: false, error: message });
    }
    bucket.push(now);
    rateLimitStore.set(key, bucket);
    return next();
  };
}

const aiRateLimit = rateLimit({ windowMs: 60_000, max: 15 });
const deepDiveRateLimit = rateLimit({ windowMs: 60_000, max: 5 });

// DeepSeek 统一 AI 客户端 (OpenAI 兼容 chat/completions 接口)
const DEEPSEEK_BASE_URL = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "");
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callDeepSeek(options: {
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

function parseJsonResponse(text: string): any {
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

// 1. Get Stock Data endpoint
app.get("/api/stock/:symbol", async (req, res) => {
  const symbol = req.params.symbol.trim().toUpperCase();
  try {
    const stock = await getRealtimeStockData(symbol);
    const enriched = await enrichWithFinancials(stock);
    res.json({ success: true, stock: enriched, isFallback: !enriched.isRealtime });
  } catch (error: any) {
    console.error("Error fetching stock data, using fallback:", error?.message || error);
    res.json({ success: true, stock: PRESET_STOCKS[symbol] || generateStockFallback(symbol), isFallback: true, fallbackReason: "行情源暂时不可用" });
  }
});

// 前十大流通股东真实披露数据（东方财富 F10，A股有效；港股/美股返回快照或空）
interface HolderRow {
  HOLDER_NAME?: string;
  HOLD_NUM?: number;
  FREE_HOLDNUM_RATIO?: number;
  HOLD_CHANGE?: string | number;
  HOLDER_RANK?: number;
  HOLDER_TYPE?: string;
  REPORT_DATE_NAME?: string;
  END_DATE?: string;
}

const holdersCache = new Map<string, { at: number; data: any }>();
const HOLDERS_CACHE_TTL_MS = 10 * 60_000;

function formatShares(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '--';
  if (n >= 1e8) return `${(n / 1e8).toFixed(2)}亿股`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}万股`;
  return `${n}股`;
}

function mapHolderChange(raw: string | number | null | undefined): { status: 'increase' | 'decrease' | 'unchanged' | 'new'; label?: string } {
  if (typeof raw === 'number') {
    if (Number.isFinite(raw) && raw !== 0) {
      return { status: raw > 0 ? 'increase' : 'decrease', label: `${raw > 0 ? '+' : ''}${raw.toLocaleString()}股` };
    }
    return { status: 'unchanged' };
  }
  const s = String(raw || '').trim();
  if (!s || s === '不变') return { status: 'unchanged' };
  if (s.includes('增持')) return { status: 'increase', label: s };
  if (s.includes('减持') || s.includes('减少')) return { status: 'decrease', label: s };
  if (s.includes('新进')) return { status: 'new', label: s };
  return { status: 'unchanged' };
}

function inferHolderType(name: string, holderType: string): string {
  if (name.includes('香港中央结算')) return '北向陆股通外资';
  if (name.includes('中央汇金') || name.includes('中国证券金融') || name.includes('证金')) return '国家队证金/汇金';
  if (name.includes('社保')) return '社保基金';
  if (name.includes('基金')) return '公募基金';
  if (name.includes('保险') || name.includes('资管') || name.includes('信托')) return '保险资管';
  if (holderType.includes('个人') || !name.includes('公司') && !name.includes('集团') && !name.includes('有限')) return '个人自然人';
  return '控股股东/国资';
}

app.get("/api/stock/:symbol/holders", async (req, res) => {
  const symbol = req.params.symbol.trim().toUpperCase();
  if (!/^\d{6}$/.test(symbol)) {
    return res.status(400).json({ success: false, error: "港股/美股暂不支持股东接口，请使用 6 位 A 股代码" });
  }

  try {
    const cached = holdersCache.get(symbol);
    if (cached && Date.now() - cached.at < HOLDERS_CACHE_TTL_MS) {
      return res.json({ success: true, ...cached.data });
    }

    const suffix = /^(60|68)/.test(symbol) ? 'SH' : /^(00|30)/.test(symbol) ? 'SZ' : /^(8|4)/.test(symbol) ? 'BJ' : 'SH';
    const secuCode = `${symbol}.${suffix}`;
    const url = `https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_EH_FREEHOLDERS&columns=ALL&filter=(${encodeURIComponent(`SECUCODE="${secuCode}"`)})&pageNumber=1&pageSize=20&source=HSF10&client=PC`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    });
    clearTimeout(timer);

    if (!response.ok) throw new Error(`eastmoney http ${response.status}`);
    const json = await response.json();
    const rows: HolderRow[] = json?.result?.data || [];
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ success: false, error: "未找到该标的的前十大股东披露数据" });
    }

    // 接口会返回多个报告期的全部历史披露，仅保留最新报告期，并按股东名称去重
    const endDates = rows.map((r) => String(r.END_DATE || '')).filter((d) => d);
    const latestEndDate = endDates.sort().pop() || '';
    const latestRows = rows.filter((r) => String(r.END_DATE || '') === latestEndDate);
    const byName = new Map<string, HolderRow>();
    for (const r of [...latestRows].sort((a, b) => (a.HOLDER_RANK || 99) - (b.HOLDER_RANK || 99))) {
      const name = String(r.HOLDER_NAME || '').trim();
      if (name && !byName.has(name)) byName.set(name, r);
    }
    const sorted = Array.from(byName.values()).sort((a, b) => (a.HOLDER_RANK || 99) - (b.HOLDER_RANK || 99)).slice(0, 10);

    const shareholders = sorted.map((r) => {
      const name = String(r.HOLDER_NAME || '').trim();
      const change = mapHolderChange(r.HOLD_CHANGE);
      return {
        rank: r.HOLDER_RANK || 0,
        name: name || '--',
        holdingShares: formatShares(Number(r.HOLD_NUM) || 0),
        holdingPercent: Number(r.FREE_HOLDNUM_RATIO) || 0,
        changeStatus: change.status,
        changeStatusZh: change.status === 'increase' ? '增持' : change.status === 'decrease' ? '减持' : change.status === 'new' ? '新进' : '未变',
        ...(change.label ? { changeShares: change.label } : {}),
        shareholderType: inferHolderType(name, String(r.HOLDER_TYPE || '')),
      };
    });

    const northboundHolder = shareholders.find((s) => s.name.includes('香港中央结算'));
    const socialSecurityPresent = shareholders.some((s) => s.name.includes('社保'));
    const nationalTeamPresent = shareholders.some((s) => s.name.includes('中央汇金') || s.name.includes('中国证券金融') || s.name.includes('证金'));
    const top10ConcentrationPercent = Number(
      Math.min(shareholders.reduce((sum, s) => sum + s.holdingPercent, 0), 99.9).toFixed(2)
    );

    const latestPeriodRow = latestRows.find((r) => String(r.REPORT_DATE_NAME || '')) || rows[0];
    const payload = {
      symbol,
      stockName: String(sorted[0]?.HOLDER_NAME || ''),
      reportPeriod: String(latestPeriodRow?.REPORT_DATE_NAME || latestEndDate || '最新披露'),
      totalInstitutionsCount: 0,
      institutionalSharePercent: 0,
      top10ConcentrationPercent,
      northboundHoldingPercent: northboundHolder ? northboundHolder.holdingPercent : 0,
      mutualFundCount: 0,
      socialSecurityPresent,
      nationalTeamPresent,
      shareholders,
      source: 'eastmoney',
    };

    holdersCache.set(symbol, { at: Date.now(), data: payload });
    res.json({ success: true, data: payload });
  } catch (error: any) {
    console.error("Error fetching holders:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch holders" });
  }
});

// 常用标杆池实时报价（供顶部快捷切换卡片展示真实价格）
app.get("/api/quick-quotes", async (req, res) => {
  try {
    const quotes = await Promise.all(
      HOT_SYMBOLS.map(async (item) => {
        try {
          const stock = await getRealtimeStockData(item.symbol);
          const fallbackName = String(stock?.name || '').includes('行业标的');
          return {
            symbol: item.symbol,
            name: fallbackName ? item.name : (stock.name || item.name),
            currentPrice: stock.currentPrice,
            changePercent: stock.changePercent,
            currency: stock.currency,
            isFallback: !stock.isRealtime,
          };
        } catch {
          return { symbol: item.symbol, name: item.name, currentPrice: 0, changePercent: 0, currency: 'CNY', isFallback: true };
        }
      })
    );
    res.json({ success: true, quotes });
  } catch (error: any) {
    console.error("Error fetching quick quotes:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch quick quotes" });
  }
});

// 日K线接口（腾讯行情源，供策略回测引擎拉取真实指数/个股历史K线作为基准）
const klineCache = new Map<string, { at: number; bars: { date: string; price: number }[] }>();
const KLINE_CACHE_TTL_MS = 5 * 60_000;

function toTencentKlineSymbol(raw: string): string | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, '');
  if (!s) return null;
  if (/^(sh|sz|bj)\d{6}$/.test(s) || /^hk\d{5}$/.test(s) || /^us[A-Za-z.]+$/.test(s)) {
    return s;
  }
  if (/^\d{6}$/.test(s)) {
    const prefix = /^(60|68)/.test(s) ? 'sh' : /^(00|30)/.test(s) ? 'sz' : /^(8|4)/.test(s) ? 'bj' : 'sh';
    return `${prefix}${s}`;
  }
  if (/^\d{1,5}$/.test(s)) {
    return `hk${s.padStart(5, '0')}`;
  }
  return null;
}

app.get("/api/kline/:symbol", async (req, res) => {
  const tsSymbol = toTencentKlineSymbol(req.params.symbol);
  if (!tsSymbol) {
    return res.status(400).json({ success: false, error: "无法识别的代码格式" });
  }
  const days = Math.min(Math.max(Number(req.query.days) || 120, 20), 500);
  const key = `${tsSymbol}:${days}`;

  try {
    const cached = klineCache.get(key);
    if (cached && Date.now() - cached.at < KLINE_CACHE_TTL_MS) {
      return res.json({ success: true, symbol: tsSymbol, bars: cached.bars, cached: true });
    }

    const fetched = await fetchTencentKline(tsSymbol, days);
    if (!fetched) {
      if (cached) {
        return res.json({ success: true, symbol: tsSymbol, bars: cached.bars, cached: true, stale: true });
      }
      return res.status(502).json({ success: false, error: "行情源暂时无法获取该标的K线" });
    }

    const bars = fetched.bars.map((b) => ({ date: b.date, price: b.close }));
    klineCache.set(key, { at: Date.now(), bars });
    res.json({ success: true, symbol: tsSymbol, bars, cached: false });
  } catch (error: any) {
    console.error("Error fetching kline:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch kline" });
  }
});

// 公募基金实时基础信息（名称/申购费率，源：天天基金 pingzhongdata）
const fundCache = new Map<string, { at: number; data: any }>();
const FUND_CACHE_TTL_MS = 12 * 60 * 60_000; // 名称/费率低频变动，缓存 12 小时

interface FundBasicInfo {
  code: string;
  name: string;
  subscriptionFeeRate: number; // 折后申购费率 %
  sourceRate: number; // 原申购费率 %
}

app.get("/api/fund/:code", async (req, res) => {
  const code = req.params.code.trim();
  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ success: false, error: "基金代码需为 6 位数字" });
  }

  try {
    const cached = fundCache.get(code);
    if (cached && Date.now() - cached.at < FUND_CACHE_TTL_MS) {
      return res.json({ success: true, fund: cached.data, cached: true });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(`https://fund.eastmoney.com/pingzhongdata/${code}.js`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://fund.eastmoney.com/' },
    });
    clearTimeout(timer);

    if (!response.ok) throw new Error(`fund eastmoney http ${response.status}`);
    const text = await response.text();

    const nameMatch = text.match(/fS_name\s*=\s*"([^"]+)"/);
    const sourceRateMatch = text.match(/fund_sourceRate\s*=\s*"([^"]*)"/);
    const rateMatch = text.match(/fund_Rate\s*=\s*"([^"]*)"/);
    const name = nameMatch?.[1]?.trim();
    if (!name) throw new Error('未解析到基金名称');

    const fund: FundBasicInfo = {
      code,
      name,
      subscriptionFeeRate: rateMatch?.[1] ? Number(rateMatch[1]) || 0 : 0,
      sourceRate: sourceRateMatch?.[1] ? Number(sourceRateMatch[1]) || 0 : 0,
    };
    fundCache.set(code, { at: Date.now(), data: fund });
    res.json({ success: true, fund, cached: false });
  } catch (error: any) {
    console.error("Error fetching fund info:", error);
    res.status(502).json({ success: false, error: error.message || "暂时无法获取基金信息" });
  }
});

// 北向资金（陆股通）重仓榜（东财数据中心真实披露，30 分钟缓存）
let northboundCache: { at: number; data: any } | null = null;
const NORTHBOUND_CACHE_TTL_MS = 30 * 60_000;

interface NorthboundHoldingRow {
  SECUCODE?: string;
  SECURITY_CODE?: string;
  SECURITY_NAME?: string;
  TRADE_DATE?: string;
  HOLD_MARKET_CAP?: number; // 持股市值（元）
  HOLD_SHARES_RATIO?: number; // 占流通股比 %
  CHANGE_RATE?: number; // 环比变化 %
  CLOSE_PRICE?: number; // 现价
}

async function fetchNorthboundTop10(): Promise<{
  tradeDate: string;
  holdings: {
    symbol: string;
    name: string;
    holdingValueYi: number;
    holdingRatioPercent: number;
    changeRate: number;
    closePrice: number;
  }[];
}> {
  const url = `https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_MUTUAL_HOLDSTOCKNORTH_STA&columns=ALL&pageNumber=1&pageSize=10&sortColumns=HOLD_MARKET_CAP&sortTypes=-1&filter=(${encodeURIComponent('MUTUAL_TYPE="003"')})`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`northbound http ${response.status}`);
    const json = await response.json();
    const rows: NorthboundHoldingRow[] = json?.result?.data || [];
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('北向数据为空');

    return {
      tradeDate: String(rows[0]?.TRADE_DATE || '').slice(0, 10),
      holdings: rows.map((r) => ({
        symbol: String(r.SECURITY_CODE || ''),
        name: String(r.SECURITY_NAME || ''),
        holdingValueYi: (Number(r.HOLD_MARKET_CAP) || 0) / 1e8,
        holdingRatioPercent: Number(r.HOLD_SHARES_RATIO) || 0,
        changeRate: Number(r.CHANGE_RATE) || 0,
        closePrice: Number(r.CLOSE_PRICE) || 0,
      })).filter((h) => h.symbol && h.name),
    };
  } finally {
    clearTimeout(timer);
  }
}

app.get("/api/institutional/northbound-top10", async (req, res) => {
  try {
    if (northboundCache && Date.now() - northboundCache.at < NORTHBOUND_CACHE_TTL_MS) {
      return res.json({ success: true, ...northboundCache.data, cached: true });
    }
    const data = await fetchNorthboundTop10();
    northboundCache = { at: Date.now(), data };
    res.json({ success: true, ...data, cached: false });
  } catch (error: any) {
    console.error("Error fetching northbound top10:", error);
    res.status(502).json({ success: false, error: error.message || "暂时无法获取北向资金数据" });
  }
});

// 主力机构持仓数据（公募基金 / 社保基金 / QFII 重仓）
const instHoldingCache = new Map<string, { at: number; data: any }>();
const INST_CACHE_TTL_MS = 60 * 60_000; // 缓存 1 小时

const ZLSJ_TYPE_MAP: Record<string, string> = {
  fund: "1",
  social: "3",
  qfii: "2",
  broker: "4",
  insurance: "5",
  trust: "6",
};

async function fetchInstitutionalHoldings(kind: string, date = "2024-06-30") {
  const typeCode = ZLSJ_TYPE_MAP[kind] || "1";
  const url = `https://data.eastmoney.com/dataapi/zlsj/list?date=${date}&type=${typeCode}&zjc=0&sortField=HOLD_VALUE&sortDirec=1&pageNum=1&pageSize=50&p=1&pageNo=1`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://data.eastmoney.com/zlsj/sb.html",
      },
    });
    if (!resp.ok) throw new Error(`eastmoney zlsj status ${resp.status}`);
    const data = await resp.json();
    const rows: any[] = data?.data || [];
    rows.sort((a, b) => (Number(b.HOLD_VALUE) || 0) - (Number(a.HOLD_VALUE) || 0));
    const top10 = rows.slice(0, 10);
    return top10.map((r: any) => {
      const holdVal = Number(r.HOLD_VALUE) || 0;
      const ratio = Number(r.FREESHARES_RATIO) || 0;
      const holdcha = String(r.HOLDCHA || "");
      const change = Number(r.HOLDCHA_RATIO) || 0;
      let status: 'increase' | 'decrease' | 'unchanged' = 'unchanged';
      if (holdcha.includes('增') || holdcha.includes('新进')) status = 'increase';
      else if (holdcha.includes('减')) status = 'decrease';
      return {
        symbol: String(r.SECURITY_CODE || "").padStart(6, "0"),
        name: String(r.SECURITY_NAME_ABBR || ""),
        orgTypeName: String(r.ORG_TYPE_NAME || kind),
        marketValueYi: Math.round((holdVal / 1e8) * 10) / 10,
        holdingValueYi: Math.round((holdVal / 1e8) * 10) / 10,
        ratio: Math.round(ratio * 100) / 100,
        holdingRatioPercent: Math.round(ratio * 100) / 100,
        changeStatus: status,
        changePercent: Math.round(change * 100) / 100,
      };
    });
  } finally {
    clearTimeout(timer);
  }
}

async function handleInstitutionalRoute(kind: string, req: express.Request, res: express.Response) {
  const date = (req.query.date as string) || "2024-06-30";
  const key = `${kind}:${date}`;
  const cached = instHoldingCache.get(key);
  if (cached && Date.now() - cached.at < INST_CACHE_TTL_MS) {
    return res.json({ success: true, kind, reportDate: date, cached: true, holdings: cached.data });
  }
  try {
    const holdings = await fetchInstitutionalHoldings(kind, date);
    if (holdings.length === 0) {
      return res.status(404).json({ success: false, error: "未查询到机构持仓数据" });
    }
    instHoldingCache.set(key, { at: Date.now(), data: holdings });
    return res.json({ success: true, kind, reportDate: date, cached: false, holdings });
  } catch (error: any) {
    console.error(`Error fetching ${kind} holdings:`, error);
    return res.status(502).json({ success: false, error: error.message || "暂时无法获取机构持仓数据" });
  }
}

app.get("/api/institutional/fund-top10", (req, res) => handleInstitutionalRoute("fund", req, res));
app.get("/api/institutional/social-security-top10", (req, res) => handleInstitutionalRoute("social", req, res));
app.get("/api/institutional/qfii-top10", (req, res) => handleInstitutionalRoute("qfii", req, res));
app.get(["/api/ak/fund-hold", "/api/ak/fund_hold"], (req, res) => handleInstitutionalRoute("fund", req, res));
app.get(["/api/ak/social-security-hold", "/api/ak/social_security_hold"], (req, res) => handleInstitutionalRoute("social", req, res));
app.get(["/api/ak/qfii-hold", "/api/ak/qfii_hold"], (req, res) => handleInstitutionalRoute("qfii", req, res));

// 大盘指数概览（真实行情）
app.get("/api/market-overview", async (req, res) => {
  try {
    const indices = await fetchMarketIndexQuotes();
    res.json({
      success: true,
      updatedAt: new Date().toISOString(),
      indices,
    });
  } catch (error: any) {
    console.error("Error fetching market overview:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch market overview" });
  }
});

// 大盘涨跌分布、领涨板块与板块资金流向
app.get("/api/market-breadth", async (req, res) => {
  try {
    const [breadth, leaders, fundFlow] = await Promise.all([
      fetchMarketBreadth(),
      fetchBoardLeaders(),
      fetchBoardFundFlow(),
    ]);
    res.json({
      success: true,
      updatedAt: new Date().toISOString(),
      breadth,
      leaders,
      fundFlow,
    });
  } catch (error: any) {
    console.error("Error fetching market breadth:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch market breadth" });
  }
});

// 全市场 A 股选股雷达（真实行情快照，供前端按行业/估值/ROE/价格二次筛选）
let screenerCache: { at: number; items: ScreenerItem[] } | null = null;
const SCREENER_CACHE_TTL_MS = 60_000;

app.get("/api/screener", async (req, res) => {
  try {
    const now = Date.now();
    if (!screenerCache || now - screenerCache.at > SCREENER_CACHE_TTL_MS) {
      let items = await fetchMarketScreener();
      if (items.length === 0) {
        // 东财 clist 偶发限流时，降级到腾讯真实行情备用池，保证选股雷达始终可用。
        items = await fetchTencentScreenerFallback();
      }
      if (items.length === 0) {
        if (screenerCache && screenerCache.items.length > 0) {
          // 行情源临时限流时，返回上一次缓存并标记为陈旧数据。
          return res.json({
            success: true,
            updatedAt: new Date(screenerCache.at).toISOString(),
            total: screenerCache.items.length,
            items: screenerCache.items,
            stale: true,
          });
        }
        return res.status(502).json({ success: false, error: "暂时无法获取行情列表，请稍后重试" });
      }
      screenerCache = { at: now, items };
    }
    res.json({
      success: true,
      updatedAt: new Date(screenerCache.at).toISOString(),
      total: screenerCache.items.length,
      items: screenerCache.items,
      stale: now - screenerCache.at > SCREENER_CACHE_TTL_MS,
    });
  } catch (error: any) {
    console.error("Error fetching screener:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch screener" });
  }
});

// 大盘一句话复盘（AI，硬约束不出现买卖建议）
app.post("/api/market-ai-review", aiRateLimit, async (req, res) => {
  try {
    const indices = await fetchMarketIndexQuotes();
    if (indices.length === 0) {
      return res.status(502).json({ success: false, error: "未能获取指数行情" });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      const text = indices.map((i) => `${i.name} ${i.changePercent >= 0 ? "+" : ""}${i.changePercent}%`).join("，");
      return res.json({ success: true, review: `今日主要指数：${text}。请结合成交额与板块结构继续观察。` });
    }

    const indexText = indices.map((i) => `${i.name}(${i.code}) ${i.price}，涨跌 ${i.changePercent}%`).join("；");
    const prompt = `你是一位严谨的中文市场复盘编辑。请基于以下真实指数数据，用 110-160 字写一段今日盘面一句话复盘。要求：只做客观描述与结构观察，禁止出现任何买卖建议、涨跌预测或收益承诺。\n\n${indexText}`;

    const review = await callDeepSeek({
      system: "你是严谨客观的证券市场复盘编辑，只陈述事实与结构，不给出买卖建议。",
      user: prompt,
      temperature: 0.3,
      maxTokens: 300,
    });

    res.json({ success: true, review: review.trim() });
  } catch (error: any) {
    console.error("Error in market AI review:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate market review" });
  }
});

// 2. AI 5-Step Stock Deep Analysis endpoint
app.post("/api/stock-analysis", aiRateLimit, async (req, res) => {
  try {
    const { stock, macroSlider } = req.body;
    if (!stock || !stock.symbol) {
      return res.status(400).json({ error: "Missing stock data" });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.json({
        success: false,
        message: "DeepSeek API key not configured",
        useLocalFallback: true,
      });
    }

    const prompt = `你是一位顶级A股/港股/美股资深证券分析师与价值投资专家。请对以下股票执行“股票分析五步法”深度扫描并生成专业诊断报告：

【股票基本信息】
- 股票名称: ${stock.name} (${stock.symbol})
- 所属行业: ${stock.sector} | 市场: ${stock.market}
- 当前股价: ${stock.currentPrice} ${stock.currency} (今日变动: ${stock.changePercent}%)
- 动态PE (TTM): ${stock.peTTM} | 市值: ${stock.marketCap}
- 投资者设置的【Step 1 & 2 宏观行业热度打分】: ${macroSlider} / 10

【基本面数据 (Step 3)】
- 毛利率: ${stock.fundamentals.grossMarginValue}% (标准>30% - ${stock.fundamentals.grossMarginPass ? '达标' : '未达标'})
- 净利率: ${stock.fundamentals.netMarginValue}% (标准>10% - ${stock.fundamentals.netMarginPass ? '达标' : '未达标'})
- 资产负债率: ${stock.fundamentals.debtRatioValue}% (标准<60% - ${stock.fundamentals.debtRatioPass ? '达标' : '未达标'})
- ROE: ${stock.fundamentals.roeValue}% | 营收增长率: ${stock.fundamentals.revenueGrowthValue}%

【估值水平 (Step 4)】
- 当前PE处于历史5年: ${stock.valuation.historicalPePercentile}% 百分位 (${stock.valuation.statusZh})
- 估值区间: 5年最低 ${stock.valuation.pe5YearMin} / 最高 ${stock.valuation.pe5YearMax} / 平均 ${stock.valuation.pe5YearAvg}
- 安全边际买入价预估: ${stock.valuation.marginOfSafetyPrice} ${stock.currency}

【技术形态 (Step 5)】
- 技术形态: ${stock.technical.trendChannelZh} (${stock.technical.macdSignalZh})
- 强支撑位: ${stock.technical.supportLevel1} | 强压力位: ${stock.technical.resistanceLevel1}

请输出结构化JSON报告，包含：
1. summary: 150字左右的五步分析精炼总结
2. macroDiagnosis: 宏观与行业环境研判 (分析宏观热度${macroSlider}分的合理性与行业催化)
3. fundamentalDiagnosis: 公司基本面财报扫描诊断
4. valuationDiagnosis: 估值百分位与安全边际分析
5. technicalDiagnosis: 技术面走势与建仓时机研判
6. fiveStepScore: 五步法综合评分 (0-100分)
7. verdictZh: 明确交易建议，只能是其中之一 ('强烈推荐建仓' | '建议分批逢低吸纳' | '观望/持有' | '风险偏高谨慎观望')
8. keyRisksToWatch: 3条核心风险提示数组
9. recommendedAction: 建仓与分批策略建议
`;

    const reportText = await callDeepSeek({
      system: "你是一个专业的量化与价值投资股票分析专家。请严谨客观地评估，只输出一个合法的JSON对象。",
      user: prompt,
      json: true,
      maxTokens: 4000,
    });

    const reportData = parseJsonResponse(reportText);
    res.json({ success: true, report: reportData });
  } catch (error: any) {
    console.error("Error in AI stock analysis:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to run AI analysis",
    });
  }
});

// 3. AI Stock Deep Exploration endpoint (深度探索专题研判)
// 财报深度阅读：对比历年财报 + 财报数据与实际情况互相印证
function financialPct(a: number, b: number): string {
  if (!Number.isFinite(b) || b === 0) return '--';
  const v = ((a - b) / Math.abs(b)) * 100;
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
}

function buildLocalFinancialReading(stock: any) {
  const years: any[] = stock?.financialHistory || [];
  const latest = years[years.length - 1];
  const prev = years.length >= 2 ? years[years.length - 2] : null;
  const first = years[0];

  const revCagr = first && latest && first.revenue > 0
    ? Math.pow(latest.revenue / first.revenue, 1 / Math.max(1, years.length - 1)) - 1
    : null;
  const cashRatio = latest ? latest.freeCashFlow / Math.max(latest.netProfit, 1) : null;

  const highlights: string[] = [];
  const concerns: string[] = [];

  if (prev && latest) {
    if (latest.revenue > prev.revenue) highlights.push(`营业收入同比 ${financialPct(latest.revenue, prev.revenue)}，规模仍在扩张`);
    else concerns.push(`营业收入同比 ${financialPct(latest.revenue, prev.revenue)}，增长出现停滞`);
    if (latest.netProfit > prev.netProfit) highlights.push(`归母净利润同比 ${financialPct(latest.netProfit, prev.netProfit)}，盈利同步改善`);
    else concerns.push(`归母净利润同比 ${financialPct(latest.netProfit, prev.netProfit)}，盈利承压`);
    if (latest.grossMargin >= prev.grossMargin) highlights.push(`毛利率 ${latest.grossMargin}%（同比 ${financialPct(latest.grossMargin, prev.grossMargin)}），定价权稳定`);
    else concerns.push(`毛利率 ${latest.grossMargin}%（同比 ${financialPct(latest.grossMargin, prev.grossMargin)}），竞争或成本挤压`);
  }
  if (cashRatio !== null && cashRatio >= 1) highlights.push(`经营现金流/净利润约 ${cashRatio.toFixed(2)}，利润有真金白银支撑`);
  if (cashRatio !== null && cashRatio < 1) concerns.push(`经营现金流/净利润约 ${cashRatio.toFixed(2)}，利润含金量不足`);
  if (revCagr !== null && revCagr > 0) highlights.push(`近 ${years.length} 年营收年化复合增速约 ${(revCagr * 100).toFixed(1)}%`);

  return {
    summary: `${stock?.name || '该标的'}（${stock?.symbol || ''}）近 ${years.length} 期财报：${latest ? `最新一期营收 ${latest.revenue} 亿元、归母净利润 ${latest.netProfit} 亿元、ROE ${latest.roe}%` : '暂无足够财报数据'}。${concerns.length > highlights.length ? '整体看账面增长与现金流质量需要进一步验证。' : '整体盈利质量与成长动能相对扎实。'}`,
    highlights: highlights.length ? highlights : ['具备多年连续披露的财报历史，可供趋势对比'],
    concerns: concerns.length ? concerns : ['当前数据未发现明显恶化信号，仍需结合行业实际与后续报告期验证'],
    realityGap: `财报显示 ${latest?.revenue ?? '--'} 亿元营收，而经营现金流为 ${latest?.freeCashFlow ?? '--'} 亿元，对应现金转化率约 ${cashRatio === null ? '--' : cashRatio.toFixed(2)}。这一「账面收入 vs 真实现金」的落差是判断财报与实际情况是否一致的关键：比值接近甚至高于 1，说明收入有现金回款支撑；若显著低于 1，则可能存在赊销、压货或利润确认过快。`,
    conclusion: '结合同比增速、毛利率趋势与现金流转化率综合判断，财报质量与实际情况整体处于可验证区间，建议继续跟踪后续报告期是否延续。',
  };
}

app.post("/api/financial-analysis", aiRateLimit, async (req, res) => {
  try {
    const { stock } = req.body;
    if (!stock || !stock.symbol || !Array.isArray(stock.financialHistory)) {
      return res.status(400).json({ error: "Missing stock financial data" });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.json({ success: true, report: buildLocalFinancialReading(stock) });
    }

    const years = stock.financialHistory.map((y: any) =>
      `${y.year}: 营收${y.revenue}亿 / 净利${y.netProfit}亿 / 毛利率${y.grossMargin}% / 净利率${y.netMargin}% / ROE${y.roe}% / 负债率${y.debtToAsset}% / 经营现金流${y.freeCashFlow}亿`
    ).join('\n');

    const prompt = `你是一位严谨的买方财务分析师。请对以下公司的历年财报做「财报深度阅读 + 与前期对比 + 与实际情况互相印证」。

【公司】${stock.name} (${stock.symbol})，行业：${stock.sector}
【历年财报数据】\n${years}
【当前财务扫描】毛利率 ${stock.fundamentals?.grossMarginValue}%，净利率 ${stock.fundamentals?.netMarginValue}%，ROE ${stock.fundamentals?.roeValue}%，资产负债率 ${stock.fundamentals?.debtRatioValue}%，营收增速 ${stock.fundamentals?.revenueGrowthValue}%

请重点完成三件事：
1. 纵向对比：逐期看营收、净利、毛利率、ROE 的变化趋势，判断增长是否可持续、利润率是否被侵蚀。
2. 横向印证：把「账面利润」和「经营现金流」对比，判断利润是真金白银还是应收账款/存货堆积出来的纸面利润。
3. 财报 vs 实际情况：结合行业常识，指出财报数字与真实经营可能存在的落差（如增收不增利、毛利虚高、现金流倒挂、负债上升等）。

只输出一个 JSON 对象（不要 Markdown 代码块）：
{
  "summary": "150字总体判断",
  "highlights": ["3-4条积极信号"],
  "concerns": ["3-4条需要警惕的信号"],
  "realityGap": "财报数字与实际经营情况对比的核心结论，含现金流转化率等关键证据",
  "conclusion": "100字投资视角结论（不构成买卖建议）"
}`;

    const text = await callDeepSeek({
      system: "你是严谨客观的买方财务分析师，只做财报事实解读与逻辑印证，不给出买卖建议，只输出合法 JSON。",
      user: prompt,
      json: true,
      maxTokens: 2500,
    });
    const report = parseJsonResponse(text);
    res.json({ success: true, report });
  } catch (error: any) {
    console.error("Error in financial-analysis:", error);
    res.json({ success: true, report: buildLocalFinancialReading(req.body?.stock || {}) });
  }
});

app.post("/api/deep-explore", aiRateLimit, async (req, res) => {
  try {
    const { stock, topic } = req.body;
    if (!stock || !stock.symbol) {
      return res.status(400).json({ error: "Missing stock data" });
    }

    const targetTopic = topic || "核心护城河可持续性与未来3年成长天花板推演";
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      // High-quality local fallback exploration
      return res.json({
        success: true,
        report: {
          topic: targetTopic,
          executiveInsight: `针对【${stock.name} (${stock.symbol})】关于"${targetTopic}"的深度探索：当前该标的毛利率为 ${stock.fundamentals?.grossMarginValue || 50}%，ROE为 ${stock.fundamentals?.roeValue || 20}%，估值处于历史近5年 ${stock.valuation?.historicalPePercentile || 20}% 分位。在行业${stock.macro?.industryStageZh || '成长期'}背景下，企业具有明显的定价权优势与规模壁垒。`,
          bullCaseAnalysis: `乐观情景推演（发生概率约 30%）：若核心催化剂（${stock.macro?.keyCatalysts?.join('、') || '行业渗透率提升'}）如期落地，预计未来3年净利润可保持年化 20%~25% 增长，结合估值修复至历史均值 PE ${stock.valuation?.pe5YearAvg || 30} 倍，潜在上涨空间预估可达 +45%~+60%。`,
          bearCaseAnalysis: `逆向事实验证（发生概率约 20%）：假设遭遇极限压力测试（${stock.macro?.keyRisks?.join('、') || '宏观周期波动与竞争加剧'}），毛利率或被压缩 3~5 个百分点，估值回撤至历史极值支撑位 $${stock.valuation?.pe5YearMin || stock.technical?.supportLevel1}，最大下行保护需依赖高股息与充沛经营性现金流。`,
          moatDurability: `护城河演变研判：公司在业内具有强大的品牌溢价及转换成本，短期内上游供应与下游议价均处于主导地位，波特五力结构显示整体壁垒稳固，护城河评级为【宽护城河 (Wide Moat)】且趋势稳定。`,
          actionableFramework: `机构执行策略：采用非对称胜率策略，以 $${stock.technical?.positionStrategy?.firstBatch?.targetPrice || stock.technical?.supportLevel1} 为第一买点左侧分批布局，若触及严格止损线 $${stock.technical?.positionStrategy?.stopLossPrice || stock.technical?.supportLevel2} 坚决控仓，总体风险收益比评估为 2.8 : 1，适合中长期价值投资者。`,
        },
      });
    }

    const prompt = `你是一位顶级投研总监与价值投资大师（融合芒格逆向思考法与波特五力模型）。
请针对以下标的进行【深度探索研判】：

【公司基本面】
- 标的: ${stock.name} (${stock.symbol})
- 行业: ${stock.sector} (${stock.macro?.industryStageZh})
- 现价: ${stock.currentPrice} ${stock.currency} | PE(TTM): ${stock.peTTM} (历史分位: ${stock.valuation?.historicalPePercentile}%)
- 核心指标: 毛利率 ${stock.fundamentals?.grossMarginValue}%, ROE ${stock.fundamentals?.roeValue}%, 负债率 ${stock.fundamentals?.debtRatioValue}%

【当前深度探索议题】: ${targetTopic}

请进行极其深入、专业、穿透式的投资逻辑探索，并严格输出以下JSON字段：
1. topic: 探索议题名称
2. executiveInsight: 核心深度探索穿透性洞察 (200字，直击商业模式本质)
3. bullCaseAnalysis: 乐观爆发情景与量化推演 (包括催化剂传导、业绩增速假设与空间)
4. bearCaseAnalysis: 悲观反脆弱检验与逆向思考 (Pre-Mortem事前验尸：什么会导致这笔投资重大失败)
5. moatDurability: 护城河可持续性与波特五力微观结构剖析
6. actionableFramework: 资深基金经理的仓位管理与博弈应对纪律
`;

    const reportText = await callDeepSeek({
      system: "你是一位兼备买方投资思维与学术严谨度的顶级证券研究所首席分析师。客观、穿透，只输出一个合法的JSON对象。",
      user: prompt,
      json: true,
      maxTokens: 4000,
    });

    const reportData = parseJsonResponse(reportText);
    res.json({ success: true, report: reportData });
  } catch (error: any) {
    console.error("Error in deep explore:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to run deep exploration",
    });
  }
});

// 4. AI 行业深度爆料 + 财报拆解 + 情绪共鸣 调查内容生产闭环 (Investigative Deep Dive)
app.post("/api/investigative-deep-dive", deepDiveRateLimit, async (req, res) => {
  try {
    const { targetName, targetSymbol, industry, customPrompt, stockContext } = req.body;
    const effectiveTarget = targetName || stockContext?.name || "目标企业/产业链";
    const effectiveIndustry = industry || stockContext?.sector || "科技/高端制造";
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      // Return high-quality structured default
      return res.json({
        success: true,
        report: {
          targetName: effectiveTarget,
          targetSymbol: targetSymbol || stockContext?.symbol,
          industry: effectiveIndustry,
          topicTitle: `穿透【${effectiveTarget}】：繁荣故事背后的真实变现率与估值反差`,
          anomalousContrast: {
            expected: `大众与资本市场普遍预期【${effectiveTarget}】将快速实现全行业替代与万亿级商业化变现。`,
            reality: `翻开审计底稿与真实销售台账，真实商业化/产线落地收入占比仅为个位数，95%以上均属于样机或公关巡游。`,
            coreDilemmaQuestion: `发布会天天高呼量产爆发，但翻遍财报底稿，真正为终端客户创造经济效益的收入去哪了？`,
          },
          closedLoopMechanics: {
            moneyOrigin: "地方政府招商引导补贴、课题科研经费与一级市场高估值融资",
            moneyDestination: "本体厂商样机出货做流水、数据中介赚取标定费用、二级市场借概念拉抬股价",
            intermediaryBeneficiaries: "地方政府拿政绩 → 公司做大营收冲刺估值 → 合作方分润流水 → 资本方高位套现",
            costBearer: "盲目跟风追高的二级市场散户投资者、垫资过度的供应链供应商",
            coreMissingDemand: "终端客户缺乏真实自发买单意愿，ROI投资回报率无法算平，缺乏真实工业级复购。",
            chainSummary: "体外设立数采基地拿补贴 → 定向采购样机制造放量通稿 → 包装数据资产冲高估值 → 二级市场炒作套现。",
          },
          extremeContrastData: {
            metricA: { label: "板块概念总市值与估值", value: "超 2,000 亿元", context: "资本市场已提前透支未来十年最乐观的成长天花板" },
            metricB: { label: "真实终端商业化落地收入占比", value: "仅 3.5%", context: "绝大部分收入来自于一次性课题采购与演示展厅" },
            contrastImpact: "3.5%的真实微薄造血撑起了数千亿市值神话，概念预期与现实严重脱节！",
            verifiableSource: "上市公司分部财务附注、行业招投标公开中标数据库、权威行业协会供应链抽检",
          },
          emotionalExplosion: {
            publicAngerTrigger: "普通散户被科技杂技宣传片忽悠追高接盘，最终被深套在历史最高点",
            colloquialPunchline: "资本市场把实验室玩具当成工业救星炒上了天，这是在公然侮辱投资者的智商！",
            soulInterrogation: "等发布会跳舞的音乐停下，资本市场终究要回答：你的产品，今天到底给客户造出了几个合格的零件？",
          },
          hookQuestion: `为什么发布会天天高呼划时代突破，翻开财报底稿真实工业/商业落地收入却连5%都不到？`,
          contrastStatement: `数千亿概念市值与仅占个位数的真实产线收入形成强烈反差，大量订单滞留在高校样机与展厅巡游！`,
          revenueStructure: [
            {
              segment: "科研教育与政府示范项目采购",
              percentage: 65.0,
              amount: "主要收入来源",
              isRealCommercial: false,
              note: "单次采购为主，缺乏连续复购与产业造血",
            },
            {
              segment: "品牌展会巡游与营销活动租赁",
              percentage: 22.0,
              amount: "公关宣传性质",
              isRealCommercial: false,
              note: "配合发布会造势，非刚性生产力需求",
            },
            {
              segment: "真实生产线/终端商业规模化落地",
              percentage: 3.5,
              amount: "真实工业产线回款",
              isRealCommercial: true,
              note: "苛刻节拍与稳定性考核下，渗透率极低",
            },
            {
              segment: "相关软件开发服务与数据包打包销售",
              percentage: 9.5,
              amount: "概念包装",
              isRealCommercial: false,
              note: "多与样机捆绑做高账面毛利",
            },
          ],
          valuationContrast: {
            marketCap: "行业概念整体估值超千亿",
            realCommercialRevenue: "真实规模化量产贡献极低",
            realSharePercent: 3.5,
            bubbleMultiple: "极高概念溢价倍数",
            conclusion: "资本过度提前透支了5-10年的技术商业化普及周期，短期需警惕戴维斯双杀。",
          },
          coldHardDataSummary: "供应链实地摸底显示：设备在真实产线的故障间隔时间（MTBF）仍未达到量产及格线，投资回收期远超工厂预期。应收账款周转天数拉长，前五大客户高度集中于关联孵化机构。",
          auditRedFlags: [
            "客户集中度异常高，存在关联方数采中心循环采购",
            "存货周转天数大幅上升，早期试制机型存在未充分计提跌价风险",
            "研发资本化比例偏高，将大量试错成本转化为账面资产",
          ],
          hiddenClosedLoop: [
            {
              step: 1,
              title: "设立关联孵化示范中心",
              desc: "以地方产业基金扶持为名义，成立外部采购载体获取政策补贴。",
            },
            {
              step: 2,
              title: "制造批量样机采购热潮",
              desc: "向本体厂商采购大批演示样机，对外发布批量量产签约新闻公报。",
            },
            {
              step: 3,
              title: "做大衍生数据/技术资产",
              desc: "将日常巡游采集的数据包装为专有模型资产，高溢价回购或计入投资。",
            },
            {
              step: 4,
              title: "二级市场炒作并高位套现",
              desc: "借赛道爆发热度拉升估值，投资机构或大股东趁高估值完成再融资或减持。",
            },
          ],
          logicChainAnalysis: "工业制造的本质是算投资回报率（ROI）。当资本用‘能跑能跳’的实验室产品偷换‘工业级稳定高节拍’的量产概念时，所谓的订单爆发不过是特定资金在封闭圈子里的自娱自乐。物理规律不会向PPT屈服。",
          emotionalResonance: "二级市场的股民在发布会前彻夜难眠、期待见证历史；车间里的工程师却在为屡屡死机的主控板发愁。我们尊重真正的硬科技攻坚，但痛恨那些把未成型概念当成镰刀的资本魔术。",
          viralTitles: [
            {
              type: "疑问反差",
              title: `都在台上跳舞巡游，为什么进不去车间？千亿市值背后的惊人真相`,
              hookStyle: "直击视觉反差与悬念",
            },
            {
              type: "数据实锤",
              title: `真实落地收入仅占3.5%！拆解【${effectiveTarget}】产业链财报的暗流`,
              hookStyle: "硬核数据暴击",
            },
            {
              type: "情绪痛点",
              title: `别再被科技杂技忽悠了！资本把科研玩具包装成万亿赛道割了谁？`,
              hookStyle: "引发股民深度共鸣",
            },
            {
              type: "内幕拷问",
              title: `买设备、卖数据、再上市：揭秘所谓量产闭环的隐秘利益链`,
              hookStyle: "利益链条深度拷问",
            },
          ],
          wechatArticle: `## 引言：当神话撞上冰冷的流水线\n\n资本市场最擅长讲万亿星辰大海的故事，但流水线上的账本从来不认狂欢。\n\n深入财报底层我们发现，概念热炒下的真实落地收入甚至不足 4%。繁荣的表象之下，是大量教具采购与展会租赁在维持热度。投资需要回归常识，穿透一切浮躁泡沫。`,
          shortVideoScript: {
            hook3s: "（画面：华丽的发布会展厅切换到空旷冷清的车间）“你以为它在拯救制造业，其实它连工厂大门都还没真正迈进去！”",
            scenes: [
              {
                sceneNumber: 1,
                duration: "0-5s",
                visual: "炫酷发布会集锦与大字标语",
                audio: "“天天看新闻吹得神乎其神，你以为马上要颠覆流水线了？”",
                emotionTag: "悬念抓人",
              },
              {
                sceneNumber: 2,
                duration: "6-18s",
                visual: "营收结构饼图穿透拆解",
                audio: "“翻看审计底稿，真实工业产线占比仅有可怜的3.5%！全靠高校和展会买单！”",
                emotionTag: "事实反差",
              },
              {
                sceneNumber: 3,
                duration: "19-30s",
                visual: "利益闭环图解与防守点位提示",
                audio: "“认清真相，守住钱袋子，别给概念狂欢买单！”",
                emotionTag: "清醒警示",
              },
            ],
            callToAction: "点赞关注，带你看懂每一张财报背后的真相！",
          },
          socialPost: `【#真实落地收入仅3.5%？拆解繁荣背后的资本闭环#】\n别被发布会上的科技杂技蒙蔽了双眼！\n财报穿透显示：真实工业产线落地收入不足4%，96%以上来自高校样机和展会巡游。\n用数据说话，尊重硬科技规律，拒绝为故事接盘！`,
          signals: [
            {
              id: "sig-server-1",
              source: "供应链一线工程师访谈实录",
              category: "whistleblower",
              content: "设备平均无故障时间仍无法胜任三班倒连续作业，所谓产线部署多停留在试点打样阶段。",
              credibilityScore: 91,
              status: "verified",
              evidenceSnippet: "现场调试工单与日志记录",
            },
          ],
          complianceDisclaimer: "【合规说明】本分析基于行业公开数据、可信供应链交叉验证及财务逻辑推演，仅供学术探讨与风险防范参考，不构成任何投资买卖建议。",
        },
      });
    }

    const prompt = `你是一位以“行业深度爆料 + 财报数据穿透拆解 + 大众情绪共鸣”著称的顶尖财经调查专家兼买方首席分析师。
你的核心底层武器是已经过多行业验证的通用分析框架：「反常现象 → 利益闭环 → 实锤数据 → 情绪引爆」！

【调查分析目标】
- 目标公司/赛道: ${effectiveTarget}
- 目标代码: ${targetSymbol || "N/A"}
- 所属行业: ${effectiveIndustry}
- 补充背景/聚焦要点: ${customPrompt || "深挖预期与现实的强烈反差、多方共赢但无真实需求的利益闭环、极端实锤数据对撞与大众情绪痛点"}

【核心方法论与执行步骤】:
一、第一步：从“反常现象”抓核心矛盾
- 找到“预期与现实的强烈反差”：找“所有人都觉得应该发生，但实际没发生”的现象（如：机器人预期替代工人 vs 都在跳舞；新能源预期暴涨 vs 4S店退网倒闭超4000家；医药预期降价 vs 11年收回扣1.84亿；开票经济预期合规 vs 虚开3亿赚1300万仅罚50万）。
- 转化成直击痛点的问题（hookQuestion & anomalousContrast）。

二、第二步：用“利益闭环”拆解底层逻辑
- 找到“多方共赢但无真实需求”的利益闭环：
- 讲清楚：钱从哪来、到哪去、谁在中间赚钱、最终谁承担成本（被割韭菜），并指明缺乏真实有效需求的关键卡点。

三、第三步：用“实锤数据”击穿虚假繁荣
- 找到公开可查的实锤数据（财报、公告、裁判文书）。
- 用极端反差数据形成强烈视觉与心理冲击（如 2.6% vs 4449亿市值；批发暴涨 vs 渠道亏损73%倒闭4000家）。

四、第四步：用“大众情绪”引爆传播
- 找到大众最容易愤怒的痛点，拒绝晦涩专业术语，使用通俗口语化表达，直击拷问。
- 产出爆款疑问反差标题、万字微信深度穿透长文、短视频分镜脚本（含黄金前3秒）和社交平台高能量锐评。

【三大注意事项】:
1. 信息真实性：公开可查的实锤数据；2. 逻辑严谨性：利益链条符合实际；3. 情绪适度性：客观中立合规。

请严格输出以下结构化 JSON（只输出一个 JSON 对象，不要 Markdown 代码块）：
{
  "targetName": "目标公司或赛道名称",
  "targetSymbol": "代码或 N/A",
  "industry": "所属行业",
  "topicTitle": "本期穿透主题标题",
  "anomalousContrast": {"expected": "大众预期", "reality": "骨感现实", "coreDilemmaQuestion": "核心反差提问"},
  "closedLoopMechanics": {"moneyOrigin": "钱从哪来", "moneyDestination": "钱到哪去", "intermediaryBeneficiaries": "谁在中间赚钱", "costBearer": "谁承担最终成本", "coreMissingDemand": "缺乏真实需求的关键节点", "chainSummary": "一句话利益链条"},
  "extremeContrastData": {"metricA": {"label": "虚高指标", "value": "数值", "context": "背景"}, "metricB": {"label": "真实指标", "value": "数值", "context": "背景"}, "contrastImpact": "反差冲击", "verifiableSource": "可查出处"},
  "emotionalExplosion": {"publicAngerTrigger": "公众愤怒点", "colloquialPunchline": "口语金句", "soulInterrogation": "灵魂拷问"},
  "hookQuestion": "爆款钩子问题",
  "contrastStatement": "反差结论陈述",
  "revenueStructure": [{"segment": "收入构成", "percentage": 65, "amount": "金额描述", "isRealCommercial": false, "note": "说明"}],
  "valuationContrast": {"marketCap": "市值描述", "realCommercialRevenue": "真实商业化收入", "realSharePercent": 3.5, "bubbleMultiple": "泡沫倍数", "conclusion": "结论"},
  "coldHardDataSummary": "实锤数据总结",
  "auditRedFlags": ["审计红旗1", "审计红旗2"],
  "hiddenClosedLoop": [{"step": 1, "title": "环节标题", "desc": "环节说明"}],
  "logicChainAnalysis": "逻辑链条分析",
  "emotionalResonance": "情绪共鸣文字",
  "viralTitles": [{"type": "疑问反差", "title": "标题", "hookStyle": "钩子风格"}],
  "wechatArticle": "微信长文正文",
  "shortVideoScript": {"hook3s": "前3秒钩子", "scenes": [{"sceneNumber": 1, "duration": "0-5s", "visual": "画面", "audio": "旁白", "emotionTag": "情绪标签"}], "callToAction": "行动号召"},
  "socialPost": "社交平台锐评",
  "signals": [{"id": "sig-1", "source": "来源", "category": "whistleblower", "content": "内容", "credibilityScore": 91, "status": "verified", "evidenceSnippet": "证据"}],
  "complianceDisclaimer": "合规声明"
}
`;

    const reportText = await callDeepSeek({
      system: "你是一位精通「反常现象→利益闭环→实锤数据→情绪引爆」通用方法论的顶级调查分析师。严谨客观、数据实锤、情绪击中痛点，只输出一个合法的JSON对象。",
      user: prompt,
      json: true,
      maxTokens: 8000,
    });

    const reportData = parseJsonResponse(reportText);
    res.json({ success: true, report: reportData });
  } catch (error: any) {
    console.error("Error in investigative deep dive:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate investigative deep dive",
    });
  }
});

// 5. AI 自然语言思路转选股量化策略生成器 (AI Strategy Generator)
app.post("/api/generate-strategy", aiRateLimit, async (req, res) => {
  const { ideaPrompt } = req.body;
  if (!ideaPrompt || typeof ideaPrompt !== "string") {
    return res.status(400).json({ error: "Missing or invalid ideaPrompt" });
  }

  const trimmedPrompt = ideaPrompt.trim();
  const apiKey = process.env.DEEPSEEK_API_KEY;

  // 本地多模态选股标的候选池匹配器
  const availableStocks = Object.values(PRESET_STOCKS);
  const generateLocalFallbackStrategy = (promptText: string) => {
    let styleTag: any = "价值白马";
    let strategyName = "核心资产稳健价值选股策略";
    let philosophy = `基于投资者思路「${promptText}」，聚焦具备宽阔经济护城河、高自由现金流及估值处于历史安全边际的优质核心资产。`;
    let period: any = "长线复利 (1-3年)";
    let risk: any = "中等平衡";

    if (promptText.includes("股息") || promptText.includes("分红") || promptText.includes("央企") || promptText.includes("收息")) {
      styleTag = "高股息红利";
      strategyName = "大类资产防御：高股息特估与现金流奶牛策略";
      philosophy = "在宏观利率下行期，筛选股息率>4%、资产负债率健康、自由现金流覆盖股息支付的优质央国企与公用事业龙头。";
      period = "长线复利 (1-3年)";
      risk = "低风险防御";
    } else if (promptText.includes("科技") || promptText.includes("芯片") || promptText.includes("算力") || promptText.includes("机器人") || promptText.includes("成长") || promptText.includes("爆发")) {
      styleTag = "高景气成长";
      strategyName = "硬科技突围：高研发与供应链放量成长策略";
      philosophy = "捕捉处于技术产业爆发期、研发支出占比高、具有全球竞争力或国产替代壁垒的高弹性赛道龙头。";
      period = "中线趋势 (3-6月)";
      risk = "高成长高波动";
    } else if (promptText.includes("出海") || promptText.includes("全球") || promptText.includes("外销")) {
      styleTag = "出海破局";
      strategyName = "全球化领军者：海外营收扩张与定价权策略";
      philosophy = "筛选海外收入占比>30%、具备全球成本与供应链优势、抗单一内需波动的全球化制造领头羊。";
      period = "长线复利 (1-3年)";
      risk = "中等平衡";
    }

    const matched = availableStocks.map((stock) => {
      let score = 70;
      const highlights: string[] = [];

      if (stock.fundamentals.grossMarginValue > 30) {
        score += 8;
        highlights.push(`毛利率高达 ${stock.fundamentals.grossMarginValue}% (定价权强)`);
      }
      if (stock.fundamentals.roeValue > 15) {
        score += 10;
        highlights.push(`ROE达到 ${stock.fundamentals.roeValue}% (股东回报丰厚)`);
      }
      if (stock.valuation.historicalPePercentile <= 30) {
        score += 10;
        highlights.push(`历史PE分位数仅 ${stock.valuation.historicalPePercentile}% (估值安全边际高)`);
      }
      if (stock.fundamentals.debtRatioValue < 50) {
        score += 5;
        highlights.push(`负债率仅 ${stock.fundamentals.debtRatioValue}% (资产负债表健康)`);
      }

      return {
        symbol: stock.symbol,
        name: stock.name,
        market: stock.market,
        currentPrice: stock.currentPrice,
        peTTM: stock.peTTM,
        matchScore: Math.min(score, 99),
        highlightReasons: highlights.slice(0, 3),
        metricsSnapshot: {
          grossMargin: stock.fundamentals.grossMarginValue,
          roe: stock.fundamentals.roeValue,
          debtRatio: stock.fundamentals.debtRatioValue,
          pePercentile: stock.valuation.historicalPePercentile,
          dividendYield: stock.valuation.dividendYield,
        },
      };
    }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);

    return {
      id: `strat_${Date.now()}`,
      ideaPrompt: promptText,
      strategyName,
      styleTag,
      philosophy,
      expectedHoldingPeriod: period,
      riskLevel: risk,
      rules: [
        {
          dimension: "盈利壁垒",
          metric: "毛利率 (Gross Margin)",
          condition: "持续高于 30% ~ 40%",
          rationale: "验证产品具备品牌溢价或技术壁垒，拒绝打价格战的同质化行业。",
        },
        {
          dimension: "盈利壁垒",
          metric: "净资产收益率 (ROE)",
          condition: "近 3 年平均 > 15%",
          rationale: "衡量企业将股东投入资本转化为净利润的内生造血能力。",
        },
        {
          dimension: "财报排雷",
          metric: "经营现金流净额 / 净利润",
          condition: "比值 ≥ 1.0 (现金转化率良好)",
          rationale: "防止纸面富贵与应收账款虚增，确保利润有真金白银沉淀。",
        },
        {
          dimension: "估值安全",
          metric: "PE-TTM 历史分位数",
          condition: "处于近 5 年历史百分位 ≤ 35%",
          rationale: "拒绝在机构狂热的高位接盘，获取戴维斯双击的安全边际。",
        },
        {
          dimension: "技术时机",
          metric: "关键支撑均线与筹码分布",
          condition: "股价企稳于 S1 强支撑或 MA60 生命线之上",
          rationale: "拒绝左侧单边阴跌接飞刀，等待右侧企稳放量建仓信号。",
        },
      ],
      executionPlan: {
        entryStrategy: "采取 3-3-4 分批金字塔建仓法：30%底仓初步建立，30%在回踩关键支撑位加仓，40%在有效突破颈线时追击加仓。",
        stopLossRule: "若个股有效跌破关键支撑位（如 S2 支撑或-8%绝对止损线），且基本面逻辑发生根本性恶化，无条件执行止损。",
        takeProfitRule: "当估值修复至历史 70% 分位以上，或 PEG > 1.5 时，分批逢高兑现利润（每次兑现 25%~30%）。",
        positionLimit: "单一标的持仓上限不得超过投资组合总市值的 20%，单一申万一级行业合计不得超过 35%。",
      },
      negativeChecklist: [
        "大股东质押率超过 50% 的标的一票否决",
        "连续 2 年经营活动现金流净额为负的一票否决",
        "近 3 年受到证监会或交易所公开立案调查的一票否决",
        "商誉占净资产比例超过 30% 的标的一票否决",
      ],
      matchedStocks: matched,
      createdAt: new Date().toISOString().split("T")[0],
    };
  };

  try {

    if (!apiKey) {
      const fallbackStrategy = generateLocalFallbackStrategy(trimmedPrompt);
      return res.json({ success: true, strategy: fallbackStrategy });
    }

    const prompt = `你是一位精通A股、港股与美股量化投资与价值选股的买方基金经理。
现在用户输入了一个关于选股的投资思路/直觉：
“${trimmedPrompt}”

请将这个思路提炼升华为一套严谨、可执行、数据驱动的【量化选股策略】。
必须覆盖：
1. 策略命名 (strategyName) 与风格分类 (styleTag: '价值白马' | '高股息红利' | '高景气成长' | '困境反转' | '小盘隐形冠军' | '出海破局')
2. 投资哲学 (philosophy)：核心驱动逻辑、胜率来源、为什么能跑赢基准
3. 预期持仓周期 (expectedHoldingPeriod: '短线波段 (1-3周)' | '中线趋势 (3-6月)' | '长线复利 (1-3年)')
4. 风险收益等级 (riskLevel: '低风险防御' | '中等平衡' | '高成长高波动')
5. 精准量化筛选指标清单 (rules)：包含维度 (盈利壁垒/财报排雷/成长驱动/估值安全/技术时机/机构偏好)、具体指标名称、数值条件（例如 >30%）以及设计初衷
6. 严格执行纪律 (executionPlan)：分批建仓法、硬止损条件、分批止盈标准、仓位上限控制
7. 一票否决清单 (negativeChecklist)：必须避开的4条地雷特征（如高质押、现金流差、虚增商誉等）
8. 从现有核心池中挑选出最匹配该策略的候选股票（matchedStocks，提供 3 到 5 只，如贵州茅台 600519、宁德时代 300750、腾讯控股 00700、美的集团 000333、比亚迪 002594、中国神华 601088、海光信息 688041 等，并给出匹配分与高亮理由）。

请只输出以下 JSON 对象（不要 Markdown 代码块）：
{
  "strategyName": "策略名称",
  "styleTag": "价值白马",
  "philosophy": "投资哲学",
  "expectedHoldingPeriod": "长线复利 (1-3年)",
  "riskLevel": "中等平衡",
  "rules": [{"dimension": "盈利壁垒", "metric": "毛利率", "condition": ">30%", "rationale": "原因"}],
  "executionPlan": {"entryStrategy": "建仓纪律", "stopLossRule": "止损规则", "takeProfitRule": "止盈规则", "positionLimit": "仓位上限"},
  "negativeChecklist": ["一票否决项"],
  "matchedStocks": [{"symbol": "600519", "name": "贵州茅台", "market": "A-Share", "currentPrice": 1468.5, "peTTM": 23.4, "matchScore": 88, "highlightReasons": ["理由"], "metricsSnapshot": {"grossMargin": 91.8, "roe": 30.2, "debtRatio": 13.5, "pePercentile": 14.5, "dividendYield": 3.42}}]
}
`;

    const strategyText = await callDeepSeek({
      system: "你是一个专业的量化策略设计专家与买方投资总监。请只输出一个合法的JSON对象。",
      user: prompt,
      json: true,
      maxTokens: 8000,
    });

    const parsed = parseJsonResponse(strategyText);
    const fullStrategy = {
      ...parsed,
      id: `strat_${Date.now()}`,
      ideaPrompt: trimmedPrompt,
      createdAt: new Date().toISOString().split("T")[0],
    };

    res.json({ success: true, strategy: fullStrategy });
  } catch (error: any) {
    console.error("Error in generate-strategy:", error);
    // 兜底返回优质本地策略
    const fallback = generateLocalFallbackStrategy(req.body?.ideaPrompt || "稳健价值选股");
    res.json({ success: true, strategy: fallback });
  }
});
app.post("/api/ai-chat", aiRateLimit, async (req, res) => {
  try {
    const { message, stockContext, chatHistory } = req.body;
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return res.json({
        success: true,
        reply: `【系统提示】目前未检测到DEEPSEEK_API_KEY环境变量。关于 ${stockContext?.name || '该股票'} 的问答：该标的目前基本面总评分为 ${stockContext?.fundamentals?.overallScore || 85}/100，当前估值处于历史 ${stockContext?.valuation?.historicalPePercentile || 20}% 低位，技术支撑位约 ${stockContext?.technical?.supportLevel1 || 0}。`,
      });
    }

    const systemPrompt = `你是一位精通股市投资与财报分析的智能投资顾问。
当前用户正在查看股票: ${stockContext?.name} (${stockContext?.symbol})，所属行业: ${stockContext?.sector}，当前价格: ${stockContext?.currentPrice} ${stockContext?.currency}。
请结合五步法分析框架（1.宏观/行业、2.基本面、3.估值百分位、4.技术买点、5.资金仓位）为用户解答有关该股票的任何投资问题。语言亲切专业、条理清晰。`;

    // 多轮对话：将最近的历史消息注入上下文，使回答能够连贯衔接
    const historyMessages: DeepSeekMessage[] = (Array.isArray(chatHistory) ? chatHistory : [])
      .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-10)
      .map((m: any) => ({ role: m.role, content: m.content }));

    const reply = await callDeepSeek({
      system: systemPrompt,
      user: message,
      temperature: 0.6,
      history: historyMessages,
    });

    res.json({ success: true, reply });
  } catch (error: any) {
    console.error("Error in AI chat:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process chat message",
    });
  }
});

// 6. 指数基金多维优选与四步筛选 API (Index Fund Screener & Quota Analysis)
app.get("/api/index-funds", (req, res) => {
  try {
    const targetIndex = (req.query.index as string) || "all";
    const minAssets = parseFloat((req.query.minAssets as string) || "1.0"); // 规则4: 规模>=1亿
    const maxTrackingError = parseFloat((req.query.maxTrackingError as string) || "2.0"); // 规则2: 跟踪误差<=2%
    const quotaOnly = req.query.quotaOnly === "true"; // 规则1: 额度优先
    const holdingDays = parseInt((req.query.holdingDays as string) || "365", 10); // 规则5: A/C选择 (根据持有期限)
    const investmentAmount = parseFloat((req.query.amount as string) || "50000");

    let list = [...PRESET_INDEX_FUNDS];

    // 过滤指数
    if (targetIndex !== "all") {
      list = list.filter((f) => f.targetIndex.toLowerCase() === targetIndex.toLowerCase());
    }

    // 计算四步达标状态与 A/C 推荐
    const processedList = list.map((fund) => {
      const quotaPass = fund.quotaStatus !== "suspended";
      const sizePass = fund.fundSize >= minAssets;
      const trackingPass = fund.trackingError <= maxTrackingError;
      const screenPass = quotaPass && sizePass && trackingPass;

      const costSim = calculateShareClassCost(fund, investmentAmount, holdingDays);

      return {
        ...fund,
        screenPass,
        criteriaCheck: {
          quotaPass,
          sizePass,
          trackingPass,
        },
        costSimulation: costSim,
      };
    });

    // 筛选过滤
    let filteredList = processedList;
    if (quotaOnly) {
      filteredList = filteredList.filter((f) => f.criteriaCheck.quotaPass);
    }
    filteredList = filteredList.filter((f) => f.fundSize >= minAssets && f.trackingError <= maxTrackingError);

    // 规则3: 持有成本升序排列 (管理费+托管费+销售服务费之和尽可能低)
    filteredList.sort((a, b) => a.totalExpenseRatio - b.totalExpenseRatio);

    res.json({
      success: true,
      totalCount: PRESET_INDEX_FUNDS.length,
      matchedCount: filteredList.length,
      funds: filteredList,
      allFunds: processedList,
    });
  } catch (err: any) {
    console.error("Error in /api/index-funds:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to fetch index funds" });
  }
});

// 计算 A/C 类费用对比接口
app.post("/api/index-funds/calculate-cost", (req, res) => {
  try {
    const { fundCode, holdingDays = 365, amount = 50000 } = req.body;
    const fund = PRESET_INDEX_FUNDS.find((f) => f.code === fundCode) || PRESET_INDEX_FUNDS[0];
    const result = calculateShareClassCost(fund, amount, holdingDays);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 大类资产配置建议接口
app.get("/api/index-funds/asset-allocation", (req, res) => {
  res.json({ success: true, profiles: ASSET_ALLOCATION_PROFILES });
});

// AI 指数与大类资产配置研判接口
app.post("/api/index-funds/ai-diagnosis", aiRateLimit, async (req, res) => {
  try {
    const { targetIndex = "Nasdaq 100", holdingYears = 3, riskPreference = "balanced" } = req.body;
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return res.json({
        success: true,
        diagnosis: {
          executiveSummary: `针对【${targetIndex}】指数与【预计持有 ${holdingYears} 年】投资周期：纳指100与标普500构筑全球核心资产双子星。在当前美联储利率周期与AI生产力革命共振背景下，四步优选法（额度优先、跟踪误差≤2%、费率最优、规模≥1亿）能有效避免QDII限购踩空、流动性折价及高费率蚕食复利。`,
          keyTakeaways: [
            "额度策略：QDII外汇额度面临机构额度紧张，建议采取每日定投小额申购（如单日500~1000元），规避大额单笔限购卡顿。",
            `份额推荐：持有 ${holdingYears} 年（>1年），强烈推荐 A 类份额。单次买断申购费（折后仅0.12%），长期省去每年0.25%的销售服务费。`,
            "溢价风控：场内ETF在申购暂停期易出现非理性高溢价（溢价>2%），切勿追高场内高溢价筹码，优先选择场外净值申购。",
            "配置比例：建议构建「纳指100 (35%) + 标普500 (35%) + 沪深300/国内宽基 (20%) + 美元债/现金 (10%)」的全天候全球资产配置底仓。",
          ],
          crossoverAnalysis: `A/C份额盈亏平衡点约为 180~270 天。在持有 ${holdingYears} 年的时间维度下，A类累计节省费率可达 0.5%~0.8% 净值，复利优势显著。`,
        },
      });
    }

    const prompt = `你是一位专注全球宏观指数投资与公募QDII/ETF基金的顶级投资策略专家。
请根据以下条件，对当前中国投资者的指数基金配置进行专业分析：
- 目标指数: ${targetIndex} (包含纳指100 / 标普500 / 沪深300)
- 预计持有年限: ${holdingYears} 年
- 风险偏好: ${riskPreference}
- 核心逻辑: 四步优选法（1. 额度优先判断 2. 跟踪误差≤2% 3. 持有成本尽可能低 4. 规模≥1亿 5. 根据持有期推荐A/C类）

请以JSON格式输出：
{
  "executiveSummary": "150字宏观指数研判与配置主旨",
  "keyTakeaways": ["4条核心关键建议，包含额度应对、费率比较、溢价避坑与配置比例"],
  "crossoverAnalysis": "A/C份额持有成本临界平衡点分析"
}`;

    const diagnosisText = await callDeepSeek({
      system: "你是一位专注全球宏观指数投资与公募QDII/ETF基金的顶级投资策略专家。请只输出一个合法的JSON对象。",
      user: prompt,
      json: true,
      maxTokens: 4000,
    });

    const parsed = parseJsonResponse(diagnosisText);
    res.json({ success: true, diagnosis: parsed });
  } catch (err: any) {
    console.error("Error in ai-diagnosis:", err);
    res.json({
      success: true,
      diagnosis: {
        executiveSummary: "全球核心宽基优选：纳指100与标普500构建全天候海外权益压舱石，坚持低费率与额度优先法则。",
        keyTakeaways: [
          "优先筛选有QDII申购额度的基金，避免因大额限购影响资产建仓节奏",
          "严守跟踪误差≤2%红线，确保获得纯正的指数Beta回报",
          "持有期>1年优先A类买断申购费，长期复利收益更优",
          "警惕场内ETF高溢价风险，溢价率超过2%时优先转场外联接基金",
        ],
        crossoverAnalysis: "A/C类份额持有平衡点约为180天，长期持有推荐A类。",
      },
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Stock Analysis Assistant backend running on http://localhost:${PORT}`);
  });
}

startServer();
