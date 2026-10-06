import { StockData, ReliabilityAuditReport, StockAnalysisArchetype, DecisionGateCheckItem } from '../types/stock';
import { isFinancialSector, resolveFundamentalThresholds } from './fundamentalProfile';

/**
 * 针对标的执行「选股可靠性三步法决策审计」
 * Gate 1: 硬核财务排雷（一票否决）
 * Gate 2: 历史安全边际与性价比买点
 * Gate 3: 防突发黑天鹅的人工核验清单
 */
export function auditStockReliability(
  stock: StockData,
  archetype: StockAnalysisArchetype = 'value_leader',
  humanCheckedMap: Record<string, boolean> = {}
): ReliabilityAuditReport {
  const f = stock.fundamentals;
  const v = stock.valuation;
  const t = stock.technical;
  const lastYear = stock.financialHistory[stock.financialHistory.length - 1];

  // 1. 动态判断或使用用户选择的股票类型
  let archetypeZh = '价值白马股';
  let archetypeGuideline = '核心看重经营现金流匹配度、ROE持续性与估值安全边际，拒绝纸面利润与高负债。';

  if (archetype === 'cyclical_recovery') {
    archetypeZh = '周期复苏股 (航运/资源/化工/半导体)';
    archetypeGuideline = '周期股切忌低PE追高，需关注行业供需拐点与破净PB安全垫，重点防范断崖式亏损。';
  } else if (archetype === 'growth_innovator') {
    archetypeZh = '成长科技/新兴产业股';
    archetypeGuideline = '宽容早期研发与高估值，但硬性要求营收高增(>20%)、核心专利壁垒，严防商誉爆雷。';
  } else if (archetype === 'dividend_defensive') {
    archetypeZh = '红利防御高股息股';
    archetypeGuideline = '核心看股息率(>4%)、自由现金流能否覆盖分红，经营现金流稳健度高于一切。';
  }

  // 2. Gate 1: 排雷一票否决指标检查
  const items: DecisionGateCheckItem[] = [];

  const thresholds = resolveFundamentalThresholds(stock, archetype);
  const financial = isFinancialSector(stock);

  // 指标 1: 经营现金流 vs 净利润。亏损时比值无意义，不能默认通过。
  const profit = lastYear?.netProfit;
  const operatingCash = lastYear?.freeCashFlow;
  let cashVsProfitRatio: number | null = null;
  let cashDisplay = '缺少最近一期净利润';
  let isCashFlowOk = false;
  if (profit == null || operatingCash == null) {
    cashDisplay = '缺少最近一期财报';
  } else if (profit <= 0) {
    cashDisplay = `净利润 ${profit} 亿，亏损期无法计算现金流/净利润`;
  } else {
    cashVsProfitRatio = operatingCash / profit;
    isCashFlowOk = cashVsProfitRatio >= 0.8;
    cashDisplay = `${(cashVsProfitRatio * 100).toFixed(0)}%（经营现金流 ${operatingCash} 亿）`;
  }
  const cashSeverity: DecisionGateCheckItem['severity'] = archetype === 'cyclical_recovery' && profit != null && profit <= 0
    ? 'high'
    : 'critical';

  items.push({
    id: 'gate1_cash_flow',
    category: 'gate1_anti_fraud',
    name: '经营现金流与净利润匹配度',
    criterion: '经营现金流/净利润 ≥ 80%；净利润 ≤ 0 时记为无法计算',
    currentValueDisplay: cashDisplay,
    isPassed: isCashFlowOk,
    severity: cashSeverity,
    explanation: isCashFlowOk
      ? '净利润有相应经营现金流支撑。口径是经营活动现金流，不是自由现金流。'
      : profit != null && profit <= 0
      ? '公司处于亏损，现金流/净利润这个比值没有意义，不能当成通过。'
      : '经营现金流明显低于净利润，利润里可能有较多应收或应计项目。',
    actionIfFailed: '利润不为正或含金量不足时，不要按“匹配度 110%”放行。',
  });

  // 指标 2: 资产负债率。金融业不使用 60% 红线。
  const isDebtOk = thresholds.debtRatioMax == null || f.debtRatioValue <= thresholds.debtRatioMax;
  items.push({
    id: 'gate1_debt_ratio',
    category: 'gate1_anti_fraud',
    name: financial ? '资产负债率（金融业不适用）' : '资产负债率与偿债安全垫',
    criterion: thresholds.debtRatioMax == null
      ? '银行/保险/证券不适用资产负债率红线'
      : `资产负债率 ≤ ${thresholds.debtRatioMax}%`,
    currentValueDisplay: financial
      ? `${f.debtRatioValue.toFixed(1)}%（不计入否决）`
      : `${f.debtRatioValue.toFixed(1)}%`,
    isPassed: isDebtOk,
    severity: 'high',
    explanation: financial
      ? '金融企业负债率天然高于工商企业。这里不设 60% 红线，请另看不良率、偿付能力或资本充足率。'
      : isDebtOk
      ? '负债水平处于当前原型的阈值以内。'
      : '负债率高于当前原型的阈值。',
    actionIfFailed: financial
      ? '改查资本充足率、不良率和拨备，而不是用工商企业的负债率否决。'
      : '若有息负债率持续上升，降低预期仓位。',
  });

  // 指标 3: 毛利率。金融业不适用。
  const isGrossMarginOk = thresholds.grossMarginMin == null || f.grossMarginValue >= thresholds.grossMarginMin;
  items.push({
    id: 'gate1_gross_margin',
    category: 'gate1_anti_fraud',
    name: financial ? '毛利率（金融业不适用）' : '产品毛利率与定价权',
    criterion: thresholds.grossMarginMin == null ? '金融业不适用毛利率红线' : `毛利率 ≥ ${thresholds.grossMarginMin}%`,
    currentValueDisplay: financial ? '不适用' : `${f.grossMarginValue.toFixed(1)}%`,
    isPassed: isGrossMarginOk,
    severity: 'high',
    explanation: financial
      ? '银行、保险、证券没有可与消费股对比的产品毛利率。'
      : isGrossMarginOk
      ? '毛利率达到当前原型阈值。'
      : '毛利率低于当前原型阈值，定价权偏弱。',
    actionIfFailed: '若处于价格战行业，需要另有规模或成本优势才能保留。',
  });

  // 3. Gate 2: 估值与性价比检查
  // 指标 4: 历史估值百分位
  const isValuationOk = v.historicalPePercentile <= (archetype === 'cyclical_recovery' ? 50 : 65);
  items.push({
    id: 'gate2_pe_percentile',
    category: 'gate2_margin_of_safety',
    name: '近 5-10 年估值百分位分位数',
    criterion: archetype === 'cyclical_recovery' ? 'PE/PB 分位数 ≤ 50%' : 'PE-TTM 分位数 ≤ 65% (拒绝山顶接盘)',
    currentValueDisplay: `${v.historicalPePercentile}% 分位 (PE-TTM: ${v.peTTM.toFixed(1)}x)`,
    isPassed: isValuationOk,
    severity: 'critical',
    explanation: isValuationOk
      ? '估值未处于历史泡沫区，即便短期震荡，下行杀估值空间有限。'
      : '估值处于历史 70%+ 偏高甚至极度亢奋水位，透支未来 2-3 年业绩成长。',
    actionIfFailed: '耐住寂寞，绝不追高！等待均线回踩或情绪退潮后的合理区间。',
  });

  // 指标 5: 安全边际价格与现价比值
  const priceToMarginRatio = stock.currentPrice > 0 ? (v.marginOfSafetyPrice / stock.currentPrice) : 1;
  const isMarginOfSafetyOk = priceToMarginRatio >= 0.85;
  items.push({
    id: 'gate2_margin_price',
    category: 'gate2_margin_of_safety',
    name: '严谨安全边际折扣率',
    criterion: '现价接近或低于安全边际价格 (溢价 ≤ 15%)',
    currentValueDisplay: `现价 ${stock.currency === 'USD' ? '$' : '¥'}${stock.currentPrice} / 安全底价 ${stock.currency === 'USD' ? '$' : '¥'}${v.marginOfSafetyPrice}`,
    isPassed: isMarginOfSafetyOk,
    severity: 'medium',
    explanation: isMarginOfSafetyOk
      ? '当前股价与内在清算/重置价值贴近，提供充分防护垫。'
      : '当前买入缺少充分的安全垫缓冲，盈亏比不对称。',
    actionIfFailed: '建议分批建仓（如先建 20% 观察仓，80% 资金留作低吸）。',
  });

  // 指标 6: 右侧支撑与止损边界
  const isSupportOk = t.currentPrice >= t.supportLevel1 * 0.96;
  items.push({
    id: 'gate2_technical_support',
    category: 'gate2_margin_of_safety',
    name: '技术支撑与止损止盈盈亏比',
    criterion: '距离关键支撑位在 5% 以内，且止盈空间/止损空间 ≥ 2.0',
    currentValueDisplay: `支撑位: ${t.supportLevel1} (止损点: ${t.positionStrategy.stopLossPrice})`,
    isPassed: isSupportOk,
    severity: 'medium',
    explanation: isSupportOk
      ? '位于均线或筹码密集支撑带附近，下行有防守支点。'
      : '已跌破关键均线或悬于半空中，破位下跌概率未被消化。',
    actionIfFailed: '等待缩量企稳十字星或底背离右侧买点出现再行买入。',
  });

  // 4. Gate 3: 人工终极核验 Checklist (机器无法预知的主观真实黑天鹅)
  const defaultQuestions = [
    {
      id: 'human_management_pledge',
      question: '大股东高比例质押或违规担保？',
      description: '查阅最新公告确认大股东质押率是否低于 50%，无被立案调查、冻结或债务违约。',
    },
    {
      id: 'human_policy_crackdown',
      question: '近 3 个月是否存在行业突发颠覆性监管政策？',
      description: '确认所处赛道未被出台强限制性关税、反倾销调查或强制降价指导令。',
    },
    {
      id: 'human_key_customer_risk',
      question: '前五大客户集中度过高（单一客户 > 50%）？',
      description: '防范苹果链/特斯拉链单一核心大客户砍单被踢出供应链暴雷。',
    },
    {
      id: 'human_core_mgmt_change',
      question: '核心技术带头人或创始人近期是否有减持出逃/非正常离职？',
      description: '查阅高管变动与董监高减持明细，确认内部人态度是坚守还是套现。',
    },
  ];

  const humanChecklist = defaultQuestions.map((q) => ({
    ...q,
    checked: humanCheckedMap[q.id] ?? false,
  }));

  const pendingHumanChecks = humanChecklist.filter((q) => !q.checked).length;

  // 5. 汇总门禁判定
  const gate1Passed = items.filter((i) => i.category === 'gate1_anti_fraud' && i.severity === 'critical').every((i) => i.isPassed);
  const gate2Passed = items.filter((i) => i.category === 'gate2_margin_of_safety').filter((i) => i.isPassed).length >= 2;

  // 基础打分
  const passedItemsCount = items.filter((i) => i.isPassed).length;
  let auditScore = Math.round((passedItemsCount / items.length) * 80);
  // 人工 checklist 确认比例
  const checkedHumanRatio = (humanChecklist.length - pendingHumanChecks) / humanChecklist.length;
  auditScore += Math.round(checkedHumanRatio * 20);

  let canBuyDecision: 'pass' | 'conditional_buy' | 'strictly_forbidden' = 'conditional_buy';
  let canBuyDecisionZh: '可稳健建仓' | '带约束条件分批' | '触碰红线·坚决禁止买入' = '带约束条件分批';

  if (!gate1Passed) {
    canBuyDecision = 'strictly_forbidden';
    canBuyDecisionZh = '触碰红线·坚决禁止买入';
    auditScore = Math.min(auditScore, 45);
  } else if (gate1Passed && gate2Passed && pendingHumanChecks === 0) {
    canBuyDecision = 'pass';
    canBuyDecisionZh = '可稳健建仓';
    auditScore = Math.max(auditScore, 85);
  } else {
    canBuyDecision = 'conditional_buy';
    canBuyDecisionZh = '带约束条件分批';
  }

  return {
    symbol: stock.symbol,
    stockName: stock.name,
    archetype,
    archetypeZh,
    archetypeGuideline,
    auditScore,
    canBuyDecision,
    canBuyDecisionZh,
    gate1AntiFraudPass: gate1Passed,
    gate2ValuationPass: gate2Passed,
    gate3HumanChecklistPendingCount: pendingHumanChecks,
    items,
    humanChecklist,
  };
}
