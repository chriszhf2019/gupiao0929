import { FundamentalScan, StockAnalysisArchetype, StockData } from '../types/stock';

export interface FundamentalThresholds {
  profile: 'value' | 'financial' | 'growth' | 'cyclical' | 'dividend';
  profileLabel: string;
  grossMarginMin: number | null;
  netMarginMin: number;
  debtRatioMax: number | null;
  roeMin: number;
  revenueGrowthMin: number;
}

export function isFinancialSector(stock: Pick<StockData, 'sector' | 'macro'>): boolean {
  const text = `${stock.sector || ''} ${stock.macro?.sectorName || ''}`;
  return /银行|保险|证券|多元金融|非银金融/.test(text);
}

/**
 * 消费股默认阈值保持不变。金融业不适用负债率和毛利率红线。
 * 成长、周期、红利在显式指定原型时放宽或收紧对应项。
 */
export function resolveFundamentalThresholds(
  stock: Pick<StockData, 'sector' | 'macro'>,
  archetype?: StockAnalysisArchetype
): FundamentalThresholds {
  if (isFinancialSector(stock)) {
    return {
      profile: 'financial',
      profileLabel: '金融业：资产负债率与毛利率红线不适用，改看 ROE 与营收',
      grossMarginMin: null,
      netMarginMin: 8,
      debtRatioMax: null,
      roeMin: 8,
      revenueGrowthMin: 0,
    };
  }
  if (archetype === 'growth_innovator') {
    return {
      profile: 'growth',
      profileLabel: '成长股：营收增速门槛 20%',
      grossMarginMin: 20,
      netMarginMin: 5,
      debtRatioMax: 65,
      roeMin: 8,
      revenueGrowthMin: 20,
    };
  }
  if (archetype === 'cyclical_recovery') {
    return {
      profile: 'cyclical',
      profileLabel: '周期股：容忍更低的毛利和阶段性增速下滑',
      grossMarginMin: 15,
      netMarginMin: 0,
      debtRatioMax: 70,
      roeMin: 5,
      revenueGrowthMin: -5,
    };
  }
  if (archetype === 'dividend_defensive') {
    return {
      profile: 'dividend',
      profileLabel: '红利股：负债上限 70%，增速要求放宽',
      grossMarginMin: 20,
      netMarginMin: 8,
      debtRatioMax: 70,
      roeMin: 8,
      revenueGrowthMin: 0,
    };
  }
  return {
    profile: 'value',
    profileLabel: '价值股默认阈值',
    grossMarginMin: 30,
    netMarginMin: 10,
    debtRatioMax: 60,
    roeMin: 15,
    revenueGrowthMin: 5,
  };
}

export function applyFundamentalThresholds(
  values: {
    grossMarginValue: number;
    netMarginValue: number;
    debtRatioValue: number;
    roeValue: number;
    revenueGrowthValue: number;
    cashFlowValue: number;
  },
  thresholds: FundamentalThresholds
): FundamentalScan {
  const grossMarginPass = thresholds.grossMarginMin == null || values.grossMarginValue >= thresholds.grossMarginMin;
  const netMarginPass = values.netMarginValue >= thresholds.netMarginMin;
  const debtRatioPass = thresholds.debtRatioMax == null || values.debtRatioValue <= thresholds.debtRatioMax;
  const roePass = values.roeValue >= thresholds.roeMin;
  const revenueGrowthPass = values.revenueGrowthValue >= thresholds.revenueGrowthMin;
  const cashFlowPass = values.cashFlowValue > 0;

  const checks = [
    thresholds.grossMarginMin == null ? null : grossMarginPass,
    netMarginPass,
    thresholds.debtRatioMax == null ? null : debtRatioPass,
    roePass,
    revenueGrowthPass,
    cashFlowPass,
  ].filter((item): item is boolean => item !== null);

  const passed = checks.filter(Boolean).length;
  const score = checks.length === 0 ? 0 : Math.round((passed / checks.length) * 100);

  let grade: FundamentalScan['grade'] = 'D';
  if (score >= 90) grade = 'A+';
  else if (score >= 75) grade = 'A';
  else if (score >= 60) grade = 'B';
  else if (score >= 40) grade = 'C';

  return {
    grossMarginPass,
    grossMarginValue: values.grossMarginValue,
    netMarginPass,
    netMarginValue: values.netMarginValue,
    debtRatioPass,
    debtRatioValue: values.debtRatioValue,
    roePass,
    roeValue: values.roeValue,
    revenueGrowthPass,
    revenueGrowthValue: values.revenueGrowthValue,
    cashFlowPass,
    cashFlowValue: values.cashFlowValue,
    overallScore: score,
    grade,
  };
}

export interface FundamentalRuleView {
  id: string;
  label: string;
  value: string;
  pass: boolean;
  desc: string;
}

export function describeFundamentalRules(stock: StockData, archetype?: StockAnalysisArchetype): FundamentalRuleView[] {
  const thresholds = resolveFundamentalThresholds(stock, archetype);
  const scan = stock.fundamentals;
  return [
    {
      id: 'grossMargin',
      label: thresholds.grossMarginMin == null ? '毛利率（金融业不适用）' : `毛利率 > ${thresholds.grossMarginMin}%`,
      value: thresholds.grossMarginMin == null ? '不适用' : `${scan.grossMarginValue}%`,
      pass: scan.grossMarginPass,
      desc: thresholds.grossMarginMin == null
        ? '银行、保险、证券的毛利率不能和消费股放在同一把尺子上。'
        : '考核定价权。阈值随股票原型变化。',
    },
    {
      id: 'netMargin',
      label: `净利率 > ${thresholds.netMarginMin}%`,
      value: `${scan.netMarginValue}%`,
      pass: scan.netMarginPass,
      desc: '考核扣除费用后的盈利留存。',
    },
    {
      id: 'debtRatio',
      label: thresholds.debtRatioMax == null ? '资产负债率（金融业不适用）' : `资产负债率 < ${thresholds.debtRatioMax}%`,
      value: thresholds.debtRatioMax == null ? `${scan.debtRatioValue}% · 不计入否决` : `${scan.debtRatioValue}%`,
      pass: scan.debtRatioPass,
      desc: thresholds.debtRatioMax == null
        ? '金融企业负债率天然偏高。请另看不良率、偿付能力或资本充足率，这里不设 60% 红线。'
        : '排查财务杠杆与还本付息压力。',
    },
    {
      id: 'roe',
      label: `ROE > ${thresholds.roeMin}%`,
      value: `${scan.roeValue}%`,
      pass: scan.roePass,
      desc: '单位所有者权益的回报。金融业门槛为 8%。',
    },
    {
      id: 'revenueGrowth',
      label: `营收增速 > ${thresholds.revenueGrowthMin}%`,
      value: `${scan.revenueGrowthValue}%`,
      pass: scan.revenueGrowthPass,
      desc: '最近两期营收变化。成长股门槛为 20%。',
    },
    {
      id: 'cashFlow',
      label: '经营现金流为正',
      value: `${scan.cashFlowValue} 亿`,
      pass: scan.cashFlowPass,
      desc: '口径是经营活动现金流净额，不是扣减资本开支后的自由现金流。',
    },
  ];
}
