import { TrackedStockItem, TrackStatus, TrackingLogNote, TrackingEvent, StockData } from '../types/stock';
import { PRESET_STOCKS } from './presetStocks';

const STORAGE_KEY = 'zane_invest_tracked_stocks_v1';

export const STATUS_MAP: Record<TrackStatus, { label: string; color: string; bg: string; border: string }> = {
  observe: {
    label: '观望研判中',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  waiting_pullback: {
    label: '等待回踩支撑',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  initial_position: {
    label: '已建底仓跟踪',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  breakout_watch: {
    label: '突破加仓监控',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
  high_alert: {
    label: '高估警惕预警',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
  },
};

export const DEFAULT_TRACKED_STOCKS: TrackedStockItem[] = [
  {
    symbol: '600519',
    name: '贵州茅台',
    market: 'A-Share',
    currentPrice: 1468.5,
    currency: 'CNY',
    trackStatus: 'initial_position',
    statusLabelZh: '已建底仓跟踪',
    targetBuyPrice: 1450.0,
    targetPullbackBuyPrice: 1380.0,
    targetStopLossPrice: 1280.0,
    targetTakeProfitPrice: 1800.0,
    addedDate: '2026-08-15',
    priority: 'high',
    alertsEnabled: true,
    notes: [
      {
        id: 'n-1',
        timestamp: '2026-09-02 10:30',
        stage: '五步法建仓',
        author: 'Zane投研',
        content: '价格回踩至$1450第一支撑位附近企稳，已执行第一批30%底仓建仓。毛利率91.8%，ROE30.2%，基本面无懈可击，等待中秋国庆旺季批价验证。',
        sentiment: 'bullish',
      },
      {
        id: 'n-2',
        timestamp: '2026-08-20 15:45',
        stage: '估值排雷',
        author: 'Zane投研',
        content: 'PE(TTM)降至23倍，位于历史近5年14.5%低位，股息率达到3.4%，具备充沛的下行防御安全垫。',
        sentiment: 'neutral',
      },
    ],
    upcomingEvents: [
      {
        id: 'ev-1',
        date: '2026-10-25',
        title: '三季度财报披露',
        impact: 'high',
        category: 'earnings',
        note: '重点观察直销渠道收入增速与经营性净现金流走势',
      },
      {
        id: 'ev-2',
        date: '2026-11-15',
        title: '海外经销商大会与提价预期研判',
        impact: 'medium',
        category: 'catalyst',
        note: '评估国际市场渗透率与新文创酒放量节奏',
      },
    ],
  },
  {
    symbol: '300750',
    name: '宁德时代',
    market: 'A-Share',
    currentPrice: 258.4,
    currency: 'CNY',
    trackStatus: 'waiting_pullback',
    statusLabelZh: '等待回踩支撑',
    targetBuyPrice: 245.0,
    targetPullbackBuyPrice: 230.0,
    targetStopLossPrice: 218.0,
    targetTakeProfitPrice: 320.0,
    addedDate: '2026-08-28',
    priority: 'high',
    alertsEnabled: true,
    notes: [
      {
        id: 'n-3',
        timestamp: '2026-09-08 14:15',
        stage: '技术买点观察',
        author: 'Zane投研',
        content: '现价在MA20均线上方蓄势，短期MACD金叉，但在$270附近面临第一阻力，耐心等待回踩$245~$250强支撑区域再介入第一批。',
        sentiment: 'neutral',
      },
    ],
    upcomingEvents: [
      {
        id: 'ev-3',
        date: '2026-10-18',
        title: '欧洲匈牙利电池超级工厂一期投产仪式',
        impact: 'high',
        category: 'product',
        note: '标志着海外本地化供货能力实质性飞跃，规避碳足迹关税壁垒',
      },
    ],
  },
  {
    symbol: '00700',
    name: '腾讯控股',
    market: 'HK-Share',
    currentPrice: 383.0,
    currency: 'HKD',
    trackStatus: 'breakout_watch',
    statusLabelZh: '突破加仓监控',
    targetBuyPrice: 380.0,
    targetPullbackBuyPrice: 360.0,
    targetStopLossPrice: 340.0,
    targetTakeProfitPrice: 460.0,
    addedDate: '2026-08-10',
    priority: 'high',
    alertsEnabled: true,
    notes: [
      {
        id: 'n-4',
        timestamp: '2026-09-10 11:20',
        stage: '资金与回购追踪',
        author: 'Zane投研',
        content: '公司连续每日斥资10亿港元回购注销，若有效放量突破$390颈线阻力位，将触发第三批突破顺势加仓指令。',
        sentiment: 'bullish',
      },
    ],
    upcomingEvents: [
      {
        id: 'ev-4',
        date: '2026-11-12',
        title: 'Q3 业绩发布会 & 混元AI战略迭代',
        impact: 'high',
        category: 'earnings',
        note: '重点观察视频号广告商业化增速及大模型落地收益',
      },
    ],
  },
  {
    symbol: 'NVDA',
    name: '英伟达',
    market: 'US-Share',
    currentPrice: 123.8,
    currency: 'USD',
    trackStatus: 'observe',
    statusLabelZh: '观望研判中',
    targetBuyPrice: 115.0,
    targetPullbackBuyPrice: 105.0,
    targetStopLossPrice: 96.0,
    targetTakeProfitPrice: 165.0,
    addedDate: '2026-09-01',
    priority: 'medium',
    alertsEnabled: false,
    notes: [
      {
        id: 'n-5',
        timestamp: '2026-09-05 09:30',
        stage: '景气度周期推演',
        author: 'Zane投研',
        content: 'Blackwell量产爬坡顺利，但短期需密切追踪微软、亚马逊等超大规模云厂商的资本支出指引，静待波动回调至$115下方。',
        sentiment: 'neutral',
      },
    ],
    upcomingEvents: [
      {
        id: 'ev-5',
        date: '2026-11-20',
        title: '新季度财务报告及Blackwell交付指引',
        impact: 'high',
        category: 'earnings',
        note: '全球AI算力产业链风向标事件',
      },
    ],
  },
];

export function loadTrackedStocks(): TrackedStockItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse tracked stocks from localStorage:', e);
  }
  return DEFAULT_TRACKED_STOCKS;
}

export function saveTrackedStocks(items: TrackedStockItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed to save tracked stocks to localStorage:', e);
  }
}

export function createTrackedStockFromStockData(
  stock: StockData,
  status: TrackStatus = 'observe'
): TrackedStockItem {
  const p = stock.technical?.positionStrategy;
  const targetBuy = p?.firstBatch?.targetPrice || stock.technical?.supportLevel1 || Math.round(stock.currentPrice * 0.95);
  const targetPullback = p?.secondBatch?.targetPrice || stock.technical?.supportLevel2 || Math.round(stock.currentPrice * 0.90);
  const targetStop = p?.stopLossPrice || Math.round(stock.currentPrice * 0.88);
  const targetTake = p?.takeProfitPrice || Math.round(stock.currentPrice * 1.25);

  return {
    symbol: stock.symbol,
    name: stock.name,
    market: stock.market,
    currentPrice: stock.currentPrice,
    currency: stock.currency,
    trackStatus: status,
    statusLabelZh: STATUS_MAP[status].label,
    targetBuyPrice: targetBuy,
    targetPullbackBuyPrice: targetPullback,
    targetStopLossPrice: targetStop,
    targetTakeProfitPrice: targetTake,
    addedDate: new Date().toISOString().split('T')[0],
    priority: 'high',
    alertsEnabled: true,
    notes: [
      {
        id: `n-${Date.now()}`,
        timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
        stage: '初始跟踪建档',
        author: 'Zane投研',
        content: `通过五步法深度研判将【${stock.name} (${stock.symbol})】载入重点跟踪池。当前价格 $${stock.currentPrice}，五步综合评定目标买点 $${targetBuy}，防守止损线 $${targetStop}。`,
        sentiment: 'bullish',
      },
    ],
    upcomingEvents: [
      {
        id: `ev-${Date.now()}`,
        date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        title: '定期经营与行业跟踪节点',
        impact: 'medium',
        category: 'catalyst',
        note: `定期跟踪${stock.sector}行业催化与公司核心经营数据`,
      },
    ],
  };
}
