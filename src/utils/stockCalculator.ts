import { StockData, FundamentalScan, AIAnalysisReport } from '../types/stock';

/**
 * Re-evaluates fundamental scan rules based on stock data
 */
export function calculateFundamentalScan(stock: StockData): FundamentalScan {
  const gmPass = stock.fundamentals.grossMarginValue >= 30;
  const nmPass = stock.fundamentals.netMarginValue >= 10;
  const debtPass = stock.fundamentals.debtRatioValue <= 60;
  const roePass = stock.fundamentals.roeValue >= 15;
  const revPass = stock.fundamentals.revenueGrowthValue >= 5;
  const cashPass = stock.fundamentals.cashFlowValue > 0;

  const passes = [gmPass, nmPass, debtPass, roePass, revPass, cashPass].filter(Boolean).length;
  const score = Math.round((passes / 6) * 100);

  let grade: FundamentalScan['grade'] = 'C';
  if (score >= 90) grade = 'A+';
  else if (score >= 75) grade = 'A';
  else if (score >= 60) grade = 'B';
  else if (score >= 40) grade = 'C';
  else grade = 'D';

  return {
    grossMarginPass: gmPass,
    grossMarginValue: stock.fundamentals.grossMarginValue,
    netMarginPass: nmPass,
    netMarginValue: stock.fundamentals.netMarginValue,
    debtRatioPass: debtPass,
    debtRatioValue: stock.fundamentals.debtRatioValue,
    roePass: roePass,
    roeValue: stock.fundamentals.roeValue,
    revenueGrowthPass: revPass,
    revenueGrowthValue: stock.fundamentals.revenueGrowthValue,
    cashFlowPass: cashPass,
    cashFlowValue: stock.fundamentals.cashFlowValue,
    overallScore: score,
    grade
  };
}

/**
 * 五步法结论统一阈值档位（单一事实来源，UI 配色/文案/本地兜底全部以此为准）
 */
export type FiveStepVerdictLevel = 'strong' | 'accumulate' | 'hold' | 'caution';

export const VERDICT_THRESHOLDS: { strong: number; accumulate: number; caution: number } = {
  strong: 85, // >= 85
  accumulate: 70, // >= 70 且 < 85
  caution: 50, // < 50；介于 50~70 为 hold
};

/**
 * Evaluates the 5-step analysis summary score
 */
export function computeFiveStepSummary(stock: StockData, macroHeatSlider: number) {
  // Step 1 & 2: Macro (0-20 pts)
  const macroPts = Math.min(20, Math.round((macroHeatSlider / 10) * 20));

  // Step 3: Fundamentals (0-30 pts)
  const fundPts = Math.round((stock.fundamentals.overallScore / 100) * 30);

  // Step 4: Valuation percentile (0-25 pts)
  // Lower percentile = Higher score for buying
  const pePercentile = stock.valuation.historicalPePercentile;
  let valPts = 25;
  if (pePercentile <= 20) valPts = 25;
  else if (pePercentile <= 40) valPts = 20;
  else if (pePercentile <= 60) valPts = 15;
  else if (pePercentile <= 80) valPts = 8;
  else valPts = 2;

  // Step 5: Technical (0-25 pts)
  let techPts = 15;
  if (stock.technical.macdSignal === 'Golden Cross' && stock.technical.trendChannel === 'Uptrend') {
    techPts = 25;
  } else if (stock.technical.trendChannel === 'Uptrend') {
    techPts = 20;
  } else if (stock.technical.macdSignal === 'Golden Cross') {
    techPts = 18;
  } else {
    techPts = 10;
  }

  const totalScore = macroPts + fundPts + valPts + techPts;

  let verdict = '观望/持有';
  let verdictLevel: FiveStepVerdictLevel = 'hold';
  let badgeColor = 'bg-amber-500/10 text-amber-600 border-amber-500/20';

  if (totalScore >= VERDICT_THRESHOLDS.strong) {
    verdict = '强烈推荐建仓';
    verdictLevel = 'strong';
    badgeColor = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
  } else if (totalScore >= VERDICT_THRESHOLDS.accumulate) {
    verdict = '建议分批逢低吸纳';
    verdictLevel = 'accumulate';
    badgeColor = 'bg-blue-500/10 text-blue-600 border-blue-500/20';
  } else if (totalScore < VERDICT_THRESHOLDS.caution) {
    verdict = '风险偏高谨慎观望';
    verdictLevel = 'caution';
    badgeColor = 'bg-rose-500/10 text-rose-600 border-rose-500/20';
  }

  return {
    totalScore,
    macroPts,
    fundPts,
    valPts,
    techPts,
    verdict,
    verdictLevel,
    badgeColor
  };
}

/**
 * Fallback static AI analysis generator if server is offline or missing key
 */
export function generateLocalReport(stock: StockData, macroSlider: number): AIAnalysisReport {
  const summary = computeFiveStepSummary(stock, macroSlider);

  return {
    summary: `${stock.name} (${stock.symbol}) 股票分析五步走综合评分为 ${summary.totalScore}/100 分。宏观政策热度打分为 ${macroSlider}/10。基本面评分 ${stock.fundamentals.overallScore}/100，毛利率与盈利能力优秀，估值位于历史 ${stock.valuation.historicalPePercentile}% 百分位，具备极高安全边际。`,
    macroDiagnosis: `宏观热度调至 ${macroSlider}/10，所属行业为【${stock.macro.sectorName}】，${stock.macro.policyTone}`,
    fundamentalDiagnosis: `公司财务状况评估等级为 ${stock.fundamentals.grade}。毛利率为 ${stock.fundamentals.grossMarginValue}%（${stock.fundamentals.grossMarginPass ? '符合 >30% 优质选股规则' : '偏低'}），净利率为 ${stock.fundamentals.netMarginValue}%（${stock.fundamentals.netMarginPass ? '符合 >10% 要求' : '偏低'}），资产负债率为 ${stock.fundamentals.debtRatioValue}%。`,
    valuationDiagnosis: `当前动态 PE 为 ${stock.valuation.peTTM} 倍，处于 5 年历史 PE 估值的 ${stock.valuation.historicalPePercentile}% 百分位（${stock.valuation.statusZh}），安全边际买入价建议为 ${stock.valuation.marginOfSafetyPrice} ${stock.currency}。`,
    technicalDiagnosis: `技术指标 ${stock.technical.macdSignalZh}，属于 ${stock.technical.trendChannelZh} 形态，关键支撑位 ${stock.technical.supportLevel1} ${stock.currency}，关键压力位 ${stock.technical.resistanceLevel1} ${stock.currency}。`,
    fiveStepScore: summary.totalScore,
    verdict:
      summary.verdictLevel === 'strong'
        ? 'Strong Buy'
        : summary.verdictLevel === 'accumulate'
        ? 'Accumulate'
        : summary.verdictLevel === 'caution'
        ? 'Caution / Wait'
        : 'Hold',
    verdictZh: summary.verdict as any,
    keyRisksToWatch: stock.macro.keyRisks,
    recommendedAction: stock.technical.timingAdvice,
    source: 'local' as const,
  };
}
