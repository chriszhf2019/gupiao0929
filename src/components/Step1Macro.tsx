import React, { useState } from 'react';
import { StockData } from '../types/stock';
import { Globe, Layers, Flame, CheckCircle2, AlertTriangle, TrendingUp, Sparkles, Compass, ChevronDown, ChevronUp } from 'lucide-react';
import { SemanticBadge } from './common/SemanticBadge';
import { GlobalLiquidityRadar } from './macro/GlobalLiquidityRadar';

interface Step1MacroProps {
  stock: StockData;
  macroSlider: number;
  onMacroSliderChange: (val: number) => void;
}

export const Step1Macro: React.FC<Step1MacroProps> = ({
  stock,
  macroSlider,
  onMacroSliderChange,
}) => {
  const [showGlobalRadar, setShowGlobalRadar] = useState(false);
  const getHeatLabel = (score: number) => {
    if (score >= 9)
      return {
        text: '极度强劲 / 政策超级周期',
        color: 'text-[#4A7C6F] bg-[#4A7C6F]/10 border-[#4A7C6F]/30',
      };
    if (score >= 7)
      return {
        text: '利好频出 / 积极催化',
        color: 'text-[#3E6F73] bg-[#3E6F73]/10 border-[#3E6F73]/30',
      };
    if (score >= 5)
      return {
        text: '温和向好 / 中性偏多',
        color: 'text-[#1F3437] dark:text-[#A6C0C3] bg-[#1F3437]/10 border-[#1F3437]/30',
      };
    if (score >= 3)
      return {
        text: '政策平淡 / 行业筑底',
        color: 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
      };
    return {
      text: '政策压制 / 强逆风环境',
      color: 'text-[#A84A3E] bg-[#A84A3E]/10 border-[#A84A3E]/30',
    };
  };

  const heatInfo = getHeatLabel(macroSlider);

  return (
    <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-6 shadow-xs mb-8 transition-colors">
      {/* 模块标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E3E7E1] dark:border-[#2A383A] pb-4 mb-6 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#3E6F73]/10 text-[#3E6F73] dark:text-[#76B4B9] border border-[#3E6F73]/20">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                Step 1 & 2: 宏观流动性与行业生命周期
              </h2>
              <SemanticBadge tier="ai" subText="多因子催化研判" />
            </div>
            <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] mt-0.5">
              量化宏观流动性松紧、产业扶持政策红利与所属赛道渗透率曲线
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#576F73] dark:text-[#9BB2B4]">所属行业:</span>
          <span className="text-xs font-semibold text-[#1F3437] dark:text-[#E5EBEA] px-2.5 py-1 rounded-lg bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A]">
            {stock.macro.sectorName}
          </span>
        </div>
      </div>

      {/* 政策热度滑块调节器 */}
      <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <label className="text-sm font-semibold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-2">
              <Flame className="w-4 h-4 text-[#3E6F73]" />
              <span>宏观政策热度自定义评估 (1 - 10 分)</span>
            </label>
            <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] mt-0.5">
              滑块只记下你自己的热度判断。综合评分使用标的上的政策催化分和行业阶段，拖动不会改写结论。
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2.5 py-1 rounded-lg border font-semibold ${heatInfo.color}`}>
              {heatInfo.text}
            </span>
            <span className="text-xl font-black font-mono text-[#3E6F73] dark:text-[#76B4B9]">
              {macroSlider} / 10
            </span>
          </div>
        </div>

        <div className="relative pt-2">
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={macroSlider}
            onChange={(e) => onMacroSliderChange(Number(e.target.value))}
            className="w-full h-2 bg-[#E3E7E1] dark:bg-[#2A383A] rounded-lg appearance-none cursor-pointer accent-[#3E6F73]"
          />
          <div className="flex justify-between text-[10px] text-[#7A9194] mt-1.5 font-mono">
            <span>1 (极端逆风)</span>
            <span>3 (中性偏冷)</span>
            <span>5 (温和修复)</span>
            <span>7 (利好频出)</span>
            <span>10 (超级刺激)</span>
          </div>
        </div>
      </div>

      {/* 宏观三因子与行业生命周期看板 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* 宏观因子解读 */}
        <div className="p-4 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#3E6F73]" />
              <span>当前宏观流动性与货币政策基调</span>
            </h3>
            <SemanticBadge tier="fact" subText="央行公开操作" />
          </div>

          <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] leading-relaxed">
            {stock.macro.monetaryPolicySummary}
          </p>

          <div className="pt-2 border-t border-[#E3E7E1] dark:border-[#2A383A] text-xs flex items-center justify-between font-mono">
            <span className="text-[#576F73] dark:text-[#9BB2B4]">宏观景气分值:</span>
            <span className="font-bold text-[#3E6F73] dark:text-[#76B4B9]">{stock.macro.macroScore} / 100</span>
          </div>
        </div>

        {/* 行业生命周期 */}
        <div className="p-4 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-[#3E6F73]" />
              <span>所属行业生命周期与供需格局</span>
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#3E6F73]/15 text-[#3E6F73] dark:text-[#76B4B9] font-medium">
              {stock.macro.industryStage}
            </span>
          </div>

          <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] leading-relaxed">
            {stock.macro.industryGrowthDriver}
          </p>

          <div className="pt-2 border-t border-[#E3E7E1] dark:border-[#2A383A] text-xs flex items-center justify-between font-mono">
            <span className="text-[#576F73] dark:text-[#9BB2B4]">行业景气增速预估:</span>
            <span className="font-bold text-[#4A7C6F]">+{stock.macro.industryGrowthRate}% 复合年增</span>
          </div>
        </div>
      </div>

      {/* 全球流动性雷达与宏观先行指标折叠区 */}
      <div className="pt-2 border-t border-[#E3E7E1] dark:border-[#2A383A]">
        <button
          type="button"
          onClick={() => setShowGlobalRadar(!showGlobalRadar)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] text-xs font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA] transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-[#3E6F73] dark:text-[#76B4B9]" />
            <span>查看【全球流动性雷达 & 中美利差 / 风险溢价 ERP / 两融杠杆】先行指标看板</span>
          </div>
          <div className="flex items-center space-x-1 text-[11px] text-[#3E6F73] dark:text-[#76B4B9]">
            <span>{showGlobalRadar ? '收起指标' : '展开指标'}</span>
            {showGlobalRadar ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showGlobalRadar && (
          <div className="mt-4">
            <GlobalLiquidityRadar />
          </div>
        )}
      </div>
    </div>
  );
};
