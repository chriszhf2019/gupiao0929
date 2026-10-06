const EASTMONEY_PUSH_API = "https://push2.eastmoney.com/api/qt/ulist.np/get";
const EASTMONEY_DIST_API = "https://push2ex.eastmoney.com/getTopicZDFenBu";
const EASTMONEY_BOARD_API = "https://push2.eastmoney.com/api/qt/clist/get";

interface MarketIndexQuote {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface MarketBreadth {
  up: number;
  down: number;
  flat: number;
  total: number;
}

interface BoardQuote {
  code: string;
  name: string;
  changePercent: number;
  netInflow?: number;
}

export interface ScreenerItem {
  code: string;
  name: string;
  market: 'SH' | 'SZ' | 'BJ';
  industry: string;
  price: number;
  changePercent: number;
  pe: number;          // 动态市盈率，负数或无数据记为 0
  pb: number;          // 市净率
  roe: number;         // 加权净资产收益率 %
  marketCapYi: number; // 总市值（亿元）
  turnoverRate: number; // 换手率 %
  amountYi: number;    // 成交额（亿元）
  isSt?: boolean;      // ST/*ST/退市风险（由股票名称推断）
}

// 由股票名称推断 ST/*ST/退市标记（A 股 ST 股名称以 ST/*ST 开头，退市股名称含"退"）
function isStName(name: string): boolean {
  const n = (name || '').trim().toUpperCase();
  return n.startsWith('ST') || n.startsWith('*ST') || n.includes('退');
}

export async function fetchMarketIndexQuotes(): Promise<MarketIndexQuote[]> {
  const secids = ["1.000001", "0.399001", "0.399006", "1.000300", "100.HSI"];
  const url = `${EASTMONEY_PUSH_API}?secids=${secids.join(",")}&fields=f2,f3,f4,f12,f14&fltt=2&invt=2`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    });
    if (!response.ok) return [];
    const json = await response.json();
    const diff: any[] = json?.data?.diff || [];
    return diff.map((d) => ({
      code: String(d.f12 || ""),
      name: String(d.f14 || ""),
      price: Number(d.f2) || 0,
      change: Number(d.f4) || 0,
      changePercent: Number(d.f3) || 0,
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchMarketBreadth(): Promise<MarketBreadth | null> {
  const url = `${EASTMONEY_DIST_API}?ut=7eea3edcaed734bea9cbfc24409ed989&dpt=wz.ztzt`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    });
    if (!response.ok) return null;
    const json = await response.json();
    const fenbu: Record<string, number>[] = json?.data?.fenbu || [];
    let up = 0;
    let down = 0;
    let flat = 0;
    for (const item of fenbu) {
      for (const [key, value] of Object.entries(item)) {
        const n = Number(value) || 0;
        if (key === '0') flat += n;
        else if (Number(key) > 0) up += n;
        else down += n;
      }
    }
    if (up + down + flat === 0) return null;
    return { up, down, flat, total: up + down + flat };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchBoardLeaders(): Promise<BoardQuote[]> {
  const url = `${EASTMONEY_BOARD_API}?pn=1&pz=8&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:90+t:2+f:!50&fields=f2,f3,f12,f14`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    });
    if (!response.ok) return [];
    const json = await response.json();
    const diff: any[] = json?.data?.diff || [];
    return diff.map((d) => ({
      code: String(d.f12 || ""),
      name: String(d.f14 || ""),
      changePercent: Number(d.f3) || 0,
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchBoardFundFlow(): Promise<BoardQuote[]> {
  const url = `${EASTMONEY_BOARD_API}?pn=1&pz=8&po=1&np=1&fltt=2&invt=2&fid=f62&fs=m:90+t:2+f:!50&fields=f2,f3,f12,f14,f62`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    });
    if (!response.ok) return [];
    const json = await response.json();
    const diff: any[] = json?.data?.diff || [];
    return diff.map((d) => ({
      code: String(d.f12 || ""),
      name: String(d.f14 || ""),
      changePercent: Number(d.f3) || 0,
      netInflow: Number(d.f62) || 0,
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function toYi(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.round(value / 1e8) : 0;
}

// 东方财富 clist 临时限流时的备用股票池（腾讯批量行情，字段与名称均为真实数据）。
const TENCENT_SCREENER_FALLBACK: { code: string; market: 'SH' | 'SZ'; name: string; industry: string }[] = [
  { code: '600519', market: 'SH', name: '贵州茅台', industry: '白酒' },
  { code: '601318', market: 'SH', name: '中国平安', industry: '保险' },
  { code: '600036', market: 'SH', name: '招商银行', industry: '银行' },
  { code: '601398', market: 'SH', name: '工商银行', industry: '银行' },
  { code: '601939', market: 'SH', name: '建设银行', industry: '银行' },
  { code: '601288', market: 'SH', name: '农业银行', industry: '银行' },
  { code: '601988', market: 'SH', name: '中国银行', industry: '银行' },
  { code: '601166', market: 'SH', name: '兴业银行', industry: '银行' },
  { code: '600900', market: 'SH', name: '长江电力', industry: '电力' },
  { code: '601088', market: 'SH', name: '中国神华', industry: '煤炭' },
  { code: '600028', market: 'SH', name: '中国石化', industry: '石油石化' },
  { code: '601857', market: 'SH', name: '中国石油', industry: '石油石化' },
  { code: '601899', market: 'SH', name: '紫金矿业', industry: '有色金属' },
  { code: '600030', market: 'SH', name: '中信证券', industry: '证券' },
  { code: '600276', market: 'SH', name: '恒瑞医药', industry: '医药' },
  { code: '600887', market: 'SH', name: '伊利股份', industry: '食品饮料' },
  { code: '601888', market: 'SH', name: '中国中免', industry: '旅游零售' },
  { code: '600809', market: 'SH', name: '山西汾酒', industry: '白酒' },
  { code: '600309', market: 'SH', name: '万华化学', industry: '化工' },
  { code: '600585', market: 'SH', name: '海螺水泥', industry: '建材' },
  { code: '600690', market: 'SH', name: '海尔智家', industry: '家电' },
  { code: '600031', market: 'SH', name: '三一重工', industry: '工程机械' },
  { code: '601012', market: 'SH', name: '隆基绿能', industry: '光伏' },
  { code: '600438', market: 'SH', name: '通威股份', industry: '光伏' },
  { code: '688981', market: 'SH', name: '中芯国际', industry: '半导体' },
  { code: '688041', market: 'SH', name: '海光信息', industry: '半导体' },
  { code: '688256', market: 'SH', name: '寒武纪', industry: '半导体' },
  { code: '688111', market: 'SH', name: '金山办公', industry: '软件服务' },
  { code: '000001', market: 'SZ', name: '平安银行', industry: '银行' },
  { code: '000333', market: 'SZ', name: '美的集团', industry: '家电' },
  { code: '000651', market: 'SZ', name: '格力电器', industry: '家电' },
  { code: '000858', market: 'SZ', name: '五粮液', industry: '白酒' },
  { code: '000568', market: 'SZ', name: '泸州老窖', industry: '白酒' },
  { code: '000002', market: 'SZ', name: '万科A', industry: '房地产' },
  { code: '000063', market: 'SZ', name: '中兴通讯', industry: '通信设备' },
  { code: '000725', market: 'SZ', name: '京东方A', industry: '面板' },
  { code: '000100', market: 'SZ', name: 'TCL科技', industry: '面板' },
  { code: '002594', market: 'SZ', name: '比亚迪', industry: '汽车' },
  { code: '002415', market: 'SZ', name: '海康威视', industry: '安防' },
  { code: '002475', market: 'SZ', name: '立讯精密', industry: '消费电子' },
  { code: '002714', market: 'SZ', name: '牧原股份', industry: '养殖' },
  { code: '002230', market: 'SZ', name: '科大讯飞', industry: '软件服务' },
  { code: '300750', market: 'SZ', name: '宁德时代', industry: '电池' },
  { code: '300059', market: 'SZ', name: '东方财富', industry: '互联网证券' },
  { code: '300760', market: 'SZ', name: '迈瑞医疗', industry: '医疗器械' },
  { code: '300124', market: 'SZ', name: '汇川技术', industry: '工控' },
  { code: '300308', market: 'SZ', name: '中际旭创', industry: '光模块' },
  { code: '300274', market: 'SZ', name: '阳光电源', industry: '光伏' },
  { code: '002304', market: 'SZ', name: '洋河股份', industry: '白酒' },
  { code: '000792', market: 'SZ', name: '盐湖股份', industry: '锂资源' },
  { code: '002460', market: 'SZ', name: '赣锋锂业', industry: '锂资源' },
];

const TENCENT_QUOTE_API = 'https://qt.gtimg.cn/q=';

export async function fetchTencentScreenerFallback(): Promise<ScreenerItem[]> {
  const symbols = TENCENT_SCREENER_FALLBACK.map((s) => `${s.market === 'SH' ? 'sh' : 'sz'}${s.code}`).join(',');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(`${TENCENT_QUOTE_API}${symbols}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://gu.qq.com/' },
    });
    if (!response.ok) return [];
    const buffer = await response.arrayBuffer();
    const text = new TextDecoder('gbk').decode(buffer);

    const quoteMap = new Map<string, string[]>();
    const re = /v_(\w+)="([^"]*)";/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      quoteMap.set(match[1], match[2].split('~'));
    }

    return TENCENT_SCREENER_FALLBACK.map((s): ScreenerItem | null => {
      const key = `${s.market === 'SH' ? 'sh' : 'sz'}${s.code}`;
      const f = quoteMap.get(key);
      if (!f || f.length < 47) return null;
      const price = Number(f[3]) || 0;
      const pe = Number(f[39]);
      return {
        code: s.code,
        name: s.name,
        market: s.market,
        industry: s.industry,
        price,
        changePercent: Number(f[32]) || 0,
        pe: Number.isFinite(pe) && pe > 0 ? pe : 0,
        pb: Number(f[46]) || 0,
        roe: Number(f[65]) || 0,
        marketCapYi: Number(f[45]) || 0,
        turnoverRate: Number(f[38]) || 0,
        amountYi: toYi((Number(f[37]) || 0) * 1e4),
      };
    }).filter((item): item is ScreenerItem => item !== null && item.price > 0);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// 全市场 A 股筛选器：拉取按总市值排序的前 500 只股票，供前端二次筛选与排序。
export async function fetchMarketScreener(): Promise<ScreenerItem[]> {
  const fs = 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23';
  const fields = 'f2,f3,f8,f9,f12,f13,f14,f20,f23,f37,f100,f6';
  const pages = 3; // 每页 100，共 300 只头部标的；串行拉取以降低触发限流的概率

  const rows: any[] = [];
  for (let i = 0; i < pages; i++) {
    const url = `${EASTMONEY_BOARD_API}?pn=${i + 1}&pz=100&po=1&np=1&fltt=2&invt=2&fid=f20&fs=${encodeURIComponent(fs)}&fields=${fields}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      });
      if (!response.ok) continue;
      const json = await response.json();
      const diff: any[] = json?.data?.diff || [];
      rows.push(...diff);
      // 相邻请求之间留出缓冲，避免触发东财接口的突发限流。
      if (i < pages - 1) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    } catch {
      // 单页失败时继续拉取后续页，最终以已获取的数据兜底。
    } finally {
      clearTimeout(timer);
    }
  }

  return rows.map((d) => {
    const code = String(d.f12 || '');
    const f13 = Number(d.f13);
    const market: ScreenerItem['market'] = f13 === 1 ? 'SH' : f13 === 0 ? 'SZ' : 'BJ';
    const peRaw = Number(d.f9);
    const name = String(d.f14 || '');
    return {
      code,
      name,
      market,
      industry: String(d.f100 || '其他'),
      price: Number(d.f2) || 0,
      changePercent: Number(d.f3) || 0,
      pe: Number.isFinite(peRaw) && peRaw > 0 ? peRaw : 0,
      pb: Number(d.f23) || 0,
      roe: Number(d.f37) || 0,
      marketCapYi: toYi(Number(d.f20)),
      turnoverRate: Number(d.f8) || 0,
      amountYi: toYi(Number(d.f6)),
      isSt: isStName(name),
    };
  }).filter((item) => item.code && item.price > 0);
}
