import { describe, expect, it } from 'vitest';
import { assessMarketRegime, RegimeBar, splitTrackedByRegime } from '../marketRegime';

function bars(start: number, end: number, count = 80): RegimeBar[] {
  return Array.from({ length: count }, (_, index) => ({
    date: `d${index}`,
    price: start + ((end - start) * index) / (count - 1),
  }));
}

const indices = [
  { code: '000001', name: '上证指数', price: 3800, changePercent: 0.2 },
  { code: '399001', name: '深证成指', price: 12000, changePercent: -0.4 },
];

describe('市场状态、趋势与策略选择', () => {
  it('指数下跌且跌多涨少时，主策略是高股息和价值白马', () => {
    const regime = assessMarketRegime({
      indices,
      breadth: { up: 1200, down: 3800, flat: 100, total: 5100 },
      shanghaiBars: bars(4200, 3600),
    });
    expect(regime.trend).toBe('down');
    expect(regime.tone).toBe('risk_off');
    expect(regime.preferredStyles.slice(0, 2)).toEqual(['高股息红利', '价值白马']);
    expect(regime.deferredStyles).toContain('高景气成长');
    expect(regime.todaySummary).toContain('上证指数');
    expect(regime.trendDetail).toContain('60 日均线之下');
  });

  it('指数上升且上涨家数过半时，主策略包含成长和出海', () => {
    const regime = assessMarketRegime({
      indices,
      breadth: { up: 3600, down: 1400, flat: 100, total: 5100 },
      shanghaiBars: bars(3000, 3600),
    });
    expect(regime.trend).toBe('up');
    expect(regime.tone).toBe('risk_on');
    expect(regime.preferredStyles).toEqual(['高景气成长', '出海破局', '价值白马']);
  });

  it('指数上升但多数股票下跌时，不把成长当主策略', () => {
    const regime = assessMarketRegime({
      indices,
      breadth: { up: 1500, down: 3400, flat: 100, total: 5000 },
      shanghaiBars: bars(3000, 3600),
    });
    expect(regime.tone).toBe('divergence');
    expect(regime.preferredStyles).toEqual(['价值白马', '高股息红利']);
    expect(regime.deferredStyles).toContain('高景气成长');
  });

  it('跟踪名单按当前主策略分成仍匹配和已退出', () => {
    const split = splitTrackedByRegime(['高股息红利', '高景气成长', '自定策略'], ['高股息红利', '价值白马']);
    expect(split.still).toEqual(['高股息红利']);
    expect(split.dropped).toEqual(['高景气成长']);
  });

  it('日 K 不足时不编造趋势', () => {
    const regime = assessMarketRegime({
      indices,
      breadth: { up: 2500, down: 2500, flat: 100, total: 5100 },
      shanghaiBars: bars(100, 101, 20),
    });
    expect(regime.trend).toBe('unknown');
    expect(regime.trendDetail).toContain('不足 60 根');
  });
});
