import { InvestigativeReport, StockData } from '../types/stock';

function loadedFacts(stock?: StockData | null): string {
  if (!stock) return '当前没有加载到该标的的财报科目。';
  const latest = stock.financialHistory?.[stock.financialHistory.length - 1];
  const bits = [
    `市盈率 ${stock.peTTM || '--'}`,
    `历史分位 ${stock.valuation?.historicalPePercentile ?? '--'}%`,
    `毛利率 ${stock.fundamentals?.grossMarginValue ?? '--'}%`,
    `ROE ${stock.fundamentals?.roeValue ?? '--'}%`,
  ];
  if (latest) {
    bits.push(`最近一期营收 ${latest.revenue} 亿元、净利润 ${latest.netProfit} 亿元、经营现金流 ${latest.freeCashFlow} 亿元`);
  }
  return bits.join('，') + '。';
}

/**
 * 没有模型时的调查报告：只保留已加载科目，分部占比和市值故事留空。
 */
export function buildUnavailableInvestigativeReport(
  targetName: string,
  targetSymbol: string | undefined,
  industry: string,
  stock?: StockData | null
): InvestigativeReport {
  const name = targetName || stock?.name || '目标企业';
  const symbol = targetSymbol || stock?.symbol;
  const facts = loadedFacts(stock);
  return {
    targetName: name,
    targetSymbol: symbol,
    industry: industry || stock?.sector || '未注明行业',
    topicTitle: `【${name}】调查稿未生成：没有模型，也不填写模板占比`,
    anomalousContrast: {
      expected: '未配置模型，不代写市场预期。',
      reality: facts,
      coreDilemmaQuestion: '要核验收入结构，请直接看财报模块里的营收、净利润和经营现金流，而不是这里的模板数字。',
    },
    closedLoopMechanics: {
      moneyOrigin: '未配置模型，不推测资金来源。',
      moneyDestination: '未配置模型，不推测资金去向。',
      intermediaryBeneficiaries: '未配置模型，不点名受益方。',
      costBearer: '未配置模型，不指定成本承担者。',
      coreMissingDemand: '需求是否真实，要以客户、订单和回款披露为准。',
      chainSummary: '没有模型时不编排利益闭环。',
    },
    extremeContrastData: {
      metricA: { label: '已加载估值', value: stock ? `${stock.peTTM || '--'} 倍市盈率` : '未加载', context: '来自行情模块，不是调查推算。' },
      metricB: { label: '分部商业化占比', value: '未披露', context: '没有模型，也不用模板百分比填充分部收入。' },
      contrastImpact: '这里没有可对照的极端数字。',
      verifiableSource: '财报模块中的利润表与现金流量表。',
    },
    emotionalExplosion: {
      publicAngerTrigger: '未生成情绪稿。',
      colloquialPunchline: '没有核对过的百分比，不要当成公司披露。',
      soulInterrogation: '这份调查在配置模型之前停在科目复述。',
    },
    hookQuestion: `【${name}】的调查正文需要模型。当前只复述已加载科目。`,
    contrastStatement: facts,
    revenueStructure: [
      {
        segment: '分部收入',
        percentage: null,
        amount: '未披露',
        isRealCommercial: false,
        note: '未配置模型，不填写各分部占比。',
      },
    ],
    valuationContrast: {
      marketCap: stock?.marketCap || '未加载市值',
      realCommercialRevenue: facts,
      realSharePercent: null,
      bubbleMultiple: '未计算',
      conclusion: '不根据模板估算泡沫倍数。',
    },
    coldHardDataSummary: facts,
    auditRedFlags: ['未配置模型，不列举未经披露支持的审计疑点。'],
    hiddenClosedLoop: [
      {
        step: 1,
        title: '调查未展开',
        desc: '配置模型后才会按「反常现象 → 利益闭环 → 实锤数据 → 情绪」生成正文。',
      },
    ],
    logicChainAnalysis: '没有模型时不写因果链。上面的科目来自已加载的行情和财报。',
    emotionalResonance: '不生成传播用的情绪段落。',
    viralTitles: [
      { type: '疑问反差', title: `【${name}】调查稿待生成`, hookStyle: '不使用虚构占比' },
      { type: '数据实锤', title: `先看【${name}】已加载的营收和现金流`, hookStyle: '只指向财报模块' },
      { type: '情绪痛点', title: '未生成情绪标题', hookStyle: '留空' },
      { type: '内幕拷问', title: '未生成内幕标题', hookStyle: '留空' },
    ],
    wechatArticle: `未配置模型。\n\n${facts}\n\n分部收入占比、市值神话和产线落地率都不会在这里编造。`,
    shortVideoScript: {
      hook3s: '这条调查还没有模型，画面里不出现虚构百分比。',
      scenes: [
        {
          sceneNumber: 1,
          duration: '0-10s',
          visual: '财报模块中的营收、净利润、经营现金流',
          audio: facts,
          emotionTag: '科目复述',
        },
      ],
      callToAction: '配置模型后再生成调查正文。',
    },
    socialPost: `【${name}】调查稿未生成。已加载科目：${facts}`,
    signals: [],
    complianceDisclaimer: '未配置模型。本页不包含模板百分比或市值故事。编辑案例库里的历史稿件另行标注，不与本页空白稿混用。不构成投资建议。',
  };
}
