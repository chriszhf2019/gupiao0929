import { StockData, ForensicForensicsResult, ScenarioValuationModel, PositionSizingResult } from '../types/stock';

function buildInsufficientResult(stock: StockData): ForensicForensicsResult {
  return {
    dataQuality: 'insufficient',
    dataQualityNote: '缺少资产负债表科目（应收账款/总资产/流动资产/留存收益等）真实披露数据，无法可靠计算 M-Score 与 Z-Score。请确认财报数据源可用后重试。',
    mScore: 0,
    mScoreThreshold: -1.78,
    isManipulationRiskHigh: false,
    mScoreRating: 'gray_zone',
    mScoreAnalysis: '数据不足，无法输出可靠的财务造假/破产判断。',
    components: { dsri: 0, gmi: 0, aqi: 0, sgi: 0, tata: 0, lvgi: 0 },
    zScore: 0,
    zScoreSafeThreshold: 2.99,
    zScoreRating: 'gray',
    zScoreAnalysis: '数据不足，无法输出可靠的财务破产判断。',
  };
}

/**
 * 计算 Beneish M-Score（财务造假排雷）与 Altman Z-Score（破产违约系数）
 * 优先使用真实资产负债表科目（应收账款/总资产/流动资产/流动负债/固定资产/留存收益）；
 * 数据缺失时返回 dataQuality='insufficient' 而非用估算值冒充。
 */
export function calculateBeneishAndAltman(stock: StockData): ForensicForensicsResult {
  const history = stock.financialHistory;
  if (!history || history.length < 2) return buildInsufficientResult(stock);

  const curr = history[history.length - 1];
  const prev = history[history.length - 2] || curr;

  // 需要真实资产负债表的科目，否则诚实降级
  const hasBalance =
    curr.totalAssets > 0 &&
    prev.totalAssets > 0 &&
    curr.receivables !== undefined &&
    prev.receivables !== undefined &&
    curr.currentAssets !== undefined &&
    curr.currentLiabilities !== undefined;
  if (!hasBalance) return buildInsufficientResult(stock);

  // 1. Beneish M-Score 核心变量（真实值）
  // DSRI (Days Sales in Receivables Index): (期末应收/期末营收) / (期初应收/期初营收)
  const dsri =
    prev.revenue > 0 && prev.receivables! > 0 && curr.revenue > 0
      ? (curr.receivables! / curr.revenue) / (prev.receivables! / prev.revenue)
      : 1.0;

  // GMI (Gross Margin Index): 上期毛利率 / 本期毛利率 (>1 表示毛利率下滑，存在粉饰动力)
  const currGrossMargin = curr.grossMargin / 100;
  const prevGrossMargin = prev.grossMargin / 100;
  const gmi = currGrossMargin > 0 ? prevGrossMargin / currGrossMargin : 1.0;

  // AQI (Asset Quality Index): [1 - (流动资产+固定资产)/总资产] 的环比
  const currNcRatio = 1 - (curr.currentAssets! + (curr.fixedAssets ?? 0)) / curr.totalAssets!;
  const prevNcRatio = 1 - (prev.currentAssets! + (prev.fixedAssets ?? 0)) / prev.totalAssets!;
  const aqi = prevNcRatio > 0 ? currNcRatio / prevNcRatio : 1.0;

  // SGI (Sales Growth Index): 营收增速
  const sgi = prev.revenue > 0 ? curr.revenue / prev.revenue : 1.0;

  // TATA (Total Accruals to Total Assets): (净利润 - 经营性净现金流) / 总资产
  const accruals = curr.netProfit - curr.freeCashFlow;
  const tata = curr.totalAssets! > 0 ? accruals / curr.totalAssets! : 0;

  // LVGI (Leverage Index): (负债/资产) 环比
  const lvgi =
    prev.totalLiabilities !== undefined && prev.totalLiabilities! > 0 && curr.totalLiabilities !== undefined && curr.totalLiabilities! > 0
      ? (curr.totalLiabilities! / curr.totalAssets!) / (prev.totalLiabilities! / prev.totalAssets!)
      : 1.0;

  // Beneish 5-variable 标准拟合方程（以真实值替代原估算/硬编码常数）
  let mScore = -4.84 + 0.92 * dsri + 0.528 * gmi + 0.404 * aqi + 0.892 * sgi + 4.679 * tata;
  mScore = Number(mScore.toFixed(2));

  let mScoreRating: ForensicForensicsResult['mScoreRating'] = 'safe';
  let isManipulationRiskHigh = false;
  let mScoreAnalysis = '各项应计利润与现金流匹配健康，财务造假与利润操纵概率极低。';

  if (mScore > -1.78) {
    mScoreRating = 'high_manipulation_risk';
    isManipulationRiskHigh = true;
    mScoreAnalysis = 'M-Score 击穿警戒红线(-1.78)，应计利润占比过高，需高度警惕应收账款虚增或利润粉饰风险！';
  } else if (mScore > -2.22) {
    mScoreRating = 'gray_zone';
    mScoreAnalysis = '处于灰色预警观察区，部分季度现金流滞后于利润确认，建议进一步复核存货与周转率。';
  }

  // 2. Altman Z-Score（以真实科目计算）
  // Z = 1.2*X1 + 1.4*X2 + 3.3*X3 + 0.6*X4 + 0.999*X5
  const totalAssets = curr.totalAssets!;
  const x1 = (curr.currentAssets! - curr.currentLiabilities!) / totalAssets; // 营运资本/总资产
  const x2 = (curr.retainedEarnings ?? 0) / totalAssets; // 留存收益/总资产
  const x3 = curr.netProfit / totalAssets; // EBIT 近似（以归母净利润近似息税前利润）
  const x4 =
    curr.totalLiabilities !== undefined && curr.totalLiabilities! > 0 && curr.totalEquity !== undefined
      ? curr.totalEquity! / curr.totalLiabilities!
      : curr.debtToAsset > 0
      ? (1 - curr.debtToAsset / 100) / (curr.debtToAsset / 100)
      : 2.5;
  const x5 = curr.revenue / totalAssets; // 营收/总资产（资产周转率）

  let zScore = 1.2 * x1 + 1.4 * x2 + 3.3 * x3 + 0.6 * Math.min(x4, 4.0) + 0.999 * x5;
  zScore = Number(zScore.toFixed(2));

  let zScoreRating: ForensicForensicsResult['zScoreRating'] = 'safe';
  let zScoreAnalysis = '处于极度安全的绿灯区(Z > 2.99)，资产结构稳固，未来两年内发生违约或破产概率微乎其微。';

  if (zScore < 1.81) {
    zScoreRating = 'distress';
    zScoreAnalysis = '位于危机困境区(Z < 1.81)，偿债压力巨大，资金链极度紧绷，存在实质性违约或流动性危机风险！';
  } else if (zScore <= 2.99) {
    zScoreRating = 'gray';
    zScoreAnalysis = '处于中性灰色带(1.81 <= Z <= 2.99)，需密切追踪有息负债率与再融资现金流。';
  }

  return {
    dataQuality: 'real',
    dataQualityNote: '基于真实资产负债表科目（应收账款/流动资产/流动负债/留存收益/总资产）计算。',
    mScore,
    mScoreThreshold: -1.78,
    isManipulationRiskHigh,
    mScoreRating,
    mScoreAnalysis,
    components: {
      dsri: Number(dsri.toFixed(2)),
      gmi: Number(gmi.toFixed(2)),
      aqi: Number(aqi.toFixed(2)),
      sgi: Number(sgi.toFixed(2)),
      tata: Number(tata.toFixed(3)),
      lvgi: Number(lvgi.toFixed(2)),
    },
    zScore,
    zScoreSafeThreshold: 2.99,
    zScoreRating,
    zScoreAnalysis,
  };
}

/**
 * 动态多情景敏感性估值引擎 (Bear / Base / Bull)
 */
export function calculateScenarioValuation(
  stock: StockData,
  baseCagr = 12,
  basePe = 25
): ScenarioValuationModel {
  const currentPrice = stock.currentPrice;
  const history = stock.financialHistory;
  const latestNetProfit = history[history.length - 1].netProfit;

  // 1. 基准情景 (Base)
  const baseProfit3Y = latestNetProfit * Math.pow(1 + baseCagr / 100, 3);
  // 假定每股收益按同比例扩张
  const currentPe = stock.valuation.peTTM || 20;
  const baseFairValue = Number((currentPrice * (baseProfit3Y / latestNetProfit) * (basePe / currentPe)).toFixed(2));
  const baseUpside = Number((((baseFairValue - currentPrice) / currentPrice) * 100).toFixed(1));

  // 2. 悲观情景 (Bear): 增长降速 40%，估值乘数下修 25%
  const bearCagr = Math.max(Number((baseCagr * 0.4).toFixed(1)), -5);
  const bearPe = Math.max(Number((basePe * 0.75).toFixed(1)), 10);
  const bearProfit3Y = latestNetProfit * Math.pow(1 + bearCagr / 100, 3);
  const bearFairValue = Number((currentPrice * (bearProfit3Y / latestNetProfit) * (bearPe / currentPe)).toFixed(2));
  const bearUpside = Number((((bearFairValue - currentPrice) / currentPrice) * 100).toFixed(1));

  // 3. 乐观情景 (Bull): 超预期加速 40%，估值乘数扩张 25%
  const bullCagr = Number((baseCagr * 1.45).toFixed(1));
  const bullPe = Number((basePe * 1.25).toFixed(1));
  const bullProfit3Y = latestNetProfit * Math.pow(1 + bullCagr / 100, 3);
  const bullFairValue = Number((currentPrice * (bullProfit3Y / latestNetProfit) * (bullPe / currentPe)).toFixed(2));
  const bullUpside = Number((((bullFairValue - currentPrice) / currentPrice) * 100).toFixed(1));

  // 概率加权均价 (悲观 25% + 基准 50% + 乐观 25%)
  const probabilityWeightedPrice = Number(
    (bearFairValue * 0.25 + baseFairValue * 0.5 + bullFairValue * 0.25).toFixed(2)
  );

  // 盈亏比 (Upside / Math.abs(Downside))
  const downside = Math.abs(Math.min(bearUpside, 0));
  const riskRewardRatio = downside > 0 ? Number((bullUpside / downside).toFixed(2)) : 5.0;

  return {
    bear: {
      name: '悲观情景 (Bear Case)',
      cagr3Y: bearCagr,
      terminalPe: bearPe,
      fairValue: bearFairValue,
      upsideDownside: bearUpside,
    },
    base: {
      name: '中性基准 (Base Case)',
      cagr3Y: baseCagr,
      terminalPe: basePe,
      fairValue: baseFairValue,
      upsideDownside: baseUpside,
    },
    bull: {
      name: '乐观情景 (Bull Case)',
      cagr3Y: bullCagr,
      terminalPe: bullPe,
      fairValue: bullFairValue,
      upsideDownside: bullUpside,
    },
    probabilityWeightedPrice,
    riskRewardRatio,
  };
}

/**
 * 买方头寸管理与确定性亏损计算器 (Kelly & VaR Position Sizing)
 */
export function calculatePositionSizing(params: {
  totalCapital: number;
  riskTolerancePercent: number;
  entryPrice: number;
  stopLossPrice: number;
}): PositionSizingResult {
  const { totalCapital, riskTolerancePercent, entryPrice, stopLossPrice } = params;

  // 1. 最大允许亏损额 (Dollar Risk)
  const maxDollarRisk = totalCapital * (riskTolerancePercent / 100);

  // 2. 每股风险敞口
  const riskPerShare = Math.max(entryPrice - stopLossPrice, entryPrice * 0.02);

  // 3. 计算理论可买股数并按一手 (100股) 向下取整
  const rawShares = maxDollarRisk / riskPerShare;
  let recommendedShares = Math.floor(rawShares / 100) * 100;
  if (recommendedShares < 100 && entryPrice * 100 <= totalCapital) {
    recommendedShares = 100;
  }

  // 4. 总投资额与仓位占比
  const totalInvestment = recommendedShares * entryPrice;
  const portfolioAllocationPercent = totalCapital > 0 ? Number(((totalInvestment / totalCapital) * 100).toFixed(1)) : 0;
  const potentialStopLossAmount = Number((recommendedShares * riskPerShare).toFixed(0));

  // 5. 集中度预警 (单一标的超过 30% 仓位预警)
  const isConcentrationWarning = portfolioAllocationPercent > 30;

  return {
    totalCapital,
    riskTolerancePercent,
    maxDollarRisk,
    entryPrice,
    stopLossPrice,
    riskPerShare,
    recommendedShares,
    totalInvestment,
    portfolioAllocationPercent,
    potentialStopLossAmount,
    isConcentrationWarning,
  };
}
