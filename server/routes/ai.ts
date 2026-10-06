import express from "express";
import type { StockData } from "../../src/types/stock.js";
import { callDeepSeek, parseJsonResponse, loadCanonicalStock, sanitizeAiReport, clampMacroSlider, type DeepSeekMessage } from "../deepseek.js";
import { attachPresetMatches } from "../../src/utils/strategyPipeline.js";
import { buildLocalDeepExploreReport } from "../../src/utils/localDeepExplore.js";
import { buildUnavailableInvestigativeReport } from "../../src/utils/unavailableInvestigative.js";

export function register(router: express.Router, limits: { aiRateLimit?: express.RequestHandler; deepDiveRateLimit?: express.RequestHandler } = {}) {
  const aiRateLimit = limits.aiRateLimit!;
  const deepDiveRateLimit = limits.deepDiveRateLimit!;
  // 2. AI 5-Step Stock Deep Analysis endpoint
  router.post("/stock-analysis", aiRateLimit, async (req, res) => {
    try {
      const symbol = String(req.body?.symbol || req.body?.stock?.symbol || '').trim();
      const macroSlider = clampMacroSlider(req.body?.macroSlider);
      if (!symbol) {
        return res.status(400).json({ error: "Missing stock symbol" });
      }
      let stock: StockData;
      try {
        stock = await loadCanonicalStock(symbol);
      } catch (error: any) {
        return res.json({ success: false, useLocalFallback: true, message: error?.message || "行情暂不可用" });
      }

      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        return res.json({
          success: false,
          message: "DeepSeek API key not configured",
          useLocalFallback: true,
        });
      }

      const prompt = `你是一位顶级A股/港股/美股资深证券分析师与价值投资专家。请对以下股票执行“股票分析五步法”深度扫描并生成专业诊断报告：

  【股票基本信息】
  - 股票名称: ${stock.name} (${stock.symbol})
  - 所属行业: ${stock.sector} | 市场: ${stock.market}
  - 当前股价: ${stock.currentPrice} ${stock.currency} (今日变动: ${stock.changePercent}%)
  - 动态PE (TTM): ${stock.peTTM} | 市值: ${stock.marketCap}
  - 投资者设置的【Step 1 & 2 宏观行业热度打分】: ${macroSlider} / 10

  【基本面数据 (Step 3)】
  - 毛利率: ${stock.fundamentals.grossMarginValue}% (标准>30% - ${stock.fundamentals.grossMarginPass ? '达标' : '未达标'})
  - 净利率: ${stock.fundamentals.netMarginValue}% (标准>10% - ${stock.fundamentals.netMarginPass ? '达标' : '未达标'})
  - 资产负债率: ${stock.fundamentals.debtRatioValue}% (标准<60% - ${stock.fundamentals.debtRatioPass ? '达标' : '未达标'})
  - ROE: ${stock.fundamentals.roeValue}% | 营收增长率: ${stock.fundamentals.revenueGrowthValue}%

  【估值水平 (Step 4)】
  - 当前PE处于历史5年: ${stock.valuation.historicalPePercentile}% 百分位 (${stock.valuation.statusZh})
  - 估值区间: 5年最低 ${stock.valuation.pe5YearMin} / 最高 ${stock.valuation.pe5YearMax} / 平均 ${stock.valuation.pe5YearAvg}
  - 安全边际买入价预估: ${stock.valuation.marginOfSafetyPrice} ${stock.currency}

  【技术形态 (Step 5)】
  - 技术形态: ${stock.technical.trendChannelZh} (${stock.technical.macdSignalZh})
  - 强支撑位: ${stock.technical.supportLevel1} | 强压力位: ${stock.technical.resistanceLevel1}

  请输出结构化JSON报告，包含：
  1. summary: 150字左右的五步分析精炼总结
  2. macroDiagnosis: 宏观与行业环境研判 (分析宏观热度${macroSlider}分的合理性与行业催化)
  3. fundamentalDiagnosis: 公司基本面财报扫描诊断
  4. valuationDiagnosis: 估值百分位与安全边际分析
  5. technicalDiagnosis: 技术面走势与建仓时机研判
  6. fiveStepScore: 五步法综合评分 (0-100分)
  7. verdictZh: 明确交易建议，只能是其中之一 ('强烈推荐建仓' | '建议分批逢低吸纳' | '观望/持有' | '风险偏高谨慎观望')
  8. keyRisksToWatch: 3条核心风险提示数组
  9. recommendedAction: 建仓与分批策略建议
  `;

      const reportText = await callDeepSeek({
        system: "你是一个专业的量化与价值投资股票分析专家。请严谨客观地评估，只输出一个合法的JSON对象。",
        user: prompt,
        json: true,
        maxTokens: 4000,
      });

      const reportData = sanitizeAiReport(parseJsonResponse(reportText), stock, macroSlider);
      res.json({ success: true, report: reportData });
    } catch (error: any) {
      console.error("Error in AI stock analysis:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to run AI analysis",
      });
    }
  });

  // 3. AI Stock Deep Exploration endpoint (深度探索专题研判)
  // 财报深度阅读：对比历年财报 + 财报数据与实际情况互相印证
  function financialPct(a: number, b: number): string {
    if (!Number.isFinite(b) || b === 0) return '--';
    const v = ((a - b) / Math.abs(b)) * 100;
    return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
  }

  function buildLocalFinancialReading(stock: any) {
    const years: any[] = stock?.financialHistory || [];
    const latest = years[years.length - 1];
    const prev = years.length >= 2 ? years[years.length - 2] : null;
    const first = years[0];

    const revCagr = first && latest && first.revenue > 0
      ? Math.pow(latest.revenue / first.revenue, 1 / Math.max(1, years.length - 1)) - 1
      : null;
    const cashRatio = latest ? latest.freeCashFlow / Math.max(latest.netProfit, 1) : null;

    const highlights: string[] = [];
    const concerns: string[] = [];

    if (prev && latest) {
      if (latest.revenue > prev.revenue) highlights.push(`营业收入同比 ${financialPct(latest.revenue, prev.revenue)}，规模仍在扩张`);
      else concerns.push(`营业收入同比 ${financialPct(latest.revenue, prev.revenue)}，增长出现停滞`);
      if (latest.netProfit > prev.netProfit) highlights.push(`归母净利润同比 ${financialPct(latest.netProfit, prev.netProfit)}，盈利同步改善`);
      else concerns.push(`归母净利润同比 ${financialPct(latest.netProfit, prev.netProfit)}，盈利承压`);
      if (latest.grossMargin >= prev.grossMargin) highlights.push(`毛利率 ${latest.grossMargin}%（同比 ${financialPct(latest.grossMargin, prev.grossMargin)}），定价权稳定`);
      else concerns.push(`毛利率 ${latest.grossMargin}%（同比 ${financialPct(latest.grossMargin, prev.grossMargin)}），竞争或成本挤压`);
    }
    if (cashRatio !== null && cashRatio >= 1) highlights.push(`经营现金流/净利润约 ${cashRatio.toFixed(2)}，利润有真金白银支撑`);
    if (cashRatio !== null && cashRatio < 1) concerns.push(`经营现金流/净利润约 ${cashRatio.toFixed(2)}，利润含金量不足`);
    if (revCagr !== null && revCagr > 0) highlights.push(`近 ${years.length} 年营收年化复合增速约 ${(revCagr * 100).toFixed(1)}%`);

    return {
      summary: `${stock?.name || '该标的'}（${stock?.symbol || ''}）近 ${years.length} 期财报：${latest ? `最新一期营收 ${latest.revenue} 亿元、归母净利润 ${latest.netProfit} 亿元、ROE ${latest.roe}%` : '暂无足够财报数据'}。${concerns.length > highlights.length ? '整体看账面增长与现金流质量需要进一步验证。' : '整体盈利质量与成长动能相对扎实。'}`,
      highlights: highlights.length ? highlights : ['具备多年连续披露的财报历史，可供趋势对比'],
      concerns: concerns.length ? concerns : ['当前数据未发现明显恶化信号，仍需结合行业实际与后续报告期验证'],
      realityGap: `财报显示 ${latest?.revenue ?? '--'} 亿元营收，而经营现金流为 ${latest?.freeCashFlow ?? '--'} 亿元，对应现金转化率约 ${cashRatio === null ? '--' : cashRatio.toFixed(2)}。这一「账面收入 vs 真实现金」的落差是判断财报与实际情况是否一致的关键：比值接近甚至高于 1，说明收入有现金回款支撑；若显著低于 1，则可能存在赊销、压货或利润确认过快。`,
      conclusion: '结合同比增速、毛利率趋势与现金流转化率综合判断，财报质量与实际情况整体处于可验证区间，建议继续跟踪后续报告期是否延续。',
    };
  }

  router.post("/financial-analysis", aiRateLimit, async (req, res) => {
    try {
      const symbol = String(req.body?.symbol || req.body?.stock?.symbol || '').trim();
      if (!symbol) {
        return res.status(400).json({ error: "Missing stock symbol" });
      }
      let stock: StockData;
      try {
        stock = await loadCanonicalStock(symbol);
      } catch (error: any) {
        return res.status(400).json({ error: error?.message || "缺少股票代码" });
      }
      if (!Array.isArray(stock.financialHistory)) {
        return res.status(400).json({ error: "Missing stock financial data" });
      }

      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        return res.json({ success: true, report: buildLocalFinancialReading(stock) });
      }

      const years = stock.financialHistory.map((y: any) =>
        `${y.year}: 营收${y.revenue}亿 / 净利${y.netProfit}亿 / 毛利率${y.grossMargin}% / 净利率${y.netMargin}% / ROE${y.roe}% / 负债率${y.debtToAsset}% / 经营现金流${y.freeCashFlow}亿`
      ).join('\n');

      const prompt = `你是一位严谨的买方财务分析师。请对以下公司的历年财报做「财报深度阅读 + 与前期对比 + 与实际情况互相印证」。

  【公司】${stock.name} (${stock.symbol})，行业：${stock.sector}
  【历年财报数据】\n${years}
  【当前财务扫描】毛利率 ${stock.fundamentals?.grossMarginValue}%，净利率 ${stock.fundamentals?.netMarginValue}%，ROE ${stock.fundamentals?.roeValue}%，资产负债率 ${stock.fundamentals?.debtRatioValue}%，营收增速 ${stock.fundamentals?.revenueGrowthValue}%

  请重点完成三件事：
  1. 纵向对比：逐期看营收、净利、毛利率、ROE 的变化趋势，判断增长是否可持续、利润率是否被侵蚀。
  2. 横向印证：把「账面利润」和「经营现金流」对比，判断利润是真金白银还是应收账款/存货堆积出来的纸面利润。
  3. 财报 vs 实际情况：结合行业常识，指出财报数字与真实经营可能存在的落差（如增收不增利、毛利虚高、现金流倒挂、负债上升等）。

  只输出一个 JSON 对象（不要 Markdown 代码块）：
  {
    "summary": "150字总体判断",
    "highlights": ["3-4条积极信号"],
    "concerns": ["3-4条需要警惕的信号"],
    "realityGap": "财报数字与实际经营情况对比的核心结论，含现金流转化率等关键证据",
    "conclusion": "100字投资视角结论（不构成买卖建议）"
  }`;

      const text = await callDeepSeek({
        system: "你是严谨客观的买方财务分析师，只做财报事实解读与逻辑印证，不给出买卖建议，只输出合法 JSON。",
        user: prompt,
        json: true,
        maxTokens: 2500,
      });
      const report = parseJsonResponse(text);
      res.json({ success: true, report });
    } catch (error: any) {
      console.error("Error in financial-analysis:", error);
      res.json({ success: false, error: error?.message || "财报解读失败" });
    }
  });

  router.post("/deep-explore", aiRateLimit, async (req, res) => {
    try {
      const symbol = String(req.body?.symbol || req.body?.stock?.symbol || '').trim();
      const topic = typeof req.body?.topic === 'string' ? req.body.topic.slice(0, 200) : '';
      if (!symbol) {
        return res.status(400).json({ error: "Missing stock symbol" });
      }
      let stock: StockData;
      try {
        stock = await loadCanonicalStock(symbol);
      } catch (error: any) {
        return res.status(400).json({ error: error?.message || "缺少股票代码" });
      }

      const targetTopic = topic || "核心护城河可持续性与未来3年成长天花板推演";
      const apiKey = process.env.DEEPSEEK_API_KEY;

      if (!apiKey) {
        return res.json({
          success: true,
          report: buildLocalDeepExploreReport(stock, targetTopic),
        });
      }

      const prompt = `你是一位顶级投研总监与价值投资大师（融合芒格逆向思考法与波特五力模型）。
  请针对以下标的进行【深度探索研判】：

  【公司基本面】
  - 标的: ${stock.name} (${stock.symbol})
  - 行业: ${stock.sector} (${stock.macro?.industryStageZh})
  - 现价: ${stock.currentPrice} ${stock.currency} | PE(TTM): ${stock.peTTM} (历史分位: ${stock.valuation?.historicalPePercentile}%)
  - 核心指标: 毛利率 ${stock.fundamentals?.grossMarginValue}%, ROE ${stock.fundamentals?.roeValue}%, 负债率 ${stock.fundamentals?.debtRatioValue}%

  【当前深度探索议题】: ${targetTopic}

  请进行极其深入、专业、穿透式的投资逻辑探索，并严格输出以下JSON字段：
  1. topic: 探索议题名称
  2. executiveInsight: 核心深度探索穿透性洞察 (200字，直击商业模式本质)
  3. bullCaseAnalysis: 乐观爆发情景与量化推演 (包括催化剂传导、业绩增速假设与空间)
  4. bearCaseAnalysis: 悲观反脆弱检验与逆向思考 (Pre-Mortem事前验尸：什么会导致这笔投资重大失败)
  5. moatDurability: 护城河可持续性与波特五力微观结构剖析
  6. actionableFramework: 资深基金经理的仓位管理与博弈应对纪律
  `;

      const reportText = await callDeepSeek({
        system: "你是一位兼备买方投资思维与学术严谨度的顶级证券研究所首席分析师。客观、穿透，只输出一个合法的JSON对象。",
        user: prompt,
        json: true,
        maxTokens: 4000,
      });

      const reportData = parseJsonResponse(reportText);
      res.json({ success: true, report: reportData });
    } catch (error: any) {
      console.error("Error in deep explore:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to run deep exploration",
      });
    }
  });

  // 4. AI 行业深度爆料 + 财报拆解 + 情绪共鸣 调查内容生产闭环 (Investigative Deep Dive)
  router.post("/investigative-deep-dive", deepDiveRateLimit, async (req, res) => {
    try {
      const { targetName, targetSymbol, industry, customPrompt } = req.body;
      const symbol = String(targetSymbol || req.body?.symbol || '').trim();
      let namedStock: StockData | null = null;
      if (symbol) {
        try {
          namedStock = await loadCanonicalStock(symbol);
        } catch {
          namedStock = null;
        }
      }
      const effectiveTarget = targetName || namedStock?.name || "目标企业/产业链";
      const effectiveIndustry = industry || namedStock?.sector || "科技/高端制造";
      const apiKey = process.env.DEEPSEEK_API_KEY;

      if (!apiKey) {
        return res.json({
          success: true,
          report: buildUnavailableInvestigativeReport(effectiveTarget, symbol || namedStock?.symbol, effectiveIndustry, namedStock),
        });
      }

      const prompt = `你是一位以“行业深度爆料 + 财报数据穿透拆解 + 大众情绪共鸣”著称的顶尖财经调查专家兼买方首席分析师。
  你的核心底层武器是已经过多行业验证的通用分析框架：「反常现象 → 利益闭环 → 实锤数据 → 情绪引爆」！

  【调查分析目标】
  - 目标公司/赛道: ${effectiveTarget}
  - 目标代码: ${targetSymbol || "N/A"}
  - 所属行业: ${effectiveIndustry}
  - 已加载科目: 市盈率 ${namedStock?.peTTM ?? "未加载"}，历史分位 ${namedStock?.valuation?.historicalPePercentile ?? "未加载"}%，毛利率 ${namedStock?.fundamentals?.grossMarginValue ?? "未加载"}%，ROE ${namedStock?.fundamentals?.roeValue ?? "未加载"}%，最近一期经营现金流 ${namedStock?.financialHistory?.at(-1)?.freeCashFlow ?? "未加载"} 亿元
  - 补充背景/聚焦要点: ${customPrompt || "深挖预期与现实的强烈反差、多方共赢但无真实需求的利益闭环、极端实锤数据对撞与大众情绪痛点"}

  【数字纪律】
只允许使用下方已加载科目里出现的数字。分部收入占比、产线落地率、市值、门店数量、回扣金额如果没有出现在已加载科目中，必须写成「未披露」，禁止编造 3.5%、数千亿或其他模板数字。

【核心方法论与执行步骤】:
  一、第一步：从“反常现象”抓核心矛盾
  - 找到“预期与现实的强烈反差”：找“所有人都觉得应该发生，但实际没发生”的现象（如：机器人预期替代工人 vs 都在跳舞；新能源预期暴涨 vs 4S店退网倒闭超4000家；医药预期降价 vs 11年收回扣1.84亿；开票经济预期合规 vs 虚开3亿赚1300万仅罚50万）。
  - 转化成直击痛点的问题（hookQuestion & anomalousContrast）。

  二、第二步：用“利益闭环”拆解底层逻辑
  - 找到“多方共赢但无真实需求”的利益闭环：
  - 讲清楚：钱从哪来、到哪去、谁在中间赚钱、最终谁承担成本（被割韭菜），并指明缺乏真实有效需求的关键卡点。

  三、第三步：用“实锤数据”击穿虚假繁荣
  - 找到公开可查的实锤数据（财报、公告、裁判文书）。
  - 用极端反差数据形成强烈视觉与心理冲击（如 2.6% vs 4449亿市值；批发暴涨 vs 渠道亏损73%倒闭4000家）。

  四、第四步：用“大众情绪”引爆传播
  - 找到大众最容易愤怒的痛点，拒绝晦涩专业术语，使用通俗口语化表达，直击拷问。
  - 产出爆款疑问反差标题、万字微信深度穿透长文、短视频分镜脚本（含黄金前3秒）和社交平台高能量锐评。

  【三大注意事项】:
  1. 信息真实性：公开可查的实锤数据；2. 逻辑严谨性：利益链条符合实际；3. 情绪适度性：客观中立合规。

  请严格输出以下结构化 JSON（只输出一个 JSON 对象，不要 Markdown 代码块）：
  {
    "targetName": "目标公司或赛道名称",
    "targetSymbol": "代码或 N/A",
    "industry": "所属行业",
    "topicTitle": "本期穿透主题标题",
    "anomalousContrast": {"expected": "大众预期", "reality": "骨感现实", "coreDilemmaQuestion": "核心反差提问"},
    "closedLoopMechanics": {"moneyOrigin": "钱从哪来", "moneyDestination": "钱到哪去", "intermediaryBeneficiaries": "谁在中间赚钱", "costBearer": "谁承担最终成本", "coreMissingDemand": "缺乏真实需求的关键节点", "chainSummary": "一句话利益链条"},
    "extremeContrastData": {"metricA": {"label": "虚高指标", "value": "数值", "context": "背景"}, "metricB": {"label": "真实指标", "value": "数值", "context": "背景"}, "contrastImpact": "反差冲击", "verifiableSource": "可查出处"},
    "emotionalExplosion": {"publicAngerTrigger": "公众愤怒点", "colloquialPunchline": "口语金句", "soulInterrogation": "灵魂拷问"},
    "hookQuestion": "爆款钩子问题",
    "contrastStatement": "反差结论陈述",
    "revenueStructure": [{"segment": "收入构成", "percentage": 65, "amount": "金额描述", "isRealCommercial": false, "note": "说明"}],
    "valuationContrast": {"marketCap": "市值描述", "realCommercialRevenue": "真实商业化收入", "realSharePercent": 3.5, "bubbleMultiple": "泡沫倍数", "conclusion": "结论"},
    "coldHardDataSummary": "实锤数据总结",
    "auditRedFlags": ["审计红旗1", "审计红旗2"],
    "hiddenClosedLoop": [{"step": 1, "title": "环节标题", "desc": "环节说明"}],
    "logicChainAnalysis": "逻辑链条分析",
    "emotionalResonance": "情绪共鸣文字",
    "viralTitles": [{"type": "疑问反差", "title": "标题", "hookStyle": "钩子风格"}],
    "wechatArticle": "微信长文正文",
    "shortVideoScript": {"hook3s": "前3秒钩子", "scenes": [{"sceneNumber": 1, "duration": "0-5s", "visual": "画面", "audio": "旁白", "emotionTag": "情绪标签"}], "callToAction": "行动号召"},
    "socialPost": "社交平台锐评",
    "signals": [{"id": "sig-1", "source": "来源", "category": "whistleblower", "content": "内容", "credibilityScore": 91, "status": "verified", "evidenceSnippet": "证据"}],
    "complianceDisclaimer": "合规声明"
  }
  `;

      const reportText = await callDeepSeek({
        system: "你是一位精通「反常现象→利益闭环→实锤数据→情绪引爆」通用方法论的顶级调查分析师。严谨客观、数据实锤、情绪击中痛点，只输出一个合法的JSON对象。",
        user: prompt,
        json: true,
        maxTokens: 8000,
      });

      const reportData = parseJsonResponse(reportText);
      res.json({ success: true, report: reportData });
    } catch (error: any) {
      console.error("Error in investigative deep dive:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate investigative deep dive",
      });
    }
  });

  // 5. AI 自然语言思路转选股量化策略生成器 (AI Strategy Generator)
  router.post("/generate-strategy", aiRateLimit, async (req, res) => {
    const { ideaPrompt } = req.body;
    if (!ideaPrompt || typeof ideaPrompt !== "string") {
      return res.status(400).json({ error: "Missing or invalid ideaPrompt" });
    }

    const trimmedPrompt = ideaPrompt.trim();
    const apiKey = process.env.DEEPSEEK_API_KEY;

    const generateLocalFallbackStrategy = (promptText: string) => {
      let styleTag: any = "价值白马";
      let strategyName = "核心资产稳健价值选股策略";
      let philosophy = `基于投资者思路「${promptText}」，聚焦具备宽阔经济护城河、高自由现金流及估值处于历史安全边际的优质核心资产。`;
      let period: any = "长线复利 (1-3年)";
      let risk: any = "中等平衡";

      if (promptText.includes("股息") || promptText.includes("分红") || promptText.includes("央企") || promptText.includes("收息")) {
        styleTag = "高股息红利";
        strategyName = "大类资产防御：高股息特估与现金流奶牛策略";
        philosophy = "在宏观利率下行期，筛选股息率>4%、资产负债率健康、自由现金流覆盖股息支付的优质央国企与公用事业龙头。";
        period = "长线复利 (1-3年)";
        risk = "低风险防御";
      } else if (promptText.includes("科技") || promptText.includes("芯片") || promptText.includes("算力") || promptText.includes("机器人") || promptText.includes("成长") || promptText.includes("爆发")) {
        styleTag = "高景气成长";
        strategyName = "硬科技突围：高研发与供应链放量成长策略";
        philosophy = "捕捉处于技术产业爆发期、研发支出占比高、具有全球竞争力或国产替代壁垒的高弹性赛道龙头。";
        period = "中线趋势 (3-6月)";
        risk = "高成长高波动";
      } else if (promptText.includes("出海") || promptText.includes("全球") || promptText.includes("外销")) {
        styleTag = "出海破局";
        strategyName = "全球化领军者：海外营收扩张与定价权策略";
        philosophy = "筛选海外收入占比>30%、具备全球成本与供应链优势、抗单一内需波动的全球化制造领头羊。";
        period = "长线复利 (1-3年)";
        risk = "中等平衡";
      }

      return attachPresetMatches({
        id: `strat_${Date.now()}`,
        ideaPrompt: promptText,
        strategyName,
        styleTag,
        philosophy,
        expectedHoldingPeriod: period,
        riskLevel: risk,
        rules: [
          {
            dimension: "盈利壁垒",
            metric: "毛利率 (Gross Margin)",
            condition: "持续高于 30% ~ 40%",
            rationale: "验证产品具备品牌溢价或技术壁垒，拒绝打价格战的同质化行业。",
          },
          {
            dimension: "盈利壁垒",
            metric: "净资产收益率 (ROE)",
            condition: "近 3 年平均 > 15%",
            rationale: "衡量企业将股东投入资本转化为净利润的内生造血能力。",
          },
          {
            dimension: "财报排雷",
            metric: "经营现金流净额 / 净利润",
            condition: "比值 ≥ 1.0 (现金转化率良好)",
            rationale: "防止纸面富贵与应收账款虚增，确保利润有真金白银沉淀。",
          },
          {
            dimension: "估值安全",
            metric: "PE-TTM 历史分位数",
            condition: "处于近 5 年历史百分位 ≤ 35%",
            rationale: "拒绝在机构狂热的高位接盘，获取戴维斯双击的安全边际。",
          },
          {
            dimension: "技术时机",
            metric: "关键支撑均线与筹码分布",
            condition: "股价企稳于 S1 强支撑或 MA60 生命线之上",
            rationale: "拒绝左侧单边阴跌接飞刀，等待右侧企稳放量建仓信号。",
          },
        ],
        executionPlan: {
          entryStrategy: "采取 3-3-4 分批金字塔建仓法：30%底仓初步建立，30%在回踩关键支撑位加仓，40%在有效突破颈线时追击加仓。",
          stopLossRule: "若个股有效跌破关键支撑位（如 S2 支撑或-8%绝对止损线），且基本面逻辑发生根本性恶化，无条件执行止损。",
          takeProfitRule: "当估值修复至历史 70% 分位以上，或 PEG > 1.5 时，分批逢高兑现利润（每次兑现 25%~30%）。",
          positionLimit: "单一标的持仓上限不得超过投资组合总市值的 20%，单一申万一级行业合计不得超过 35%。",
        },
        negativeChecklist: [
          "大股东质押率超过 50% 的标的一票否决",
          "连续 2 年经营活动现金流净额为负的一票否决",
          "近 3 年受到证监会或交易所公开立案调查的一票否决",
          "商誉占净资产比例超过 30% 的标的一票否决",
        ],
        createdAt: new Date().toISOString().split("T")[0],
      }, promptText);
    };

    try {

      if (!apiKey) {
        const fallbackStrategy = generateLocalFallbackStrategy(trimmedPrompt);
        return res.json({ success: true, strategy: fallbackStrategy });
      }

      const prompt = `你是一位精通A股、港股与美股量化投资与价值选股的买方基金经理。
  现在用户输入了一个关于选股的投资思路/直觉：
  “${trimmedPrompt}”

  请将这个思路提炼升华为一套严谨、可执行、数据驱动的【量化选股策略】。
  必须覆盖：
  1. 策略命名 (strategyName) 与风格分类 (styleTag: '价值白马' | '高股息红利' | '高景气成长' | '困境反转' | '小盘隐形冠军' | '出海破局')
  2. 投资哲学 (philosophy)：核心驱动逻辑、胜率来源、为什么能跑赢基准
  3. 预期持仓周期 (expectedHoldingPeriod: '短线波段 (1-3周)' | '中线趋势 (3-6月)' | '长线复利 (1-3年)')
  4. 风险收益等级 (riskLevel: '低风险防御' | '中等平衡' | '高成长高波动')
  5. 精准量化筛选指标清单 (rules)：包含维度 (盈利壁垒/财报排雷/成长驱动/估值安全/技术时机/机构偏好)、具体指标名称、数值条件（例如 >30%）以及设计初衷
  6. 严格执行纪律 (executionPlan)：分批建仓法、硬止损条件、分批止盈标准、仓位上限控制
  7. 一票否决清单 (negativeChecklist)：必须避开的4条地雷特征（如高质押、现金流差、虚增商誉等）
  8. 从现有核心池中挑选出最匹配该策略的候选股票（matchedStocks，提供 3 到 5 只，如贵州茅台 600519、宁德时代 300750、腾讯控股 00700、美的集团 000333、比亚迪 002594、中国神华 601088、海光信息 688041 等，并给出匹配分与高亮理由）。

  请只输出以下 JSON 对象（不要 Markdown 代码块）：
  {
    "strategyName": "策略名称",
    "styleTag": "价值白马",
    "philosophy": "投资哲学",
    "expectedHoldingPeriod": "长线复利 (1-3年)",
    "riskLevel": "中等平衡",
    "rules": [{"dimension": "盈利壁垒", "metric": "毛利率", "condition": ">30%", "rationale": "原因"}],
    "executionPlan": {"entryStrategy": "建仓纪律", "stopLossRule": "止损规则", "takeProfitRule": "止盈规则", "positionLimit": "仓位上限"},
    "negativeChecklist": ["一票否决项"],
    "matchedStocks": [{"symbol": "600519", "name": "贵州茅台", "market": "A-Share", "currentPrice": 1468.5, "peTTM": 23.4, "matchScore": 88, "highlightReasons": ["理由"], "metricsSnapshot": {"grossMargin": 91.8, "roe": 30.2, "debtRatio": 13.5, "pePercentile": 14.5, "dividendYield": 3.42}}]
  }
  `;

      const strategyText = await callDeepSeek({
        system: "你是一个专业的量化策略设计专家与买方投资总监。请只输出一个合法的JSON对象。",
        user: prompt,
        json: true,
        maxTokens: 8000,
      });

      const parsed = parseJsonResponse(strategyText);
      const fullStrategy = attachPresetMatches({
        ...parsed,
        id: `strat_${Date.now()}`,
        ideaPrompt: trimmedPrompt,
        createdAt: new Date().toISOString().split("T")[0],
      }, trimmedPrompt);

      res.json({ success: true, strategy: fullStrategy });
    } catch (error: any) {
      console.error("Error in generate-strategy:", error);
      // 兜底返回优质本地策略
      const fallback = generateLocalFallbackStrategy(req.body?.ideaPrompt || "稳健价值选股");
      res.json({ success: true, strategy: fallback });
    }
  });
  router.post("/ai-chat", aiRateLimit, async (req, res) => {
    try {
      const { message, chatHistory } = req.body;
      const symbol = String(req.body?.symbol || req.body?.stockContext?.symbol || '').trim();
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!symbol) {
        return res.status(400).json({ success: false, error: "缺少股票代码" });
      }
      let stock: StockData;
      try {
        stock = await loadCanonicalStock(symbol);
      } catch (error: any) {
        return res.status(502).json({ success: false, error: error?.message || "无法加载该代码的行情与财报" });
      }

      if (!apiKey) {
        return res.json({
          success: true,
          reply: `未配置 DEEPSEEK_API_KEY。${stock.name}（${stock.symbol}）服务端数据：现价 ${stock.currentPrice} ${stock.currency}，PE ${stock.peTTM}，基本面评分 ${stock.fundamentals.overallScore}，PE 历史分位 ${stock.valuation.historicalPePercentile}%。`,
        });
      }

      const systemPrompt = `你是一位精通股市投资与财报分析的智能投资顾问。
  当前用户正在查看股票: ${stock.name} (${stock.symbol})，所属行业: ${stock.sector}，当前价格: ${stock.currentPrice} ${stock.currency}。
  请结合五步法分析框架（1.宏观/行业、2.基本面、3.估值百分位、4.技术买点、5.资金仓位）为用户解答有关该股票的任何投资问题。语言亲切专业、条理清晰。这些数字来自服务端行情与财报，不要改用用户消息里自行报出的指标。`;

      // 多轮对话：将最近的历史消息注入上下文，使回答能够连贯衔接
      const historyMessages: DeepSeekMessage[] = (Array.isArray(chatHistory) ? chatHistory : [])
        .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-10)
        .map((m: any) => ({ role: m.role, content: m.content }));

      const reply = await callDeepSeek({
        system: systemPrompt,
        user: message,
        temperature: 0.6,
        history: historyMessages,
      });

      res.json({ success: true, reply });
    } catch (error: any) {
      console.error("Error in AI chat:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to process chat message",
      });
    }
  });

}
