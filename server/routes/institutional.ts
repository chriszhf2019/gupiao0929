import express from "express";

export function register(router: express.Router, limits: { aiRateLimit?: express.RequestHandler; deepDiveRateLimit?: express.RequestHandler } = {}) {
  const aiRateLimit = limits.aiRateLimit!;
  const deepDiveRateLimit = limits.deepDiveRateLimit!;
  // 北向资金（陆股通）重仓榜（东财数据中心真实披露，30 分钟缓存）
  let northboundCache: { at: number; data: any } | null = null;
  const NORTHBOUND_CACHE_TTL_MS = 30 * 60_000;

  interface NorthboundHoldingRow {
    SECUCODE?: string;
    SECURITY_CODE?: string;
    SECURITY_NAME?: string;
    TRADE_DATE?: string;
    HOLD_MARKET_CAP?: number; // 持股市值（元）
    HOLD_SHARES_RATIO?: number; // 占流通股比 %
    CHANGE_RATE?: number; // 环比变化 %
    CLOSE_PRICE?: number; // 现价
  }

  async function fetchNorthboundTop10(): Promise<{
    tradeDate: string;
    holdings: {
      symbol: string;
      name: string;
      holdingValueYi: number;
      holdingRatioPercent: number;
      changeRate: number;
      closePrice: number;
    }[];
  }> {
    const url = `https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_MUTUAL_HOLDSTOCKNORTH_STA&columns=ALL&pageNumber=1&pageSize=10&sortColumns=HOLD_MARKET_CAP&sortTypes=-1&filter=(${encodeURIComponent('MUTUAL_TYPE="003"')})`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`northbound http ${response.status}`);
      const json = await response.json();
      const rows: NorthboundHoldingRow[] = json?.result?.data || [];
      if (!Array.isArray(rows) || rows.length === 0) throw new Error('北向数据为空');

      return {
        tradeDate: String(rows[0]?.TRADE_DATE || '').slice(0, 10),
        holdings: rows.map((r) => ({
          symbol: String(r.SECURITY_CODE || ''),
          name: String(r.SECURITY_NAME || ''),
          holdingValueYi: (Number(r.HOLD_MARKET_CAP) || 0) / 1e8,
          holdingRatioPercent: Number(r.HOLD_SHARES_RATIO) || 0,
          changeRate: Number(r.CHANGE_RATE) || 0,
          closePrice: Number(r.CLOSE_PRICE) || 0,
        })).filter((h) => h.symbol && h.name),
      };
    } finally {
      clearTimeout(timer);
    }
  }

  router.get("/institutional/northbound-top10", async (req, res) => {
    try {
      if (northboundCache && Date.now() - northboundCache.at < NORTHBOUND_CACHE_TTL_MS) {
        return res.json({ success: true, ...northboundCache.data, cached: true });
      }
      const data = await fetchNorthboundTop10();
      northboundCache = { at: Date.now(), data };
      res.json({ success: true, ...data, cached: false });
    } catch (error: any) {
      console.error("Error fetching northbound top10:", error);
      res.status(502).json({ success: false, error: error.message || "暂时无法获取北向资金数据" });
    }
  });

  // 主力机构持仓数据（公募基金 / 社保基金 / QFII 重仓）
  const instHoldingCache = new Map<string, { at: number; data: any }>();
  const INST_CACHE_TTL_MS = 60 * 60_000; // 缓存 1 小时

  const ZLSJ_TYPE_MAP: Record<string, string> = {
    fund: "1",
    social: "3",
    qfii: "2",
    broker: "4",
    insurance: "5",
    trust: "6",
  };

  async function fetchInstitutionalHoldings(kind: string, date = "2024-06-30") {
    const typeCode = ZLSJ_TYPE_MAP[kind] || "1";
    const url = `https://data.eastmoney.com/dataapi/zlsj/list?date=${date}&type=${typeCode}&zjc=0&sortField=HOLD_VALUE&sortDirec=1&pageNum=1&pageSize=50&p=1&pageNo=1`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const resp = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://data.eastmoney.com/zlsj/sb.html",
        },
      });
      if (!resp.ok) throw new Error(`eastmoney zlsj status ${resp.status}`);
      const data = await resp.json();
      const rows: any[] = data?.data || [];
      rows.sort((a, b) => (Number(b.HOLD_VALUE) || 0) - (Number(a.HOLD_VALUE) || 0));
      const top10 = rows.slice(0, 10);
      return top10.map((r: any) => {
        const holdVal = Number(r.HOLD_VALUE) || 0;
        const ratio = Number(r.FREESHARES_RATIO) || 0;
        const holdcha = String(r.HOLDCHA || "");
        const change = Number(r.HOLDCHA_RATIO) || 0;
        let status: 'increase' | 'decrease' | 'unchanged' = 'unchanged';
        if (holdcha.includes('增') || holdcha.includes('新进')) status = 'increase';
        else if (holdcha.includes('减')) status = 'decrease';
        return {
          symbol: String(r.SECURITY_CODE || "").padStart(6, "0"),
          name: String(r.SECURITY_NAME_ABBR || ""),
          orgTypeName: String(r.ORG_TYPE_NAME || kind),
          marketValueYi: Math.round((holdVal / 1e8) * 10) / 10,
          holdingValueYi: Math.round((holdVal / 1e8) * 10) / 10,
          ratio: Math.round(ratio * 100) / 100,
          holdingRatioPercent: Math.round(ratio * 100) / 100,
          changeStatus: status,
          changePercent: Math.round(change * 100) / 100,
        };
      });
    } finally {
      clearTimeout(timer);
    }
  }

  async function handleInstitutionalRoute(kind: string, req: express.Request, res: express.Response) {
    const date = (req.query.date as string) || "2024-06-30";
    const key = `${kind}:${date}`;
    const cached = instHoldingCache.get(key);
    if (cached && Date.now() - cached.at < INST_CACHE_TTL_MS) {
      return res.json({ success: true, kind, reportDate: date, cached: true, holdings: cached.data });
    }
    try {
      const holdings = await fetchInstitutionalHoldings(kind, date);
      if (holdings.length === 0) {
        return res.status(404).json({ success: false, error: "未查询到机构持仓数据" });
      }
      instHoldingCache.set(key, { at: Date.now(), data: holdings });
      return res.json({ success: true, kind, reportDate: date, cached: false, holdings });
    } catch (error: any) {
      console.error(`Error fetching ${kind} holdings:`, error);
      return res.status(502).json({ success: false, error: error.message || "暂时无法获取机构持仓数据" });
    }
  }

  router.get("/institutional/fund-top10", (req, res) => handleInstitutionalRoute("fund", req, res));
  router.get("/institutional/social-security-top10", (req, res) => handleInstitutionalRoute("social", req, res));
  router.get("/institutional/qfii-top10", (req, res) => handleInstitutionalRoute("qfii", req, res));
  router.get(["/ak/fund-hold", "/ak/fund_hold"], (req, res) => handleInstitutionalRoute("fund", req, res));
  router.get(["/ak/social-security-hold", "/ak/social_security_hold"], (req, res) => handleInstitutionalRoute("social", req, res));
  router.get(["/ak/qfii-hold", "/ak/qfii_hold"], (req, res) => handleInstitutionalRoute("qfii", req, res));
}
