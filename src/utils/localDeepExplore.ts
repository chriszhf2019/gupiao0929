import { StockData, DeepExploreAIResult } from '../types/stock';
import { calculateScenarioValuation } from './institutionalForensics';

function num(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '--';
}

/** 没有模型密钥时，只复述已加载科目和同一套情景引擎，不写护城河或涨幅故事。 */
export function buildLocalDeepExploreReport(stock: StockData, topic: string): DeepExploreAIResult {
  const model = calculateScenarioValuation(stock);
  const note = model.assumptionNote || '情景假设见估值模块。';
  const withheld = model.base.terminalPe === 0;
  return {
    topic,
    executiveInsight: `未配置模型。只复述已加载科目：${stock.name}（${stock.symbol}）毛利率 ${num(stock.fundamentals?.grossMarginValue)}%，ROE ${num(stock.fundamentals?.roeValue)}%，市盈率历史分位 ${num(stock.valuation?.historicalPePercentile)}%。不推断定价权或护城河。议题：${topic}`,
    bullCaseAnalysis: withheld
      ? `情景未外推。${note}`
      : `情景引擎乐观公允价 ${model.bull.fairValue}，相对现价 ${model.bull.upsideDownside}%。${note} 这不是研究员给出的上涨空间。`,
    bearCaseAnalysis: withheld
      ? `情景未外推。${note}`
      : `情景引擎悲观公允价 ${model.bear.fairValue}，相对现价 ${model.bear.upsideDownside}%。净利润不为正或缺少价格时，公允价记为现价，涨跌幅为 0。`,
    moatDurability: '未配置模型，不评定护城河宽窄，也不填写波特五力分数。',
    actionableFramework: `执行价沿用技术模块已算出的支撑 ${num(stock.technical?.supportLevel1)} 与止损 ${num(stock.technical?.positionStrategy?.stopLossPrice)}。这里不给出盈亏比。`,
  };
}
