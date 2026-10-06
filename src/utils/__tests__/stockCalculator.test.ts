import { describe, it, expect } from 'vitest';
import { calculateFundamentalScan, computeFiveStepSummary, generateLocalReport } from '../stockCalculator';
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

  it('银行高负债不计入否决，评分只看适用项', () => {
    const stock = makeStock();
    stock.sector = '商业银行 / 金融板块';
    stock.macro.sectorName = '银行业';
    stock.fundamentals.debtRatioValue = 91;
    stock.fundamentals.roeValue = 11;
    stock.fundamentals.revenueGrowthValue = 4;
    const scan = calculateFundamentalScan(stock);
    expect(scan.debtRatioPass).toBe(true);
    expect(scan.grossMarginPass).toBe(true);
    expect(scan.overallScore).toBe(100);
  });

  it('成长股营收增速低于 20% 不达标', () => {
    const stock = makeStock();
    stock.fundamentals.revenueGrowthValue = 10;
    const scan = calculateFundamentalScan(stock, 'growth_innovator');
    expect(scan.revenueGrowthPass).toBe(false);
  });
});

describe('generateLocalReport 本地兜底文案', () => {
  it('高分位不会写成极高安全边际', () => {
    const stock = makeStock();
    stock.valuation.historicalPePercentile = 92;
    const report = generateLocalReport(stock, 5);
    expect(report.summary).not.toContain('极高安全边际');
    expect(report.summary).toContain('安全边际很薄');
    expect(report.source).toBe('local');
  });
});

describe('computeFiveStepSummary 五步综合评分', () => {
  it('宏观分取政策催化分，滑块不改总分', () => {
    const stock = makeStock();
    stock.macro.policyCatalystScore = 5;
    stock.macro.industryStage = 'Mature Cash Cow';
    const low = computeFiveStepSummary(stock, 1);
    const high = computeFiveStepSummary(stock, 10);
    expect(low.macroPts).toBe(10);
    expect(high.totalScore).toBe(low.totalScore);
  });

  it('verdict 档位映射：>=85 strong', () => {
    const stock = makeStock();
    const summary = computeFiveStepSummary(stock, 10);
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
