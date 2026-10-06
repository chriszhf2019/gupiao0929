import { describe, it, expect } from 'vitest';
import { runStrategyBacktest } from '../backtestEngine';
import { makeStock, makePriceHistory } from '../../test/fixtures';

describe('runStrategyBacktest 回测引擎', () => {
  it('K 线不足 20 根时返回 insufficientData', () => {
    const stock = makeStock();
    stock.priceHistory = makePriceHistory(10, 100);
    const result = runStrategyBacktest(stock);
    expect(result.insufficientData).toBe(true);
    expect(result.tradeSignalsSummary).toHaveLength(0);
  });

  it('有真实 K 线时可正常回测并输出净值序列', () => {
    const stock = makeStock();
    stock.priceHistory = makePriceHistory(30, 100);
    const result = runStrategyBacktest(stock);
    expect(result.insufficientData).toBeUndefined();
    expect(result.performanceSeries.length).toBe(30);
    expect(result.annualizedReliable).toBe(false);
    expect(result.annualizedReturnPercent).toBe(0);
    expect(result.sharpeRatio).toBe(0);
    expect(result.initialCapital).toBe(100000);
  });

  it('无平仓交易时胜率与盈亏比显示为 0（不再美化）', () => {
    const stock = makeStock();
    stock.priceHistory = makePriceHistory(30, 100);
    const result = runStrategyBacktest(stock, 'breakout_momentum', 100000);
    if (result.totalTrades === 0) {
      expect(result.winRatePercent).toBe(0);
      expect(result.profitFactor).toBe(0);
    }
  });

  it('传入真实基准时标记 benchmarkAvailable 并计算超额收益', () => {
    const stock = makeStock();
    stock.priceHistory = makePriceHistory(30, 100);
    const benchmark = stock.priceHistory.map((p) => ({ date: p.date, price: p.price * 0.9 }));
    const result = runStrategyBacktest(stock, 'ma_pullback', 100000, { benchmark });
    expect(result.benchmarkAvailable).toBe(true);
    expect(result.benchmarkReturnPercent).toBeTypeOf('number');
  });
});
