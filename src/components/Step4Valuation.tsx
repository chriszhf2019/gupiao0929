import React, { useEffect, useState } from 'react';
import { StockData } from '../types/stock';
import { PieChart, ArrowDownRight, ArrowUpRight, Shield, Award, Sliders, Scale, Calculator } from 'lucide-react';
import { SemanticBadge } from './common/SemanticBadge';
import { calculateScenarioValuation, inferScenarioAssumptions } from '../utils/institutionalForensics';

interface Step4ValuationProps {
  stock: StockData;
}

export const Step4Valuation: React.FC<Step4ValuationProps> = ({ stock }) => {
  const v = stock.valuation;
  const percentile = v.historicalPePercentile;

  const inferred = inferScenarioAssumptions(stock);
  const [customCagr, setCustomCagr] = useState<number>(inferred.cagr);
  const [customPe, setCustomPe] = useState<number>(inferred.exitPe);

  useEffect(() => {
    const next = inferScenarioAssumptions(stock);
    setCustomCagr(next.cagr);
    setCustomPe(next.exitPe);
  }, [stock.symbol, stock.financialHistory, stock.valuation.peTTM]);

  const scenarioModel = calculateScenarioValuation(stock, customCagr, customPe);

  // 状态徽章色彩（低饱和金融色）
  let statusBadgeColor = 'bg-[#4A7C6F]/15 text-[#376156] dark:text-[#67A394] border-[#4A7C6F]/30';
  if (percentile > 80) {
    statusBadgeColor = 'bg-[#A84A3E]/15 text-[#8C3A2F] dark:text-[#E2897E] border-[#A84A3E]/30';
  } else if (percentile > 60) {
    statusBadgeColor = 'bg-[#B07238]/15 text-[#865121] dark:text-[#DE9E62] border-[#B07238]/30';
  } else if (percentile > 30) {
    statusBadgeColor = 'bg-[#3E6F73]/15 text-[#2B5458] dark:text-[#5B9DA2] border-[#3E6F73]/30';
  }

  // 相对合理估值的折价率
  const discountPercent = Math.round(((v.fairValuePrice - stock.currentPrice) / v.fairValuePrice) * 100);

  // 估值温度（温度 = PE 历史分位）：0-30 低估买入 / 30-50 合理偏低 / 50-70 合理观望 / 70-100 高估减仓
  let tempZone = { label: '高估 · 谨慎/逐步减仓', color: 'text-[#A84A3E]', bar: 'bg-[#A84A3E]' };
  if (percentile < 30) tempZone = { label: '低估 · 买入区间', color: 'text-[#4A7C6F]', bar: 'bg-[#4A7C6F]' };
  else if (percentile < 50) tempZone = { label: '合理偏低 · 持有关注', color: 'text-[#3E6F73]', bar: 'bg-[#3E6F73]' };
  else if (percentile < 70) tempZone = { label: '合理 · 观望', color: 'text-[#B0803C]', bar: 'bg-[#B0803C]' };

  return (
    <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-6 shadow-xs mb-8 transition-colors">
      {/* 模块标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E3E7E1] dark:border-[#2A383A] pb-4 mb-6 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#3E6F73]/10 text-[#3E6F73] dark:text-[#76B4B9] border border-[#3E6F73]/20">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                Step 4: 估值水平与历史百分位
              </h2>
              <SemanticBadge tier="fact" subText="历史5年分位客观统计" />
            </div>
            <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] mt-0.5">
              量化动态 PE / PB 所处历史极值区间，严格检验买入安全边际
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] px-3.5 py-1.5 rounded-xl">
          <span className="text-xs text-[#576F73] dark:text-[#9BB2B4]">历史分位数:</span>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${statusBadgeColor}`}>
            {v.statusZh} (历史 {percentile}%)
          </span>
        </div>
      </div>

      {/* 核心指标卡片矩阵 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* 动态 PE TTM */}
        <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-4">
          <div className="text-xs text-[#576F73] dark:text-[#9BB2B4] mb-1 font-medium">当前 PE (动态/TTM)</div>
          <div className="text-2xl font-black font-mono text-[#1F3437] dark:text-white mb-1 tabular-nums">
            {v.peTTM}
            <span className="text-xs text-[#7A9194] font-sans font-normal ml-1">倍</span>
          </div>
          <div className="flex items-center text-[11px] font-medium text-[#4A7C6F]">
            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            <span>5年均值: {v.pe5YearMean} 倍</span>
          </div>
        </div>

        {/* 历史 PE 百分位 + 估值温度计 */}
        <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-4">
          <div className="text-xs text-[#576F73] dark:text-[#9BB2B4] mb-1 font-medium">估值温度（PE 历史分位）</div>
          <div className="text-2xl font-black font-mono text-[#3E6F73] dark:text-[#76B4B9] mb-1 tabular-nums">
            {percentile}<span className="text-xs font-normal text-[#7A9194] font-sans">°C</span>
          </div>
          <div className="mb-1.5 h-1.5 rounded-full bg-[#E3E7E1] dark:bg-[#2A383A] overflow-hidden">
            <div className={`h-full ${tempZone.bar}`} style={{ width: `${Math.min(100, Math.max(0, percentile))}%` }} />
          </div>
          <div className={`text-[11px] font-bold ${tempZone.color}`}>{tempZone.label}</div>
        </div>

        {/* 市净率 PB */}
        <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-4">
          <div className="text-xs text-[#576F73] dark:text-[#9BB2B4] mb-1 font-medium">市净率 PB</div>
          <div className="text-2xl font-black font-mono text-[#1F3437] dark:text-white mb-1 tabular-nums">
            {v.pb}
            <span className="text-xs text-[#7A9194] font-sans font-normal ml-1">倍</span>
          </div>
          <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">
            PEG 指标: <span className="font-mono font-bold text-[#1F3437] dark:text-white">{v.peg}</span>
          </div>
        </div>

        {/* 目标合理估值折价 */}
        <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-4">
          <div className="text-xs text-[#576F73] dark:text-[#9BB2B4] mb-1 font-medium">目标公允价值</div>
          <div className="text-2xl font-black font-mono text-[#1F3437] dark:text-white mb-1 tabular-nums">
            {stock.currency === 'USD' ? '$' : '¥'}{v.fairValuePrice}
          </div>
          <div className={`flex items-center text-[11px] font-medium ${discountPercent >= 0 ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'}`}>
            {discountPercent >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
            <span>{discountPercent >= 0 ? `具备 ${discountPercent}% 安全折价` : `溢价超买 ${Math.abs(discountPercent)}%`}</span>
          </div>
        </div>
      </div>

      {/* 历史分位标尺条 */}
      <div className="p-5 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
            历史估值区间标尺分布（5年滚动）
          </span>
          <span className="font-mono text-[#3E6F73] dark:text-[#76B4B9] font-semibold">
            当前定位于 {percentile}% 处
          </span>
        </div>

        {/* 彩色阶梯进度条 */}
        <div className="h-3 rounded-full bg-[#E3E7E1] dark:bg-[#2A383A] relative overflow-hidden flex">
          <div className="w-[30%] bg-[#4A7C6F]/80" title="低估区 (0-30%)" />
          <div className="w-[40%] bg-[#3E6F73]/80" title="合理中位数 (30-70%)" />
          <div className="w-[30%] bg-[#A84A3E]/80" title="泡沫高估区 (70-100%)" />
        </div>

        <div className="flex justify-between text-[11px] text-[#7A9194] font-mono">
          <span>0% (极度低估)</span>
          <span>30% (黄金买点)</span>
          <span>70% (合理上限)</span>
          <span>100% (狂热高估)</span>
        </div>
      </div>

      {/* 机构级动态多情景敏感性估值测算器 */}
      <div className="mt-6 p-5 rounded-2xl bg-[#F6F7F5]/90 dark:bg-[#141A1B] border border-[#CBD5E1] dark:border-[#2A383A] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E3E7E1] dark:border-[#2A383A] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#3E6F73]/15 text-[#3E6F73] dark:text-[#76B4B9]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-2">
                <span>买方多情景动态敏感性测算器 (Scenario Valuation Workbench)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#3E6F73]/10 text-[#3E6F73] dark:text-[#76B4B9] font-mono font-bold">
                  拒绝单一假定
                </span>
              </h4>
              <p className="text-xs text-[#576F73] dark:text-[#9BB2B4]">
                动态模拟「悲观 (Bear) / 基准 (Base) / 乐观 (Bull)」三种情景，实时测算公允价与赔率期望
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-white dark:bg-[#1C2426] px-3 py-1 rounded-lg border border-[#E3E7E1] dark:border-[#2A383A] text-xs">
            <Scale className="w-3.5 h-3.5 text-[#3E6F73] dark:text-[#76B4B9]" />
            <span className="text-[#576F73] dark:text-[#9BB2B4]">当前盈亏比 (赔率):</span>
            <span className="font-mono font-black text-[#1F3437] dark:text-white">
              {scenarioModel.riskRewardRatio}:1
            </span>
          </div>
        </div>

        {/* 交互滑块控制区 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A]">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-[#1F3437] dark:text-[#E5EBEA]">基准未来三年利润 CAGR 增速:</span>
              <span className="font-mono font-bold text-[#3E6F73] dark:text-[#76B4B9]">{customCagr}%</span>
            </div>
            <input
              type="range"
              min="-10"
              max="35"
              step="1"
              value={customCagr}
              onChange={(e) => setCustomCagr(Number(e.target.value))}
              className="w-full h-1.5 bg-[#E3E7E1] dark:bg-[#2A383A] rounded-lg appearance-none cursor-pointer accent-[#3E6F73]"
            />
            <div className="flex justify-between text-[10px] text-[#7A9194] font-mono mt-1">
              <span>-10%</span>
              <span>8% 历史不足时的默认</span>
              <span>35%</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-[#1F3437] dark:text-[#E5EBEA]">基准给予出局估值 PE 倍数:</span>
              <span className="font-mono font-bold text-[#3E6F73] dark:text-[#76B4B9]">{customPe}x</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="1"
              value={customPe}
              onChange={(e) => setCustomPe(Number(e.target.value))}
              className="w-full h-1.5 bg-[#E3E7E1] dark:bg-[#2A383A] rounded-lg appearance-none cursor-pointer accent-[#3E6F73]"
            />
            <div className="flex justify-between text-[10px] text-[#7A9194] font-mono mt-1">
              <span>10x (重资产/周期)</span>
              <span>25x (蓝筹核心)</span>
              <span>60x (硬科技溢价)</span>
            </div>
          </div>
        </div>

        {/* 三种情景对比结果卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* 悲观情景 */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#1C2426] border border-[#ECC5BE] dark:border-[#522E29]/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#8C3A2F] dark:text-[#E2897E]">悲观情景 (Bear Case)</span>
              <span className="text-[10px] font-mono text-[#576F73] dark:text-[#9BB2B4]">权重 25%</span>
            </div>
            <div className="text-xl font-mono font-bold text-[#1F3437] dark:text-white mb-1">
              {stock.currency === 'USD' ? '$' : '¥'}{scenarioModel.bear.fairValue}
            </div>
            <div className="flex items-center text-xs font-mono font-semibold text-[#A84A3E] mb-2">
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              <span>预期下行空间 {scenarioModel.bear.upsideDownside}%</span>
            </div>
            <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">
              假定增速下修至 {scenarioModel.bear.cagr3Y}%，估值收缩至 {scenarioModel.bear.terminalPe}x PE
            </p>
          </div>

          {/* 基准情景 */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#1C2426] border border-[#3E6F73]/50 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#2B5458] dark:text-[#76B4B9]">中性基准 (Base Case)</span>
              <span className="text-[10px] font-mono text-[#576F73] dark:text-[#9BB2B4]">权重 50%</span>
            </div>
            <div className="text-xl font-mono font-bold text-[#1F3437] dark:text-white mb-1">
              {stock.currency === 'USD' ? '$' : '¥'}{scenarioModel.base.fairValue}
            </div>
            <div className={`flex items-center text-xs font-mono font-semibold mb-2 ${
              scenarioModel.base.upsideDownside >= 0 ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'
            }`}>
              {scenarioModel.base.upsideDownside >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              <span>预期收益空间 {scenarioModel.base.upsideDownside > 0 ? `+${scenarioModel.base.upsideDownside}` : scenarioModel.base.upsideDownside}%</span>
            </div>
            <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">
              基准 {scenarioModel.base.cagr3Y}% 增速、{scenarioModel.base.terminalPe}x 退出 PE。{scenarioModel.assumptionNote}
            </p>
          </div>

          {/* 乐观情景 */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#1C2426] border border-[#A7D1C7] dark:border-[#2F4D45]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#376156] dark:text-[#67A394]">乐观情景 (Bull Case)</span>
              <span className="text-[10px] font-mono text-[#576F73] dark:text-[#9BB2B4]">权重 25%</span>
            </div>
            <div className="text-xl font-mono font-bold text-[#1F3437] dark:text-white mb-1">
              {stock.currency === 'USD' ? '$' : '¥'}{scenarioModel.bull.fairValue}
            </div>
            <div className="flex items-center text-xs font-mono font-semibold text-[#4A7C6F] mb-2">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              <span>预期收益空间 +{scenarioModel.bull.upsideDownside}%</span>
            </div>
            <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">
              行业景气爆发，利润增速升至 {scenarioModel.bull.cagr3Y}%，戴维斯双击给予 {scenarioModel.bull.terminalPe}x PE
            </p>
          </div>
        </div>

        {/* 概率加权中枢公允价总结条 */}
        <div className="p-3.5 rounded-xl bg-[#3E6F73]/10 border border-[#3E6F73]/25 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-[#1F3437] dark:text-white">
            <span className="font-bold">三情景概率加权公允价值：</span>
            <span className="font-mono text-base font-black text-[#2B5458] dark:text-[#76B4B9] ml-1">
              {stock.currency === 'USD' ? '$' : '¥'}{scenarioModel.probabilityWeightedPrice}
            </span>
            <span className="text-[#576F73] dark:text-[#9BB2B4] ml-2">
              (现价 {stock.currency === 'USD' ? '$' : '¥'}{stock.currentPrice}，
              {scenarioModel.probabilityWeightedPrice >= stock.currentPrice
                ? `安全边际充足，期望折价 +${Math.round(((scenarioModel.probabilityWeightedPrice - stock.currentPrice) / stock.currentPrice) * 100)}%`
                : `存在溢价折损风险 -${Math.round(((stock.currentPrice - scenarioModel.probabilityWeightedPrice) / stock.currentPrice) * 100)}%`}
              )
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
