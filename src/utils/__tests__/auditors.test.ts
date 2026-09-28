import { describe, it, expect } from 'vitest';
import { auditPeerRecommendation } from '../peerRecommendationAuditor';
import { auditPortfolioHealth } from '../portfolioHealthAuditor';
import { makeStock } from '../../test/fixtures';

describe('auditPeerRecommendation 荐股验真', () => {
  it('高估值分位触发 trap_distribution 并给低分', () => {
    const stock = makeStock();
    stock.valuation.historicalPePercentile = 90;
    const r = auditPeerRecommendation({
      symbol: stock.symbol,
      recommenderName: '测试',
      sourceChannel: 'friend',
      recommendedReason: 'x',
      userAttitude: 'neutral',
      stock,
    });
    expect(r.auditVerdict).toBe('trap_distribution');
    expect(r.verdictScore).toBeLessThan(50);
    expect(r.redFlags.length).toBeGreaterThan(0);
  });

  it('基本面优秀且估值低位时为 resonance_buy', () => {
    const stock = makeStock();
    stock.valuation.historicalPePercentile = 30;
    stock.fundamentals.overallScore = 90;
    const r = auditPeerRecommendation({
      symbol: stock.symbol,
      recommenderName: '测试',
      sourceChannel: 'friend',
      recommendedReason: 'x',
      userAttitude: 'neutral',
      stock,
    });
    expect(r.auditVerdict).toBe('resonance_buy');
    expect(r.verdictScore).toBe(88);
  });
});

describe('auditPortfolioHealth 持仓体检', () => {
  it('无财务数据的标的标记 unknown 且不计入高危', () => {
    const report = auditPortfolioHealth(
      [{ symbol: 'XXXXX', name: '未知', shares: 100, costPrice: 10, currentPrice: 12 }],
      {}
    );
    expect(report.holdingsAudit[0].healthLevel).toBe('unknown');
    expect(report.highRiskExposurePercent).toBe(0);
  });

  it('负债率超标的标的判定 critical_danger', () => {
    const stock = makeStock();
    stock.fundamentals.debtRatioValue = 70;
    const report = auditPortfolioHealth(
      [{ symbol: '600519', name: '贵州茅台', shares: 100, costPrice: 1200, currentPrice: 1237 }],
      { '600519': stock }
    );
    expect(report.holdingsAudit[0].healthLevel).toBe('critical_danger');
    expect(report.highRiskExposurePercent).toBeGreaterThan(0);
  });
});
