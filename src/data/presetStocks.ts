import { StockData } from '../types/stock';
import { normalizeListing } from '../utils/symbolCode';

export const PRESET_STOCKS: Record<string, StockData> = {
  '600519': {
    symbol: '600519',
    name: '贵州茅台',
    market: 'A-Share',
    currency: 'CNY',
    sector: '白酒 / 消费龙头',
    currentPrice: 1468.5,
    changeAmount: 12.8,
    changePercent: 0.88,
    marketCap: '1.84万亿元',
    peTTM: 23.4,
    macro: {
      macroPolicyHeat: 7,
      policyTone: '扩大内需与促进大宗消费政策利好，消费龙头估值回暖',
      sectorName: '高端白酒与食品饮料',
      industryStage: 'Mature Cash Cow',
      industryStageZh: '成熟稳健期',
      policyCatalystScore: 8,
      keyCatalysts: ['促消费政策加码', '直销渠道占比提升', '品牌提价预期与强现金流'],
      keyRisks: ['商务消费需求波动', '行业库存去化速度']
    },
    fundamentals: {
      grossMarginPass: true,
      grossMarginValue: 91.8,
      netMarginPass: true,
      netMarginValue: 52.4,
      debtRatioPass: true,
      debtRatioValue: 13.5,
      roePass: true,
      roeValue: 30.2,
      revenueGrowthPass: true,
      revenueGrowthValue: 15.6,
      cashFlowPass: true,
      cashFlowValue: 680,
      overallScore: 98,
      grade: 'A+'
    },
    financialHistory: [
      { year: '2020', revenue: 979.9, netProfit: 467.0, grossMargin: 91.4, netMargin: 51.5, roe: 31.4, debtToAsset: 14.8, freeCashFlow: 510.5 },
      { year: '2021', revenue: 1094.6, netProfit: 524.6, grossMargin: 91.5, netMargin: 51.7, roe: 30.7, debtToAsset: 14.2, freeCashFlow: 550.0 },
      { year: '2022', revenue: 1275.5, netProfit: 627.2, grossMargin: 91.9, netMargin: 52.2, roe: 30.3, debtToAsset: 13.9, freeCashFlow: 612.0 },
      { year: '2023', revenue: 1505.6, netProfit: 747.3, grossMargin: 92.1, netMargin: 52.6, roe: 30.8, debtToAsset: 13.2, freeCashFlow: 665.8 },
      { year: '2024', revenue: 1732.0, netProfit: 860.5, grossMargin: 91.8, netMargin: 52.4, roe: 30.2, debtToAsset: 13.5, freeCashFlow: 710.0 }
    ],
    valuation: {
      peTTM: 23.4,
      peStatic: 24.8,
      pb: 7.1,
      ps: 11.2,
      dividendYield: 3.42,
      historicalPePercentile: 14.5,
      historicalPbPercentile: 18.2,
      pe5YearMin: 21.0,
      pe5YearMax: 58.5,
      pe5YearAvg: 36.2,
      status: 'Undervalued',
      statusZh: '合理偏低',
      marginOfSafetyPrice: 1350.0,
      fairValuePrice: 1720.0
    },
    technical: {
      currentPrice: 1468.5,
      changePercent: 0.88,
      ma5: 1455.0,
      ma20: 1438.0,
      ma60: 1420.0,
      ma200: 1510.0,
      supportLevel1: 1420.0,
      supportLevel2: 1360.0,
      resistanceLevel1: 1520.0,
      resistanceLevel2: 1600.0,
      rsi: 54.2,
      macdSignal: 'Golden Cross',
      macdSignalZh: '金叉看多',
      trendChannel: 'Uptrend',
      trendChannelZh: '上升通道',
      timingAdvice: '股价已站稳MA20/MA60均线上方，MACD出现日线金叉，属于估值底部区域向上修复形态，建议分批试建仓。',
      positionStrategy: {
        firstBatch: { percent: 30, targetPrice: 1460, note: '当前价格区间建底仓 (30%)' },
        secondBatch: { percent: 30, targetPrice: 1420, note: '回踩强支撑位补仓 (30%)' },
        thirdBatch: { percent: 40, targetPrice: 1520, note: '放量有效突破压力位加仓 (40%)' },
        stopLossPrice: 1350.0,
        takeProfitPrice: 1750.0
      }
    },
    priceHistory: [
      { date: '06-01', price: 1410, ma5: 1412, ma20: 1425, ma60: 1450, volume: 22400 },
      { date: '06-15', price: 1422, ma5: 1418, ma20: 1423, ma60: 1445, volume: 25100 },
      { date: '07-01', price: 1435, ma5: 1428, ma20: 1425, ma60: 1440, volume: 28900 },
      { date: '07-10', price: 1450, ma5: 1442, ma20: 1430, ma60: 1432, volume: 31200 },
      { date: '07-15', price: 1460, ma5: 1450, ma20: 1435, ma60: 1428, volume: 34500 },
      { date: '07-21', price: 1468.5, ma5: 1455, ma20: 1438, ma60: 1420, volume: 38200 }
    ],
    lastUpdated: '2026-07-21'
  },
  '300750': {
    symbol: '300750',
    name: '宁德时代',
    market: 'A-Share',
    currency: 'CNY',
    sector: '动力电池 / 新能源龙头',
    currentPrice: 258.4,
    changeAmount: -2.1,
    changePercent: -0.81,
    marketCap: '1.13万亿元',
    peTTM: 21.8,
    macro: {
      macroPolicyHeat: 8,
      policyTone: '新能源出海与储能产业政策强力扶持，海外市场拓展顺畅',
      sectorName: '锂电池与储能设备',
      industryStage: 'High Growth',
      industryStageZh: '高景气爆发期',
      policyCatalystScore: 9,
      keyCatalysts: ['欧洲/中东储能大单落地', '麒麟电池与神行超充电池量产', '全球市占率稳居第一'],
      keyRisks: ['上游碳酸锂价格剧烈波动', '地缘政治关税政策规避']
    },
    fundamentals: {
      grossMarginPass: false,
      grossMarginValue: 28.2, // Rule is >30%, 28.2% is high for manufacturing
      netMarginPass: true,
      netMarginValue: 12.8,
      debtRatioPass: true,
      debtRatioValue: 58.2,
      roePass: true,
      roeValue: 24.5,
      revenueGrowthPass: true,
      revenueGrowthValue: 22.4,
      cashFlowPass: true,
      cashFlowValue: 920,
      overallScore: 91,
      grade: 'A'
    },
    financialHistory: [
      { year: '2020', revenue: 503.2, netProfit: 55.8, grossMargin: 27.8, netMargin: 11.1, roe: 17.2, debtToAsset: 55.8, freeCashFlow: 180.2 },
      { year: '2021', revenue: 1303.6, netProfit: 159.3, grossMargin: 26.3, netMargin: 12.2, roe: 21.8, debtToAsset: 67.2, freeCashFlow: 310.5 },
      { year: '2022', revenue: 3285.9, netProfit: 307.3, grossMargin: 20.3, netMargin: 9.3, roe: 23.6, debtToAsset: 70.0, freeCashFlow: 610.0 },
      { year: '2023', revenue: 4009.2, netProfit: 441.2, grossMargin: 22.9, netMargin: 11.0, roe: 25.1, debtToAsset: 64.5, freeCashFlow: 820.4 },
      { year: '2024', revenue: 4520.0, netProfit: 520.0, grossMargin: 28.2, netMargin: 12.8, roe: 24.5, debtToAsset: 58.2, freeCashFlow: 920.0 }
    ],
    valuation: {
      peTTM: 21.8,
      peStatic: 23.2,
      pb: 5.3,
      ps: 2.5,
      dividendYield: 2.15,
      historicalPePercentile: 12.2,
      historicalPbPercentile: 19.8,
      pe5YearMin: 18.5,
      pe5YearMax: 120.0,
      pe5YearAvg: 48.5,
      status: 'Undervalued',
      statusZh: '合理偏低',
      marginOfSafetyPrice: 230.0,
      fairValuePrice: 310.0
    },
    technical: {
      currentPrice: 258.4,
      changePercent: -0.81,
      ma5: 260.2,
      ma20: 252.0,
      ma60: 241.0,
      ma200: 225.0,
      supportLevel1: 248.0,
      supportLevel2: 235.0,
      resistanceLevel1: 275.0,
      resistanceLevel2: 295.0,
      rsi: 58.6,
      macdSignal: 'Golden Cross',
      macdSignalZh: '金叉看多',
      trendChannel: 'Uptrend',
      trendChannelZh: '上升通道',
      timingAdvice: '短线呈多头排列，但上方275处存在筹码密集区阻力，建议等待小幅回踩支撑位分批介入。',
      positionStrategy: {
        firstBatch: { percent: 25, targetPrice: 252, note: '回踩20日均线确认支撑后介入底仓 (25%)' },
        secondBatch: { percent: 35, targetPrice: 240, note: '若回踩60日线强支撑加仓 (35%)' },
        thirdBatch: { percent: 40, targetPrice: 275, note: '放量突破275颈线压力确认后追加 (40%)' },
        stopLossPrice: 225.0,
        takeProfitPrice: 320.0
      }
    },
    priceHistory: [
      { date: '06-01', price: 228, ma5: 226, ma20: 222, ma60: 220, volume: 182000 },
      { date: '06-15', price: 236, ma5: 232, ma20: 228, ma60: 224, volume: 195000 },
      { date: '07-01', price: 248, ma5: 242, ma20: 235, ma60: 230, volume: 210000 },
      { date: '07-10', price: 262, ma5: 255, ma20: 245, ma60: 236, volume: 245000 },
      { date: '07-15', price: 264, ma5: 261, ma20: 250, ma60: 239, volume: 220000 },
      { date: '07-21', price: 258.4, ma5: 260.2, ma20: 252, ma60: 241, volume: 198000 }
    ],
    lastUpdated: '2026-07-21'
  },
  '000001': {
    symbol: '000001',
    name: '平安银行',
    market: 'A-Share',
    currency: 'CNY',
    sector: '商业银行 / 金融板块',
    currentPrice: 11.82,
    changeAmount: 0.15,
    changePercent: 1.28,
    marketCap: '2293亿元',
    peTTM: 5.2,
    macro: {
      macroPolicyHeat: 6,
      policyTone: '货币政策保持适度宽松，降准降息预期升温，银行高股息资产属性突出',
      sectorName: '银行业',
      industryStage: 'Mature Cash Cow',
      industryStageZh: '成熟高股息期',
      policyCatalystScore: 7,
      keyCatalysts: ['公募基金与红利ETF持续增配', '不良贷款率保持稳定', '分红比例保持在30%+'],
      keyRisks: ['净息差 (NIM) 承压', '零售信贷不良率扰动']
    },
    fundamentals: {
      grossMarginPass: true,
      grossMarginValue: 42.5,
      netMarginPass: true,
      netMarginValue: 28.5,
      debtRatioPass: false, // Banks normally have high debt-to-asset ratios (~90%)
      debtRatioValue: 91.2,
      roePass: false,
      roeValue: 11.2,
      revenueGrowthPass: true,
      revenueGrowthValue: 4.2,
      cashFlowPass: true,
      cashFlowValue: 450,
      overallScore: 78,
      grade: 'B'
    },
    financialHistory: [
      { year: '2020', revenue: 1535.4, netProfit: 289.3, grossMargin: 45.0, netMargin: 18.8, roe: 11.4, debtToAsset: 91.8, freeCashFlow: 320.0 },
      { year: '2021', revenue: 1693.8, netProfit: 363.4, grossMargin: 46.2, netMargin: 21.4, roe: 12.8, debtToAsset: 91.6, freeCashFlow: 380.0 },
      { year: '2022', revenue: 1798.9, netProfit: 455.2, grossMargin: 45.8, netMargin: 25.3, roe: 12.4, debtToAsset: 91.5, freeCashFlow: 410.0 },
      { year: '2023', revenue: 1647.0, netProfit: 464.6, grossMargin: 44.2, netMargin: 28.2, roe: 11.4, debtToAsset: 91.3, freeCashFlow: 430.0 },
      { year: '2024', revenue: 1580.0, netProfit: 472.0, grossMargin: 42.5, netMargin: 28.5, roe: 11.2, debtToAsset: 91.2, freeCashFlow: 450.0 }
    ],
    valuation: {
      peTTM: 5.2,
      peStatic: 5.4,
      pb: 0.58,
      ps: 1.45,
      dividendYield: 6.12,
      historicalPePercentile: 8.5,
      historicalPbPercentile: 6.2,
      pe5YearMin: 4.8,
      pe5YearMax: 14.2,
      pe5YearAvg: 8.1,
      status: 'Severely Undervalued',
      statusZh: '极度低估',
      marginOfSafetyPrice: 11.0,
      fairValuePrice: 14.8
    },
    technical: {
      currentPrice: 11.82,
      changePercent: 1.28,
      ma5: 11.72,
      ma20: 11.55,
      ma60: 11.20,
      ma200: 10.85,
      supportLevel1: 11.40,
      supportLevel2: 10.90,
      resistanceLevel1: 12.30,
      resistanceLevel2: 13.00,
      rsi: 61.5,
      macdSignal: 'Golden Cross',
      macdSignalZh: '金叉看多',
      trendChannel: 'Uptrend',
      trendChannelZh: '上升通道',
      timingAdvice: '估值极低，PB小于0.6，股息率高达6%+，技术面上处于多头排列，适合高股息防御性配置。',
      positionStrategy: {
        firstBatch: { percent: 40, targetPrice: 11.7, note: '高股息安全垫极强，建仓40%' },
        secondBatch: { percent: 30, targetPrice: 11.2, note: '若遇到除权或回踩支撑位补仓30%' },
        thirdBatch: { percent: 30, targetPrice: 12.3, note: '突破半年线压力后跟进30%' },
        stopLossPrice: 10.20,
        takeProfitPrice: 14.50
      }
    },
    priceHistory: [
      { date: '06-01', price: 10.9, ma5: 10.85, ma20: 10.8, ma60: 10.75, volume: 680000 },
      { date: '06-15', price: 11.1, ma5: 11.02, ma20: 10.9, ma60: 10.80, volume: 720000 },
      { date: '07-01', price: 11.3, ma5: 11.20, ma20: 11.0, ma60: 10.88, volume: 810000 },
      { date: '07-10', price: 11.6, ma5: 11.45, ma20: 11.2, ma60: 10.95, volume: 920000 },
      { date: '07-15', price: 11.7, ma5: 11.62, ma20: 11.4, ma60: 11.05, volume: 850000 },
      { date: '07-21', price: 11.82, ma5: 11.72, ma20: 11.55, ma60: 11.20, volume: 890000 }
    ],
    lastUpdated: '2026-07-21'
  },
  'NVDA': {
    symbol: 'NVDA',
    name: 'NVIDIA (英伟达)',
    market: 'US-Share',
    currency: 'USD',
    sector: '半导体 / 人工智能算力',
    currentPrice: 128.5,
    changeAmount: 3.4,
    changePercent: 2.72,
    marketCap: '$3.15 Trillion',
    peTTM: 42.5,
    macro: {
      macroPolicyHeat: 10,
      policyTone: '全球人工智能算力基础设施建设进入巅峰期，大模型训练与推理需求爆发',
      sectorName: 'AI Accelerator Chips',
      industryStage: 'High Growth',
      industryStageZh: '高景气爆发期',
      policyCatalystScore: 10,
      keyCatalysts: ['Blackwell 芯片量产出货', 'CSP 云巨头资本支出升温', 'CUDA 生态壁垒极高'],
      keyRisks: ['芯片出口管制政策变化', '客户自研芯片替代效应']
    },
    fundamentals: {
      grossMarginPass: true,
      grossMarginValue: 75.2,
      netMarginPass: true,
      netMarginValue: 55.4,
      debtRatioPass: true,
      debtRatioValue: 28.5,
      roePass: true,
      roeValue: 88.5,
      revenueGrowthPass: true,
      revenueGrowthValue: 122.0,
      cashFlowPass: true,
      cashFlowValue: 28000,
      overallScore: 99,
      grade: 'A+'
    },
    financialHistory: [
      { year: '2020', revenue: 166.8, netProfit: 43.3, grossMargin: 62.3, netMargin: 26.0, roe: 28.2, debtToAsset: 42.1, freeCashFlow: 46.8 },
      { year: '2021', revenue: 269.1, netProfit: 97.5, grossMargin: 64.9, netMargin: 36.2, roe: 36.5, debtToAsset: 38.0, freeCashFlow: 81.3 },
      { year: '2022', revenue: 269.7, netProfit: 43.7, grossMargin: 56.9, netMargin: 16.2, roe: 19.8, debtToAsset: 32.4, freeCashFlow: 38.1 },
      { year: '2023', revenue: 609.2, netProfit: 297.6, grossMargin: 72.7, netMargin: 48.8, roe: 68.2, debtToAsset: 30.1, freeCashFlow: 270.2 },
      { year: '2024', revenue: 1350.0, netProfit: 747.0, grossMargin: 75.2, netMargin: 55.4, roe: 88.5, debtToAsset: 28.5, freeCashFlow: 620.0 }
    ],
    valuation: {
      peTTM: 42.5,
      peStatic: 46.2,
      pb: 32.0,
      ps: 23.3,
      dividendYield: 0.08,
      historicalPePercentile: 45.2,
      historicalPbPercentile: 72.0,
      pe5YearMin: 28.0,
      pe5YearMax: 110.0,
      pe5YearAvg: 58.0,
      status: 'Fair Value',
      statusZh: '估值合理',
      marginOfSafetyPrice: 112.0,
      fairValuePrice: 145.0
    },
    technical: {
      currentPrice: 128.5,
      changePercent: 2.72,
      ma5: 126.8,
      ma20: 122.4,
      ma60: 118.0,
      ma200: 98.5,
      supportLevel1: 120.0,
      supportLevel2: 112.0,
      resistanceLevel1: 135.0,
      resistanceLevel2: 142.0,
      rsi: 62.8,
      macdSignal: 'Golden Cross',
      macdSignalZh: '金叉看多',
      trendChannel: 'Uptrend',
      trendChannelZh: '上升通道',
      timingAdvice: 'AI超级周期驱动下，技术面突破短期震荡上轨，RSI温和看多，建议逢回踩120美元分批配置。',
      positionStrategy: {
        firstBatch: { percent: 30, targetPrice: 125, note: '当前位置建立初始底仓 (30%)' },
        secondBatch: { percent: 35, targetPrice: 118, note: '回踩20日/60日均线支撑补仓 (35%)' },
        thirdBatch: { percent: 35, targetPrice: 135, note: '有效突破135历史阻力位确认新高时追加 (35%)' },
        stopLossPrice: 108.0,
        takeProfitPrice: 160.0
      }
    },
    priceHistory: [
      { date: '06-01', price: 115, ma5: 114, ma20: 112, ma60: 105, volume: 45000000 },
      { date: '06-15', price: 118, ma5: 116, ma20: 114, ma60: 108, volume: 48000000 },
      { date: '07-01', price: 122, ma5: 120, ma20: 117, ma60: 112, volume: 52000000 },
      { date: '07-10', price: 125, ma5: 123, ma20: 119, ma60: 114, volume: 55000000 },
      { date: '07-15', price: 126, ma5: 125, ma20: 121, ma60: 116, volume: 51000000 },
      { date: '07-21', price: 128.5, ma5: 126.8, ma20: 122.4, ma60: 118.0, volume: 58000000 }
    ],
    lastUpdated: '2026-07-21'
  }
};

/**
 * Dynamic fallback stock generator for any unlisted stock symbol
 */
export function generateStockFallback(symbol: string): StockData {
  const cleanSym = symbol.trim().toUpperCase();
  const listing = normalizeListing(cleanSym);
  const market = listing?.market ?? 'A-Share';
  const currency = listing?.currency ?? 'CNY';

  // Seeded values from string hash
  let hash = 0;
  for (let i = 0; i < cleanSym.length; i++) {
    hash = (hash << 5) - hash + cleanSym.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  const priceBase = (positiveHash % 180) + 12.5;
  const peBase = (positiveHash % 35) + 11.2;
  const grossMargin = (positiveHash % 45) + 28.0;
  const netMargin = (positiveHash % 25) + 12.0;

  const currentPrice = Number(priceBase.toFixed(2));
  const ma5 = Number((currentPrice * 0.99).toFixed(2));
  const ma20 = Number((currentPrice * 0.97).toFixed(2));
  const ma60 = Number((currentPrice * 0.93).toFixed(2));
  const ma200 = Number((currentPrice * 0.88).toFixed(2));

  return {
    symbol: cleanSym,
    name: `${cleanSym} 行业标的`,
    market,
    currency,
    sector: '综合制造 / 科技',
    currentPrice,
    changeAmount: Number(((positiveHash % 5) - 2.1).toFixed(2)),
    changePercent: Number(((positiveHash % 4) - 1.5).toFixed(2)),
    marketCap: market === 'US-Share' ? `$${(positiveHash % 150 + 20)} Billion` : `${(positiveHash % 2000 + 100)}亿元`,
    peTTM: Number(peBase.toFixed(1)),
    macro: {
      macroPolicyHeat: (positiveHash % 6) + 4,
      policyTone: '稳增长政策驱动下，行业景气度逐步修复，政策催化作用显现',
      sectorName: '产业龙头板块',
      industryStage: 'High Growth',
      industryStageZh: '高景气爆发期',
      policyCatalystScore: 7,
      keyCatalysts: ['产业升级政策出台', '研发投入持续提升', '海外出口订单增长'],
      keyRisks: ['原材料价格波动', '市场竞争加剧风险']
    },
    fundamentals: {
      grossMarginPass: grossMargin >= 30,
      grossMarginValue: Number(grossMargin.toFixed(1)),
      netMarginPass: netMargin >= 10,
      netMarginValue: Number(netMargin.toFixed(1)),
      debtRatioPass: (positiveHash % 100) < 60,
      debtRatioValue: Number(((positiveHash % 40) + 25).toFixed(1)),
      roePass: (positiveHash % 100) > 30,
      roeValue: Number(((positiveHash % 20) + 12).toFixed(1)),
      revenueGrowthPass: true,
      revenueGrowthValue: Number(((positiveHash % 25) + 8).toFixed(1)),
      cashFlowPass: true,
      cashFlowValue: (positiveHash % 500) + 100,
      overallScore: (positiveHash % 25) + 75,
      grade: grossMargin >= 30 && netMargin >= 10 ? 'A' : 'B'
    },
    financialHistory: [
      { year: '2020', revenue: 120, netProfit: 14, grossMargin: grossMargin - 3, netMargin: netMargin - 2, roe: 12, debtToAsset: 48, freeCashFlow: 80 },
      { year: '2021', revenue: 145, netProfit: 18, grossMargin: grossMargin - 2, netMargin: netMargin - 1, roe: 14, debtToAsset: 46, freeCashFlow: 95 },
      { year: '2022', revenue: 168, netProfit: 22, grossMargin: grossMargin - 1, netMargin: netMargin, roe: 15, debtToAsset: 45, freeCashFlow: 110 },
      { year: '2023', revenue: 195, netProfit: 28, grossMargin: grossMargin, netMargin: netMargin + 1, roe: 17, debtToAsset: 42, freeCashFlow: 135 },
      { year: '2024', revenue: 230, netProfit: 35, grossMargin: grossMargin + 1, netMargin: netMargin + 1.5, roe: 18.5, debtToAsset: 40, freeCashFlow: 160 }
    ],
    valuation: {
      peTTM: Number(peBase.toFixed(1)),
      peStatic: Number((peBase * 1.08).toFixed(1)),
      pb: Number(((positiveHash % 5) + 1.2).toFixed(2)),
      ps: Number(((positiveHash % 4) + 0.8).toFixed(2)),
      dividendYield: Number(((positiveHash % 4) + 1.1).toFixed(2)),
      historicalPePercentile: (positiveHash % 40) + 15,
      historicalPbPercentile: (positiveHash % 50) + 20,
      pe5YearMin: Number((peBase * 0.6).toFixed(1)),
      pe5YearMax: Number((peBase * 2.2).toFixed(1)),
      pe5YearAvg: Number((peBase * 1.3).toFixed(1)),
      status: 'Fair Value',
      statusZh: '估值合理',
      marginOfSafetyPrice: Number((currentPrice * 0.85).toFixed(2)),
      fairValuePrice: Number((currentPrice * 1.15).toFixed(2))
    },
    technical: {
      currentPrice,
      changePercent: Number(((positiveHash % 4) - 1.5).toFixed(2)),
      ma5,
      ma20,
      ma60,
      ma200,
      supportLevel1: Number((currentPrice * 0.94).toFixed(2)),
      supportLevel2: Number((currentPrice * 0.88).toFixed(2)),
      resistanceLevel1: Number((currentPrice * 1.08).toFixed(2)),
      resistanceLevel2: Number((currentPrice * 1.16).toFixed(2)),
      rsi: (positiveHash % 30) + 45,
      macdSignal: 'Golden Cross',
      macdSignalZh: '金叉看多',
      trendChannel: 'Uptrend',
      trendChannelZh: '上升通道',
      timingAdvice: '技术指标呈健康多头反弹形态，处于建仓安全边际内。',
      positionStrategy: {
        firstBatch: { percent: 30, targetPrice: Number((currentPrice * 0.99).toFixed(2)), note: '建立基础仓位 (30%)' },
        secondBatch: { percent: 30, targetPrice: Number((currentPrice * 0.94).toFixed(2)), note: '支撑位补仓 (30%)' },
        thirdBatch: { percent: 40, targetPrice: Number((currentPrice * 1.08).toFixed(2)), note: '放量突破确认追加 (40%)' },
        stopLossPrice: Number((currentPrice * 0.85).toFixed(2)),
        takeProfitPrice: Number((currentPrice * 1.25).toFixed(2))
      }
    },
    priceHistory: [
      { date: '06-01', price: Number((currentPrice * 0.88).toFixed(2)), ma5: ma5 * 0.88, ma20: ma20 * 0.88, ma60: ma60 * 0.88, volume: 50000 },
      { date: '06-15', price: Number((currentPrice * 0.91).toFixed(2)), ma5: ma5 * 0.91, ma20: ma20 * 0.91, ma60: ma60 * 0.91, volume: 55000 },
      { date: '07-01', price: Number((currentPrice * 0.95).toFixed(2)), ma5: ma5 * 0.95, ma20: ma20 * 0.95, ma60: ma60 * 0.95, volume: 62000 },
      { date: '07-10', price: Number((currentPrice * 0.98).toFixed(2)), ma5: ma5 * 0.98, ma20: ma20 * 0.98, ma60: ma60 * 0.98, volume: 70000 },
      { date: '07-21', price: currentPrice, ma5, ma20, ma60, volume: 78000 }
    ],
    lastUpdated: '2026-07-21'
  };
}
