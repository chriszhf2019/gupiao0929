import express from "express";
import { PRESET_STOCKS, generateStockFallback } from "../../src/data/presetStocks.js";
import { getRealtimeStockData, fetchTencentKline } from "../../src/data/realtimeQuote.js";
import { enrichWithFinancials } from "../../src/data/financialData.js";
import { HOT_SYMBOLS } from "../../src/data/hotSymbols.js";
import { BACKTEST_BAR_COUNT, normalizeListing } from "../../src/utils/symbolCode.js";

export function register(router: express.Router, limits: { aiRateLimit?: express.RequestHandler; deepDiveRateLimit?: express.RequestHandler } = {}) {
  const aiRateLimit = limits.aiRateLimit!;
  const deepDiveRateLimit = limits.deepDiveRateLimit!;
  // 1. Get Stock Data endpoint
  router.get("/stock/:symbol", async (req, res) => {
    const symbol = req.params.symbol.trim().toUpperCase();
    try {
      const stock = await getRealtimeStockData(symbol);
      const enriched = await enrichWithFinancials(stock);
      res.json({ success: true, stock: enriched, isFallback: !enriched.isRealtime });
    } catch (error: any) {
      console.error("Error fetching stock data, using fallback:", error?.message || error);
      res.json({ success: true, stock: PRESET_STOCKS[symbol] || generateStockFallback(symbol), isFallback: true, fallbackReason: "行情源暂时不可用" });
    }
  });

  // 前十大流通股东真实披露数据（东方财富 F10，A股有效；港股/美股返回快照或空）
  interface HolderRow {
    HOLDER_NAME?: string;
    HOLD_NUM?: number;
    FREE_HOLDNUM_RATIO?: number;
    HOLD_CHANGE?: string | number;
    HOLDER_RANK?: number;
    HOLDER_TYPE?: string;
    REPORT_DATE_NAME?: string;
    END_DATE?: string;
  }

  const holdersCache = new Map<string, { at: number; data: any }>();
  const HOLDERS_CACHE_TTL_MS = 10 * 60_000;

  function formatShares(n: number): string {
    if (!Number.isFinite(n) || n <= 0) return '--';
    if (n >= 1e8) return `${(n / 1e8).toFixed(2)}亿股`;
    if (n >= 1e4) return `${(n / 1e4).toFixed(1)}万股`;
    return `${n}股`;
  }

  function mapHolderChange(raw: string | number | null | undefined): { status: 'increase' | 'decrease' | 'unchanged' | 'new'; label?: string } {
    if (typeof raw === 'number') {
      if (Number.isFinite(raw) && raw !== 0) {
        return { status: raw > 0 ? 'increase' : 'decrease', label: `${raw > 0 ? '+' : ''}${raw.toLocaleString()}股` };
      }
      return { status: 'unchanged' };
    }
    const s = String(raw || '').trim();
    if (!s || s === '不变') return { status: 'unchanged' };
    if (s.includes('增持')) return { status: 'increase', label: s };
    if (s.includes('减持') || s.includes('减少')) return { status: 'decrease', label: s };
    if (s.includes('新进')) return { status: 'new', label: s };
    return { status: 'unchanged' };
  }

  function inferHolderType(name: string, holderType: string): string {
    if (name.includes('香港中央结算')) return '北向陆股通外资';
    if (name.includes('中央汇金') || name.includes('中国证券金融') || name.includes('证金')) return '国家队证金/汇金';
    if (name.includes('社保')) return '社保基金';
    if (name.includes('基金')) return '公募基金';
    if (name.includes('保险') || name.includes('资管') || name.includes('信托')) return '保险资管';
    if (holderType.includes('个人') || !name.includes('公司') && !name.includes('集团') && !name.includes('有限')) return '个人自然人';
    return '控股股东/国资';
  }

  router.get("/stock/:symbol/holders", async (req, res) => {
    const symbol = req.params.symbol.trim().toUpperCase();
    if (!/^\d{6}$/.test(symbol)) {
      return res.status(400).json({ success: false, error: "港股/美股暂不支持股东接口，请使用 6 位 A 股代码" });
    }

    try {
      const cached = holdersCache.get(symbol);
      if (cached && Date.now() - cached.at < HOLDERS_CACHE_TTL_MS) {
        return res.json({ success: true, ...cached.data });
      }

      const secuCode = normalizeListing(symbol)?.eastmoneySecuCode;
      if (!secuCode) {
        return res.status(400).json({ success: false, error: "无法识别的 A 股代码" });
      }
      const url = `https://datacenter.eastmoney.com/securities/api/data/v1/get?reportName=RPT_F10_EH_FREEHOLDERS&columns=ALL&filter=(${encodeURIComponent(`SECUCODE="${secuCode}"`)})&pageNumber=1&pageSize=20&source=HSF10&client=PC`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      });
      clearTimeout(timer);

      if (!response.ok) throw new Error(`eastmoney http ${response.status}`);
      const json = await response.json();
      const rows: HolderRow[] = json?.result?.data || [];
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(404).json({ success: false, error: "未找到该标的的前十大股东披露数据" });
      }

      // 接口会返回多个报告期的全部历史披露，仅保留最新报告期，并按股东名称去重
      const endDates = rows.map((r) => String(r.END_DATE || '')).filter((d) => d);
      const latestEndDate = endDates.sort().pop() || '';
      const latestRows = rows.filter((r) => String(r.END_DATE || '') === latestEndDate);
      const byName = new Map<string, HolderRow>();
      for (const r of [...latestRows].sort((a, b) => (a.HOLDER_RANK || 99) - (b.HOLDER_RANK || 99))) {
        const name = String(r.HOLDER_NAME || '').trim();
        if (name && !byName.has(name)) byName.set(name, r);
      }
      const sorted = Array.from(byName.values()).sort((a, b) => (a.HOLDER_RANK || 99) - (b.HOLDER_RANK || 99)).slice(0, 10);

      const shareholders = sorted.map((r) => {
        const name = String(r.HOLDER_NAME || '').trim();
        const change = mapHolderChange(r.HOLD_CHANGE);
        return {
          rank: r.HOLDER_RANK || 0,
          name: name || '--',
          holdingShares: formatShares(Number(r.HOLD_NUM) || 0),
          holdingPercent: Number(r.FREE_HOLDNUM_RATIO) || 0,
          changeStatus: change.status,
          changeStatusZh: change.status === 'increase' ? '增持' : change.status === 'decrease' ? '减持' : change.status === 'new' ? '新进' : '未变',
          ...(change.label ? { changeShares: change.label } : {}),
          shareholderType: inferHolderType(name, String(r.HOLDER_TYPE || '')),
        };
      });

      const northboundHolder = shareholders.find((s) => s.name.includes('香港中央结算'));
      const socialSecurityPresent = shareholders.some((s) => s.name.includes('社保'));
      const nationalTeamPresent = shareholders.some((s) => s.name.includes('中央汇金') || s.name.includes('中国证券金融') || s.name.includes('证金'));
      const top10ConcentrationPercent = Number(
        Math.min(shareholders.reduce((sum, s) => sum + s.holdingPercent, 0), 99.9).toFixed(2)
      );

      const latestPeriodRow = latestRows.find((r) => String(r.REPORT_DATE_NAME || '')) || rows[0];
      const payload = {
        symbol,
        stockName: String(sorted[0]?.HOLDER_NAME || ''),
        reportPeriod: String(latestPeriodRow?.REPORT_DATE_NAME || latestEndDate || '最新披露'),
        totalInstitutionsCount: 0,
        institutionalSharePercent: 0,
        top10ConcentrationPercent,
        northboundHoldingPercent: northboundHolder ? northboundHolder.holdingPercent : 0,
        mutualFundCount: 0,
        socialSecurityPresent,
        nationalTeamPresent,
        shareholders,
        source: 'eastmoney',
      };

      holdersCache.set(symbol, { at: Date.now(), data: payload });
      res.json({ success: true, data: payload });
    } catch (error: any) {
      console.error("Error fetching holders:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to fetch holders" });
    }
  });

  // 常用标杆池实时报价（供顶部快捷切换卡片展示真实价格）
  router.get("/quick-quotes", async (req, res) => {
    try {
      const quotes = await Promise.all(
        HOT_SYMBOLS.map(async (item) => {
          try {
            const stock = await getRealtimeStockData(item.symbol);
            const fallbackName = String(stock?.name || '').includes('行业标的');
            return {
              symbol: item.symbol,
              name: fallbackName ? item.name : (stock.name || item.name),
              currentPrice: stock.currentPrice,
              changePercent: stock.changePercent,
              currency: stock.currency,
              isFallback: !stock.isRealtime,
            };
          } catch {
            return { symbol: item.symbol, name: item.name, currentPrice: 0, changePercent: 0, currency: 'CNY', isFallback: true };
          }
        })
      );
      res.json({ success: true, quotes });
    } catch (error: any) {
      console.error("Error fetching quick quotes:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to fetch quick quotes" });
    }
  });

  // 日K线接口（腾讯行情源，供策略回测引擎拉取真实指数/个股历史K线作为基准）
  const klineCache = new Map<string, { at: number; bars: { date: string; price: number }[] }>();
  const KLINE_CACHE_TTL_MS = 5 * 60_000;

  function toTencentKlineSymbol(raw: string): string | null {
    return normalizeListing(raw)?.tencentSymbol ?? null;
  }

  router.get("/kline/:symbol", async (req, res) => {
    const tsSymbol = toTencentKlineSymbol(req.params.symbol);
    if (!tsSymbol) {
      return res.status(400).json({ success: false, error: "无法识别的代码格式" });
    }
    const days = Math.min(Math.max(Number(req.query.days) || BACKTEST_BAR_COUNT, 20), 800);
    const key = `${tsSymbol}:${days}`;

    try {
      const cached = klineCache.get(key);
      if (cached && Date.now() - cached.at < KLINE_CACHE_TTL_MS) {
        return res.json({ success: true, symbol: tsSymbol, bars: cached.bars, cached: true });
      }

      const fetched = await fetchTencentKline(tsSymbol, days);
      if (!fetched) {
        if (cached) {
          return res.json({ success: true, symbol: tsSymbol, bars: cached.bars, cached: true, stale: true });
        }
        return res.status(502).json({ success: false, error: "行情源暂时无法获取该标的K线" });
      }

      const bars = fetched.bars.map((b) => ({ date: b.date, price: b.close }));
      klineCache.set(key, { at: Date.now(), bars });
      res.json({ success: true, symbol: tsSymbol, bars, cached: false });
    } catch (error: any) {
      console.error("Error fetching kline:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to fetch kline" });
    }
  });

  // 公募基金实时基础信息（名称/申购费率，源：天天基金 pingzhongdata）
  const fundCache = new Map<string, { at: number; data: any }>();
  const FUND_CACHE_TTL_MS = 12 * 60 * 60_000; // 名称/费率低频变动，缓存 12 小时

  interface FundBasicInfo {
    code: string;
    name: string;
    subscriptionFeeRate: number; // 折后申购费率 %
    sourceRate: number; // 原申购费率 %
  }

  router.get("/fund/:code", async (req, res) => {
    const code = req.params.code.trim();
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ success: false, error: "基金代码需为 6 位数字" });
    }

    try {
      const cached = fundCache.get(code);
      if (cached && Date.now() - cached.at < FUND_CACHE_TTL_MS) {
        return res.json({ success: true, fund: cached.data, cached: true });
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(`https://fund.eastmoney.com/pingzhongdata/${code}.js`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://fund.eastmoney.com/' },
      });
      clearTimeout(timer);

      if (!response.ok) throw new Error(`fund eastmoney http ${response.status}`);
      const text = await response.text();

      const nameMatch = text.match(/fS_name\s*=\s*"([^"]+)"/);
      const sourceRateMatch = text.match(/fund_sourceRate\s*=\s*"([^"]*)"/);
      const rateMatch = text.match(/fund_Rate\s*=\s*"([^"]*)"/);
      const name = nameMatch?.[1]?.trim();
      if (!name) throw new Error('未解析到基金名称');

      const fund: FundBasicInfo = {
        code,
        name,
        subscriptionFeeRate: rateMatch?.[1] ? Number(rateMatch[1]) || 0 : 0,
        sourceRate: sourceRateMatch?.[1] ? Number(sourceRateMatch[1]) || 0 : 0,
      };
      fundCache.set(code, { at: Date.now(), data: fund });
      res.json({ success: true, fund, cached: false });
    } catch (error: any) {
      console.error("Error fetching fund info:", error);
      res.status(502).json({ success: false, error: error.message || "暂时无法获取基金信息" });
    }
  });
}
