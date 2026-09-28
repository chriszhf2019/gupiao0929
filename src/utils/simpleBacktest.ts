export interface SimpleBacktestResult {
  dataQuality: 'real' | 'insufficient';
  note?: string;
  buyHoldReturnPercent: number; // 区间买入持有收益
  strategyReturnPercent: number; // MA20 交叉策略收益
  annualizedReturnPercent: number; // 策略年化
  maxDrawdownPercent: number; // 策略最大回撤
  totalTrades: number; // 平仓交易次数
  winRatePercent: number; // 胜率
}

interface CostModel {
  commissionRate: number;
  minCommission: number;
  stampTaxRate: number;
  slippageRate: number;
}

const DEFAULT_COST: CostModel = {
  commissionRate: 0.00025,
  minCommission: 5,
  stampTaxRate: 0.0005,
  slippageRate: 0.001,
};

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

/**
 * 轻量自包含回测（仅依赖日K收盘价，供选股雷达批量回测候选池）
 * 策略：MA20 均线穿越（站上买入，跌破/回撤3% 卖出），含 A 股交易成本。
 */
export function runSimpleBacktest(
  bars: { date: string; price: number }[],
  cost: CostModel = DEFAULT_COST
): SimpleBacktestResult {
  const insufficient: SimpleBacktestResult = {
    dataQuality: 'insufficient',
    note: '日K数据不足（至少 40 根），无法回测。',
    buyHoldReturnPercent: 0,
    strategyReturnPercent: 0,
    annualizedReturnPercent: 0,
    maxDrawdownPercent: 0,
    totalTrades: 0,
    winRatePercent: 0,
  };
  if (!bars || bars.length < 40) return insufficient;

  const closes = bars.map((b) => b.price);
  const ma20 = rollingMean(closes, 20);

  // 买入持有
  const buyHold = ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100;

  let capital = 100000;
  let shares = 0;
  let entry = 0;
  let costBasis = 0;
  let peak = capital;
  let maxDd = 0;
  let trades = 0;
  let wins = 0;

  for (let i = 1; i < closes.length; i++) {
    const c = closes[i];
    const m20 = ma20[i];
    const prevM20 = ma20[i - 1];
    if (!Number.isFinite(m20) || !Number.isFinite(prevM20)) continue;

    let buy = false;
    let sell = false;
    if (shares === 0 && closes[i - 1] <= prevM20 && c > m20) {
      buy = true;
    } else if (shares > 0) {
      if ((closes[i - 1] >= prevM20 && c < m20) || c < m20 * 0.97) sell = true;
    }

    if (buy) {
      const exec = c * (1 + cost.slippageRate);
      const affordable = Math.floor(capital / exec / 100) * 100;
      if (affordable > 0) {
        const gross = affordable * exec;
        const commission = Math.max(gross * cost.commissionRate, cost.minCommission);
        if (gross + commission <= capital) {
          shares = affordable;
          entry = exec;
          costBasis = gross + commission;
          capital -= costBasis;
        }
      }
    } else if (sell && shares > 0) {
      const exec = c * (1 - cost.slippageRate);
      const gross = shares * exec;
      const commission = Math.max(gross * cost.commissionRate, cost.minCommission);
      const stamp = gross * cost.stampTaxRate;
      const net = gross - commission - stamp;
      const pnl = net - costBasis;
      trades++;
      if (pnl > 0) wins++;
      capital += net;
      shares = 0;
      entry = 0;
      costBasis = 0;
    }

    const equity = capital + shares * c;
    if (equity > peak) peak = equity;
    const dd = ((peak - equity) / peak) * 100;
    if (dd > maxDd) maxDd = dd;
  }

  const final = capital + shares * closes[closes.length - 1];
  const strategyReturn = ((final - 100000) / 100000) * 100;

  const first = new Date(bars[0].date).getTime();
  const last = new Date(bars[bars.length - 1].date).getTime();
  const calendarDays = Number.isFinite(first) && Number.isFinite(last) && last > first ? Math.round((last - first) / 86400000) : bars.length;
  const annualized = calendarDays > 0 ? (Math.pow(final / 100000, 365 / calendarDays) - 1) * 100 : 0;

  return {
    dataQuality: 'real',
    buyHoldReturnPercent: Number(buyHold.toFixed(2)),
    strategyReturnPercent: Number(strategyReturn.toFixed(2)),
    annualizedReturnPercent: Number(annualized.toFixed(2)),
    maxDrawdownPercent: Number(maxDd.toFixed(2)),
    totalTrades: trades,
    winRatePercent: trades > 0 ? Number(((wins / trades) * 100).toFixed(1)) : 0,
  };
}
