import { describe, it, expect } from 'vitest';
import { runSimpleBacktest } from '../simpleBacktest';

function makeBars(count: number, seed = 100): { date: string; price: number }[] {
  const out: { date: string; price: number }[] = [];
  let p = seed;
  for (let i = 0; i < count; i++) {
    p = p * (1 + Math.sin(i * 0.4) * 0.02 + 0.002);
    out.push({ date: `2025-01-${String((i % 28) + 1).padStart(2, '0')}`, price: Number(p.toFixed(2)) });
  }
  return out;
}

describe('runSimpleBacktest 轻量回测', () => {
  it('K 线不足 40 根返回 insufficient', () => {
    const r = runSimpleBacktest(makeBars(30));
    expect(r.dataQuality).toBe('insufficient');
    expect(r.totalTrades).toBe(0);
  });

  it('有足够 K 线时输出回测指标', () => {
    const r = runSimpleBacktest(makeBars(250));
    expect(r.dataQuality).toBe('real');
    expect(r.buyHoldReturnPercent).toBeTypeOf('number');
    expect(r.strategyReturnPercent).toBeTypeOf('number');
    expect(r.maxDrawdownPercent).toBeGreaterThanOrEqual(0);
  });

  it('买入持有收益等于首尾价差', () => {
    const bars = [
      { date: '2025-01-01', price: 100 },
      { date: '2025-01-02', price: 101 },
      ...Array.from({ length: 45 }, (_, i) => ({ date: `2025-01-${3 + i}`, price: 110 })),
    ];
    const r = runSimpleBacktest(bars);
    // 首 100 -> 尾 110 = +10%
    expect(r.buyHoldReturnPercent).toBeCloseTo(10, 0);
  });
});
