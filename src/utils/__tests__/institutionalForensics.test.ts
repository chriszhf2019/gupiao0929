import { describe, it, expect } from 'vitest';
import { calculateBeneishAndAltman, calculatePositionSizing, calculateScenarioValuation, inferScenarioAssumptions } from '../institutionalForensics';
import { makeStock, makeFinancialYears } from '../../test/fixtures';

describe('calculateBeneishAndAltman', () => {
  it('缺少资产负债表科目时返回 insufficient', () => {
    const stock = makeStock(); // financialHistory 无 balance 字段
    const result = calculateBeneishAndAltman(stock);
    expect(result.dataQuality).toBe('insufficient');
    expect(result.isManipulationRiskHigh).toBe(false);
  });

  it('有真实资产负债表时计算 M-Score 与 Z-Score', () => {
    const stock = makeStock();
    stock.financialHistory = makeFinancialYears(true);
    const result = calculateBeneishAndAltman(stock);
    expect(result.dataQuality).toBe('real');
    expect(result.mScore).toBeTypeOf('number');
    expect(result.zScore).toBeTypeOf('number');
    // 组件五项指标均有值
    expect(result.components.dsri).toBeTypeOf('number');
    expect(result.components.aqi).toBeTypeOf('number');
    expect(result.components.tata).toBeTypeOf('number');
    expect(result.components.lvgi).toBeTypeOf('number');
  });

  it('高应计利润（现金流远低于净利润）会推高 M-Score 风险', () => {
    const stock = makeStock();
    stock.financialHistory = makeFinancialYears(true);
    // 净利润远大于经营现金流 -> TATA 大幅抬高
    stock.financialHistory[1].netProfit = 2000;
    stock.financialHistory[1].freeCashFlow = 10;
    const result = calculateBeneishAndAltman(stock);
    expect(result.components.tata).toBeGreaterThan(0.1);
  });
});

describe('calculateScenarioValuation 三情景', () => {
  it('基准增速来自历史营收，悲观情景是基准的 60%', () => {
    const stock = makeStock();
    const assumptions = inferScenarioAssumptions(stock);
    expect(assumptions.cagr).toBeCloseTo(10, 0);
    const model = calculateScenarioValuation(stock);
    expect(model.base.cagr3Y).toBeCloseTo(assumptions.cagr, 1);
    expect(model.bear.cagr3Y).toBeCloseTo(assumptions.cagr * 0.6, 1);
    expect(model.assumptionNote).toContain('营收复合增速');
  });

  it('最近一期净利润不为正时不外推', () => {
    const stock = makeStock();
    stock.financialHistory[stock.financialHistory.length - 1].netProfit = -1;
    const model = calculateScenarioValuation(stock);
    expect(model.base.upsideDownside).toBe(0);
    expect(model.assumptionNote).toContain('无法外推');
  });
});

describe('calculatePositionSizing 头寸计算器', () => {
  it('整手向下取整（100 股）', () => {
    const r = calculatePositionSizing({ totalCapital: 300000, riskTolerancePercent: 1.5, entryPrice: 100, stopLossPrice: 90 });
    // 风险额 4500，每股风险 10 -> 理论 450 股 -> 400 股
    expect(r.recommendedShares).toBe(400);
  });

  it('每股风险有 2% 下限保护', () => {
    const r = calculatePositionSizing({ totalCapital: 300000, riskTolerancePercent: 1.5, entryPrice: 100, stopLossPrice: 99.5 });
    // 止损仅差 0.5，触发 2% 下限 -> riskPerShare = 2
    expect(r.riskPerShare).toBe(2);
  });

  it('仓位占比超过 30% 触发集中度预警', () => {
    const r = calculatePositionSizing({ totalCapital: 100000, riskTolerancePercent: 50, entryPrice: 10, stopLossPrice: 9 });
    expect(r.portfolioAllocationPercent).toBeGreaterThan(30);
    expect(r.isConcentrationWarning).toBe(true);
  });
});
