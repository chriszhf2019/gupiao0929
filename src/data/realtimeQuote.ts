import { StockData, PricePoint } from '../types/stock';
import { PRESET_STOCKS, generateStockFallback } from './presetStocks';
import { singleflight } from '../utils/singleflight';

interface NormalizedSymbol {
  market: 'A-Share' | 'HK-Share' | 'US-Share';
  tencentSymbol: string;
  code: string;
  currency: string;
}

interface TencentBar {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
}

interface TencentQuote {
  name: string;
  currentPrice: number;
  prevClose: number;
  open: number;
  changeAmount: number;
  changePercent: number;
  high: number;
  low: number;
  peTTM: number;
  totalMarketCapYi: number;
  timestamp: string;
}

const ENABLE_REALTIME = process.env.ENABLE_REALTIME_QUOTES !== 'false';
const CACHE_TTL_MS = 15_000;
const cache = new Map<string, { at: number; stock: StockData }>();
const quoteInflight = new Map<string, Promise<StockData>>();
const TENCENT_BATCH_QUOTE_API = 'https://qt.gtimg.cn/q=';

function num(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function minOf(bars: TencentBar[], key: 'low' | 'high'): number {
  return Math.min(...bars.map((b) => b[key]));
}

function maxOf(bars: TencentBar[], key: 'low' | 'high'): number {
  return Math.max(...bars.map((b) => b[key]));
}

function formatMarketCap(yi: number): string {
  if (!Number.isFinite(yi) || yi <= 0) return '';
  if (yi >= 10000) return `${(yi / 10000).toFixed(2)}万亿元`;
  return `${yi.toFixed(2)}亿元`;
}

function rollingMean(values: number[], period: number): number[] {
  const out: number[] = new Array(values.length).fill(NaN);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [values[0]];
  let prev = values[0];
  for (let i = 1; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

export function normalizeTencentSymbol(input: string): NormalizedSymbol | null {
  const s = input.trim().toUpperCase().replace(/\s/g, '');
  if (!s) return null;
  if (/^\d{6}$/.test(s)) {
    const prefix = /^(60|68)/.test(s) ? 'sh' : /^(00|30)/.test(s) ? 'sz' : /^(8|4)/.test(s) ? 'bj' : 'sh';
    return { market: 'A-Share', tencentSymbol: `${prefix}${s}`, code: s, currency: 'CNY' };
  }
  if (/^\d{1,5}$/.test(s)) {
    const code = s.padStart(5, '0');
    return { market: 'HK-Share', tencentSymbol: `hk${code}`, code, currency: 'HKD' };
  }
  if (/^[A-Z][A-Z0-9.]{0,9}$/.test(s)) {
    return { market: 'US-Share', tencentSymbol: `us${s}`, code: s, currency: 'USD' };
  }
  return null;
}

export async function fetchTencentKline(
  tencentSymbol: string,
  days = 120
): Promise<{ bars: TencentBar[]; quote: TencentQuote | null } | null> {
  const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${tencentSymbol},day,,,${days},qfq`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    const json = await response.json();
    const node = json?.data?.[tencentSymbol];
    const barsRaw = node?.qfqday || node?.day;
    if (!Array.isArray(barsRaw) || barsRaw.length === 0) return null;

    const bars: TencentBar[] = barsRaw
      .map((b: any[]) => ({
        date: String(b[0]),
        open: Number(b[1]),
        close: Number(b[2]),
        high: Number(b[3]),
        low: Number(b[4]),
        volume: Number(b[5]) || 0,
      }))
      .filter((b: TencentBar) => Number.isFinite(b.close) && b.close > 0);

    const qtRaw = node?.qt?.[tencentSymbol];
    let quote: TencentQuote | null = null;
    if (Array.isArray(qtRaw) && qtRaw.length > 40) {
      quote = {
        name: String(qtRaw[1] || ''),
        currentPrice: Number(qtRaw[3]),
        prevClose: Number(qtRaw[4]),
        open: Number(qtRaw[5]),
        changeAmount: Number(qtRaw[31]),
        changePercent: Number(qtRaw[32]),
        high: Number(qtRaw[33]),
        low: Number(qtRaw[34]),
        peTTM: Number(qtRaw[39]),
        totalMarketCapYi: Number(qtRaw[45]),
        timestamp: String(qtRaw[30] || ''),
      };
    }

    if (bars.length < 20) return null;
    return { bars, quote };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function buildTimingAdvice(
  price: number,
  ma20: number,
  macdSignal: 'Golden Cross' | 'Death Cross' | 'Neutral',
  trend: 'Uptrend' | 'Downtrend' | 'Sideways'
): string {
  if (trend === 'Uptrend' && macdSignal === 'Golden Cross') {
    return '价格站上多条均线且MACD金叉，处于右侧多头形态，可分批试建仓。';
  }
  if (trend === 'Downtrend') {
    return '价格位于均线下方且趋势走弱，建议等待企稳信号再介入。';
  }
  return '价格围绕均线震荡，建议控制仓位等待方向明确。';
}

function mergeQuoteIntoStock(
  base: StockData,
  ns: NormalizedSymbol,
  bars: TencentBar[],
  quote: TencentQuote | null
): StockData {
  const closes = bars.map((b) => b.close);
  const n = closes.length;
  const last = n - 1;
  const ma5Arr = rollingMean(closes, 5);
  const ma20Arr = rollingMean(closes, 20);
  const ma60Arr = rollingMean(closes, 60);
  const ma5 = num(ma5Arr[last]) || closes[last];
  const ma20 = num(ma20Arr[last]) || closes[last];
  const ma60 = num(ma60Arr[last]) || ma20;

  let rsi = 50;
  if (n >= 15) {
    let gain = 0;
    let loss = 0;
    for (let i = n - 14; i < n; i++) {
      const d = closes[i] - closes[i - 1];
      if (d >= 0) gain += d;
      else loss -= d;
    }
    const avgGain = gain / 14;
    const avgLoss = loss / 14;
    rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const dif = closes.map((_, i) => ema12[i] - ema26[i]);
  const dea = ema(dif, 9);
  let macdSignal: 'Golden Cross' | 'Death Cross' | 'Neutral' = 'Neutral';
  if (dif[last] > dea[last]) macdSignal = 'Golden Cross';
  else if (dif[last] < dea[last]) macdSignal = 'Death Cross';

  const recent20 = bars.slice(-20);
  const recent60 = bars.slice(-60);
  const support1 = minOf(recent20, 'low');
  const support2 = minOf(recent60, 'low');
  const resistance1 = maxOf(recent20, 'high');
  const resistance2 = maxOf(recent60, 'high');

  let trendChannel: 'Uptrend' | 'Downtrend' | 'Sideways' = 'Sideways';
  if (ma5 > ma20 && ma20 >= ma60) trendChannel = 'Uptrend';
  else if (ma5 < ma20 && ma20 <= ma60) trendChannel = 'Downtrend';

  const price = quote && quote.currentPrice > 0 ? quote.currentPrice : closes[last];
  const changePercent = quote && Number.isFinite(quote.changePercent) ? quote.changePercent : 0;
  const changeAmount =
    quote && Number.isFinite(quote.changeAmount)
      ? quote.changeAmount
      : round2(price - (quote?.prevClose || price));
  const peTTM = quote && Number.isFinite(quote.peTTM) && quote.peTTM > 0 ? quote.peTTM : base.peTTM;

  const priceHistory: PricePoint[] = bars.slice(-40).map((b, i) => {
    const idx = n - Math.min(40, bars.length) + i;
    return {
      date: b.date,
      price: b.close,
      ma5: num(ma5Arr[idx]) || b.close,
      ma20: num(ma20Arr[idx]) || b.close,
      ma60: num(ma60Arr[idx]) || b.close,
      volume: b.volume,
    };
  });

  return {
    ...base,
    symbol: ns.code,
    name: (quote?.name || base.name).replace(/\s+/g, ''),
    market: ns.market,
    currency: ns.currency,
    currentPrice: round2(price),
    changeAmount: round2(changeAmount),
    changePercent: round2(changePercent),
    marketCap: formatMarketCap(quote?.totalMarketCapYi || 0) || base.marketCap,
    peTTM: round1(peTTM),
    valuation: {
      ...base.valuation,
      peTTM: round1(peTTM),
    },
    technical: {
      ...base.technical,
      currentPrice: round2(price),
      changePercent: round2(changePercent),
      ma5: round2(ma5),
      ma20: round2(ma20),
      ma60: round2(ma60),
      ma200: round2(ma60),
      supportLevel1: round2(support1),
      supportLevel2: round2(support2),
      resistanceLevel1: round2(resistance1),
      resistanceLevel2: round2(resistance2),
      rsi: round1(rsi),
      macdSignal,
      macdSignalZh: macdSignal === 'Golden Cross' ? '金叉看多' : macdSignal === 'Death Cross' ? '死叉看空' : '震荡盘整',
      trendChannel,
      trendChannelZh: trendChannel === 'Uptrend' ? '上升通道' : trendChannel === 'Downtrend' ? '下降通道' : '宽幅震荡',
      timingAdvice: buildTimingAdvice(price, ma20, macdSignal, trendChannel),
      positionStrategy: {
        firstBatch: { percent: 30, targetPrice: round2(price), note: '当前价格区间建底仓 (30%)' },
        secondBatch: { percent: 30, targetPrice: round2(support1), note: '回踩支撑位补仓 (30%)' },
        thirdBatch: { percent: 40, targetPrice: round2(resistance1), note: '放量突破压力位追加 (40%)' },
        stopLossPrice: round2(support2 * 0.98),
        takeProfitPrice: round2(resistance1 * 1.08),
      },
    },
    priceHistory,
    lastUpdated: quote?.timestamp || new Date().toISOString(),
    isRealtime: true,
  };
}

async function loadRealtimeStock(raw: string): Promise<StockData> {
  const base = PRESET_STOCKS[raw] || generateStockFallback(raw);

  if (!ENABLE_REALTIME) {
    return base;
  }

  const normalized = normalizeTencentSymbol(raw);
  if (!normalized || normalized.market === 'US-Share') {
    return base;
  }

  const fetched = await fetchTencentKline(normalized.tencentSymbol, 120);
  if (!fetched) {
    return base;
  }

  const stock = mergeQuoteIntoStock(base, normalized, fetched.bars, fetched.quote);
  cache.set(raw, { at: Date.now(), stock });
  return stock;
}

export function getRealtimeStockData(symbol: string): Promise<StockData> {
  const raw = symbol.trim().toUpperCase();
  const cached = cache.get(raw);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return Promise.resolve(cached.stock);
  }
  return singleflight(quoteInflight, raw, () => loadRealtimeStock(raw));
}

export interface SnapshotQuote {
  symbol: string;
  name: string;
  currentPrice: number;
  changePercent: number;
  currency: string;
  isFallback: boolean;
}

export function parseTencentQuoteBody(text: string): Map<string, string[]> {
  const quoteMap = new Map<string, string[]>();
  const re = /v_(\w+)="([^"]*)";/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    quoteMap.set(match[1].toLowerCase(), match[2].split('~'));
  }
  return quoteMap;
}

export function quoteFromTencentFields(symbol: string, fields: string[]): SnapshotQuote | null {
  if (!fields || fields.length < 33) return null;
  const price = Number(fields[3]);
  if (!Number.isFinite(price) || price <= 0) return null;
  const raw = symbol.trim().toUpperCase();
  const ns = normalizeTencentSymbol(raw);
  const preset = PRESET_STOCKS[raw];
  const name = String(fields[1] || '').replace(/\s+/g, '') || preset?.name || raw;
  return {
    symbol: raw,
    name,
    currentPrice: round2(price),
    changePercent: round2(Number(fields[32]) || 0),
    currency: ns?.currency || preset?.currency || 'CNY',
    isFallback: false,
  };
}

function fallbackSnapshot(symbol: string): SnapshotQuote {
  const raw = symbol.trim().toUpperCase();
  const preset = PRESET_STOCKS[raw];
  const ns = normalizeTencentSymbol(raw);
  return {
    symbol: raw,
    name: preset?.name || raw,
    currentPrice: preset?.currentPrice || 0,
    changePercent: preset?.changePercent || 0,
    currency: ns?.currency || preset?.currency || 'CNY',
    isFallback: true,
  };
}

const snapshotCache = new Map<string, { at: number; quote: SnapshotQuote }>();
const SNAPSHOT_TTL_MS = 15_000;
const snapshotInflight = new Map<string, Promise<void>>();

function pruneSnapshotCache() {
  if (snapshotCache.size <= 500) return;
  const oldest = [...snapshotCache.entries()].sort((a, b) => a[1].at - b[1].at);
  for (const [key] of oldest.slice(0, snapshotCache.size - 300)) snapshotCache.delete(key);
}

export async function fetchTencentSnapshotQuotes(symbols: string[]): Promise<SnapshotQuote[]> {
  const unique = [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))].slice(0, 40);
  const now = Date.now();
  const out = new Map<string, SnapshotQuote>();
  const missing: { raw: string; tencent: string }[] = [];

  for (const raw of unique) {
    const hit = snapshotCache.get(raw);
    if (hit && now - hit.at < SNAPSHOT_TTL_MS) {
      out.set(raw, hit.quote);
      continue;
    }
    const ns = normalizeTencentSymbol(raw);
    if (!ns || ns.market === 'US-Share') {
      const fallback = fallbackSnapshot(raw);
      snapshotCache.set(raw, { at: now, quote: fallback });
      out.set(raw, fallback);
      continue;
    }
    missing.push({ raw, tencent: ns.tencentSymbol });
  }

  if (missing.length > 0) {
    const flightKey = missing.map((item) => item.tencent).sort().join(',');
    await singleflight(snapshotInflight, flightKey, async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      try {
        const response = await fetch(`${TENCENT_BATCH_QUOTE_API}${missing.map((item) => item.tencent).join(',')}`, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://gu.qq.com/' },
        });
        if (!response.ok) throw new Error(`tencent http ${response.status}`);
        const buffer = await response.arrayBuffer();
        const text = new TextDecoder('gbk').decode(buffer);
        const parsed = parseTencentQuoteBody(text);
        const stamped = Date.now();
        for (const item of missing) {
          const fields = parsed.get(item.tencent.toLowerCase());
          const quote = fields ? quoteFromTencentFields(item.raw, fields) : null;
          snapshotCache.set(item.raw, { at: stamped, quote: quote || fallbackSnapshot(item.raw) });
        }
      } catch {
        const stamped = Date.now();
        for (const item of missing) {
          if (!snapshotCache.has(item.raw)) {
            snapshotCache.set(item.raw, { at: stamped, quote: fallbackSnapshot(item.raw) });
          }
        }
      } finally {
        clearTimeout(timer);
      }
    });

    for (const item of missing) {
      out.set(item.raw, snapshotCache.get(item.raw)?.quote || fallbackSnapshot(item.raw));
    }
  }

  pruneSnapshotCache();
  return unique.map((symbol) => out.get(symbol) || fallbackSnapshot(symbol));
}
