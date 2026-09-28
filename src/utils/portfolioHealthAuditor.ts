import { PortfolioHoldingInput, PortfolioHealthReport, StockData } from '../types/stock';
import { PRESET_STOCKS } from '../data/presetStocks';

/**
 * 针对用户持仓组合进行全方位健康度与雷区排查体检
 * stockMap 可选：传入按代码索引的实时/接口 StockData，优先于内置预置池；
 * 两者皆无数据的标的会被标记为 unknown（无法排雷），不计入高危暴露。
 */
export function auditPortfolioHealth(
  holdings: PortfolioHoldingInput[],
  stockMap: Record<string, StockData> = {}
): PortfolioHealthReport {
  if (!holdings || holdings.length === 0) {
    return {
      overallHealthScore: 100,
      totalMarketValue: 0,
      totalCostValue: 0,
      totalUnrealizedPnL: 0,
      totalUnrealizedPnLPercent: 0,
      highRiskExposurePercent: 0,
      averagePePercentile: 50,
      cashFlowDeficitCount: 0,
      holdingsAudit: [],
      detoxRecommendations: ['暂无持仓，请先添加持仓股票或导入模拟组合进行体检。'],
    };
  }

  let totalMarketValue = 0;
  let totalCostValue = 0;
  let highRiskMarketValue = 0;
  let totalWeightedPePercentile = 0;
  let cashFlowDeficitCount = 0;

  // 1. 初步计算总市值与成本
  const prepared = holdings.map((h) => {
    const stock = stockMap[h.symbol] || PRESET_STOCKS[h.symbol] || null;
    const currentPrice = h.currentPrice || stock?.currentPrice || 0;
    const mv = h.shares * currentPrice;
    const cost = h.shares * h.costPrice;
    totalMarketValue += mv;
    totalCostValue += cost;
    return { ...h, currentPrice, marketValue: mv, stock };
  });

  // 2. 逐一诊断每只标的的健康风险等级
  const auditedHoldings = prepared.map((item) => {
    const stock = item.stock;
    const weightPercent = totalMarketValue > 0 ? (item.marketValue / totalMarketValue) * 100 : 0;
    const pnlPercent = item.costPrice > 0 ? ((item.currentPrice - item.costPrice) / item.costPrice) * 100 : 0;

    // 无财务数据：无法排雷，标记 unknown 并跳过风险计入
    if (!stock) {
      return {
        symbol: item.symbol,
        name: item.name || item.symbol,
        marketValue: Math.round(item.marketValue),
        weightPercent: Number(weightPercent.toFixed(1)),
        unrealizedPnLPercent: Number(pnlPercent.toFixed(2)),
        healthLevel: 'unknown' as const,
        primaryRisk: '暂无财务披露数据，无法执行排雷诊断（数据接口仅覆盖部分标的）',
        actionSuggestion: 'review' as const,
        actionSuggestionZh: '补充数据后复核',
      };
    }

    const pePercentile = stock.valuation.historicalPePercentile;
    totalWeightedPePercentile += pePercentile * (weightPercent / 100);

    const lastYear = stock.financialHistory[stock.financialHistory.length - 1];
    const isCashFlowNegative = (lastYear?.freeCashFlow ?? 0) < 0;
    if (isCashFlowNegative) {
      cashFlowDeficitCount++;
    }

    const isHighDebt = stock.fundamentals.debtRatioValue > 65;
    const isOvervalued = pePercentile > 75;

    let healthLevel: 'healthy' | 'warning' | 'critical_danger' = 'healthy';
    let primaryRisk = '财务与估值均衡，抗风险能力强';
    let actionSuggestion: 'continue_hold' | 'trim_reduce' | 'immediate_cut_loss' = 'continue_hold';
    let actionSuggestionZh = '安心持有 · 逢低加仓';

    if (isHighDebt || isCashFlowNegative) {
      healthLevel = 'critical_danger';
      highRiskMarketValue += item.marketValue;
      primaryRisk = isCashFlowNegative ? '现金流净额为负，存在严重资金链风险' : '资产负债率超警戒线，谨防债务暴雷';
      actionSuggestion = 'immediate_cut_loss';
      actionSuggestionZh = '坚决减仓 · 规避暴雷';
    } else if (isOvervalued) {
      healthLevel = 'warning';
      highRiskMarketValue += item.marketValue * 0.5;
      primaryRisk = `估值处于历史 ${pePercentile}% 高位，随时面临杀估值回撤`;
      actionSuggestion = 'trim_reduce';
      actionSuggestionZh = '逢高止盈 · 降低仓位';
    }

    return {
      symbol: item.symbol,
      name: item.name || stock.name,
      marketValue: Math.round(item.marketValue),
      weightPercent: Number(weightPercent.toFixed(1)),
      unrealizedPnLPercent: Number(pnlPercent.toFixed(2)),
      healthLevel,
      primaryRisk,
      actionSuggestion,
      actionSuggestionZh,
    };
  });

  const highRiskExposurePercent = totalMarketValue > 0
    ? Number(((highRiskMarketValue / totalMarketValue) * 100).toFixed(1))
    : 0;

  const totalUnrealizedPnL = totalMarketValue - totalCostValue;
  const totalUnrealizedPnLPercent = totalCostValue > 0
    ? Number(((totalUnrealizedPnL / totalCostValue) * 100).toFixed(2))
    : 0;

  // 综合健康分 (100分制)
  let healthScore = 100;
  healthScore -= highRiskExposurePercent * 0.7;
  if (totalWeightedPePercentile > 70) healthScore -= 15;
  if (cashFlowDeficitCount > 0) healthScore -= cashFlowDeficitCount * 12;
  healthScore = Math.max(15, Math.min(98, Math.round(healthScore)));

  // 针对性清淤排毒建议
  const detoxRecommendations: string[] = [];
  if (highRiskExposurePercent > 30) {
    detoxRecommendations.push(`高危资产暴露度高达 ${highRiskExposurePercent}%，组合在黑天鹅冲击下极易大幅回撤，建议优先清理现金流恶化标的。`);
  }
  if (totalWeightedPePercentile > 65) {
    detoxRecommendations.push(`组合平均历史估值分位数处于 ${Math.round(totalWeightedPePercentile)}% 偏贵区间，切忌在指数反弹时加仓高估值白马，应配置部分低估防守资产平衡。`);
  }
  if (cashFlowDeficitCount > 0) {
    detoxRecommendations.push(`组合中存在 ${cashFlowDeficitCount} 只现金流失血股票，建议趁脉冲反弹果断换仓至具有自由现金流造血能力的稳健龙头。`);
  }
  if (detoxRecommendations.length === 0) {
    detoxRecommendations.push('组合整体资产质量优良，无明显爆雷隐患。建议继续遵循止损与分批建仓纪律，耐心持有享受企业成长红利。');
  }

  return {
    overallHealthScore: healthScore,
    totalMarketValue: Math.round(totalMarketValue),
    totalCostValue: Math.round(totalCostValue),
    totalUnrealizedPnL: Math.round(totalUnrealizedPnL),
    totalUnrealizedPnLPercent,
    highRiskExposurePercent,
    averagePePercentile: Math.round(totalWeightedPePercentile),
    cashFlowDeficitCount,
    holdingsAudit: auditedHoldings,
    detoxRecommendations,
  };
}
