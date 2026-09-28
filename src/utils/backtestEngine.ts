import { StockData, StrategyBacktestResult, BacktestPerformancePoint, PricePoint } from '../types/stock';

export type BacktestStrategyType = 'ma_pullback' | 'safety_margin_staged' | 'breakout_momentum';

/**
 * 交易成本模型（默认按 A 股现行费率假设，可由调用方覆盖）
 */
export interface BacktestCostModel {
  commissionRate: number; // 佣金费率（买卖双边各收一次）
  minCommission: number; // 单笔最低佣金（元）
  stampTaxRate: number; // 印花税（仅卖出收取，A 股现行 0.05%）
  slippageRate: number; // 滑点假设（成交价按不利方向偏移的比例，双边）
}

export const DEFAULT_COST_MODEL: BacktestCostModel = {
  commissionRate: 0.00025, // 万 2.5
  minCommission: 5,
  stampTaxRate: 0.0005,
  slippageRate: 0.001,
};

export const COST_NOTE = '成本假设：佣金万2.5(单笔最低5元) + 印花税0.05%(仅卖出) + 双边滑点0.1%；按100股整手撮合';

export interface BenchmarkBar {
  date: string;
  price: number;
}

export interface BacktestOptions {
  benchmark?: BenchmarkBar[]; // 真实指数基准日 K（如沪深300），与个股日期按 date 对齐
  costModel?: Partial<BacktestCostModel>;
  riskFreeRateAnnual?: number; // 无风险利率（年化，默认 2%）
}

const RISK_FREE_RATE_ANNUAL_DEFAULT = 0.02;

function buildInsufficientResult(
  strategyName: string,
  initialCapital: number,
  reason: string
): StrategyBacktestResult {
  return {
    strategyName,
    period: '',
    initialCapital,
    finalCapital: initialCapital,
    totalReturnPercent: 0,
    annualizedReturnPercent: 0,
    benchmarkReturnPercent: 0,
    excessReturnPercent: 0,
    maxDrawdownPercent: 0,
    sharpeRatio: 0,
    winRatePercent: 0,
    profitFactor: 0,
    totalTrades: 0,
    insufficientData: true,
    insufficientReason: reason,
    performanceSeries: [],
    tradeSignalsSummary: [],
  };
}

function parseCalendarDays(prices: PricePoint[]): number {
  const first = new Date(prices[0].date).getTime();
  const last = new Date(prices[prices.length - 1].date).getTime();
  if (!Number.isFinite(first) || !Number.isFinite(last)) return 0;
  return Math.round((last - first) / 86400000);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * 针对当前标的与选定交易策略执行量化回测模拟（含交易成本、真实基准与标准夏普）
 */
export function runStrategyBacktest(
  stock: StockData,
  strategyType: BacktestStrategyType = 'ma_pullback',
  initialCapital = 100000,
  options: BacktestOptions = {}
): StrategyBacktestResult {
  const cost: BacktestCostModel = { ...DEFAULT_COST_MODEL, ...(options.costModel || {}) };
  const riskFreeAnnual = options.riskFreeRateAnnual ?? RISK_FREE_RATE_ANNUAL_DEFAULT;

  let strategyName = '20日均线回踩企稳+严格止损策略';
  if (strategyType === 'safety_margin_staged') {
    strategyName = '安全边际折价率+分批建仓三部曲策略';
  } else if (strategyType === 'breakout_momentum') {
    strategyName = '右侧放量突破+跟踪移动止盈策略';
  }

  const prices = stock.priceHistory;
  if (!prices || prices.length < 20) {
    return buildInsufficientResult(
      strategyName,
      initialCapital,
      '真实日K数据不足（至少需要 20 根K线以计算均线信号），无法执行回测。请确认行情源可用后重试。'
    );
  }

  // 真实基准：按日期对齐（基准缺失的交易日不绘制基准净值）
  const benchMap = new Map<string, number>();
  (options.benchmark || []).forEach((b) => {
    if (Number.isFinite(b.price) && b.price > 0) benchMap.set(b.date, b.price);
  });
  let benchBase: number | null = null;
  for (let i = 0; i < prices.length; i++) {
    const p = benchMap.get(prices[i].date);
    if (p) {
      benchBase = p;
      break;
    }
  }
  const benchmarkAvailable = benchBase !== null && benchMap.size >= 10;

  const series: BacktestPerformancePoint[] = [];
  const signals: StrategyBacktestResult['tradeSignalsSummary'] = [];

  let currentCapital = initialCapital;
  let sharesHeld = 0;
  let costBasisTotal = 0; // 含佣金的买入总成本
  let entryPrice = 0;
  let peakCapital = initialCapital;
  let maxDrawdown = 0;
  let winTrades = 0;
  let totalTrades = 0;
  let totalWinPnL = 0;
  let totalLossPnL = 0;

  const initialStockPrice = prices[0].price;

  // 逐日遍历模拟交易与净值变动
  for (let i = 0; i < prices.length; i++) {
    const pt = prices[i];
    const prevPt = i > 0 ? prices[i - 1] : pt;

    const benchPrice = benchMap.get(pt.date);
    const benchmarkReturn = benchmarkAvailable && benchPrice && benchBase ? benchPrice / benchBase : undefined;
    const stockHoldReturn = pt.price / initialStockPrice;

    // 交易信号规则触发
    let triggerBuy = false;
    let triggerSell = false;
    let tradeReason = '';

    if (strategyType === 'ma_pullback') {
      // 回踩 MA20 且收盘价在 MA20 之上 (金叉/企稳)
      if (sharesHeld === 0 && pt.price >= pt.ma20 && prevPt.price <= prevPt.ma20) {
        triggerBuy = true;
        tradeReason = '股价自下而上有效站上MA20日均线，右侧买点确立';
      } else if (sharesHeld > 0) {
        // 跌破止损线或跌破 MA20 超过 3%
        const stopLossPrice = stock.technical.positionStrategy.stopLossPrice || entryPrice * 0.93;
        const takeProfitPrice = stock.technical.positionStrategy.takeProfitPrice || entryPrice * 1.15;
        if (pt.price <= stopLossPrice) {
          triggerSell = true;
          tradeReason = '触碰硬性止损防守线，果断离场';
        } else if (pt.price >= takeProfitPrice) {
          triggerSell = true;
          tradeReason = '触及目标止盈位，落袋为安';
        } else if (pt.price < pt.ma20 * 0.97) {
          triggerSell = true;
          tradeReason = '破位跌穿MA20支撑带超过3%，防守出局';
        }
      }
    } else if (strategyType === 'safety_margin_staged') {
      // 接近安全边际价格时分批低吸
      const marginTarget = stock.valuation.marginOfSafetyPrice;
      if (sharesHeld === 0 && pt.price <= marginTarget * 1.05) {
        triggerBuy = true;
        tradeReason = '股价进入历史安全边际折价区，建立第1/2批底仓';
      } else if (sharesHeld > 0 && pt.price >= stock.valuation.fairValuePrice) {
        triggerSell = true;
        tradeReason = '股价回归内在合理公允估值，兑现收益';
      }
    } else {
      // 突破阻力位
      const r1 = stock.technical.resistanceLevel1;
      if (sharesHeld === 0 && pt.price >= r1 * 0.99) {
        triggerBuy = true;
        tradeReason = '放量突破前期密集成交压力位R1，顺势跟进';
      } else if (sharesHeld > 0 && pt.price <= pt.ma5 * 0.98) {
        triggerSell = true;
        tradeReason = '跌破5日超短均线，止盈退出';
      }
    }

    // 执行买入（滑点不利偏移 + 佣金，100 股整手向下取整）
    if (triggerBuy && sharesHeld === 0 && currentCapital > 0) {
      const execPrice = pt.price * (1 + cost.slippageRate);
      const affordableShares = Math.floor(currentCapital / execPrice / 100) * 100;
      if (affordableShares > 0) {
        const grossCost = affordableShares * execPrice;
        const commission = Math.max(grossCost * cost.commissionRate, cost.minCommission);
        if (grossCost + commission <= currentCapital) {
          sharesHeld = affordableShares;
          entryPrice = execPrice;
          costBasisTotal = grossCost + commission;
          currentCapital -= costBasisTotal;
          signals.push({
            date: pt.date,
            type: 'BUY',
            price: round2(execPrice),
            reason: tradeReason,
          });
        }
      }
    } else if (triggerSell && sharesHeld > 0) {
      // 执行卖出（滑点不利偏移 + 佣金 + 印花税）
      const execPrice = pt.price * (1 - cost.slippageRate);
      const grossProceeds = sharesHeld * execPrice;
      const commission = Math.max(grossProceeds * cost.commissionRate, cost.minCommission);
      const stampTax = grossProceeds * cost.stampTaxRate;
      const netProceeds = grossProceeds - commission - stampTax;
      const netPnl = netProceeds - costBasisTotal;
      const pnlPercent = costBasisTotal > 0 ? (netPnl / costBasisTotal) * 100 : 0;

      currentCapital += netProceeds;
      totalTrades++;
      if (netPnl > 0) {
        winTrades++;
        totalWinPnL += netPnl;
      } else {
        totalLossPnL += Math.abs(netPnl);
      }
      signals.push({
        date: pt.date,
        type: 'SELL',
        price: round2(execPrice),
        reason: tradeReason,
        pnlPercent: Number(pnlPercent.toFixed(2)),
      });
      sharesHeld = 0;
      entryPrice = 0;
      costBasisTotal = 0;
    }

    // 计算当日策略总资产
    const dailyPortfolioValue = currentCapital + sharesHeld * pt.price;
    const strategyReturn = dailyPortfolioValue / initialCapital;

    // 统计动态最大回撤
    if (dailyPortfolioValue > peakCapital) {
      peakCapital = dailyPortfolioValue;
    }
    const currentDrawdown = ((peakCapital - dailyPortfolioValue) / peakCapital) * 100;
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }

    series.push({
      date: pt.date,
      strategyReturn: Number(strategyReturn.toFixed(3)),
      ...(benchmarkReturn !== undefined ? { benchmarkReturn: Number(benchmarkReturn.toFixed(3)) } : {}),
      stockHoldReturn: Number(stockHoldReturn.toFixed(3)),
      drawdown: Number(currentDrawdown.toFixed(2)),
    });
  }

  // 结算最终资金（期末若仍持仓，按最后一日收盘价估值，未计卖出成本）
  const finalCapital = currentCapital + sharesHeld * prices[prices.length - 1].price;
  const totalReturnPercent = Number((((finalCapital - initialCapital) / initialCapital) * 100).toFixed(2));

  // 年化：按真实日历天数折算（无法解析日期时退化为交易日口径）
  const calendarDays = parseCalendarDays(prices);
  const period = calendarDays > 0
    ? `${prices[0].date} ~ ${prices[prices.length - 1].date}（${calendarDays} 个日历日 / ${prices.length} 个交易日）`
    : `近 ${prices.length} 个交易日`;
  const annualizationDays = calendarDays > 0 ? calendarDays : prices.length;
  const annualized = annualizationDays > 0
    ? (Math.pow(finalCapital / initialCapital, 365 / annualizationDays) - 1) * 100
    : 0;
  const annualizedReturnPercent = Number(annualized.toFixed(2));

  const finalBenchmark = series[series.length - 1]?.benchmarkReturn;
  const benchmarkReturnPercent = benchmarkAvailable && finalBenchmark ? Number(((finalBenchmark - 1) * 100).toFixed(2)) : 0;
  const excessReturnPercent = benchmarkAvailable
    ? Number((totalReturnPercent - benchmarkReturnPercent).toFixed(2))
    : totalReturnPercent;

  // 标准夏普：日收益均值-日无风险 / 日收益标准差 × √252
  const dailyReturns: number[] = [];
  for (let i = 1; i < series.length; i++) {
    if (series[i - 1].strategyReturn > 0) {
      dailyReturns.push(series[i].strategyReturn / series[i - 1].strategyReturn - 1);
    }
  }
  let sharpeRatio = 0;
  if (dailyReturns.length >= 2) {
    const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const variance =
      dailyReturns.reduce((acc, r) => acc + (r - mean) * (r - mean), 0) / (dailyReturns.length - 1);
    const std = Math.sqrt(variance);
    const rfDaily = riskFreeAnnual / 365;
    if (std > 0) {
      sharpeRatio = Number((((mean - rfDaily) / std) * Math.sqrt(252)).toFixed(2));
    }
  }

  const winRatePercent = totalTrades > 0 ? Number(((winTrades / totalTrades) * 100).toFixed(1)) : 0;
  const profitFactor =
    totalLossPnL > 0
      ? Number((totalWinPnL / totalLossPnL).toFixed(2))
      : totalTrades > 0 && totalWinPnL > 0
      ? 99.99 // 有盈利交易且无亏损交易时的上限哨兵值
      : 0;

  return {
    strategyName,
    period,
    initialCapital,
    finalCapital: Math.round(finalCapital),
    totalReturnPercent,
    annualizedReturnPercent,
    benchmarkReturnPercent,
    excessReturnPercent,
    maxDrawdownPercent: Number(maxDrawdown.toFixed(2)),
    sharpeRatio,
    winRatePercent,
    profitFactor,
    totalTrades,
    benchmarkAvailable,
    costNote: COST_NOTE,
    performanceSeries: series,
    tradeSignalsSummary: signals,
  };
}
