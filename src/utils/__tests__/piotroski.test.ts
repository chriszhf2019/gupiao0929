import { describe, it, expect } from 'vitest';
import { calculatePiotroski } from '../piotroski';
import { makeStock, makeFinancialYears } from '../../test/fixtures';

describe('calculatePiotroski F-Score', () => {
  it('缺少资产负债表科目时返回 insufficient', () => {
    const stock = makeStock(); // financialHistory 无 balance 字段
    const result = calculatePiotroski(stock);
    expect(result.dataQuality).toBe('insufficient');
    expect(result.items).toHaveLength(0);
  });

  it('有真实资产负债表时计算 8 项评分', () => {
    const stock = makeStock();
    stock.financialHistory = makeFinancialYears(true);
    const result = calculatePiotroski(stock);
    expect(result.dataQuality).toBe('real');
    expect(result.maxScore).toBe(8);
    expect(result.items).toHaveLength(8);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(8);
  });

  it('盈利且现金流健康的公司得分较高', () => {
    const stock = makeStock();
    stock.financialHistory = makeFinancialYears(true);
    // 构造"全面改善"的场景：营收/净利/毛利/现金流/流动比率均提升，负债下降
    const cur = stock.financialHistory[1];
    const prev = stock.financialHistory[0];
    cur.netProfit = 600;
    cur.freeCashFlow = 700;
    cur.grossMargin = 93;
    cur.revenue = 1800;
    cur.currentAssets = 2300;
    cur.currentLiabilities = 400;
    cur.totalLiabilities = 450;
    prev.freeCashFlow = 100;
    const result = calculatePiotroski(stock);
    expect(result.score).toBeGreaterThanOrEqual(6);
    expect(['优质', '良好']).toContain(result.rating);
  });
});
