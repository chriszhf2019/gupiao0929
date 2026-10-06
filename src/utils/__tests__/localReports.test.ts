import { describe, it, expect } from 'vitest';
import { makeStock } from '../../test/fixtures';
import { buildLocalDeepExploreReport } from '../localDeepExplore';
import { buildUnavailableInvestigativeReport } from '../unavailableInvestigative';
import { getDeepExplorationForStock } from '../../data/deepExplorationData';
import { sanitizeAiReport, parseJsonResponse } from '../../../server/deepseek';

describe('无密钥文案', () => {
  it('深度探索不写宽护城河和固定涨幅', () => {
    const stock = makeStock({ symbol: '601398', name: '工商银行' });
    const report = buildLocalDeepExploreReport(stock, '现金流');
    const text = JSON.stringify(report);
    expect(text).not.toContain('Wide Moat');
    expect(report.moatDurability).toContain('不评定护城河宽窄');
    expect(text).not.toContain('45%');
    expect(text).not.toContain('2.8');
    expect(report.executiveInsight).toContain('未配置模型');
    expect(report.moatDurability).toContain('不评定');
  });

  it('没有预置案例时不编造同业和 45% 上行', () => {
    const stock = makeStock({ symbol: '601398', name: '工商银行' });
    const data = getDeepExplorationForStock(stock);
    expect(data.peers).toHaveLength(1);
    expect(data.peers[0].symbol).toBe('601398');
    expect(data.porterForces.overallMoatRating).toBe('Unrated');
    expect(data.scenarios.bull.upsidePercent).not.toBe(45);
    expect(data.preMortem[0].potentialDrawdown).toBe('未测算');
  });

  it('调查兜底不填写模板占比', () => {
    const report = buildUnavailableInvestigativeReport('示例公司', '601398', '银行', makeStock({ symbol: '601398' }));
    const text = JSON.stringify(report);
    expect(text).not.toContain('3.5%');
    expect(text).not.toContain('62.0');
    expect(report.revenueStructure[0].percentage).toBeNull();
    expect(report.valuationContrast.realSharePercent).toBeNull();
    expect(report.complianceDisclaimer).toContain('未配置模型');
  });
});

describe('AI 研报 JSON', () => {
  it('剥掉代码围栏后解析对象', () => {
    const parsed = parseJsonResponse('说明\n```json\n{"verdictZh":"观望/持有","fiveStepScore":88}\n```');
    expect(parsed.verdictZh).toBe('观望/持有');
    expect(parsed.fiveStepScore).toBe(88);
  });

  it('非法结论回落到本地枚举，分数限制在 0 到 100', () => {
    const stock = makeStock();
    const report = sanitizeAiReport(
      { verdictZh: '全部买入', fiveStepScore: 140, summary: '  ' },
      stock,
      9
    );
    expect(['强烈推荐建仓', '建议分批逢低吸纳', '观望/持有', '风险偏高谨慎观望']).toContain(report.verdictZh);
    expect(report.fiveStepScore).toBe(100);
    expect(report.summary.length).toBeGreaterThan(0);
    expect(report.verdictZh).not.toBe('全部买入');
  });

  it('缺少分数字段时使用本地评分', () => {
    const stock = makeStock();
    const report = sanitizeAiReport({ verdictZh: '观望/持有' }, stock, 3);
    expect(report.fiveStepScore).toBeGreaterThan(0);
    expect(report.fiveStepScore).toBeLessThanOrEqual(100);
  });
});
