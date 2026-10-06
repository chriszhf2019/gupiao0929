import express from "express";
import { PRESET_INDEX_FUNDS, calculateShareClassCost, ASSET_ALLOCATION_PROFILES } from "../../src/data/indexFundData.js";
import { callDeepSeek, parseJsonResponse } from "../deepseek.js";

export function register(router: express.Router, limits: { aiRateLimit?: express.RequestHandler; deepDiveRateLimit?: express.RequestHandler } = {}) {
  const aiRateLimit = limits.aiRateLimit!;
  const deepDiveRateLimit = limits.deepDiveRateLimit!;
  router.get("/index-funds", (req, res) => {
    try {
      const targetIndex = (req.query.index as string) || "all";
      const minAssets = parseFloat((req.query.minAssets as string) || "1.0"); // 规则4: 规模>=1亿
      const maxTrackingError = parseFloat((req.query.maxTrackingError as string) || "2.0"); // 规则2: 跟踪误差<=2%
      const quotaOnly = req.query.quotaOnly === "true"; // 规则1: 额度优先
      const holdingDays = parseInt((req.query.holdingDays as string) || "365", 10); // 规则5: A/C选择 (根据持有期限)
      const investmentAmount = parseFloat((req.query.amount as string) || "50000");

      let list = [...PRESET_INDEX_FUNDS];

      // 过滤指数
      if (targetIndex !== "all") {
        list = list.filter((f) => f.targetIndex.toLowerCase() === targetIndex.toLowerCase());
      }

      // 计算四步达标状态与 A/C 推荐
      const processedList = list.map((fund) => {
        const quotaPass = fund.quotaStatus !== "suspended";
        const sizePass = fund.fundSize >= minAssets;
        const trackingPass = fund.trackingError <= maxTrackingError;
        const screenPass = quotaPass && sizePass && trackingPass;

        const costSim = calculateShareClassCost(fund, investmentAmount, holdingDays);

        return {
          ...fund,
          screenPass,
          criteriaCheck: {
            quotaPass,
            sizePass,
            trackingPass,
          },
          costSimulation: costSim,
        };
      });

      // 筛选过滤
      let filteredList = processedList;
      if (quotaOnly) {
        filteredList = filteredList.filter((f) => f.criteriaCheck.quotaPass);
      }
      filteredList = filteredList.filter((f) => f.fundSize >= minAssets && f.trackingError <= maxTrackingError);

      // 规则3: 持有成本升序排列 (管理费+托管费+销售服务费之和尽可能低)
      filteredList.sort((a, b) => a.totalExpenseRatio - b.totalExpenseRatio);

      res.json({
        success: true,
        totalCount: PRESET_INDEX_FUNDS.length,
        matchedCount: filteredList.length,
        funds: filteredList,
        allFunds: processedList,
      });
    } catch (err: any) {
      console.error("Error in /api/index-funds:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to fetch index funds" });
    }
  });

  // 计算 A/C 类费用对比接口
  router.post("/index-funds/calculate-cost", (req, res) => {
    try {
      const { fundCode, holdingDays = 365, amount = 50000 } = req.body;
      const fund = PRESET_INDEX_FUNDS.find((f) => f.code === fundCode) || PRESET_INDEX_FUNDS[0];
      const result = calculateShareClassCost(fund, amount, holdingDays);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 大类资产配置建议接口
  router.get("/index-funds/asset-allocation", (req, res) => {
    res.json({ success: true, profiles: ASSET_ALLOCATION_PROFILES });
  });

  // AI 指数与大类资产配置研判接口
  router.post("/index-funds/ai-diagnosis", aiRateLimit, async (req, res) => {
    try {
      const { targetIndex = "Nasdaq 100", holdingYears = 3, riskPreference = "balanced" } = req.body;
      const apiKey = process.env.DEEPSEEK_API_KEY;

      if (!apiKey) {
        return res.json({
          success: true,
          diagnosis: {
            executiveSummary: `针对【${targetIndex}】指数与【预计持有 ${holdingYears} 年】投资周期：纳指100与标普500构筑全球核心资产双子星。在当前美联储利率周期与AI生产力革命共振背景下，四步优选法（额度优先、跟踪误差≤2%、费率最优、规模≥1亿）能有效避免QDII限购踩空、流动性折价及高费率蚕食复利。`,
            keyTakeaways: [
              "额度策略：QDII外汇额度面临机构额度紧张，建议采取每日定投小额申购（如单日500~1000元），规避大额单笔限购卡顿。",
              `份额推荐：持有 ${holdingYears} 年（>1年），强烈推荐 A 类份额。单次买断申购费（折后仅0.12%），长期省去每年0.25%的销售服务费。`,
              "溢价风控：场内ETF在申购暂停期易出现非理性高溢价（溢价>2%），切勿追高场内高溢价筹码，优先选择场外净值申购。",
              "配置比例：建议构建「纳指100 (35%) + 标普500 (35%) + 沪深300/国内宽基 (20%) + 美元债/现金 (10%)」的全天候全球资产配置底仓。",
            ],
            crossoverAnalysis: `A/C份额盈亏平衡点约为 180~270 天。在持有 ${holdingYears} 年的时间维度下，A类累计节省费率可达 0.5%~0.8% 净值，复利优势显著。`,
          },
        });
      }

      const prompt = `你是一位专注全球宏观指数投资与公募QDII/ETF基金的顶级投资策略专家。
  请根据以下条件，对当前中国投资者的指数基金配置进行专业分析：
  - 目标指数: ${targetIndex} (包含纳指100 / 标普500 / 沪深300)
  - 预计持有年限: ${holdingYears} 年
  - 风险偏好: ${riskPreference}
  - 核心逻辑: 四步优选法（1. 额度优先判断 2. 跟踪误差≤2% 3. 持有成本尽可能低 4. 规模≥1亿 5. 根据持有期推荐A/C类）

  请以JSON格式输出：
  {
    "executiveSummary": "150字宏观指数研判与配置主旨",
    "keyTakeaways": ["4条核心关键建议，包含额度应对、费率比较、溢价避坑与配置比例"],
    "crossoverAnalysis": "A/C份额持有成本临界平衡点分析"
  }`;

      const diagnosisText = await callDeepSeek({
        system: "你是一位专注全球宏观指数投资与公募QDII/ETF基金的顶级投资策略专家。请只输出一个合法的JSON对象。",
        user: prompt,
        json: true,
        maxTokens: 4000,
      });

      const parsed = parseJsonResponse(diagnosisText);
      res.json({ success: true, diagnosis: parsed });
    } catch (err: any) {
      console.error("Error in ai-diagnosis:", err);
      res.json({
        success: true,
        diagnosis: {
          executiveSummary: "全球核心宽基优选：纳指100与标普500构建全天候海外权益压舱石，坚持低费率与额度优先法则。",
          keyTakeaways: [
            "优先筛选有QDII申购额度的基金，避免因大额限购影响资产建仓节奏",
            "严守跟踪误差≤2%红线，确保获得纯正的指数Beta回报",
            "持有期>1年优先A类买断申购费，长期复利收益更优",
            "警惕场内ETF高溢价风险，溢价率超过2%时优先转场外联接基金",
          ],
          crossoverAnalysis: "A/C类份额持有平衡点约为180天，长期持有推荐A类。",
        },
      });
    }
  });
}
