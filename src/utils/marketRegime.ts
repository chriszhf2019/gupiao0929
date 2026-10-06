import { isStrategyStyle, StrategyStyle } from './strategyPipeline';

export interface RegimeIndex {
  code: string;
  name: string;
  price: number;
  changePercent: number;
}

export interface RegimeBreadth {
  up: number;
  down: number;
  flat: number;
  total: number;
}

export interface RegimeBar {
  date: string;
  price: number;
}

export type MarketTone = 'risk_on' | 'risk_off' | 'divergence' | 'range' | 'unknown';
export type MarketTrend = 'up' | 'down' | 'sideways' | 'unknown';

export interface MarketRegime {
  tone: MarketTone;
  toneZh: string;
  todaySummary: string;
  trend: MarketTrend;
  trendZh: string;
  trendDetail: string;
  preferredStyles: StrategyStyle[];
  deferredStyles: StrategyStyle[];
  reasons: string[];
}

export const STRATEGY_PLAYBOOK: { style: StrategyStyle; prompt: string; fit: string }[] = [
  {
    style: '高股息红利',
    prompt: '寻找股息率大于 3%、市盈率处于历史偏低分位、负债可控的红利资产。',
    fit: '指数走弱或上涨家数偏少时优先',
  },
  {
    style: '价值白马',
    prompt: '寻找毛利率高于 30%、ROE 高于 15%、市盈率处于历史中低分位的核心资产。',
    fit: '多数行情里作为底仓',
  },
  {
    style: '高景气成长',
    prompt: '寻找营收增速高于 20%、ROE 高于 12% 的高景气成长股。',
    fit: '指数趋势向上且上涨家数不弱时使用',
  },
  {
    style: '出海破局',
    prompt: '寻找新能源、汽车、半导体、制造链条里 ROE 高于 12% 的出海公司。',
    fit: '指数趋势向上且上涨家数不弱时使用',
  },
  {
    style: '困境反转',
    prompt: '寻找市盈率历史分位低于 20%、ROE 仍为正但不到 15% 的低估修复标的。',
    fit: '指数横盘时作观察',
  },
  {
    style: '小盘隐形冠军',
    prompt: '寻找市值 80 亿到 800 亿、ROE 高于 12%、市盈率不超过 40 倍的小盘公司。',
    fit: '只在上涨家数足够多时观察',
  },
];

const ALL_STYLES = STRATEGY_PLAYBOOK.map((item) => item.style);

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function signed(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function trendFromBars(bars: RegimeBar[]): {
  trend: MarketTrend;
  change20: number | null;
  change60: number | null;
  aboveMa60: boolean | null;
} {
  if (!bars || bars.length < 60) {
    return { trend: 'unknown', change20: null, change60: null, aboveMa60: null };
  }
  const last = bars[bars.length - 1].price;
  const prev20 = bars[bars.length - 21]?.price;
  const prev60 = bars[bars.length - 61]?.price ?? bars[bars.length - 60].price;
  if (!(last > 0) || !(prev60 > 0)) {
    return { trend: 'unknown', change20: null, change60: null, aboveMa60: null };
  }
  const window = bars.slice(-60);
  const ma60 = window.reduce((sum, bar) => sum + bar.price, 0) / window.length;
  const change60 = ((last - prev60) / prev60) * 100;
  const change20 = prev20 > 0 ? ((last - prev20) / prev20) * 100 : null;
  const aboveMa60 = last >= ma60;
  let trend: MarketTrend = 'sideways';
  if (change60 >= 3 && aboveMa60) trend = 'up';
  else if (change60 <= -3 && !aboveMa60) trend = 'down';
  return { trend, change20: change20 == null ? null : round1(change20), change60: round1(change60), aboveMa60 };
}

function preferredFor(tone: MarketTone): StrategyStyle[] {
  if (tone === 'risk_on') return ['高景气成长', '出海破局', '价值白马'];
  if (tone === 'divergence') return ['价值白马', '高股息红利'];
  if (tone === 'risk_off') return ['高股息红利', '价值白马'];
  if (tone === 'range') return ['价值白马', '高股息红利', '困境反转'];
  return ['价值白马'];
}

const TONE_ZH: Record<MarketTone, string> = {
  risk_on: '风险偏好偏高',
  risk_off: '风险偏好偏低',
  divergence: '指数与个股分化',
  range: '区间震荡',
  unknown: '数据不足',
};

const TREND_ZH: Record<MarketTrend, string> = {
  up: '上升',
  down: '下降',
  sideways: '震荡',
  unknown: '暂无法判断',
};

export function splitTrackedByRegime(strategyNames: string[], preferred: StrategyStyle[]) {
  const known = strategyNames.filter(isStrategyStyle);
  return {
    still: known.filter((name) => preferred.includes(name)),
    dropped: known.filter((name) => !preferred.includes(name)),
  };
}

export function assessMarketRegime(input: {
  indices: RegimeIndex[];
  breadth?: RegimeBreadth | null;
  shanghaiBars?: RegimeBar[];
  leaders?: { name: string }[];
}): MarketRegime {
  const shanghai = input.indices.find((item) => item.name.includes('上证'));
  const indexLines = ['上证指数', '深证成指', '创业板指', '沪深300', '恒生指数']
    .map((name) => input.indices.find((item) => item.name === name))
    .filter((item): item is RegimeIndex => Boolean(item))
    .map((item) => `${item.name} ${signed(item.changePercent)}`);
  const breadth = input.breadth && input.breadth.total > 0 ? input.breadth : null;
  const upRatio = breadth ? breadth.up / breadth.total : null;
  const breadthText = breadth
    ? `上涨 ${breadth.up} 家，下跌 ${breadth.down} 家，上涨占比 ${Math.round(upRatio! * 100)}%。`
    : '涨跌家数还没取到。';
  const leaderText = (input.leaders || []).slice(0, 3).map((item) => item.name).filter(Boolean);
  const todaySummary = [
    indexLines.length ? `今日主要指数：${indexLines.join('，')}。` : '指数行情还没取到。',
    breadthText,
    leaderText.length ? `领涨板块：${leaderText.join('、')}。` : '',
  ].filter(Boolean).join('');

  const trendStat = trendFromBars(input.shanghaiBars || []);
  const trendDetail = trendStat.trend === 'unknown'
    ? '上证指数日 K 不足 60 根，趋势先不判断。'
    : `上证指数近 60 个交易日 ${signed(trendStat.change60 || 0)}，近 20 个交易日 ${signed(trendStat.change20 || 0)}，收盘在 60 日均线${trendStat.aboveMa60 ? '之上' : '之下'}。`;

  let tone: MarketTone = 'unknown';
  if (trendStat.trend === 'up' && (upRatio == null || upRatio >= 0.5)) tone = 'risk_on';
  else if (trendStat.trend === 'up' && upRatio != null && upRatio < 0.45) tone = 'divergence';
  else if (trendStat.trend === 'down') tone = 'risk_off';
  else if (trendStat.trend === 'sideways') tone = upRatio != null && upRatio < 0.4 ? 'risk_off' : 'range';
  else if (shanghai || breadth) {
    const indexDown = shanghai != null && shanghai.changePercent < -0.3;
    const indexUp = shanghai != null && shanghai.changePercent > 0.3;
    if (indexDown || (upRatio != null && upRatio < 0.4)) tone = 'risk_off';
    else if (indexUp && upRatio != null && upRatio >= 0.55) tone = 'risk_on';
    else tone = 'range';
  }

  const preferredStyles = preferredFor(tone);
  const deferredStyles = ALL_STYLES.filter((style) => !preferredStyles.includes(style));
  const reasons = [
    trendDetail,
    breadthText,
    tone === 'risk_on'
      ? '指数趋势向上且上涨家数不弱，主策略用高景气成长和出海，价值白马留作底仓。'
      : tone === 'divergence'
        ? '指数还在上升，但上涨家数偏少。主策略守价值白马和高股息，成长先不作为主策略。'
        : tone === 'risk_off'
          ? '指数趋势偏弱或跌多涨少。主策略用高股息和价值白马，成长与小盘先放一放。'
          : tone === 'range'
            ? '上证没有形成单边趋势。主策略用价值白马和高股息，困境反转只作观察。'
            : '指数和涨跌家数都还没取到，先只保留价值白马观察名单。',
  ];

  return {
    tone,
    toneZh: TONE_ZH[tone],
    todaySummary,
    trend: trendStat.trend,
    trendZh: TREND_ZH[trendStat.trend],
    trendDetail,
    preferredStyles,
    deferredStyles,
    reasons,
  };
}
