import express from "express";
import { fetchMarketIndexQuotes, fetchMarketBreadth, fetchBoardLeaders, fetchBoardFundFlow, fetchMarketScreener, fetchTencentScreenerFallback, type ScreenerItem } from "../marketData.js";
import { callDeepSeek } from "../deepseek.js";

export function register(router: express.Router, limits: { aiRateLimit?: express.RequestHandler; deepDiveRateLimit?: express.RequestHandler } = {}) {
  const aiRateLimit = limits.aiRateLimit!;
  const deepDiveRateLimit = limits.deepDiveRateLimit!;
  // 大盘指数概览（真实行情）
  router.get("/market-overview", async (req, res) => {
    try {
      const indices = await fetchMarketIndexQuotes();
      res.json({
        success: true,
        updatedAt: new Date().toISOString(),
        indices,
      });
    } catch (error: any) {
      console.error("Error fetching market overview:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to fetch market overview" });
    }
  });

  // 大盘涨跌分布、领涨板块与板块资金流向
  router.get("/market-breadth", async (req, res) => {
    try {
      const [breadth, leaders, fundFlow] = await Promise.all([
        fetchMarketBreadth(),
        fetchBoardLeaders(),
        fetchBoardFundFlow(),
      ]);
      res.json({
        success: true,
        updatedAt: new Date().toISOString(),
        breadth,
        leaders,
        fundFlow,
      });
    } catch (error: any) {
      console.error("Error fetching market breadth:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to fetch market breadth" });
    }
  });

  // 全市场 A 股选股雷达（真实行情快照，供前端按行业/估值/ROE/价格二次筛选）
  let screenerCache: { at: number; items: ScreenerItem[] } | null = null;
  const SCREENER_CACHE_TTL_MS = 60_000;

  router.get("/screener", async (req, res) => {
    try {
      const now = Date.now();
      if (!screenerCache || now - screenerCache.at > SCREENER_CACHE_TTL_MS) {
        let items = await fetchMarketScreener();
        if (items.length === 0) {
          // 东财 clist 偶发限流时，降级到腾讯真实行情备用池，保证选股雷达始终可用。
          items = await fetchTencentScreenerFallback();
        }
        if (items.length === 0) {
          if (screenerCache && screenerCache.items.length > 0) {
            // 行情源临时限流时，返回上一次缓存并标记为陈旧数据。
            return res.json({
              success: true,
              updatedAt: new Date(screenerCache.at).toISOString(),
              total: screenerCache.items.length,
              items: screenerCache.items,
              stale: true,
            });
          }
          return res.status(502).json({ success: false, error: "暂时无法获取行情列表，请稍后重试" });
        }
        screenerCache = { at: now, items };
      }
      res.json({
        success: true,
        updatedAt: new Date(screenerCache.at).toISOString(),
        total: screenerCache.items.length,
        items: screenerCache.items,
        stale: now - screenerCache.at > SCREENER_CACHE_TTL_MS,
      });
    } catch (error: any) {
      console.error("Error fetching screener:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to fetch screener" });
    }
  });

  // 大盘一句话复盘（AI，硬约束不出现买卖建议）
  router.post("/market-ai-review", aiRateLimit, async (req, res) => {
    try {
      const indices = await fetchMarketIndexQuotes();
      if (indices.length === 0) {
        return res.status(502).json({ success: false, error: "未能获取指数行情" });
      }

      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        const text = indices.map((i) => `${i.name} ${i.changePercent >= 0 ? "+" : ""}${i.changePercent}%`).join("，");
        return res.json({ success: true, review: `今日主要指数：${text}。请结合成交额与板块结构继续观察。` });
      }

      const indexText = indices.map((i) => `${i.name}(${i.code}) ${i.price}，涨跌 ${i.changePercent}%`).join("；");
      const prompt = `你是一位严谨的中文市场复盘编辑。请基于以下真实指数数据，用 110-160 字写一段今日盘面一句话复盘。要求：只做客观描述与结构观察，禁止出现任何买卖建议、涨跌预测或收益承诺。\n\n${indexText}`;

      const review = await callDeepSeek({
        system: "你是严谨客观的证券市场复盘编辑，只陈述事实与结构，不给出买卖建议。",
        user: prompt,
        temperature: 0.3,
        maxTokens: 300,
      });

      res.json({ success: true, review: review.trim() });
    } catch (error: any) {
      console.error("Error in market AI review:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to generate market review" });
    }
  });
}
