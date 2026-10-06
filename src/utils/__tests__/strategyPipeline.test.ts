import { describe, expect, it } from 'vitest';
import { PRESET_STOCKS } from '../../data/presetStocks';
import { createTrackedStockFromStockData } from '../../data/trackingData';
import { StockData } from '../../types/stock';
import { readStrategyLibrary, writeStrategyLibrary } from '../strategyLibrary';
import {
  applyStrategyToTracked,
  attachPresetMatches,
  outlookFromStock,
  rankPresetCandidates,
  rankSnapshotCandidates,
  resolveStrategyStyle,
  targetsFromOutlook,
} from '../strategyPipeline';

describe('选股策略、情景价与跟踪', () => {
  it('用户原话里的风格优先于模型给出的风格', () => {
    expect(resolveStrategyStyle('寻找股息率大于 4.5% 的央企', '价值白马')).toBe('高股息红利');
    expect(resolveStrategyStyle('帮我看看', '高景气成长')).toBe('高景气成长');
  });

  it('硬条件筛掉不合格的核心池标的，并带上情景价', () => {
    const dividend = rankPresetCandidates(Object.values(PRESET_STOCKS), '高股息红利').map((item) => item.symbol);
    expect(dividend).toContain('000001');
    expect(rankPresetCandidates(Object.values(PRESET_STOCKS), '高股息红利').find((item) => item.symbol === '000001')?.outlook.basis).toBe('unavailable');
    expect(dividend).toContain('600519');
    expect(dividend).not.toContain('NVDA');

    const growth = rankPresetCandidates(Object.values(PRESET_STOCKS), '高景气成长').map((item) => item.symbol);
    expect(growth).toEqual(expect.arrayContaining(['300750', 'NVDA']));
    expect(growth).not.toContain('600519');

    const value = rankPresetCandidates(Object.values(PRESET_STOCKS), '价值白马');
    expect(value.map((item) => item.symbol)).not.toContain('000001');
    const moutai = value.find((item) => item.symbol === '600519');
    expect(moutai?.outlook.basis).toBe('scenario');
    expect(moutai?.outlook.note).toContain('不是涨跌承诺');
    expect(moutai!.outlook.bullPrice!).toBeGreaterThan(moutai!.outlook.basePrice!);
  });

  it('净利润无法外推时不编造目标价', () => {
    const empty = {
      ...PRESET_STOCKS['600519'],
      currentPrice: 10,
      financialHistory: [],
    } as StockData;
    const outlook = outlookFromStock(empty);
    expect(outlook.basis).toBe('unavailable');
    expect(outlook.basePrice).toBeNull();
    expect(targetsFromOutlook(10, outlook)).toBeNull();
  });

  it('情景价写入跟踪后，止损低于现价、止盈高于现价', () => {
    const stock = PRESET_STOCKS['600519'];
    const outlook = outlookFromStock(stock);
    const tracked = applyStrategyToTracked(
      createTrackedStockFromStockData(stock, 'observe'),
      outlook,
      '高股息测试',
    );
    expect(tracked.strategyOutlook?.strategyName).toBe('高股息测试');
    expect(tracked.targetStopLossPrice).toBeLessThan(stock.currentPrice);
    expect(tracked.targetTakeProfitPrice).toBeGreaterThan(stock.currentPrice);
    expect(tracked.notes[0].content).toContain('高股息测试');
    expect(tracked.notes[0].content).toContain('不是涨跌承诺');
  });

  it('全市场快照用 PE、PB、ROE 打分，并排除 ST', () => {
    const ranked = rankSnapshotCandidates([
      { code: '601088', name: '中国神华', industry: '煤炭', price: 40, pe: 10, pb: 1.4, roe: 12, marketCapYi: 7000 },
      { code: '600000', name: 'ST 示例', industry: '银行', price: 8, pe: 5, pb: 0.5, roe: 9, marketCapYi: 2000, isSt: true },
      { code: '688111', name: '高估值', industry: '软件', price: 30, pe: 80, pb: 8, roe: 4, marketCapYi: 400 },
    ], '高股息红利');
    expect(ranked.map((item) => item.symbol)).toEqual(['601088']);
  });

  it('归档策略可以读写', () => {
    const memory = new Map<string, string>();
    const store = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => { memory.set(key, value); },
    };
    const strategy = attachPresetMatches({
      id: 's1',
      ideaPrompt: '高股息',
      strategyName: '收息',
      philosophy: '',
      expectedHoldingPeriod: '长线复利 (1-3年)' as const,
      riskLevel: '低风险防御' as const,
      rules: [],
      executionPlan: { entryStrategy: '', stopLossRule: '', takeProfitRule: '', positionLimit: '' },
      negativeChecklist: [],
      createdAt: '2026-10-06',
    }, '高股息');
    writeStrategyLibrary([strategy], store);
    expect(readStrategyLibrary(store)[0].strategyName).toBe('收息');
    expect(readStrategyLibrary(store)[0].matchedStocks.length).toBeGreaterThan(0);
  });
});
