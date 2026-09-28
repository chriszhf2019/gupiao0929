import { StockData, FinancialYear, PricePoint } from '../types/stock';

export function makePriceHistory(count = 30, base = 100): PricePoint[] {
  const out: PricePoint[] = [];
  for (let i = 0; i < count; i++) {
    const price = base + Math.sin(i * 0.5) * 5 + i * 0.3;
    out.push({
      date: `2026-01-${String(i + 1).padStart(2, '0')}`,
      price: Number(price.toFixed(2)),
      ma5: Number((price * 1.001).toFixed(2)),
      ma20: Number((price * 0.998).toFixed(2)),
      ma60: Number((price * 0.99).toFixed(2)),
      volume: 10000 + i * 100,
    });
  }
  return out;
}

export function makeFinancialYears(withBalance = false): FinancialYear[] {
  const base: FinancialYear[] = [
    {
      year: '2023',
      reportDate: '20231231',
      revenue: 1500,
      netProfit: 500,
      grossMargin: 90,
      netMargin: 33,
      roe: 28,
      debtToAsset: 20,
      freeCashFlow: 480,
    },
    {
      year: '2024',
      reportDate: '20241231',
      revenue: 1650,
      netProfit: 550,
      grossMargin: 91,
      netMargin: 33,
      roe: 29,
      debtToAsset: 18,
      freeCashFlow: 520,
    },
  ];
  if (withBalance) {
    base[0] = {
      ...base[0],
      receivables: 12,
      totalAssets: 2400,
      currentAssets: 2000,
      currentLiabilities: 400,
      fixedAssets: 250,
      totalLiabilities: 480,
      totalEquity: 1920,
      retainedEarnings: 1800,
    };
    base[1] = {
      ...base[1],
      receivables: 14,
      totalAssets: 2600,
      currentAssets: 2200,
      currentLiabilities: 460,
      fixedAssets: 260,
      totalLiabilities: 470,
      totalEquity: 2130,
      retainedEarnings: 2000,
    };
  }
  return base;
}

export function makeStock(overrides: Partial<StockData> = {}): StockData {
  return {
    symbol: '600519',
    name: '贵州茅台',
    market: 'A-Share',
    currency: 'CNY',
    sector: '白酒 / 消费龙头',
    currentPrice: 1237,
    changeAmount: -14,
    changePercent: -1.14,
    marketCap: '1.55万亿元',
    peTTM: 19,
    macro: {
      macroPolicyHeat: 5,
      policyTone: '中性',
      sectorName: '高端白酒',
      industryStage: 'Mature Cash Cow',
      industryStageZh: '成熟稳健期',
      policyCatalystScore: 5,
      keyCatalysts: ['促消费政策'],
      keyRisks: ['需求波动'],
    },
    fundamentals: {
      grossMarginPass: true,
      grossMarginValue: 91,
      netMarginPass: true,
      netMarginValue: 33,
      debtRatioPass: true,
      debtRatioValue: 18,
      roePass: true,
      roeValue: 29,
      revenueGrowthPass: true,
      revenueGrowthValue: 10,
      cashFlowPass: true,
      cashFlowValue: 520,
      overallScore: 100,
      grade: 'A+',
    },
    financialHistory: makeFinancialYears(false),
    valuation: {
      peTTM: 19,
      peStatic: 20,
      pb: 7,
      ps: 8,
      dividendYield: 3,
      historicalPePercentile: 20,
      historicalPbPercentile: 30,
      pe5YearMin: 15,
      pe5YearMax: 70,
      pe5YearAvg: 35,
      status: 'Undervalued',
      statusZh: '合理偏低',
      marginOfSafetyPrice: 1100,
      fairValuePrice: 1500,
    },
    technical: {
      currentPrice: 1237,
      changePercent: -1.14,
      ma5: 1240,
      ma20: 1250,
      ma60: 1230,
      ma200: 1220,
      supportLevel1: 1200,
      supportLevel2: 1150,
      resistanceLevel1: 1300,
      resistanceLevel2: 1350,
      rsi: 48,
      macdSignal: 'Golden Cross',
      macdSignalZh: '金叉看多',
      trendChannel: 'Uptrend',
      trendChannelZh: '上升通道',
      timingAdvice: '可分批试建仓',
      positionStrategy: {
        firstBatch: { percent: 30, targetPrice: 1237, note: '建底仓' },
        secondBatch: { percent: 30, targetPrice: 1200, note: '回踩补仓' },
        thirdBatch: { percent: 40, targetPrice: 1300, note: '突破加仓' },
        stopLossPrice: 1130,
        takeProfitPrice: 1400,
      },
    },
    priceHistory: makePriceHistory(30, 100),
    lastUpdated: new Date().toISOString(),
    ...overrides,
  };
}
