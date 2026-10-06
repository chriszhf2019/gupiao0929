import { PRESET_STOCKS } from '../data/presetStocks';
import { STATUS_MAP } from '../data/trackingData';
import {
  AIStockStrategy,
  SnapshotCandidate,
  StockData,
  StrategyCandidateMatch,
  StrategyOutlook,
  TrackedStockItem,
} from '../types/stock';
import { calculateScenarioValuation } from './institutionalForensics';

export type StrategyStyle = AIStockStrategy['styleTag'];

const STYLES: StrategyStyle[] = ['价值白马', '高股息红利', '高景气成长', '困境反转', '小盘隐形冠军', '出海破局'];

export interface ScreenSnapshot {
  code: string;
  name: string;
  industry: string;
  price: number;
  pe: number;
  pb: number;
  roe: number;
  marketCapYi: number;
  isSt?: boolean;
}

export function isStrategyStyle(value: unknown): value is StrategyStyle {
  return typeof value === 'string' && STYLES.includes(value as StrategyStyle);
}

export function styleFromKeywords(prompt: string): StrategyStyle | null {
  if (/股息|分红|央企|收息|红利/.test(prompt)) return '高股息红利';
  if (/出海|全球|外销/.test(prompt)) return '出海破局';
  if (/反转|困境/.test(prompt)) return '困境反转';
  if (/小盘|隐形冠军/.test(prompt)) return '小盘隐形冠军';
  if (/科技|芯片|算力|机器人|成长|研发/.test(prompt)) return '高景气成长';
  if (/白马|护城河|价值|消费/.test(prompt)) return '价值白马';
  return null;
}

export function resolveStrategyStyle(prompt: string, hinted?: string): StrategyStyle {
  return styleFromKeywords(prompt) || (isStrategyStyle(hinted) ? hinted : '价值白马');
}

export function marketCapYi(text: string): number | null {
  const matched = text.replace(/,/g, '').match(/([\d.]+)\s*(万亿|亿)/);
  if (!matched) return null;
  const amount = Number(matched[1]);
  if (!Number.isFinite(amount)) return null;
  return matched[2] === '万亿' ? amount * 10000 : amount;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function scored(passed: boolean, hits: number, checks: number, reasons: string[]) {
  if (!passed || checks === 0) return { pass: false, score: 0, reasons: [] as string[] };
  return { pass: true, score: Math.min(100, Math.round((hits / checks) * 100)), reasons: reasons.slice(0, 3) };
}

function presetVerdict(stock: StockData, style: StrategyStyle) {
  const fundamentals = stock.fundamentals;
  const valuation = stock.valuation;
  const reasons: string[] = [];
  let hits = 0;
  let checks = 0;
  const add = (ok: boolean, reason: string) => {
    checks += 1;
    if (ok) {
      hits += 1;
      reasons.push(reason);
    }
  };

  if (style === '高股息红利') {
    add(valuation.dividendYield >= 3, `股息率 ${valuation.dividendYield}%`);
    add(valuation.historicalPePercentile <= 40, `PE 分位 ${valuation.historicalPePercentile}%`);
    add(fundamentals.debtRatioValue <= 60, `负债率 ${fundamentals.debtRatioValue}%`);
    return scored(valuation.dividendYield >= 3 && hits >= 2, hits, checks, reasons);
  }

  if (style === '高景气成长') {
    add(fundamentals.revenueGrowthValue >= 20, `营收增速 ${fundamentals.revenueGrowthValue}%`);
    add(fundamentals.roeValue >= 12, `ROE ${fundamentals.roeValue}%`);
    add(fundamentals.grossMarginValue >= 20, `毛利率 ${fundamentals.grossMarginValue}%`);
    return scored(fundamentals.revenueGrowthValue >= 20 && fundamentals.roeValue >= 12 && hits >= 2, hits, checks, reasons);
  }

  if (style === '出海破局') {
    const text = `${stock.sector} ${stock.name} ${stock.macro?.sectorName || ''}`;
    const abroad = /出海|新能源|汽车|半导体|制造|电池/.test(text);
    add(abroad, stock.sector);
    add(fundamentals.roeValue >= 12, `ROE ${fundamentals.roeValue}%`);
    add(fundamentals.revenueGrowthValue >= 10, `营收增速 ${fundamentals.revenueGrowthValue}%`);
    return scored(abroad && fundamentals.roeValue >= 12 && hits >= 2, hits, checks, reasons);
  }

  if (style === '困境反转') {
    add(valuation.historicalPePercentile <= 20, `PE 分位 ${valuation.historicalPePercentile}%`);
    add(fundamentals.roeValue > 0 && fundamentals.roeValue < 15, `ROE ${fundamentals.roeValue}%`);
    add(fundamentals.debtRatioValue <= 70, `负债率 ${fundamentals.debtRatioValue}%`);
    const cheapAndSoft = valuation.historicalPePercentile <= 20 && fundamentals.roeValue > 0 && fundamentals.roeValue < 15;
    return scored(cheapAndSoft && hits >= 2, hits, checks, reasons);
  }

  if (style === '小盘隐形冠军') {
    const cap = marketCapYi(stock.marketCap);
    add(cap != null && cap >= 80 && cap <= 800, cap == null ? '市值无法换算' : `市值约 ${cap} 亿`);
    add(fundamentals.roeValue >= 12, `ROE ${fundamentals.roeValue}%`);
    add(valuation.historicalPePercentile <= 50, `PE 分位 ${valuation.historicalPePercentile}%`);
    return scored(cap != null && cap >= 80 && cap <= 800 && hits >= 2, hits, checks, reasons);
  }

  add(fundamentals.grossMarginValue >= 30, `毛利率 ${fundamentals.grossMarginValue}%`);
  add(fundamentals.roeValue >= 15, `ROE ${fundamentals.roeValue}%`);
  add(valuation.historicalPePercentile <= 40, `PE 分位 ${valuation.historicalPePercentile}%`);
  add(fundamentals.debtRatioValue <= 60, `负债率 ${fundamentals.debtRatioValue}%`);
  const quality = fundamentals.grossMarginValue >= 30 && fundamentals.roeValue >= 15;
  const cheapQuality = fundamentals.roeValue >= 15 && valuation.historicalPePercentile <= 25;
  return scored((quality || cheapQuality) && hits >= 2, hits, checks, reasons);
}

export function outlookFromStock(stock: StockData): StrategyOutlook {
  const model = calculateScenarioValuation(stock);
  if (model.base.terminalPe === 0) {
    return {
      basis: 'unavailable',
      bearPrice: null,
      basePrice: null,
      bullPrice: null,
      weightedPrice: null,
      note: model.assumptionNote || '缺少可外推的净利润，三年情景先空着。',
    };
  }
  return {
    basis: 'scenario',
    bearPrice: model.bear.fairValue,
    basePrice: model.base.fairValue,
    bullPrice: model.bull.fairValue,
    weightedPrice: model.probabilityWeightedPrice,
    note: '三年情景用历史营收复合增速和当前市盈率外推，用来设跟踪价，不是涨跌承诺。',
  };
}

export function targetsFromOutlook(price: number, outlook: StrategyOutlook) {
  if (outlook.basis !== 'scenario' || outlook.bearPrice == null || outlook.basePrice == null || outlook.bullPrice == null || price <= 0) {
    return null;
  }
  const stop = outlook.bearPrice < price ? outlook.bearPrice : round2(price * 0.92);
  const take = outlook.bullPrice > price
    ? outlook.bullPrice
    : outlook.basePrice > price
      ? outlook.basePrice
      : round2(price * 1.15);
  const buy = outlook.basePrice < price ? outlook.basePrice : price;
  return {
    targetBuyPrice: round2(buy),
    targetPullbackBuyPrice: round2((stop + buy) / 2),
    targetStopLossPrice: round2(stop),
    targetTakeProfitPrice: round2(take),
  };
}

function candidateFromStock(stock: StockData, style: StrategyStyle): StrategyCandidateMatch | null {
  const verdict = presetVerdict(stock, style);
  if (!verdict.pass) return null;
  return {
    symbol: stock.symbol,
    name: stock.name,
    market: stock.market,
    currentPrice: stock.currentPrice,
    peTTM: stock.peTTM,
    matchScore: verdict.score,
    highlightReasons: verdict.reasons,
    metricsSnapshot: {
      grossMargin: stock.fundamentals.grossMarginValue,
      roe: stock.fundamentals.roeValue,
      debtRatio: stock.fundamentals.debtRatioValue,
      pePercentile: stock.valuation.historicalPePercentile,
      dividendYield: stock.valuation.dividendYield,
    },
    outlook: outlookFromStock(stock),
  };
}

export function rankPresetCandidates(stocks: StockData[], style: StrategyStyle, limit = 5): StrategyCandidateMatch[] {
  return stocks
    .map((stock) => candidateFromStock(stock, style))
    .filter((item): item is StrategyCandidateMatch => item != null)
    .sort((a, b) => b.matchScore - a.matchScore || a.symbol.localeCompare(b.symbol))
    .slice(0, limit);
}

export function attachPresetMatches<T extends { styleTag?: string; ideaPrompt?: string }>(
  draft: T,
  prompt: string,
  stocks: StockData[] = Object.values(PRESET_STOCKS),
): T & { styleTag: StrategyStyle; matchedStocks: StrategyCandidateMatch[] } {
  const style = resolveStrategyStyle(prompt || draft.ideaPrompt || '', draft.styleTag);
  return {
    ...draft,
    styleTag: style,
    matchedStocks: rankPresetCandidates(stocks, style),
  };
}

export function rankSnapshotCandidates(items: ScreenSnapshot[], style: StrategyStyle, limit = 6): SnapshotCandidate[] {
  const ranked = items
    .filter((item) => !item.isSt && item.price > 0)
    .map((item) => {
      const reasons: string[] = [];
      let hits = 0;
      let checks = 0;
      const add = (ok: boolean, reason: string) => {
        checks += 1;
        if (ok) {
          hits += 1;
          reasons.push(reason);
        }
      };
      let passed = false;
      if (style === '高股息红利') {
        add(item.pe > 0 && item.pe <= 12, `PE ${item.pe}`);
        add(item.pb > 0 && item.pb <= 2, `PB ${item.pb}`);
        add(item.roe >= 8, `ROE ${item.roe}%`);
        passed = item.pe > 0 && item.pe <= 12 && item.pb > 0 && item.pb <= 2 && hits >= 2;
      } else if (style === '高景气成长') {
        add(item.roe >= 15, `ROE ${item.roe}%`);
        add(item.pe > 20 && item.pe <= 80, `PE ${item.pe}`);
        passed = item.roe >= 15 && item.pe > 20 && item.pe <= 80;
      } else if (style === '出海破局') {
        const abroad = /电子|汽车|机械|电力设备|家电|半导体|电池/.test(item.industry);
        add(abroad, item.industry);
        add(item.roe >= 10, `ROE ${item.roe}%`);
        add(item.pe > 0 && item.pe <= 40, `PE ${item.pe}`);
        passed = abroad && item.roe >= 10 && hits >= 2;
      } else if (style === '困境反转') {
        add(item.pe > 0 && item.pe <= 15, `PE ${item.pe}`);
        add(item.roe > 0 && item.roe < 10, `ROE ${item.roe}%`);
        passed = item.pe > 0 && item.pe <= 15 && item.roe > 0 && item.roe < 10;
      } else if (style === '小盘隐形冠军') {
        add(item.marketCapYi >= 80 && item.marketCapYi <= 800, `市值 ${item.marketCapYi} 亿`);
        add(item.roe >= 12, `ROE ${item.roe}%`);
        add(item.pe > 0 && item.pe <= 40, `PE ${item.pe}`);
        passed = item.marketCapYi >= 80 && item.marketCapYi <= 800 && item.roe >= 12 && hits >= 2;
      } else {
        add(item.pe > 0 && item.pe <= 20, `PE ${item.pe}`);
        add(item.roe >= 12, `ROE ${item.roe}%`);
        add(item.pb > 0 && item.pb <= 5, `PB ${item.pb}`);
        passed = item.pe > 0 && item.pe <= 20 && item.roe >= 12 && hits >= 2;
      }
      const result = scored(passed, hits, checks, reasons);
      if (!result.pass) return null;
      return {
        symbol: item.code,
        name: item.name,
        industry: item.industry,
        price: item.price,
        pe: item.pe,
        pb: item.pb,
        roe: item.roe,
        marketCapYi: item.marketCapYi,
        matchScore: result.score,
        reasons: result.reasons,
      } satisfies SnapshotCandidate;
    })
    .filter((item): item is SnapshotCandidate => item != null)
    .sort((a, b) => b.matchScore - a.matchScore || b.roe - a.roe);
  return ranked.slice(0, limit);
}

export function applyStrategyToTracked(
  item: TrackedStockItem,
  outlook: StrategyOutlook,
  strategyName: string,
): TrackedStockItem {
  const targets = targetsFromOutlook(item.currentPrice, outlook);
  const buyBelow = targets != null && targets.targetBuyPrice < item.currentPrice * 0.99;
  const status = buyBelow ? 'waiting_pullback' : 'observe';
  const content = outlook.basis === 'scenario'
    ? `按策略「${strategyName}」纳入跟踪。三年情景目标价：悲观 ${outlook.bearPrice}，基准 ${outlook.basePrice}，乐观 ${outlook.bullPrice}。${outlook.note}`
    : `按策略「${strategyName}」纳入跟踪。${outlook.note}`;
  return {
    ...item,
    trackStatus: status,
    statusLabelZh: STATUS_MAP[status].label,
    ...(targets ?? {}),
    strategyOutlook: {
      ...outlook,
      strategyName,
    },
    notes: [
      {
        id: `n-strat-${item.symbol}`,
        timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
        stage: '策略预测',
        author: '策略跟踪',
        content,
        sentiment: outlook.basis === 'scenario' && (outlook.basePrice ?? 0) >= item.currentPrice ? 'bullish' : 'neutral',
      },
    ],
  };
}
