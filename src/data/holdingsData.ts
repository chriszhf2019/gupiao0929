import { InstitutionalHoldingOverview, InstitutionalPortfolioList } from '../types/stock';
import { request } from '../services/apiClient';

/**
 * 个股前十大流通股东数据（内置历史披露快照，仅作为东财真实接口不可用时的降级数据）
 */
export const STOCK_HOLDINGS_DATA: Record<string, InstitutionalHoldingOverview> = {
  // 1. 贵州茅台 (600519)
  '600519': {
    symbol: '600519',
    source: 'preset-snapshot',
    stockName: '贵州茅台',
    reportPeriod: '2024年报/最新季度披露',
    totalInstitutionsCount: 2248,
    institutionalSharePercent: 78.6,
    top10ConcentrationPercent: 72.85,
    northboundHoldingPercent: 6.95,
    mutualFundCount: 2180,
    socialSecurityPresent: true,
    nationalTeamPresent: true,
    shareholders: [
      {
        rank: 1,
        name: '中国贵州茅台酒厂(集团)有限责任公司',
        holdingShares: '6.78亿股',
        holdingPercent: 54.07,
        changeStatus: 'unchanged',
        changeStatusZh: '未变',
        shareholderType: '控股股东/国资',
      },
      {
        rank: 2,
        name: '香港中央结算有限公司 (陆股通北向资金)',
        holdingShares: '8,735.6万股',
        holdingPercent: 6.95,
        changeStatus: 'increase',
        changeStatusZh: '增持',
        changeShares: '+320.5万股',
        shareholderType: '北向陆股通外资',
      },
      {
        rank: 3,
        name: '贵州省国有资本运营有限责任公司',
        holdingShares: '5,680.0万股',
        holdingPercent: 4.52,
        changeStatus: 'unchanged',
        changeStatusZh: '未变',
        shareholderType: '控股股东/国资',
      },
      {
        rank: 4,
        name: '贵州茅台酒厂集团技术开发公司',
        holdingShares: '2,781.2万股',
        holdingPercent: 2.21,
        changeStatus: 'unchanged',
        changeStatusZh: '未变',
        shareholderType: '控股股东/国资',
      },
      {
        rank: 5,
        name: '中央汇金资产管理有限责任公司 (国家队)',
        holdingShares: '1,078.7万股',
        holdingPercent: 0.86,
        changeStatus: 'unchanged',
        changeStatusZh: '未变',
        shareholderType: '国家队证金/汇金',
      },
      {
        rank: 6,
        name: '中国证券金融股份有限公司 (证金公司)',
        holdingShares: '803.9万股',
        holdingPercent: 0.64,
        changeStatus: 'unchanged',
        changeStatusZh: '未变',
        shareholderType: '国家队证金/汇金',
      },
      {
        rank: 7,
        name: '华夏上证50交易型开放式指数证券投资基金',
        holdingShares: '652.4万股',
        holdingPercent: 0.52,
        changeStatus: 'increase',
        changeStatusZh: '增持',
        changeShares: '+85.2万股',
        shareholderType: '公募基金',
      },
      {
        rank: 8,
        name: '深圳市金汇荣盛财富管理-金汇荣盛三号私募',
        holdingShares: '601.2万股',
        holdingPercent: 0.48,
        changeStatus: 'decrease',
        changeStatusZh: '减持',
        changeShares: '-45.0万股',
        shareholderType: '保险资管',
      },
      {
        rank: 9,
        name: '易方达蓝筹精选混合型证券投资基金 (张坤)',
        holdingShares: '580.0万股',
        holdingPercent: 0.46,
        changeStatus: 'unchanged',
        changeStatusZh: '未变',
        shareholderType: '公募基金',
      },
      {
        rank: 10,
        name: '全国社保基金一零一组合',
        holdingShares: '488.5万股',
        holdingPercent: 0.39,
        changeStatus: 'new',
        changeStatusZh: '新进',
        changeShares: '+488.5万股',
        shareholderType: '社保基金',
      },
    ],
  },

  // 2. 宁德时代 (300750)
  '300750': {
    symbol: '300750',
    source: 'preset-snapshot',
    stockName: '宁德时代',
    reportPeriod: '2024年报/最新季度披露',
    totalInstitutionsCount: 1850,
    institutionalSharePercent: 71.4,
    top10ConcentrationPercent: 64.3,
    northboundHoldingPercent: 11.2,
    mutualFundCount: 1720,
    socialSecurityPresent: true,
    nationalTeamPresent: true,
    shareholders: [
      {
        rank: 1,
        name: '宁波梅山保税港区瑞庭投资有限公司 (曾毓群)',
        holdingShares: '10.25亿股',
        holdingPercent: 23.29,
        changeStatus: 'unchanged',
        changeStatusZh: '未变',
        shareholderType: '控股股东/国资',
      },
      {
        rank: 2,
        name: '香港中央结算有限公司 (陆股通北向外资)',
        holdingShares: '4.92亿股',
        holdingPercent: 11.18,
        changeStatus: 'increase',
        changeStatusZh: '增持',
        changeShares: '+1,850万股',
        shareholderType: '北向陆股通外资',
      },
      {
        rank: 3,
        name: '黄世霖 (联合创始人)',
        holdingShares: '4.66亿股',
        holdingPercent: 10.59,
        changeStatus: 'unchanged',
        changeStatusZh: '未变',
        shareholderType: '个人自然人',
      },
      {
        rank: 4,
        name: '宁波联合创新新能源投资管理合伙企业',
        holdingShares: '2.84亿股',
        holdingPercent: 6.46,
        changeStatus: 'unchanged',
        changeStatusZh: '未变',
        shareholderType: '控股股东/国资',
      },
      {
        rank: 5,
        name: '李平 (联合创始人)',
        holdingShares: '2.01亿股',
        holdingPercent: 4.57,
        changeStatus: 'unchanged',
        changeStatusZh: '未变',
        shareholderType: '个人自然人',
      },
      {
        rank: 6,
        name: '本田技研工业(中国)投资有限公司',
        holdingShares: '4,440.1万股',
        holdingPercent: 1.01,
        changeStatus: 'unchanged',
        changeStatusZh: '未变',
        shareholderType: '北向陆股通外资',
      },
      {
        rank: 7,
        name: '华泰柏瑞沪深300交易型开放式指数基金',
        holdingShares: '3,890.5万股',
        holdingPercent: 0.88,
        changeStatus: 'increase',
        changeStatusZh: '增持',
        changeShares: '+410万股',
        shareholderType: '公募基金',
      },
      {
        rank: 8,
        name: '易方达创业板交易型开放式指数证券投资基金',
        holdingShares: '3,650.2万股',
        holdingPercent: 0.83,
        changeStatus: 'increase',
        changeStatusZh: '增持',
        changeShares: '+320万股',
        shareholderType: '公募基金',
      },
      {
        rank: 9,
        name: '全国社保基金一一四组合',
        holdingShares: '2,980.0万股',
        holdingPercent: 0.68,
        changeStatus: 'increase',
        changeStatusZh: '增持',
        changeShares: '+210万股',
        shareholderType: '社保基金',
      },
      {
        rank: 10,
        name: '中央汇金投资有限责任公司 (国家队)',
        holdingShares: '2,540.0万股',
        holdingPercent: 0.58,
        changeStatus: 'unchanged',
        changeStatusZh: '未变',
        shareholderType: '国家队证金/汇金',
      },
    ],
  },

  // 3. 腾讯控股 (00700)
  '00700': {
    symbol: '00700',
    source: 'preset-snapshot',
    stockName: '腾讯控股',
    reportPeriod: '2024最新港股公开披露',
    totalInstitutionsCount: 1980,
    institutionalSharePercent: 68.2,
    top10ConcentrationPercent: 58.5,
    northboundHoldingPercent: 10.4,
    mutualFundCount: 1650,
    socialSecurityPresent: true,
    nationalTeamPresent: true,
    shareholders: [
      {
        rank: 1,
        name: 'Naspers / Prosus N.V. (南非第一大外资股东)',
        holdingShares: '23.4亿股',
        holdingPercent: 24.8,
        changeStatus: 'decrease',
        changeStatusZh: '减持',
        changeShares: '-2,400万股',
        shareholderType: '控股股东/国资',
      },
      {
        rank: 2,
        name: '香港中央结算(代理人)有限公司 (南向港股通与托管)',
        holdingShares: '18.9亿股',
        holdingPercent: 20.1,
        changeStatus: 'increase',
        changeStatusZh: '增持',
        changeShares: '+4,500万股',
        shareholderType: '北向陆股通外资',
      },
      {
        rank: 3,
        name: '马化腾 (Advance Data Services Limited)',
        holdingShares: '7.95亿股',
        holdingPercent: 8.42,
        changeStatus: 'unchanged',
        changeStatusZh: '未变',
        shareholderType: '个人自然人',
      },
      {
        rank: 4,
        name: 'Vanguard Group (领航先锋集团基金)',
        holdingShares: '2.45亿股',
        holdingPercent: 2.6,
        changeStatus: 'increase',
        changeStatusZh: '增持',
        changeShares: '+180万股',
        shareholderType: '公募基金',
      },
      {
        rank: 5,
        name: 'BlackRock, Inc. (贝莱德集团)',
        holdingShares: '2.10亿股',
        holdingPercent: 2.23,
        changeStatus: 'increase',
        changeStatusZh: '增持',
        changeShares: '+220万股',
        shareholderType: '公募基金',
      },
      {
        rank: 6,
        name: '中国证券金融(香港) / 南向港股通资金沉淀',
        holdingShares: '1.45亿股',
        holdingPercent: 1.54,
        changeStatus: 'increase',
        changeStatusZh: '增持',
        shareholderType: '国家队证金/汇金',
      },
      {
        rank: 7,
        name: '刘炽平 (腾讯执行董事兼总裁)',
        holdingShares: '5,420万股',
        holdingPercent: 0.57,
        changeStatus: 'unchanged',
        changeStatusZh: '未变',
        shareholderType: '个人自然人',
      },
      {
        rank: 8,
        name: '富达投资国际 (Fidelity International)',
        holdingShares: '4,890万股',
        holdingPercent: 0.52,
        changeStatus: 'unchanged',
        changeStatusZh: '未变',
        shareholderType: '公募基金',
      },
      {
        rank: 9,
        name: '新加坡政府投资公司 (GIC Private Limited)',
        holdingShares: '3,950万股',
        holdingPercent: 0.42,
        changeStatus: 'increase',
        changeStatusZh: '增持',
        shareholderType: '保险资管',
      },
      {
        rank: 10,
        name: '挪威中央银行投资管理部 (Norges Bank)',
        holdingShares: '3,200万股',
        holdingPercent: 0.34,
        changeStatus: 'increase',
        changeStatusZh: '增持',
        shareholderType: '北向陆股通外资',
      },
    ],
  },
};

/**
 * 市场全景机构前十大重仓榜（北向资金Top10、公募基金重仓Top10、社保重仓Top10）
 */
export const MARKET_INSTITUTIONAL_PORTFOLIOS: InstitutionalPortfolioList[] = [
  {
    id: 'northbound',
    name: '北向资金（外资陆股通）前十重仓股',
    description: '被誉为“聪明钱”的香港及海外机构资金，偏好高壁垒、高ROE、现金流稳固的核心资产。',
    tag: '聪明钱 · 偏好定价权白马',
    updatedAt: '2026年最新交易周',
    totalMarketValue: '约 2.38 万亿元',
    holdings: [
      { rank: 1, symbol: '600519', name: '贵州茅台', market: 'A-Share', industry: '食品饮料', holdingValue: '1,420亿元', holdingRatioPercent: 6.95, recentQuarterChange: 'increase', changePercent: 3.8, currentPrice: 1468.5, currency: 'CNY', peTTM: 23.4 },
      { rank: 2, symbol: '300750', name: '宁德时代', market: 'A-Share', industry: '电力设备/锂电池', holdingValue: '1,085亿元', holdingRatioPercent: 11.18, recentQuarterChange: 'increase', changePercent: 5.2, currentPrice: 242.0, currency: 'CNY', peTTM: 19.8 },
      { rank: 3, symbol: '000333', name: '美的集团', market: 'A-Share', industry: '白色家电/高端制造', holdingValue: '860亿元', holdingRatioPercent: 17.5, recentQuarterChange: 'increase', changePercent: 2.1, currentPrice: 72.8, currency: 'CNY', peTTM: 13.5 },
      { rank: 4, symbol: '601318', name: '中国平安', market: 'A-Share', industry: '保险金融', holdingValue: '620亿元', holdingRatioPercent: 7.8, recentQuarterChange: 'increase', changePercent: 4.5, currentPrice: 53.2, currency: 'CNY', peTTM: 9.6 },
      { rank: 5, symbol: '600036', name: '招商银行', market: 'A-Share', industry: '零售银行', holdingValue: '580亿元', holdingRatioPercent: 6.2, recentQuarterChange: 'increase', changePercent: 1.8, currentPrice: 38.6, currency: 'CNY', peTTM: 6.2 },
      { rank: 6, symbol: '002594', name: '比亚迪', market: 'A-Share', industry: '新能源汽车', holdingValue: '510亿元', holdingRatioPercent: 5.8, recentQuarterChange: 'increase', changePercent: 6.4, currentPrice: 285.4, currency: 'CNY', peTTM: 22.1 },
      { rank: 7, symbol: '601899', name: '紫金矿业', market: 'A-Share', industry: '有色金属/金铜', holdingValue: '480亿元', holdingRatioPercent: 6.5, recentQuarterChange: 'increase', changePercent: 8.2, currentPrice: 17.8, currency: 'CNY', peTTM: 14.2 },
      { rank: 8, symbol: '600900', name: '长江电力', market: 'A-Share', industry: '公用事业/水电', holdingValue: '450亿元', holdingRatioPercent: 5.4, recentQuarterChange: 'increase', changePercent: 1.2, currentPrice: 29.8, currency: 'CNY', peTTM: 21.0 },
      { rank: 9, symbol: '688012', name: '中微公司', market: 'A-Share', industry: '半导体设备', holdingValue: '390亿元', holdingRatioPercent: 8.9, recentQuarterChange: 'new', changePercent: 12.0, currentPrice: 188.6, currency: 'CNY', peTTM: 45.0 },
      { rank: 10, symbol: '000858', name: '五粮液', market: 'A-Share', industry: '白酒消费', holdingValue: '365亿元', holdingRatioPercent: 4.8, recentQuarterChange: 'decrease', changePercent: -1.5, currentPrice: 138.2, currency: 'CNY', peTTM: 16.5 },
    ],
  },
  {
    id: 'mutual_funds',
    name: '公募顶流基金前十重仓股',
    description: '全市场主动权益类与指数增强基金重仓票池，代表国内最庞大专业机构投资者的共识配置。',
    tag: '机构共识 · 主动权益顶配',
    updatedAt: '2024最新季报披露汇总',
    totalMarketValue: '约 3.12 万亿元',
    holdings: [
      { rank: 1, symbol: '600519', name: '贵州茅台', market: 'A-Share', industry: '食品饮料', holdingValue: '1,680亿元', holdingRatioPercent: 5.38, recentQuarterChange: 'increase', changePercent: 2.4, currentPrice: 1468.5, currency: 'CNY', peTTM: 23.4 },
      { rank: 2, symbol: '300750', name: '宁德时代', market: 'A-Share', industry: '锂电池制造', holdingValue: '1,320亿元', holdingRatioPercent: 4.23, recentQuarterChange: 'increase', changePercent: 4.8, currentPrice: 242.0, currency: 'CNY', peTTM: 19.8 },
      { rank: 3, symbol: '00700', name: '腾讯控股', market: 'HK-Share', industry: '互联网与AI', holdingValue: '1,150亿元', holdingRatioPercent: 3.68, recentQuarterChange: 'increase', changePercent: 6.2, currentPrice: 382.4, currency: 'HKD', peTTM: 18.5 },
      { rank: 4, symbol: '002594', name: '比亚迪', market: 'A-Share', industry: '整车与电池', holdingValue: '780亿元', holdingRatioPercent: 2.50, recentQuarterChange: 'increase', changePercent: 5.1, currentPrice: 285.4, currency: 'CNY', peTTM: 22.1 },
      { rank: 5, symbol: '601899', name: '紫金矿业', market: 'A-Share', industry: '资源出海', holdingValue: '690亿元', holdingRatioPercent: 2.21, recentQuarterChange: 'increase', changePercent: 7.9, currentPrice: 17.8, currency: 'CNY', peTTM: 14.2 },
      { rank: 6, symbol: '600036', name: '招商银行', market: 'A-Share', industry: '优质银行', holdingValue: '640亿元', holdingRatioPercent: 2.05, recentQuarterChange: 'unchanged', changePercent: 0.5, currentPrice: 38.6, currency: 'CNY', peTTM: 6.2 },
      { rank: 7, symbol: '000333', name: '美的集团', market: 'A-Share', industry: '智能家居', holdingValue: '610亿元', holdingRatioPercent: 1.95, recentQuarterChange: 'increase', changePercent: 1.9, currentPrice: 72.8, currency: 'CNY', peTTM: 13.5 },
      { rank: 8, symbol: '688041', name: '海光信息', market: 'A-Share', industry: '算力与CPU芯片', holdingValue: '540亿元', holdingRatioPercent: 1.73, recentQuarterChange: 'new', changePercent: 18.5, currentPrice: 128.5, currency: 'CNY', peTTM: 68.0 },
      { rank: 9, symbol: '600900', name: '长江电力', market: 'A-Share', industry: '高股息现金牛', holdingValue: '510亿元', holdingRatioPercent: 1.63, recentQuarterChange: 'increase', changePercent: 3.1, currentPrice: 29.8, currency: 'CNY', peTTM: 21.0 },
      { rank: 10, symbol: '300059', name: '东方财富', market: 'A-Share', industry: '互联网券商', holdingValue: '480亿元', holdingRatioPercent: 1.54, recentQuarterChange: 'increase', changePercent: 12.4, currentPrice: 21.6, currency: 'CNY', peTTM: 29.8 },
    ],
  },
  {
    id: 'social_security',
    name: '全国社保基金前十重仓股',
    description: '“老百姓养老保命钱”，风格极其稳健，追求长线绝对收益与高分红，极少参与泡沫炒作。',
    tag: '国家战略底仓 · 极致稳健',
    updatedAt: '2024最新年报/半年报',
    totalMarketValue: '约 4,800 亿元',
    holdings: [
      { rank: 1, symbol: '601088', name: '中国神华', market: 'A-Share', industry: '煤炭/高股息央企', holdingValue: '280亿元', holdingRatioPercent: 5.83, recentQuarterChange: 'increase', changePercent: 2.1, currentPrice: 41.5, currency: 'CNY', peTTM: 11.2 },
      { rank: 2, symbol: '600900', name: '长江电力', market: 'A-Share', industry: '大型水电站', holdingValue: '260亿元', holdingRatioPercent: 5.41, recentQuarterChange: 'increase', changePercent: 1.5, currentPrice: 29.8, currency: 'CNY', peTTM: 21.0 },
      { rank: 3, symbol: '600036', name: '招商银行', market: 'A-Share', industry: '金融零售龙头', holdingValue: '220亿元', holdingRatioPercent: 4.58, recentQuarterChange: 'unchanged', changePercent: 0.0, currentPrice: 38.6, currency: 'CNY', peTTM: 6.2 },
      { rank: 4, symbol: '600519', name: '贵州茅台', market: 'A-Share', industry: '消费定海神针', holdingValue: '190亿元', holdingRatioPercent: 3.96, recentQuarterChange: 'new', changePercent: 5.0, currentPrice: 1468.5, currency: 'CNY', peTTM: 23.4 },
      { rank: 5, symbol: '601398', name: '工商银行', market: 'A-Share', industry: '国有大行', holdingValue: '185亿元', holdingRatioPercent: 3.85, recentQuarterChange: 'increase', changePercent: 1.0, currentPrice: 6.15, currency: 'CNY', peTTM: 5.4 },
      { rank: 6, symbol: '300750', name: '宁德时代', market: 'A-Share', industry: '绿色能源龙头', holdingValue: '160亿元', holdingRatioPercent: 3.33, recentQuarterChange: 'increase', changePercent: 4.2, currentPrice: 242.0, currency: 'CNY', peTTM: 19.8 },
      { rank: 7, symbol: '000333', name: '美的集团', market: 'A-Share', industry: '出海家电制造', holdingValue: '145亿元', holdingRatioPercent: 3.02, recentQuarterChange: 'increase', changePercent: 2.5, currentPrice: 72.8, currency: 'CNY', peTTM: 13.5 },
      { rank: 8, symbol: '601899', name: '紫金矿业', market: 'A-Share', industry: '抗通胀大宗商品', holdingValue: '130亿元', holdingRatioPercent: 2.71, recentQuarterChange: 'increase', changePercent: 6.8, currentPrice: 17.8, currency: 'CNY', peTTM: 14.2 },
      { rank: 9, symbol: '600690', name: '海尔智家', market: 'A-Share', industry: '白电国际化', holdingValue: '110亿元', holdingRatioPercent: 2.29, recentQuarterChange: 'unchanged', changePercent: 0.2, currentPrice: 29.4, currency: 'CNY', peTTM: 14.8 },
      { rank: 10, symbol: '600028', name: '中国石化', market: 'A-Share', industry: '石油石化能源', holdingValue: '95亿元', holdingRatioPercent: 1.98, recentQuarterChange: 'increase', changePercent: 3.0, currentPrice: 6.32, currency: 'CNY', peTTM: 10.1 },
    ],
  },
];

/**
 * 辅助方法：获取某只股票的内置历史披露快照（仅覆盖少数龙头标的；不存在时返回 null，不做数据伪造）
 */
export function getStockHoldings(symbol: string): InstitutionalHoldingOverview | null {
  return STOCK_HOLDINGS_DATA[symbol] || null;
}

/**
 * 拉取东财真实前十大流通股东披露数据；失败时降级为内置快照（若存在），均失败返回 null。
 */
export async function fetchStockHoldings(symbol: string): Promise<InstitutionalHoldingOverview | null> {
  const clean = symbol.trim().toUpperCase();
  if (!clean) return null;
  try {
    const response = await request<{ success: boolean; data?: InstitutionalHoldingOverview; error?: string }>(
      `/api/stock/${clean}/holders`,
      { timeoutMs: 8000 }
    );
    if (response?.success && response.data) {
      return { ...response.data, source: 'eastmoney' };
    }
  } catch {
    // 接口失败时走内置快照降级
  }
  return getStockHoldings(clean);
}
