import React from 'react';
import { StockData } from '../types/stock';
import { computeFiveStepSummary, FiveStepVerdictLevel } from '../utils/stockCalculator';
import { Layers, ShieldCheck, PieChart, LineChart } from 'lucide-react';
import { SemanticBadge } from './common/SemanticBadge';

const VERDICT_STYLES: Record<FiveStepVerdictLevel, string> = {
  strong: 'bg-[#4A7C6F]/15 text-[#376156] dark:text-[#67A394] border-[#4A7C6F]/40',
  accumulate: 'bg-[#3E6F73]/15 text-[#2B5458] dark:text-[#5B9DA2] border-[#3E6F73]/40',
  hold: 'bg-[#B0803C]/15 text-[#8A6226] dark:text-[#D9B77C] border-[#B0803C]/40',
  caution: 'bg-[#A84A3E]/15 text-[#7D3228] dark:text-[#D1766B] border-[#A84A3E]/40',
};

interface StepNavigationProps {
  activeStep: number;
  onSelectStep: (step: number) => void;
  currentStock: StockData;
  macroSlider: number;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  activeStep,
  onSelectStep,
  currentStock,
  macroSlider,
}) => {
  const summary = computeFiveStepSummary(currentStock, macroSlider);

  const steps = [
    {
      id: 1,
      title: 'Step 1 & 2',
      name: '宏观与行业环境',
      icon: Layers,
      subtext: `催化 ${currentStock.macro.policyCatalystScore}/10 · 个人备注 ${macroSlider}/10`,
      score: `${summary.macroPts}/20 分`,
      tier: 'ai' as const,
    },
    {
      id: 3,
      title: 'Step 3',
      name: '公司基本面扫描',
      icon: ShieldCheck,
      subtext: `综合评级: ${currentStock.fundamentals.grade}`,
      score: `${summary.fundPts}/30 分`,
      tier: 'fact' as const,
    },
    {
      id: 4,
      title: 'Step 4',
      name: '估值水平与百分位',
      icon: PieChart,
      subtext: `${currentStock.valuation.historicalPePercentile}% 历史百分位`,
      score: `${summary.valPts}/25 分`,
      tier: 'fact' as const,
    },
    {
      id: 5,
      title: 'Step 5',
      name: '技术买点与时机',
      icon: LineChart,
      subtext: currentStock.technical.macdSignalZh,
      score: `${summary.techPts}/25 分`,
      tier: 'risk' as const,
    },
  ];

  return (
    <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-5 shadow-xs mb-8 transition-colors">
      {/* 标的头部信息栏 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#E3E7E1] dark:border-[#2A383A] pb-4 mb-5 gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-xl font-serif font-black text-[#1F3437] dark:text-[#E5EBEA]">
              {currentStock.name}
            </span>
            <span className="text-sm font-mono text-[#576F73] dark:text-[#9BB2B4]">
              ({currentStock.symbol})
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-lg bg-[#F6F7F5] dark:bg-[#141A1B] text-[#1F3437] dark:text-[#E5EBEA] border border-[#E3E7E1] dark:border-[#2A383A] font-medium">
              {currentStock.sector}
            </span>
            {(currentStock.financialSource === 'tushare' || currentStock.financialSource === 'eastmoney') ? (
              <SemanticBadge tier="fact" subText="真实财报已同步" />
            ) : (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded border border-[#B0803C]/40 bg-[#B0803C]/10 text-[#8A6226] dark:text-[#D9B77C] font-semibold"
                title="未同步到真实财报接口，当前财报为内置样例数据，仅供演示方法论"
              >
                财报为样例数据
              </span>
            )}
            {currentStock.isRealtime !== true && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded border border-[#A84A3E]/40 bg-[#A84A3E]/10 text-[#A84A3E] font-semibold"
                title="实时行情源暂不可用（或该市场暂不支持实时），当前价格/技术指标为内置演示数据，非真实行情"
              >
                行情为演示数据
              </span>
            )}
          </div>
          <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] mt-1.5 font-mono">
            动态 PE: <span className="text-[#1F3437] dark:text-[#E5EBEA] font-bold">{currentStock.peTTM} 倍</span> | 
            现价: <span className="text-[#1F3437] dark:text-[#E5EBEA] font-bold">{currentStock.currency === 'USD' ? '$' : '¥'}{currentStock.currentPrice}</span> | 
            总市值: <span className="text-[#1F3437] dark:text-[#E5EBEA] font-bold">{currentStock.marketCap}</span>
          </p>
        </div>

        {/* 五步综合量化评分箱 */}
        <div className="flex items-center space-x-4 bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] px-4 py-2.5 rounded-xl">
          <div className="text-right">
            <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] font-medium">五步综合研判</div>
            <div className="text-2xl font-black font-mono text-[#1F3437] dark:text-[#76B4B9]">
              {summary.totalScore}
              <span className="text-xs font-normal text-[#7A9194] font-sans">/100</span>
            </div>
          </div>
          <div className="h-8 w-[1px] bg-[#E3E7E1] dark:bg-[#2A383A]" />
          <div>
            <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] font-medium">仓位决策</div>
            <span
              className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                VERDICT_STYLES[summary.verdictLevel]
              }`}
            >
              {summary.verdict}
            </span>
          </div>
        </div>
      </div>

      {/* 四大核心步卡切换 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((st) => {
          const Icon = st.icon;
          const isActive = activeStep === st.id;

          return (
            <button
              key={st.id}
              onClick={() => onSelectStep(st.id)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1F3437] text-white border-[#1F3437] shadow-sm'
                  : 'bg-[#F6F7F5]/70 dark:bg-[#141A1B]/60 hover:bg-[#ECEFEA] dark:hover:bg-[#222D30] border-[#E3E7E1] dark:border-[#2A383A] text-[#1F3437] dark:text-[#E5EBEA]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] uppercase font-mono tracking-wider ${isActive ? 'text-[#76B4B9]' : 'text-[#576F73] dark:text-[#9BB2B4]'}`}>
                  {st.title}
                </span>
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#76B4B9]' : 'text-[#3E6F73]'}`} />
              </div>

              <div className={`text-xs font-serif font-bold ${isActive ? 'text-white' : 'text-[#1F3437] dark:text-white'}`}>
                {st.name}
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 dark:border-white/5 text-[11px]">
                <span className={`truncate ${isActive ? 'text-white/80' : 'text-[#576F73] dark:text-[#9BB2B4]'}`}>
                  {st.subtext}
                </span>
                <span className={`font-mono font-bold shrink-0 ml-1 ${isActive ? 'text-[#76B4B9]' : 'text-[#3E6F73] dark:text-[#76B4B9]'}`}>
                  {st.score}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
