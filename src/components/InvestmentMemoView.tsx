import React, { useState } from 'react';
import { StockData } from '../types/stock';
import { computeFiveStepSummary } from '../utils/stockCalculator';
import { FileText, Copy, Check, Printer, ShieldCheck, PieChart, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';

interface InvestmentMemoViewProps {
  stock: StockData;
  macroSlider: number;
}

export const InvestmentMemoView: React.FC<InvestmentMemoViewProps> = ({
  stock,
  macroSlider,
}) => {
  const [copied, setCopied] = useState(false);

  const fiveStepSummary = computeFiveStepSummary(stock, macroSlider);
  const fiveStepScore = fiveStepSummary.totalScore;
  const fundScore = stock.fundamentals.overallScore;
  const v = stock.valuation;
  const t = stock.technical;
  const p = t.positionStrategy;
  const cur = stock.currency === 'USD' ? '$' : '¥';
  const discountPercent = Math.round(((v.fairValuePrice - stock.currentPrice) / v.fairValuePrice) * 100);
  const ratingZh =
    fiveStepSummary.verdictLevel === 'strong'
      ? '强烈推荐建仓 (Strong Buy)'
      : fiveStepSummary.verdictLevel === 'accumulate'
      ? '建议逢低分批吸纳 (Accumulate)'
      : fiveStepSummary.verdictLevel === 'caution'
      ? '风险偏高谨慎观望 (Caution / Wait)'
      : '观望持有 (Hold)';
  const ratingShortZh =
    fiveStepSummary.verdictLevel === 'strong'
      ? '强烈推荐建仓'
      : fiveStepSummary.verdictLevel === 'accumulate'
      ? '建议分批吸纳'
      : fiveStepSummary.verdictLevel === 'caution'
      ? '风险偏高谨慎观望'
      : '观望持有';

  const memoMarkdown = `# 【Zane Invest 投资备忘录】${stock.name} (${stock.symbol}) 投研深度评估

**评估日期**: ${new Date().toLocaleDateString('zh-CN')}
**最新价**: ${cur}${stock.currentPrice} | **日涨跌**: ${stock.changePercent}%
**五步法综合评分**: ${fiveStepScore} / 100
**投资研判评级**: ${ratingZh}

---

### 一、 宏观与行业环境研判 (Step 1 & 2)
- **行业赛道**: ${stock.sector} (${stock.macro.industryStageZh})
- **政策导向**: ${stock.macro.policyTone} (政策催化热度: ${macroSlider}/10)
- **核心催化**: ${stock.macro.keyCatalysts.join('；')}
- **宏观风险**: ${stock.macro.keyRisks.join('；')}

### 二、 公司基本面排雷与质量 (Step 3)
- **基本面健康得分**: ${fundScore} / 100 (评级: ${stock.fundamentals.grade})
- **最新毛利率**: ${stock.fundamentals.grossMarginValue}% | **ROE**: ${stock.fundamentals.roeValue}%
- **经营净现金流**: ${stock.fundamentals.cashFlowValue > 0 ? '充沛正向' : '受限'}
- **资产负债率**: ${stock.fundamentals.debtRatioValue}%
- **护城河壁垒**: 行业龙头壁垒及品牌定价权

### 三、 估值水平与历史百分位 (Step 4)
- **当前 PE (动态/TTM)**: ${v.peTTM} 倍 (位于历史近5年 ${v.historicalPePercentile}% 低位)
- **估值状态**: ${v.statusZh}
- **合理估值基准**: ${cur}${v.fairValuePrice} (较现价${discountPercent >= 0 ? `折价 ${discountPercent}%` : `溢价 ${Math.abs(discountPercent)}%`})
- **安全边际买入价**: ${cur}${v.marginOfSafetyPrice}
- **股息收益率**: ${v.dividendYield}%

### 四、 技术形态与建仓三部曲纪律 (Step 5)
- **形态通道**: ${t.trendChannelZh} (${t.macdSignalZh}, RSI 14: ${t.rsi})
- **关键支撑**: ${cur}${t.supportLevel1} (强支撑) / ${cur}${t.supportLevel2} (次级支撑)
- **关键阻力**: ${cur}${t.resistanceLevel1} (第一阻力) / ${cur}${t.resistanceLevel2} (第二阻力)

**五步法分批建仓执行规划**:
1. **底仓 (第一批 ${p.firstBatch.percent}%)**: 目标价位 ${cur}${p.firstBatch.targetPrice} (${p.firstBatch.note})
2. **回踩加仓 (第二批 ${p.secondBatch.percent}%)**: 目标价位 ${cur}${p.secondBatch.targetPrice} (${p.secondBatch.note})
3. **突破顺势 (第三批 ${p.thirdBatch.percent}%)**: 目标价位 ${cur}${p.thirdBatch.targetPrice} (${p.thirdBatch.note})
- **严格止损线**: ${cur}${p.stopLossPrice} (跌破无条件离场减仓)
- **阶段止盈线**: ${cur}${p.takeProfitPrice} (获利达成目标)

---
*声明：本备忘录由 Zane Invest WORKBENCH 量化决策引擎生成，仅供投资策略与纪律参考。*
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(memoMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Zane Invest 机构级投研备忘录</span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                {stock.name} ({stock.symbol})
              </span>
            </h2>
            <p className="text-xs text-slate-400">一键导出机构级投资评估、五步法指标沉淀与分批建仓执行指令</p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '已复制 Markdown' : '复制 Markdown'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>打印 / 导出 PDF</span>
          </button>
        </div>
      </div>

      {/* Styled Printable Memo Document */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-100 font-sans space-y-8 print:bg-white print:text-black print:border-none print:shadow-none">
        
        {/* Memo Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold tracking-wider uppercase mb-1">
              <span>ZANE INVEST RESEARCH WORKBENCH</span>
              <span>•</span>
              <span>INVESTMENT MEMO</span>
            </div>
            <h1 className="text-2xl font-black text-white">
              {stock.name} ({stock.symbol}) 投资研判深度备忘录
            </h1>
            <div className="flex items-center space-x-4 text-xs text-slate-400 mt-2 font-mono">
              <span>评估时间: {new Date().toLocaleDateString('zh-CN')}</span>
              <span>基准价格: {cur}{stock.currentPrice}</span>
              <span>所属行业: {stock.sector}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
            <div className="text-center">
              <div className="text-[10px] text-slate-400 uppercase">五步综合评分</div>
              <div className="text-3xl font-black font-mono text-indigo-400">
                {fiveStepScore} <span className="text-xs text-slate-400 font-normal">/100</span>
              </div>
            </div>
            <div className="w-[1px] h-10 bg-slate-700" />
            <div className="text-center">
              <div className="text-[10px] text-slate-400 uppercase">建议执行策略</div>
              <div className="text-sm font-bold text-emerald-400 mt-1">
                {ratingShortZh}
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1 & 2 */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-blue-400 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>一、 宏观政策与行业生命周期 (Step 1 & 2)</span>
            </h3>
            <div className="text-xs space-y-1.5 text-slate-300">
              <p><strong>行业赛道阶段:</strong> {stock.sector} - {stock.macro.industryStageZh}</p>
              <p><strong>政策导向研判:</strong> {stock.macro.policyTone} (政策催化热度: {macroSlider}/10)</p>
              <p><strong>核心驱动催化:</strong> {stock.macro.keyCatalysts.join('；')}</p>
              <p className="text-rose-400"><strong>宏观潜在风险:</strong> {stock.macro.keyRisks.join('；')}</p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4" />
              <span>二、 公司基本面排雷与护城河 (Step 3)</span>
            </h3>
            <div className="text-xs space-y-1.5 text-slate-300">
              <p><strong>基本面排雷得分:</strong> {fundScore}/100 (评级: {stock.fundamentals.grade})</p>
              <p><strong>盈利中枢:</strong> 毛利率 {stock.fundamentals.grossMarginValue}% | 净资产收益率 ROE {stock.fundamentals.roeValue}%</p>
              <p><strong>现金流质量:</strong> 经营现金流 {stock.fundamentals.cashFlowValue > 0 ? '充沛正向流入' : '受限'}</p>
              <p><strong>护城河壁垒:</strong> 品牌溢价与核心产品技术护城河</p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-amber-400 flex items-center space-x-2">
              <PieChart className="w-4 h-4" />
              <span>三、 估值水平与历史百分位 (Step 4)</span>
            </h3>
            <div className="text-xs space-y-1.5 text-slate-300">
              <p><strong>当前市盈率:</strong> PE(TTM) {v.peTTM} 倍 (处于历史近5年 {v.historicalPePercentile}% 分位)</p>
              <p><strong>估值区间状态:</strong> {v.statusZh} (PB: {v.pb} 倍，股息率: {v.dividendYield}%)</p>
              <p><strong>合理价值基准:</strong> {cur}{v.fairValuePrice} ({discountPercent >= 0 ? `折价 ${discountPercent}%` : `溢价 ${Math.abs(discountPercent)}%`})</p>
              <p><strong>安全边际买点:</strong> {cur}{v.marginOfSafetyPrice}</p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-purple-400 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>四、 技术形态与支撑压力区间 (Step 5)</span>
            </h3>
            <div className="text-xs space-y-1.5 text-slate-300">
              <p><strong>技术形态通道:</strong> {t.trendChannelZh} ({t.macdSignalZh}, RSI: {t.rsi})</p>
              <p><strong>强支撑位:</strong> {cur}{t.supportLevel1} | <strong>次级支撑:</strong> {cur}{t.supportLevel2}</p>
              <p><strong>强阻力位:</strong> {cur}{t.resistanceLevel1} | <strong>次级阻力:</strong> {cur}{t.resistanceLevel2}</p>
              <p><strong>买入时机建议:</strong> {t.timingAdvice}</p>
            </div>
          </div>
        </div>

        {/* Section 5 Execution Discipline */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Zane Invest 五步交易纪律执行方案：建仓三部曲与风控线</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mb-4">
            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
              <div className="text-blue-400 font-bold mb-1">第一批：建底仓 ({p.firstBatch.percent}%)</div>
              <div className="font-mono text-white font-bold mb-1">目标买点: {cur}{p.firstBatch.targetPrice}</div>
              <p className="text-slate-400 text-[11px]">{p.firstBatch.note}</p>
            </div>

            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
              <div className="text-emerald-400 font-bold mb-1">第二批：回踩强支撑 ({p.secondBatch.percent}%)</div>
              <div className="font-mono text-white font-bold mb-1">目标买点: {cur}{p.secondBatch.targetPrice}</div>
              <p className="text-slate-400 text-[11px]">{p.secondBatch.note}</p>
            </div>

            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
              <div className="text-purple-400 font-bold mb-1">第三批：突破加仓 ({p.thirdBatch.percent}%)</div>
              <div className="font-mono text-white font-bold mb-1">目标买点: {cur}{p.thirdBatch.targetPrice}</div>
              <p className="text-slate-400 text-[11px]">{p.thirdBatch.note}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs bg-slate-900 p-3 rounded-lg border border-slate-800 gap-2">
            <div className="text-rose-400">
              <strong>严格止损风控线 (Stop Loss):</strong> {cur}{p.stopLossPrice} (若跌破强支撑位坚决止损控制回撤)
            </div>
            <div className="text-emerald-400">
              <strong>阶段止盈目标 (Take Profit):</strong> {cur}{p.takeProfitPrice} (达到预期价值后分批兑现收益)
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
