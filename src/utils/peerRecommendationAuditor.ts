import { StockData, PeerRecommendationRecord } from '../types/stock';
import { PRESET_STOCKS } from '../data/presetStocks';

/**
 * 针对他人/朋友/大V推荐的股票进行实战验真
 * 支持传入实时/接口获取的 StockData；不传时回退到内置预置池（仅演示）。
 */
export function auditPeerRecommendation(
  params: {
    symbol: string;
    recommenderName: string;
    sourceChannel: PeerRecommendationRecord['sourceChannel'];
    recommendedReason: string;
    userAttitude: PeerRecommendationRecord['userAttitude'];
    stock?: StockData;
  }
): PeerRecommendationRecord {
  const stock = params.stock || PRESET_STOCKS[params.symbol] || Object.values(PRESET_STOCKS)[0];
  const lastYear = stock.financialHistory[stock.financialHistory.length - 1];

  // 1. 验真：估值真实分位数 (防山顶吹票套现)
  const pePercentile = stock.valuation.historicalPePercentile;
  const isValuationTooHigh = pePercentile >= 75;

  // 2. 验真：真金白银现金流支撑
  const cashVsProfit = lastYear?.netProfit && lastYear.netProfit > 0
    ? (lastYear.freeCashFlow / lastYear.netProfit)
    : 1.0;
  const isCashFlowFake = cashVsProfit < 0.6;

  // 3. 验真：筹码与阻力位
  const isUnderHeavyResistance = stock.currentPrice >= stock.technical.resistanceLevel1 * 0.98;

  // 综合判定结论
  const redFlags: string[] = [];
  if (isValuationTooHigh) {
    redFlags.push(`当前估值处于历史 ${pePercentile}% 极高分位，安全垫严重不足，谨防替主力抬轿`);
  }
  if (isCashFlowFake) {
    redFlags.push(`经营现金流仅占净利润 ${(cashVsProfit * 100).toFixed(0)}%，财报成色不佳，有坏账粉饰嫌疑`);
  }
  if (isUnderHeavyResistance) {
    redFlags.push(`股价正逼近关键重阻力位 ${stock.technical.resistanceLevel1}，随时可能冲高回落`);
  }
  if (stock.fundamentals.debtRatioValue > 65) {
    redFlags.push(`资产负债率高达 ${stock.fundamentals.debtRatioValue}%，偿债压力较大`);
  }

  let auditVerdict: PeerRecommendationRecord['auditVerdict'] = 'wait_pullback';
  let verdictTitle = '逻辑部分成立 · 建议耐心等回调企稳';
  let verdictScore = 65;
  let verdictExplanation = '公司基本面尚可，但当前买入时机并不理想。建议不可盲目追高，等待股价回踩关键支撑线再做观察。';

  if (redFlags.length >= 2 || isValuationTooHigh) {
    auditVerdict = 'trap_distribution';
    verdictTitle = '谨慎避坑 · 极大概率为主力派发/山顶接盘期';
    verdictScore = 32;
    verdictExplanation = `对方推荐的“利好”可能已充分反映在过去的暴涨中。目前估值偏贵或存在现金流硬伤，盲目听信容易沦为接盘侠。`;
  } else if (redFlags.length === 0 && stock.fundamentals.overallScore >= 80 && pePercentile <= 50) {
    auditVerdict = 'resonance_buy';
    verdictTitle = '高胜率共振 · 对方逻辑与内在价值吻合';
    verdictScore = 88;
    verdictExplanation = '经检验，该标的具有坚实基本面护城河，且估值处于合理或低估区间。推荐理由具有真实基本面支撑，可按照三步建仓纪律稳步跟进。';
  }

  return {
    id: `peer_${Date.now()}`,
    recommenderName: params.recommenderName || '某投资圈朋友',
    sourceChannel: params.sourceChannel,
    symbol: stock.symbol,
    stockName: stock.name,
    recommendedPrice: stock.currentPrice,
    recommendedDate: new Date().toISOString().split('T')[0],
    recommendedReason: params.recommendedReason || '听说有大利好与新业务突破',
    userAttitude: params.userAttitude,
    auditVerdict,
    verdictTitle,
    verdictScore,
    verdictExplanation,
    redFlags,
    alignmentChecks: [
      {
        dimension: '盈利含金量',
        claim: '对方说公司业绩大赚、成长迅猛',
        fact: isCashFlowFake ? '现金流远低于净利润，多为未收回的应收账款' : '经营现金流充沛，业绩成色扎实',
        isPass: !isCashFlowFake,
      },
      {
        dimension: '估值水位',
        claim: '对方说性价比极高、空间巨大',
        fact: `历史估值分位数达 ${pePercentile}% (PE-TTM: ${stock.valuation.peTTM.toFixed(1)}x)`,
        isPass: !isValuationTooHigh,
      },
      {
        dimension: '买点盈亏比',
        claim: '对方催促“现在赶紧上车”',
        fact: isUnderHeavyResistance ? '位于阻力位下方，盈亏比极差' : '位于合理支撑区间，下行风险可控',
        isPass: !isUnderHeavyResistance,
      },
      {
        dimension: '竞争护城河',
        claim: '对方声称技术壁垒深厚独一无二',
        fact: `综合财务评级【${stock.fundamentals.grade}级】，ROE 达 ${stock.fundamentals.roeValue}%，毛利率 ${stock.fundamentals.grossMarginValue}%`,
        isPass: stock.fundamentals.roePass && stock.fundamentals.grossMarginPass,
      },
    ],
  };
}
