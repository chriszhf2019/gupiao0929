export interface FinancialYear {
  year: string;
  reportDate?: string; // 原始报告期末日期，如 20241231
  revenue: number; // 亿元 / Millions
  netProfit: number; // 亿元
  grossMargin: number; // %
  netMargin: number; // %
  roe: number; // %
  debtToAsset: number; // %
  freeCashFlow: number; // 经营现金流净额（亿元）。字段名沿用历史命名，与 operatingCashFlow 相同。
  operatingCashFlow?: number; // 经营现金流净额（亿元），与 freeCashFlow 同值。
  capitalExpenditure?: number; // 购建长期资产支付的现金（亿元，正数表示流出）。
  freeCashFlowToEquity?: number; // 自由现金流 = 经营现金流 − 资本开支。缺资本开支时不填。
  // —— 资产负债表科目（亿元，来自东财/腾讯真实披露；缺失时用于 Beneish/Z-Score 的诚实降级）——
  receivables?: number; // 应收账款
  totalAssets?: number; // 总资产
  currentAssets?: number; // 流动资产合计
  currentLiabilities?: number; // 流动负债合计
  fixedAssets?: number; // 固定资产
  totalLiabilities?: number; // 负债合计
  totalEquity?: number; // 归母股东权益
  retainedEarnings?: number; // 留存收益（盈余公积 + 未分配利润）
}

export interface FundamentalScan {
  grossMarginPass: boolean;
  grossMarginValue: number;
  netMarginPass: boolean;
  netMarginValue: number;
  debtRatioPass: boolean;
  debtRatioValue: number;
  roePass: boolean;
  roeValue: number;
  revenueGrowthPass: boolean;
  revenueGrowthValue: number;
  cashFlowPass: boolean;
  cashFlowValue: number;
  overallScore: number; // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
}

export interface ValuationMetrics {
  peTTM: number;
  peStatic: number;
  pb: number;
  ps: number;
  dividendYield: number; // %
  historicalPePercentile: number; // 0-100%
  historicalPbPercentile: number; // 0-100%
  pe5YearMin: number;
  pe5YearMax: number;
  pe5YearAvg: number;
  status: 'Severely Undervalued' | 'Undervalued' | 'Fair Value' | 'Overvalued' | 'Severely Overvalued';
  statusZh: '极度低估' | '合理偏低' | '估值合理' | '估值偏高' | '严重高估';
  marginOfSafetyPrice: number;
  fairValuePrice: number;
}

export interface TechnicalAnalysis {
  currentPrice: number;
  changePercent: number;
  ma5: number;
  ma20: number;
  ma60: number;
  ma200: number;
  supportLevel1: number;
  supportLevel2: number;
  resistanceLevel1: number;
  resistanceLevel2: number;
  rsi: number;
  macdSignal: 'Golden Cross' | 'Death Cross' | 'Neutral';
  macdSignalZh: '金叉看多' | '死叉看空' | '震荡盘整';
  trendChannel: 'Uptrend' | 'Downtrend' | 'Sideways';
  trendChannelZh: '上升通道' | '下降通道' | '宽幅震荡';
  timingAdvice: string;
  positionStrategy: {
    firstBatch: { percent: number; targetPrice: number; note: string };
    secondBatch: { percent: number; targetPrice: number; note: string };
    thirdBatch: { percent: number; targetPrice: number; note: string };
    stopLossPrice: number;
    takeProfitPrice: number;
  };
}

export interface MacroIndustry {
  macroPolicyHeat: number; // 1-10
  policyTone: string;
  sectorName: string;
  industryStage: 'High Growth' | 'Mature Cash Cow' | 'Cyclical Recovery' | 'Declining';
  industryStageZh: '高景气爆发期' | '成熟稳健期' | '成熟高股息期' | '周期复苏期' | '行业出清期' | string;
  policyCatalystScore: number; // 1-10
  keyCatalysts: string[];
  keyRisks: string[];
}

export interface PricePoint {
  date: string;
  price: number;
  ma5: number;
  ma20: number;
  ma60: number;
  volume: number;
}

export interface StockData {
  symbol: string;
  name: string;
  market: 'A-Share' | 'HK-Share' | 'US-Share';
  currency: string;
  sector: string;
  currentPrice: number;
  changeAmount: number;
  changePercent: number;
  marketCap: string; // e.g., "1.85万亿"
  peTTM: number;
  macro: MacroIndustry;
  fundamentals: FundamentalScan;
  financialHistory: FinancialYear[];
  valuation: ValuationMetrics;
  technical: TechnicalAnalysis;
  priceHistory: PricePoint[];
  lastUpdated: string;
  financialSource?: 'tushare' | 'eastmoney' | 'preset'; // 财报数据来源
  isRealtime?: boolean; // true = 行情/K线来自腾讯/东财实时接口；缺失 = 内置演示数据兜底
}

export interface AIAnalysisReport {
  summary: string;
  macroDiagnosis: string;
  fundamentalDiagnosis: string;
  valuationDiagnosis: string;
  technicalDiagnosis: string;
  fiveStepScore: number; // 0 - 100
  verdict: 'Strong Buy' | 'Accumulate' | 'Hold' | 'Caution / Wait';
  verdictZh: '强烈推荐建仓' | '建议分批逢低吸纳' | '观望/持有' | '风险偏高谨慎观望';
  keyRisksToWatch: string[];
  recommendedAction: string;
  source?: 'ai' | 'local'; // ai = DeepSeek 生成；local = 本地量化规则引擎兜底
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface PortfolioPosition {
  symbol: string;
  name: string;
  shares: number;
  costBasis: number;
  targetWeightPercent: number; // e.g., 25%
}

// --- 跟踪个股 (Stock Tracking) ---
export type TrackStatus = 'observe' | 'waiting_pullback' | 'initial_position' | 'breakout_watch' | 'high_alert';

export interface TrackingEvent {
  id: string;
  date: string;
  title: string;
  impact: 'high' | 'medium' | 'low';
  category: 'earnings' | 'policy' | 'product' | 'macro' | 'technical' | 'catalyst';
  note: string;
}

export interface TrackingLogNote {
  id: string;
  timestamp: string;
  stage: string;
  author: string;
  content: string;
  sentiment: 'bullish' | 'neutral' | 'cautious';
}

export interface TrackedStockItem {
  symbol: string;
  name: string;
  market: 'A-Share' | 'HK-Share' | 'US-Share';
  currentPrice: number;
  currency: string;
  trackStatus: TrackStatus;
  statusLabelZh: string;
  targetBuyPrice: number;
  targetPullbackBuyPrice: number;
  targetStopLossPrice: number;
  targetTakeProfitPrice: number;
  addedDate: string;
  priority: 'high' | 'medium' | 'low';
  alertsEnabled: boolean;
  notes: TrackingLogNote[];
  upcomingEvents: TrackingEvent[];
  strategyOutlook?: StrategyOutlook;
}

// --- 深度探索 (Deep Exploration) ---
export interface ScenarioDetail {
  probability: number;
  cagrGrowth: number;
  targetPe: number;
  targetPrice: number;
  upsidePercent: number;
  catalystSummary: string;
}

export interface PeerBenchmarkItem {
  symbol: string;
  name: string;
  currentPrice: number;
  currency: string;
  peTTM: number;
  pePercentile: number;
  grossMargin: number;
  roe: number;
  revenueGrowth: number;
  dividendYield: number;
  isCurrentStock?: boolean;
}

export interface PorterForces {
  supplierPower: { level: 'low' | 'medium' | 'high'; score: number; desc: string };
  buyerPower: { level: 'low' | 'medium' | 'high'; score: number; desc: string };
  threatOfNewEntrants: { level: 'low' | 'medium' | 'high'; score: number; desc: string };
  threatOfSubstitutes: { level: 'low' | 'medium' | 'high'; score: number; desc: string };
  competitiveRivalry: { level: 'low' | 'medium' | 'high'; score: number; desc: string };
  overallMoatRating: 'Wide Moat' | 'Narrow Moat' | 'No Moat' | 'Unrated';
  moatTrend: 'Widening' | 'Stable' | 'Narrowing';
  moatSources: string[];
}

export interface PreMortemItem {
  id: string;
  riskScenario: string;
  triggerEvent: string;
  probability: 'low' | 'medium' | 'high';
  potentialDrawdown: string;
  earlyWarningSignal: string;
  mitigationPlan: string;
}

export interface DeepExploreAIResult {
  topic: string;
  executiveInsight: string;
  bullCaseAnalysis: string;
  bearCaseAnalysis: string;
  moatDurability: string;
  actionableFramework: string;
}

// --- 行业深度爆料 + 财报拆解 + 情绪共鸣 通用分析框架 (Investigative Universal Framework) ---
// 「反常现象 → 利益闭环 → 实锤数据 → 情绪引爆」
export interface AnomalousContrast {
  expected: string; // 大众普遍预期 (如: "替代流水线工人干活")
  reality: string; // 骨感反常现实 (如: "都在展厅跳舞走秀翻跟头")
  coreDilemmaQuestion: string; // 直击痛点的核心反差提问
}

export interface ClosedLoopMechanics {
  moneyOrigin: string; // 钱从哪来 (资金起点)
  moneyDestination: string; // 钱到哪去 (资金流向)
  intermediaryBeneficiaries: string; // 谁在中间赚钱 (各方共赢)
  costBearer: string; // 谁在承担最终成本 / 谁被做局割韭菜
  coreMissingDemand: string; // 缺乏真实有效需求的核心节点
  chainSummary: string; // 完整利益闭环一句话链条
}

export interface ExtremeContrastData {
  metricA: { label: string; value: string; context: string }; // 指标A (虚高/故事)
  metricB: { label: string; value: string; context: string }; // 指标B (极其微小的真实落地)
  contrastImpact: string; // 极端反差造成的视觉与认知冲击
  verifiableSource: string; // 公开可查的实锤出处 (财报、裁判文书、政府公告)
}

export interface EmotionalExplosion {
  publicAngerTrigger: string; // 引发大众强烈共鸣/愤怒的痛点 (如: 投资者被割、患者被坑、税收流失)
  colloquialPunchline: string; // 口语化大白话金句 (拒绝晦涩术语)
  soulInterrogation: string; // 灵魂拷问
}

export interface RevenueSegmentBreakdown {
  segment: string;
  percentage: number | null;
  amount: string;
  isRealCommercial: boolean; // 是否是真实工业/商业落地产线
  note: string;
}

export interface ValuationContrastData {
  marketCap: string; // 估值/市值
  realCommercialRevenue: string; // 真实产线/商业化收入
  realSharePercent: number | null; // 真实收入占比 %；未计算时为 null
  bubbleMultiple: string; // 溢价/泡沫倍数
  conclusion: string; // 穿透定性结论
}

export interface HiddenClosedLoopStep {
  step: number;
  title: string;
  desc: string;
}

export interface SignalRadarItem {
  id: string;
  source: string;
  category: 'whistleblower' | 'executive_quote' | 'policy' | 'financial_anomaly' | 'supply_chain';
  content: string;
  credibilityScore: number; // 0 - 100
  status: 'verified' | 'cross_checking' | 'unconfirmed';
  evidenceSnippet: string;
}

export interface ShortVideoScene {
  sceneNumber: number;
  duration: string;
  visual: string;
  audio: string;
  emotionTag: string;
}

export interface InvestigativeReport {
  targetName: string;
  targetSymbol?: string;
  industry: string;
  topicTitle: string;
  // 通用分析框架四模块
  anomalousContrast?: AnomalousContrast; // 第一步：反常现象抓核心矛盾
  closedLoopMechanics?: ClosedLoopMechanics; // 第二步：用利益闭环拆解底层逻辑
  extremeContrastData?: ExtremeContrastData; // 第三步：用实锤数据击穿虚假繁荣
  emotionalExplosion?: EmotionalExplosion; // 第四步：用大众情绪引爆传播
  // 1. 问题提出
  hookQuestion: string;
  contrastStatement: string;
  // 2. 数据拆解
  revenueStructure: RevenueSegmentBreakdown[];
  valuationContrast: ValuationContrastData;
  coldHardDataSummary: string;
  auditRedFlags: string[];
  // 3. 逻辑闭环
  hiddenClosedLoop: HiddenClosedLoopStep[];
  logicChainAnalysis: string;
  // 4. 情绪共鸣
  emotionalResonance: string;
  // 传播矩阵
  viralTitles: {
    type: '疑问反差' | '数据实锤' | '情绪痛点' | '内幕拷问';
    title: string;
    hookStyle: string;
  }[];
  wechatArticle: string;
  shortVideoScript: {
    hook3s: string;
    scenes: ShortVideoScene[];
    callToAction: string;
  };
  socialPost: string;
  // 敏感信号雷达与交叉核验
  signals: SignalRadarItem[];
  complianceDisclaimer: string;
}

export interface WhistleblowerSubmission {
  id: string;
  companyName: string;
  category: string;
  evidenceSnippet: string;
  timestamp: string;
  credibility: 'pending' | 'verified';
}

export type WorkbenchView = 'market' | 'five-step' | 'index-fund' | 'tracking' | 'deep-exploration' | 'watchlist' | 'portfolio' | 'memo' | 'strategy';

// --- 前十大持仓与机构透视 (Top 10 Holdings & Shareholders) ---
export interface TopShareholder {
  rank: number;
  name: string;
  holdingShares: string; // e.g. "6.78亿股"
  holdingPercent: number; // e.g. 54.07%
  changeStatus: 'increase' | 'decrease' | 'unchanged' | 'new';
  changeStatusZh: '增持' | '减持' | '未变' | '新进';
  changeShares?: string; // e.g. "+125万股"
  shareholderType: '控股股东/国资' | '北向陆股通外资' | '国家队证金/汇金' | '社保基金' | '公募基金' | '保险资管' | '个人自然人';
}

export interface InstitutionalHoldingOverview {
  symbol: string;
  stockName: string;
  reportPeriod: string; // e.g. "2024年报/中报"
  totalInstitutionsCount: number; // 持股机构总数（接口无法获取时为 0，UI 显示 "--"）
  institutionalSharePercent: number; // 机构持股比例合计 %（接口无法获取时为 0）
  top10ConcentrationPercent: number; // 前十大股东持股集中度 CR10 %
  northboundHoldingPercent: number; // 陆股通/外资持股 %
  mutualFundCount: number; // 公募基金持仓家数（接口无法获取时为 0）
  socialSecurityPresent: boolean; // 社保基金是否重仓
  nationalTeamPresent: boolean; // 国家队是否重仓
  shareholders: TopShareholder[];
  source?: 'eastmoney' | 'preset-snapshot'; // 数据来源：东财真实披露 / 内置历史快照
}

export interface MarketTopHoldingItem {
  rank: number;
  symbol: string;
  name: string;
  market: 'A-Share' | 'HK-Share' | 'US-Share';
  industry: string;
  holdingValue: string; // e.g. "1,850亿元"
  holdingRatioPercent: number; // 持仓占机构总市值比例 %
  recentQuarterChange: 'increase' | 'decrease' | 'unchanged' | 'new';
  changePercent?: number; // 环比增减 %
  currentPrice: number;
  currency: string;
  peTTM: number;
}

export interface InstitutionalPortfolioList {
  id: 'northbound' | 'mutual_funds' | 'social_security' | 'qdii_overseas';
  name: string;
  description: string;
  tag: string;
  updatedAt: string;
  totalMarketValue: string;
  holdings: MarketTopHoldingItem[];
}

// --- 用户自然语言思路转选股策略 (AI Strategy Generator) ---
export interface StrategyFilterRule {
  dimension: '盈利壁垒' | '财报排雷' | '成长驱动' | '估值安全' | '技术时机' | '机构偏好';
  metric: string; // e.g. "毛利率 (Gross Margin)"
  condition: string; // e.g. "> 40%"
  rationale: string; // 指标设计初衷
}

export interface StrategyOutlook {
  basis: 'scenario' | 'unavailable';
  strategyName?: string;
  bearPrice: number | null;
  basePrice: number | null;
  bullPrice: number | null;
  weightedPrice: number | null;
  note: string;
}

export interface StrategyCandidateMatch {
  symbol: string;
  name: string;
  market: string;
  currentPrice: number;
  peTTM: number;
  matchScore: number; // 0-100
  highlightReasons: string[];
  metricsSnapshot: {
    grossMargin: number;
    roe: number;
    debtRatio: number;
    pePercentile: number;
    dividendYield?: number;
  };
  outlook: StrategyOutlook;
}

export interface SnapshotCandidate {
  symbol: string;
  name: string;
  industry: string;
  price: number;
  pe: number;
  pb: number;
  roe: number;
  marketCapYi: number;
  matchScore: number;
  reasons: string[];
}

export interface AIStockStrategy {
  id: string;
  ideaPrompt: string; // 用户原始输入的思路
  strategyName: string; // 策略标题
  styleTag: '价值白马' | '高股息红利' | '高景气成长' | '困境反转' | '小盘隐形冠军' | '出海破局';
  philosophy: string; // 投资哲学与核心逻辑
  expectedHoldingPeriod: '短线波段 (1-3周)' | '中线趋势 (3-6月)' | '长线复利 (1-3年)';
  riskLevel: '低风险防御' | '中等平衡' | '高成长高波动';
  rules: StrategyFilterRule[];
  executionPlan: {
    entryStrategy: string; // 建仓纪律
    stopLossRule: string; // 止损规则
    takeProfitRule: string; // 止盈规则
    positionLimit: string; // 单票与行业仓位上限
  };
  negativeChecklist: string[]; // 一票否决排雷条件
  matchedStocks: StrategyCandidateMatch[];
  createdAt: string;
}

// --- 选股决策可靠性与实战验证模型 (Reliability & Decision Verification) ---
export type StockAnalysisArchetype = 'value_leader' | 'cyclical_recovery' | 'growth_innovator' | 'dividend_defensive';

export interface DecisionGateCheckItem {
  id: string;
  category: 'gate1_anti_fraud' | 'gate2_margin_of_safety' | 'gate3_human_check';
  name: string;
  criterion: string;
  currentValueDisplay: string;
  isPassed: boolean;
  severity: 'critical' | 'high' | 'medium';
  explanation: string;
  actionIfFailed: string;
}

export interface ReliabilityAuditReport {
  symbol: string;
  stockName: string;
  archetype: StockAnalysisArchetype;
  archetypeZh: string;
  archetypeGuideline: string;
  auditScore: number; // 0-100
  canBuyDecision: 'pass' | 'conditional_buy' | 'strictly_forbidden';
  canBuyDecisionZh: '可稳健建仓' | '带约束条件分批' | '触碰红线·坚决禁止买入';
  gate1AntiFraudPass: boolean; // 第一步：排雷一票否决
  gate2ValuationPass: boolean; // 第二步：安全边际与性价比
  gate3HumanChecklistPendingCount: number; // 第三步：待核对的人工定性事项
  items: DecisionGateCheckItem[];
  humanChecklist: {
    id: string;
    question: string;
    description: string;
    checked: boolean;
  }[];
}

// --- 策略回测引擎类型 (Backtesting Engine) ---
export interface BacktestPerformancePoint {
  date: string;
  strategyReturn: number; // 累计净值 (如 1.0 -> 1.25)
  benchmarkReturn?: number; // 基准净值 (如 1.0 -> 1.08)；真实基准不可用时缺省
  stockHoldReturn: number; // 标的买入持有净值 (如 1.0 -> 1.15)
  drawdown: number; // 动态回撤 %
}

export interface StrategyBacktestResult {
  strategyName: string;
  period: string;
  initialCapital: number;
  finalCapital: number;
  totalReturnPercent: number;
  annualizedReturnPercent: number;
  benchmarkReturnPercent: number; // 基准区间收益（基准不可用时为 0 且 benchmarkAvailable=false）
  excessReturnPercent: number; // 超额收益
  maxDrawdownPercent: number;
  sharpeRatio: number;
  winRatePercent: number; // 胜率（无平仓交易时为 0，UI 应显示 "--"）
  profitFactor: number; // 盈亏比（无平仓交易时为 0）
  totalTrades: number;
  benchmarkAvailable?: boolean; // 是否使用了真实指数基准 K 线
  insufficientData?: boolean; // 真实 K 线不足，无法回测
  insufficientReason?: string;
  costNote?: string; // 交易成本假设说明
  annualizedReliable?: boolean; // 样本短于一年时为 false，年化收益与夏普不应展示
  performanceSeries: BacktestPerformancePoint[];
  tradeSignalsSummary: {
    date: string;
    type: 'BUY' | 'SELL';
    price: number;
    reason: string;
    pnlPercent?: number; // 已扣除佣金/印花税/滑点后的净收益
  }[];
}

// --- 他人荐股验真机 (Peer Recommendation Validator) ---
export interface PeerRecommendationRecord {
  id: string;
  recommenderName: string; // 推荐人 (如: 张总/老李/雪球大V/同事)
  sourceChannel: 'friend' | 'kol' | 'community' | 'broker' | 'relative'; // 渠道
  symbol: string;
  stockName: string;
  recommendedPrice: number;
  recommendedDate: string;
  recommendedReason: string; // 推荐理由 (如: 传有资产注入/行业反转/大客户新单)
  userAttitude: 'skeptical' | 'neutral' | 'interested'; // 自己当前态度
  // 验真分析结果
  auditVerdict: 'trap_distribution' | 'wait_pullback' | 'resonance_buy';
  verdictTitle: string;
  verdictScore: number; // 0-100
  verdictExplanation: string;
  redFlags: string[]; // 发现的暗雷
  alignmentChecks: {
    dimension: string;
    claim: string;
    fact: string;
    isPass: boolean;
  }[];
}

// --- 个人持仓健康排雷体检器 (Portfolio Health Detox) ---
export interface PortfolioHoldingInput {
  symbol: string;
  name: string;
  shares: number;
  costPrice: number;
  currentPrice: number;
  weightPercent?: number;
}

export interface PortfolioHealthReport {
  overallHealthScore: number; // 0-100
  totalMarketValue: number;
  totalCostValue: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPercent: number;
  highRiskExposurePercent: number; // 高危/排雷不过关资产占比
  averagePePercentile: number; // 组合平均估值分位数
  cashFlowDeficitCount: number; // 经营现金流为负的标的数量
  holdingsAudit: {
    symbol: string;
    name: string;
    marketValue: number;
    weightPercent: number;
    unrealizedPnLPercent: number;
    healthLevel: 'healthy' | 'warning' | 'critical_danger' | 'unknown';
    primaryRisk: string;
    actionSuggestion: 'continue_hold' | 'trim_reduce' | 'immediate_cut_loss' | 'review';
    actionSuggestionZh: string;
  }[];
  detoxRecommendations: string[];
}

// --- 智能风控盯盘哨兵规则 (Smart Alert Radar) ---
export interface SmartRadarAlertRule {
  id: string;
  symbol: string;
  stockName: string;
  triggerType: 'safety_margin_reached' | 'ma20_pullback_stable' | 'stop_loss_breached' | 'pledge_or_reduction_warning';
  title: string;
  conditionDescription: string;
  targetPrice?: number;
  currentStatus: 'monitoring' | 'triggered' | 'dismissed';
  triggeredAt?: string;
}

// --- 机构级财务排雷量化取证 (Beneish M-Score & Altman Z-Score) ---
export interface ForensicForensicsResult {
  // 数据质量：real = 基于真实资产负债表计算；insufficient = 缺少资产负债表数据，无法可靠计算
  dataQuality: 'real' | 'insufficient';
  dataQualityNote?: string;
  // Beneish M-Score 模型 (造假操纵识别)
  mScore: number;
  mScoreThreshold: number; // 标杆临界值 -1.78
  isManipulationRiskHigh: boolean;
  mScoreRating: 'safe' | 'gray_zone' | 'high_manipulation_risk';
  mScoreAnalysis: string;
  components: {
    dsri: number; // 应收账款指数
    gmi: number;  // 毛利率指数
    aqi: number;  // 资产质量指数
    sgi: number;  // 营业收入增长指数
    tata: number; // 总应计利润/总资产
    lvgi: number; // 杠杆指数（可选）
  };

  // Altman Z-Score 模型 (财务破产破产违约识别)
  zScore: number;
  zScoreSafeThreshold: number; // > 2.99 安全区, 1.81~2.99 灰色预警区, < 1.81 困境危机区
  zScoreRating: 'safe' | 'gray' | 'distress';
  zScoreAnalysis: string;
}

// --- 机构级动态多情景敏感性估值 ---
export interface ScenarioValuationModel {
  bear: {
    name: '悲观情景 (Bear Case)';
    cagr3Y: number;      // 未来三年净利复合增速
    terminalPe: number;  // 给予目标 PE
    fairValue: number;   // 理论公允价
    upsideDownside: number; // 空间 %
  };
  base: {
    name: '中性基准 (Base Case)';
    cagr3Y: number;
    terminalPe: number;
    fairValue: number;
    upsideDownside: number;
  };
  bull: {
    name: '乐观情景 (Bull Case)';
    cagr3Y: number;
    terminalPe: number;
    fairValue: number;
    upsideDownside: number;
  };
  probabilityWeightedPrice: number; // 概率加权公允价 (Bear 25% + Base 50% + Bull 25%)
  riskRewardRatio: number;          // 上行潜力 / 下行风险比率
  assumptionNote?: string;          // 基准增速与退出 PE 的来源说明
}

// --- 个人投资精准决策与复盘档案 (Personal Investment Decision Ledger & Memo) ---
export type DecisionActionType = 'BUY' | 'WATCH' | 'SELL';
export type DecisionStatusType = 'OPEN' | 'WATCHING' | 'CLOSED';
export type ExitReasonType =
  | 'TARGET_HIT'             // 达到公允价值止盈
  | 'STOP_LOSS_HIT'          // 触及硬核纪律止损
  | 'LOGIC_FALSIFIED'         // 核心投资逻辑被证伪
  | 'BETTER_OPPORTUNITY'     // 发现更高盈亏比机会
  | 'EMOTIONAL_MISTAKE';      // 情绪化误操作

export interface PersonalInvestmentDecision {
  id: string;
  createdAt: string;
  updatedAt: string;
  symbol: string;
  stockName: string;
  action: DecisionActionType;
  status: DecisionStatusType;
  
  // 核心买方逻辑档案 (Thesis & Falsification)
  thesis: string;                        // 为什么买：竞争壁垒、商业模式或低估逻辑
  catalysts: string[];                   // 预期催化剂（如业绩预告、新产品放量、提价）
  falsificationCriteria: string;         // 证伪底线：什么情况证明我看错了必须认错离场
  
  // 精确资金与量化边界 (Quant Boundaries)
  entryPrice: number;                    // 买入/基准成本价
  targetPrice: number;                   // 目标出局价
  stopLossPrice: number;                 // 硬核止损价
  plannedShares: number;                 // 买入股数 (手)
  capitalAllocated: number;              // 动用总本金 (元)
  portfolioWeight: number;               // 占总投资账户比例 (%)
  riskRewardRatio: number;               // 盈亏比
  expectedHoldingPeriod: string;         // 预期持股周期 (如 3-6个月, 1-2年)
  
  // 决策时的机构级质检快照 (Snapshot at Decision)
  healthScoreAtEntry: number;            // 当时排雷健康分 (0-100)
  mScoreAtEntry: number;                 // 当时造假指数
  zScoreAtEntry: number;                 // 当时财务安全破产系数
  pePercentileAtEntry: number;           // 当时 PE 历史百分位
  
  // 平仓归档与复盘结项 (Post-Mortem Review)
  exitDate?: string;
  exitPrice?: number;
  realizedPnl?: number;
  realizedPnlPercent?: number;
  exitReason?: ExitReasonType;
  disciplineRating?: number;             // 1~5 星：执行纪律严明度
  lessonLearned?: string;                // 复盘反思与教训沉淀
}

// --- 专业买方头寸与止损计算器 ---
export interface PositionSizingResult {
  totalCapital: number;
  riskTolerancePercent: number; // 愿意承受的最大单笔回撤 (如 2%)
  maxDollarRisk: number;         // 最大允许亏损额 (元)
  entryPrice: number;
  stopLossPrice: number;
  riskPerShare: number;          // 每股风险敞口
  recommendedShares: number;     // 建议建仓股数 (已按 100 股向下取整)
  totalInvestment: number;       // 需动用建仓本金
  portfolioAllocationPercent: number; // 占总资产比例
  potentialStopLossAmount: number;    // 触及止损时的确定性损失
  isConcentrationWarning: boolean;   // 单只股票持仓超 30% 预警
}
