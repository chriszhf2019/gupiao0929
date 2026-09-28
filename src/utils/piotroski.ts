import { StockData } from '../types/stock';

export interface PiotroskiItem {
  group: string;
  criterion: string;
  pass: boolean;
}

export interface PiotroskiResult {
  dataQuality: 'real' | 'insufficient';
  note?: string;
  score: number;
  maxScore: number; // 8（未含"未发行新股"一项，需要股本数据，诚实标注）
  rating: '优质' | '良好' | '中性' | '弱势';
  ratingZh: string;
  items: PiotroskiItem[];
}

/**
 * Piotroski F-Score（皮氏财务质量评分，0-9，此处实现 8 项）
 * 用于识别"便宜且财务基本面正在改善"的标的（与 Beneish 排雷、Altman 破产互补）。
 * 参考 Piotroski (2000) "Value Investing: The Use of Historical Financial Statement Information"。
 *
 * 9 项标准中的第 9 项「未发行新股」需要股本/股份数变动数据，当前数据源未覆盖，故只计 8 项并诚实标注。
 */
export function calculatePiotroski(stock: StockData): PiotroskiResult {
  const history = stock.financialHistory;
  if (!history || history.length < 2) {
    return {
      dataQuality: 'insufficient',
      note: '缺少至少两个年度的财报数据，无法计算 Piotroski F-Score。',
      score: 0,
      maxScore: 8,
      rating: '中性',
      ratingZh: '数据不足',
      items: [],
    };
  }

  const cur = history[history.length - 1];
  const prev = history[history.length - 2];
  const hasBalance =
    cur.totalAssets !== undefined && cur.totalAssets > 0 &&
    prev.totalAssets !== undefined && prev.totalAssets > 0 &&
    cur.currentAssets !== undefined && cur.currentLiabilities !== undefined &&
    prev.currentAssets !== undefined && prev.currentLiabilities !== undefined;
  if (!hasBalance) {
    return {
      dataQuality: 'insufficient',
      note: '缺少资产负债表科目（总资产/流动资产/流动负债）真实数据，无法计算 Piotroski F-Score。',
      score: 0,
      maxScore: 8,
      rating: '中性',
      ratingZh: '数据不足',
      items: [],
    };
  }

  const roa = (y: typeof cur): number => (y.totalAssets! > 0 ? y.netProfit / y.totalAssets! : 0);
  const leverage = (y: typeof cur): number =>
    y.totalAssets! > 0 ? (y.totalLiabilities ?? 0) / y.totalAssets! : 0;
  const currentRatio = (y: typeof cur): number =>
    (y.currentLiabilities ?? 0) > 0 ? y.currentAssets! / y.currentLiabilities! : 0;
  const assetTurnover = (y: typeof cur): number => (y.totalAssets! > 0 ? y.revenue / y.totalAssets! : 0);

  const curRoa = roa(cur);
  const prevRoa = roa(prev);

  const items: PiotroskiItem[] = [
    { group: '盈利能力', criterion: 'ROA > 0（总资产回报为正）', pass: curRoa > 0 },
    { group: '盈利能力', criterion: '经营现金流 > 0', pass: cur.freeCashFlow > 0 },
    { group: '盈利能力', criterion: 'ROA 同比提升', pass: curRoa > prevRoa },
    { group: '盈利质量', criterion: '经营现金流 > 净利润（利润含金量高）', pass: cur.freeCashFlow > cur.netProfit },
    { group: '财务杠杆', criterion: '资产负债率同比下降', pass: leverage(cur) < leverage(prev) },
    { group: '流动性', criterion: '流动比率同比提升', pass: currentRatio(cur) > currentRatio(prev) },
    { group: '运营效率', criterion: '毛利率同比提升', pass: cur.grossMargin > prev.grossMargin },
    { group: '运营效率', criterion: '资产周转率同比提升', pass: assetTurnover(cur) > assetTurnover(prev) },
  ];

  const score = items.filter((i) => i.pass).length;
  let rating: PiotroskiResult['rating'] = '弱势';
  if (score >= 7) rating = '优质';
  else if (score >= 5) rating = '良好';
  else if (score >= 3) rating = '中性';

  const ratingZh =
    rating === '优质' ? '优质（基本面全面改善）'
      : rating === '良好' ? '良好（基本面稳健向好）'
      : rating === '中性' ? '中性（喜忧参半）'
      : '弱势（基本面转差）';

  return {
    dataQuality: 'real',
    note: '基于真实财报的 Piotroski F-Score（8/9 项，未含"未发行新股"一项，因数据源缺股本数据）',
    score,
    maxScore: 8,
    rating,
    ratingZh,
    items,
  };
}
