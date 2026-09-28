export type TargetIndexType = 'Nasdaq 100' | 'S&P 500' | 'CSI 300' | 'Hang Seng Tech' | 'CSI 500';

export type IndexCategory = 'US-Tech' | 'US-Broad' | 'CN-Broad' | 'HK-Tech';

export type FundShareType = 'A类 (场外联接)' | 'C类 (场外联接)' | '场内ETF' | '美股原生ETF';

export type QuotaStatus = 'unlimited' | 'daily_limit' | 'suspended';

export interface IndexFundItem {
  code: string; // 基金代码 (如 000834, 050025, 513100, QQQ, VOO)
  name: string; // 基金名称
  targetIndex: TargetIndexType; // 跟踪标的指数
  targetIndexZh: string; // 指数中文名
  category: IndexCategory;
  shareType: FundShareType;
  fundCompany: string; // 基金公司 (如 华夏、易方达、广发、博时)
  
  // 核心筛选指标
  fundSize: number; // 规模 (亿元人民币，美股原生折合亿元)
  trackingError: number; // 近1年年化跟踪误差 (%)
  managementFee: number; // 管理费率 (%/年)
  custodyFee: number; // 托管费率 (%/年)
  salesServiceFee: number; // 销售服务费率 (%/年，仅C类)
  totalExpenseRatio: number; // 综合年持有成本 (%)
  standardSubscriptionFee: number; // 标准前端申购费率 (%)，通常A类为1.2%，互联网一折后0.12%
  discountedSubscriptionFee: number; // 折后实付申购费率 (%)，A类通常0.12%左右，C类为0
  redemptionFeeRules: {
    period: string; // 如 "< 7天"
    feeRate: number; // %
  }[];

  // 额度与交易规则
  quotaStatus: QuotaStatus;
  dailyLimitAmount?: number; // 单日单账户限额 (元)，若 unlimited 为 undefined
  quotaRemark: string; // 额度背景说明 (如 "QDII外汇额度限制，单日限购1000元")
  premiumDiscountRate: number; // 场内溢价率 / 场外折价 (%)
  confirmDays: string; // 申购确认时间，如 "T+2日"
  redemptionDays: string; // 赎回到账时间，如 "T+3~T+4日"
  isQDII: boolean; // 是否属于QDII出海基金

  // 业绩表现与风险特征
  recentReturn1Y: number; // 近1年收益率 %
  recentReturn3Y: number; // 近3年累计收益率 %
  maxDrawdown1Y: number; // 近1年最大回撤 %
  sharpeRatio: number; // 近1年夏普比率
  establishedYear: number; // 成立年份

  // 综合评价
  screenPass: boolean;
  score: number; // 0-100 综合四步优选得分
}

export interface CostSimulationResult {
  fundCode: string;
  fundName: string;
  targetIndex: string;
  holdingDays: number;
  investmentAmount: number;
  classACost: number; // A类总成本 (元)
  classCCost: number; // C类总成本 (元)
  costDifference: number; // 差异
  recommendedClass: 'A类' | 'C类';
  crossoverDays: number; // 临界天数 (在此天数之前C类更划算，之后A类更划算)
  explanation: string;
}

export interface AssetAllocationRecommendation {
  profile: 'conservative' | 'balanced' | 'aggressive';
  profileZh: string;
  expectedAnnualReturn: string;
  volatilityTolerance: string;
  allocations: {
    assetName: string;
    targetIndex: string;
    ratio: number; // %
    role: string;
    representativeFunds: string[];
  }[];
  rationales: string[];
}
