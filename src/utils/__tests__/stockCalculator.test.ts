import { describe, it, expect } from 'vitest';
import { calculateFundamentalScan, computeFiveStepSummary } from '../stockCalculator';
import { makeStock } from '../../test/fixtures';

describe('calculateFundamentalScan 六维排雷', () => {
  it('全部达标得 A+', () => {
    const scan = calculateFundamentalScan(makeStock());
    expect(scan.overallScore).toBe(100);
    expect(scan.grade).toBe('A+');
  });

  it('毛利率低于 30% 时判不达标', () => {
    const stock = makeStock();
    stock.fundamentals.grossMarginValue = 25;
    const scan = calculateFundamentalScan(stock);
    expect(scan.grossMarginPass).toBe(false);
    expect(scan.overallScore).toBe(Math.round((5 / 6) * 100));
  });

  it('负债率 > 60% 判不达标', () => {
    const stock = makeStock();
    stock.fundamentals.debtRatioValue = 65;
    const scan = calculateFundamentalScan(stock);
    expect(scan.debtRatioPass).toBe(false);
  });
});

describe('computeFiveStepSummary 五步综合评分', () => {
  it('宏观点数为滑块×2（满分20）', () => {
    const summary = computeFiveStepSummary(makeStock(), 5);
    expect(summary.macroPts).toBe(10);
  });

  it('verdict 档位映射：>=85 strong', () => {
    // 构造一个高分公司：宏观拉满 + 基本面满分 + 估值极低 + 金叉上升
    const stock = makeStock();
    const summary = computeFiveStepSummary(stock, 10); // 宏观20 + 基本面30 + 估值25 + 技术25 = 100
    expect(summary.totalScore).toBeGreaterThanOrEqual(85);
    expect(summary.verdictLevel).toBe('strong');
    expect(summary.verdict).toBe('强烈推荐建仓');
  });

  it('估值分位越高得分越低', () => {
    const low = makeStock();
    low.valuation.historicalPePercentile = 5;
    const high = makeStock();
    high.valuation.historicalPePercentile = 90;
    expect(computeFiveStepSummary(low, 5).valPts).toBeGreaterThan(computeFiveStepSummary(high, 5).valPts);
  });
});
