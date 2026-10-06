import { StockData, FundamentalScan, AIAnalysisReport, StockAnalysisArchetype } from '../types/stock';
import { applyFundamentalThresholds, resolveFundamentalThresholds } from './fundamentalProfile';

/**
 * 按行业/原型重算六维基本面。金融业不把资产负债率和毛利率算进否决项。
 */
export function calculateFundamentalScan(stock: StockData, archetype?: StockAnalysisArchetype): FundamentalScan {
  const thresholds = resolveFundamentalThresholds(stock, archetype);
  return applyFundamentalThresholds(
    {
      grossMarginValue: stock.fundamentals.grossMarginValue,
      netMarginValue: stock.fundamentals.netMarginValue,
      debtRatioValue: stock.fundamentals.debtRatioValue,
      roeValue: stock.fundamentals.roeValue,
      revenueGrowthValue: stock.fundamentals.revenueGrowthValue,
      cashFlowValue: stock.fundamentals.cashFlowValue,
    },
    thresholds
  );
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

const STAGE_MACRO_ADJUST: Record<string, number> = {
  'High Growth': 2,
  'Mature Cash Cow': 0,
  'Cyclical Recovery': -2,
  Declining: -6,
};

/**
 * 宏观 20 分来自标的上的政策催化分和行业阶段。
 * 用户滑块只作个人备注，不进入总分。
 */
export function macroPointsFromStock(stock: StockData): number {
  const raw = Number(stock.macro?.policyCatalystScore);
  const catalyst = Number.isFinite(raw) ? Math.min(10, Math.max(0, raw)) : 5;
  const adjust = STAGE_MACRO_ADJUST[stock.macro?.industryStage] ?? 0;
  return Math.min(20, Math.max(0, Math.round(catalyst * 2) + adjust));
}

/**
 * Evaluates the 5-step analysis summary score.
 * macroHeatSlider 保留给文案，不参与计分。
 */
export function computeFiveStepSummary(stock: StockData, _macroHeatSlider?: number) {
  const macroPts = macroPointsFromStock(stock);

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
function marginOfSafetyPhrase(percentile: number): string {
  if (percentile <= 20) return '处于历史低分位，安全边际较厚';
  if (percentile <= 40) return '处于历史偏低区间，安全边际一般';
  if (percentile <= 60) return '接近历史中枢，安全边际有限';
  if (percentile <= 80) return '处于历史偏高区间，安全边际不足';
  return '处于历史高分位，安全边际很薄';
}

export function generateLocalReport(stock: StockData, macroSlider: number): AIAnalysisReport {
  const summary = computeFiveStepSummary(stock, macroSlider);
  const percentile = stock.valuation.historicalPePercentile;
  const marginPhrase = marginOfSafetyPhrase(percentile);
  const marginQuality = stock.fundamentals.grossMarginPass ? '毛利率达到当前阈值' : '毛利率未达到当前阈值';

  return {
    summary: `${stock.name} (${stock.symbol}) 五步综合评分为 ${summary.totalScore}/100，结论为「${summary.verdict}」。宏观分取政策催化 ${stock.macro.policyCatalystScore}/10（${summary.macroPts}/20），个人热度备注 ${macroSlider}/10 不计入。基本面 ${stock.fundamentals.overallScore}/100（${marginQuality}）。估值位于历史 ${percentile}% 分位，${marginPhrase}。`,
    macroDiagnosis: `评分使用政策催化分 ${stock.macro.policyCatalystScore}/10 与行业阶段「${stock.macro.industryStageZh}」。个人热度滑块 ${macroSlider}/10 只作备注。所属行业为【${stock.macro.sectorName}】，${stock.macro.policyTone}`,
    fundamentalDiagnosis: `财务评级 ${stock.fundamentals.grade}。毛利率 ${stock.fundamentals.grossMarginValue}%（${stock.fundamentals.grossMarginPass ? '达到当前阈值' : '未达当前阈值'}），净利率 ${stock.fundamentals.netMarginValue}%（${stock.fundamentals.netMarginPass ? '达到当前阈值' : '未达当前阈值'}），资产负债率 ${stock.fundamentals.debtRatioValue}%。`,
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
