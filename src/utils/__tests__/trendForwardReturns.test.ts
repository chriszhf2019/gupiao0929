import { describe, it, expect } from 'vitest';
import { analyzeTrendForwardReturns } from '../trendForwardReturns';

function makeBars(count: number, seed = 100): { date: string; price: number }[] {
  const out: { date: string; price: number }[] = [];
  let p = seed;
  for (let i = 0; i < count; i++) {
    p = p * (1 + Math.sin(i * 0.3) * 0.015 + 0.001);
    out.push({ date: `2025-01-${String((i % 28) + 1).padStart(2, '0')}`, price: Number(p.toFixed(2)) });
  }
  return out;
}

describe('analyzeTrendForwardReturns 历史形态后续表现', () => {
  it('K 线不足 60 根时返回 insufficient', () => {
    const result = analyzeTrendForwardReturns(makeBars(40));
    expect(result.dataQuality).toBe('insufficient');
    expect(result.goldenCrossStats).toHaveLength(0);
  });

  it('有足够 K 线时返回金叉/死叉统计', () => {
    const result = analyzeTrendForwardReturns(makeBars(250));
    expect(result.dataQuality).toBe('real');
    expect(result.goldenCrossStats).toHaveLength(3); // horizons [5,10,20]
    expect(result.deathCrossStats).toHaveLength(3);
    expect(['bullish', 'bearish', 'neutral']).toContain(result.currentState);
  });

  it('统计字段齐全且胜率在 0-100 之间', () => {
    const result = analyzeTrendForwardReturns(makeBars(300));
    for (const s of result.goldenCrossStats) {
      expect(s.horizon).toBeGreaterThan(0);
      if (s.samples > 0) {
        expect(s.winRate).toBeGreaterThanOrEqual(0);
        expect(s.winRate).toBeLessThanOrEqual(100);
      }
    }
  });
});
