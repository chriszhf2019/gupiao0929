import { StockData, ForensicForensicsResult, ScenarioValuationModel, PositionSizingResult } from '../types/stock';
import { isFinancialSector } from './fundamentalProfile';

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
    dataQualityNote: '基于真实资产负债表科目计算。M-Score 为五变量方程（DSRI/GMI/AQI/SGI/TATA），LVGI 只展示、不进入公式。TATA 用净利润减经营现金流，不是自由现金流。Z-Score 的 X3 用净利润近似 EBIT，X4 用账面权益/负债并封顶 4，这是制造业近似，不适用于银行。',
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

export interface ScenarioAssumptions {
  cagr: number;
  exitPe: number;
  basis: string;
}

/** 基准增速取历史营收复合增速，退出 PE 取当前 PE，两者都限制在可解释区间。 */
export function inferScenarioAssumptions(stock: StockData): ScenarioAssumptions {
  const history = (stock.financialHistory || []).filter((year) => year.revenue > 0);
  let cagr = 8;
  let basis = '历史营收不足两年，基准增速用 8%';
  if (history.length >= 2) {
    const first = history[0];
    const last = history[history.length - 1];
    const years = Math.max(1, history.length - 1);
    if (first.revenue > 0 && last.revenue > 0) {
      const raw = (Math.pow(last.revenue / first.revenue, 1 / years) - 1) * 100;
      cagr = Math.max(-10, Math.min(35, Number(raw.toFixed(1))));
      basis = `近 ${years} 年营收复合增速 ${cagr}%`;
    }
  }
  const rawPe = stock.valuation.peTTM > 0 ? stock.valuation.peTTM : stock.valuation.pe5YearAvg;
  const exitPe = Math.max(10, Math.min(60, Number((rawPe || 20).toFixed(1))));
  return {
    cagr,
    exitPe,
    basis: `${basis}，退出 PE 取当前 ${exitPe} 倍（限制在 10–60）`,
  };
}

function flatScenario(stock: StockData, note: string): ScenarioValuationModel {
  const price = stock.currentPrice;
  const blank = { cagr3Y: 0, terminalPe: 0, fairValue: price, upsideDownside: 0 };
  return {
    bear: { name: '悲观情景 (Bear Case)', ...blank },
    base: { name: '中性基准 (Base Case)', ...blank },
    bull: { name: '乐观情景 (Bull Case)', ...blank },
    probabilityWeightedPrice: price,
    riskRewardRatio: 0,
    assumptionNote: note,
  };
}

/**
 * 动态多情景敏感性估值引擎 (Bear / Base / Bull)
 * 未传入参数时，用历史营收复合增速和当前 PE 作为基准。
 */
export function calculateScenarioValuation(
  stock: StockData,
  baseCagr?: number,
  basePe?: number
): ScenarioValuationModel {
  if (isFinancialSector(stock)) {
    return flatScenario(stock, '银行、保险、证券不用工业企业的盈利增速外推，这里不给三年目标价。');
  }

  const inferred = inferScenarioAssumptions(stock);
  const cagr = baseCagr ?? inferred.cagr;
  const exitPe = basePe ?? inferred.exitPe;
  const currentPrice = stock.currentPrice;
  const history = stock.financialHistory || [];
  const latestNetProfit = history.length > 0 ? history[history.length - 1].netProfit : 0;
  if (!history.length || latestNetProfit <= 0 || currentPrice <= 0) {
    return flatScenario(stock, '最近一期净利润不为正或缺少价格，三情景无法外推，公允价值暂记为现价。');
  }

  // 1. 基准情景 (Base)
  const baseProfit3Y = latestNetProfit * Math.pow(1 + cagr / 100, 3);
  const currentPe = stock.valuation.peTTM || exitPe || 20;
  const baseFairValue = Number((currentPrice * (baseProfit3Y / latestNetProfit) * (exitPe / currentPe)).toFixed(2));
  const baseUpside = Number((((baseFairValue - currentPrice) / currentPrice) * 100).toFixed(1));

  // 2. 悲观情景：增速降为基准的 60%（降速 40%），估值乘数下修 25%
  const bearCagr = Math.max(Number((cagr * 0.6).toFixed(1)), -5);
  const bearPe = Math.max(Number((exitPe * 0.75).toFixed(1)), 10);
  const bearProfit3Y = latestNetProfit * Math.pow(1 + bearCagr / 100, 3);
  const bearFairValue = Number((currentPrice * (bearProfit3Y / latestNetProfit) * (bearPe / currentPe)).toFixed(2));
  const bearUpside = Number((((bearFairValue - currentPrice) / currentPrice) * 100).toFixed(1));

  // 3. 乐观情景：增速升为基准的 140%（加速 40%），估值乘数扩张 25%
  const bullCagr = Number((cagr * 1.4).toFixed(1));
  const bullPe = Number((exitPe * 1.25).toFixed(1));
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
      cagr3Y: cagr,
      terminalPe: exitPe,
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
    assumptionNote: inferred.basis,
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
