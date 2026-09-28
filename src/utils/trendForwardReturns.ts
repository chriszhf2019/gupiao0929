import { PricePoint } from '../types/stock';

export interface ForwardReturnStat {
  horizon: number; // 持有天数
  meanPercent: number; // 平均涨跌幅 %
  medianPercent: number; // 中位数涨跌幅 %
  winRate: number; // 胜率 %
  samples: number; // 样本数
}

export interface TrendForwardResult {
  dataQuality: 'real' | 'insufficient';
  note?: string;
  currentState: 'bullish' | 'bearish' | 'neutral'; // 当前 MACD 状态
  goldenCrossStats: ForwardReturnStat[]; // 历史 MACD 金叉后 N 日表现
  deathCrossStats: ForwardReturnStat[]; // 历史 MACD 死叉后 N 日表现
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    out.push(values[i] * k + out[i - 1] * (1 - k));
  }
  return out;
}

/**
 * 历史相似形态的后续表现统计（数据驱动的趋势参考，非预测）
 * 扫描真实日K，统计「MACD 金叉/死叉」事件出现后的 N 日涨跌幅、胜率与中位数，
 * 用于回答"当前这种技术形态在历史上通常意味着什么"。历史不预示未来，仅供概率参考。
 */
export function analyzeTrendForwardReturns(
  bars: { date: string; price: number }[],
  horizons: number[] = [5, 10, 20]
): TrendForwardResult {
  const insufficient: TrendForwardResult = {
    dataQuality: 'insufficient',
    note: '日K数据不足（至少需要 60 根），无法统计历史相似形态的后续表现。',
    currentState: 'neutral',
    goldenCrossStats: [],
    deathCrossStats: [],
  };

  if (!bars || bars.length < 60) return insufficient;

  const closes = bars.map((b) => b.price);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const dif = closes.map((_, i) => ema12[i] - ema26[i]);
  const dea = ema(dif, 9);

  const goldenDays: number[] = [];
  const deathDays: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (dif[i - 1] <= dea[i - 1] && dif[i] > dea[i]) goldenDays.push(i);
    else if (dif[i - 1] >= dea[i - 1] && dif[i] < dea[i]) deathDays.push(i);
  }

  const statsFor = (days: number[]): ForwardReturnStat[] =>
    horizons.map((h) => {
      const rets = days
        .filter((i) => i + h < closes.length)
        .map((i) => ((closes[i + h] - closes[i]) / closes[i]) * 100);
      if (rets.length === 0) {
        return { horizon: h, meanPercent: 0, medianPercent: 0, winRate: 0, samples: 0 };
      }
      const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
      const sorted = [...rets].sort((a, b) => a - b);
      const median =
        sorted.length % 2 === 1
          ? sorted[(sorted.length - 1) / 2]
          : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
      const winRate = (rets.filter((r) => r > 0).length / rets.length) * 100;
      return { horizon: h, meanPercent: round1(mean), medianPercent: round1(median), winRate: round1(winRate), samples: rets.length };
    });

  const li = closes.length - 1;
  const currentState: TrendForwardResult['currentState'] =
    dif[li] > dea[li] ? 'bullish' : dif[li] < dea[li] ? 'bearish' : 'neutral';

  return {
    dataQuality: 'real',
    note: '基于真实历史日K统计；历史表现不预示未来，仅供概率参考。',
    currentState,
    goldenCrossStats: statsFor(goldenDays),
    deathCrossStats: statsFor(deathDays),
  };
}
