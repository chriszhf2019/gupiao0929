import React, { useState } from 'react';
import { StockData, DeepExploreAIResult } from '../types/stock';
import { getDeepExplorationForStock } from '../data/deepExplorationData';
import { PRESET_STOCKS } from '../data/presetStocks';
import { request } from '../services/apiClient';
import { InvestigativeDeepDiveModule } from './InvestigativeDeepDiveModule';
import {
  Compass,
  TrendingUp,
  ShieldAlert,
  BarChart3,
  Layers,
  Sparkles,
  HelpCircle,
  ArrowRight,
  CheckCircle,
  AlertOctagon,
  Award,
  Zap,
  RefreshCw,
  Sliders,
  Maximize2,
  Lock,
  Flame,
} from 'lucide-react';

interface DeepExplorationViewProps {
  stock: StockData;
  onSelectStock: (symbol: string) => void;
  onNavigateToFiveStep: (symbol: string) => void;
  onNavigateToTracking: (symbol: string) => void;
}

export const DeepExplorationView: React.FC<DeepExplorationViewProps> = ({
  stock,
  onSelectStock,
  onNavigateToFiveStep,
  onNavigateToTracking,
}) => {
  const explorationData = getDeepExplorationForStock(stock);

  // Active Sub-Tab: Default to the investigative closed-loop
  const [activeTab, setActiveTab] = useState<'investigative' | 'scenarios' | 'porter' | 'peers' | 'pre-mortem' | 'ai-explorer'>('investigative');

  // Interactive Scenario probabilities
  const [bullProb, setBullProb] = useState<number>(explorationData.scenarios.bull.probability);
  const [baseProb, setBaseProb] = useState<number>(explorationData.scenarios.base.probability);
  const [bearProb, setBearProb] = useState<number>(explorationData.scenarios.bear.probability);

  // Synchronize when stock changes
  React.useEffect(() => {
    const data = getDeepExplorationForStock(stock);
    setBullProb(data.scenarios.bull.probability);
    setBaseProb(data.scenarios.base.probability);
    setBearProb(data.scenarios.bear.probability);
    setAiResult(null);
  }, [stock.symbol]);

  // Normalize probabilities to 100%
  const totalProb = bullProb + baseProb + bearProb;
  const normBull = totalProb > 0 ? (bullProb / totalProb) * 100 : 33.3;
  const normBase = totalProb > 0 ? (baseProb / totalProb) * 100 : 33.3;
  const normBear = totalProb > 0 ? (bearProb / totalProb) * 100 : 33.4;

  // Expected Value calculation
  const bullReturn = explorationData.scenarios.bull.upsidePercent;
  const baseReturn = explorationData.scenarios.base.upsidePercent;
  const bearReturn = explorationData.scenarios.bear.upsidePercent;

  const expectedReturn = (
    (normBull / 100) * bullReturn +
    (normBase / 100) * baseReturn +
    (normBear / 100) * bearReturn
  ).toFixed(1);

  // Risk/Reward ratio: expected upside vs max downside
  const maxDownside = Math.abs(bearReturn) > 0 ? Math.abs(bearReturn) : 1;
  const riskRewardRatio = (bullReturn / maxDownside).toFixed(2);

  // AI Deep Explorer state
  const PRESET_TOPICS = [
    '核心护城河可持续性与未来3年成长天花板推演',
    '极限压力测试：若遭遇行业价格战或地缘关税的抗风险底线',
    '自由现金流回报与分红/回购托底价值深度拆解',
    '技术路线颠覆风险与研发资产转化效率评估',
  ];

  const [selectedTopic, setSelectedTopic] = useState<string>(PRESET_TOPICS[0]);
  const [customTopicInput, setCustomTopicInput] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<DeepExploreAIResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleRunAiExploration = async (topicToUse?: string) => {
    const finalTopic = topicToUse || customTopicInput.trim() || selectedTopic;
    setIsAiLoading(true);
    setAiError(null);

    try {
      const data = await request<{ success: boolean; report?: DeepExploreAIResult; error?: string }>('/api/deep-explore', {
        method: 'POST',
        body: JSON.stringify({
          symbol: stock.symbol,
          topic: finalTopic,
        }),
        timeoutMs: 25000,
      });
      if (data.success && data.report) {
        setAiResult(data.report);
      } else {
        throw new Error(data.error || 'Failed to generate deep exploration');
      }
    } catch (err: any) {
      console.error('Error running deep explore:', err);
      setAiError(err.message || '网络研判超时，请重试');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Target Stock Switcher */}
      <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center space-x-2 text-xs text-[#3E6F73] dark:text-[#76B4B9] font-bold uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4 text-[#3E6F73]" />
            <span>鉴源深度研判与利益闭环探索引擎</span>
          </div>
          <h2 className="text-xl font-serif font-black text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-3">
            <span>标的深度探索与非对称胜率研判</span>
            <span className="text-sm px-3 py-1 rounded-full bg-[#1F3437]/10 dark:bg-[#3E6F73]/20 text-[#1F3437] dark:text-[#76B4B9] border border-[#3E6F73]/30 font-mono">
              {stock.name} ({stock.symbol})
            </span>
          </h2>
          <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] mt-1">
            融合「反常现象→利益闭环→实锤数据→情绪引爆」四步分析、三维情景压力测试及 AI 深度穿透研判
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Quick select other preset stocks */}
          <select
            value={stock.symbol}
            onChange={(e) => onSelectStock(e.target.value)}
            className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] text-[#1F3437] dark:text-[#E5EBEA] text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-[#3E6F73] cursor-pointer font-medium"
          >
            {Object.values(PRESET_STOCKS).map((s) => (
              <option key={s.symbol} value={s.symbol}>
                切换标的: {s.name} ({s.symbol})
              </option>
            ))}
          </select>

          <button
            onClick={() => onNavigateToTracking(stock.symbol)}
            className="px-3 py-2 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] text-[#1F3437] dark:text-[#E5EBEA] text-xs font-semibold border border-[#E3E7E1] dark:border-[#2A383A] cursor-pointer transition-all shadow-xs"
          >
            载入跟踪中心
          </button>

          <button
            onClick={() => onNavigateToFiveStep(stock.symbol)}
            className="px-3.5 py-2 rounded-xl bg-[#1F3437] hover:bg-[#274246] text-white text-xs font-semibold shadow-xs cursor-pointer transition-all border border-[#3E6F73]/30"
          >
            返回五步诊断
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs border-b border-[#E3E7E1] dark:border-[#2A383A]">
        {[
          { key: 'investigative', label: '🔥 行业爆料与利益闭环 (四步模型)', icon: Flame, isFeatured: true },
          { key: 'scenarios', label: '三维情景压力测试', icon: Sliders },
          { key: 'porter', label: '商业模式与波特五力', icon: Layers },
          { key: 'peers', label: '行业龙头横向对标', icon: BarChart3 },
          { key: 'pre-mortem', label: '事前验尸反脆弱推演', icon: ShieldAlert },
          { key: 'ai-explorer', label: 'AI 深度专题研判', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-t-xl font-serif font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-[#1C2426] text-[#1F3437] dark:text-[#E5EBEA] border-b-2 border-[#3E6F73] shadow-xs'
                  : 'text-[#576F73] dark:text-[#9BB2B4] hover:text-[#1F3437] dark:hover:text-white hover:bg-white/50 dark:hover:bg-[#1C2426]/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#3E6F73]' : 'text-[#7A9194]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 0: 行业深度爆料 + 财报数据拆解 + 情绪共鸣 生产闭环 (Investigative Deep Dive) */}
      {activeTab === 'investigative' && (
        <InvestigativeDeepDiveModule
          stock={stock}
          onSelectStock={onSelectStock}
        />
      )}

      {/* TAB 1: 三维情景压力测试 (Scenario Modeling & Risk/Reward Engine) */}
      {activeTab === 'scenarios' && (
        <div className="space-y-6">
          {/* Executive Summary Cards: Expected Value & Non-Asymmetric Payoff */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                加权期望年化回报率 E(Return)
              </span>
              <div className="flex items-baseline space-x-2">
                <span className={`text-3xl font-black font-mono ${Number(expectedReturn) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {Number(expectedReturn) >= 0 ? `+${expectedReturn}%` : `${expectedReturn}%`}
                </span>
                <span className="text-xs text-slate-500 font-mono">/ 3年复合推演</span>
              </div>
              <p className="text-[11px] text-slate-400">
                依据当前三维情景概率加权模拟，综合胜率处于正期望值区间。
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                风险/收益比 (Risk / Reward Ratio)
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black font-mono text-indigo-400">
                  {riskRewardRatio} : 1
                </span>
                <span className="text-xs text-slate-500 font-mono">（潜在向上空间 vs 极限下行）</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {Number(riskRewardRatio) >= 2.0
                  ? '具备明显的非对称高胜率优势，赔率极具吸引力。'
                  : '赔率适中，建议严格执行分批建仓与止损纪律。'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                当前价格锚点 & 估值分位
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black font-mono text-white">
                  ${stock.currentPrice}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {stock.currency} · PE {stock.peTTM}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                PE历史分位数: <span className="text-blue-400 font-bold">{stock.valuation.historicalPePercentile}%</span> (处近5年偏低估值分位)
              </p>
            </div>
          </div>

          {/* Interactive Probability Tuner */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>动态调节情景发生概率权重 (实时模拟期望收益分布)</span>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                总归一化: 100% (牛市 {normBull.toFixed(0)}% · 基准 {normBase.toFixed(0)}% · 熊市 {normBear.toFixed(0)}%)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-emerald-400 font-bold">牛市/乐观情景权重</span>
                  <span className="font-mono text-white">{bullProb}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="80"
                  value={bullProb}
                  onChange={(e) => setBullProb(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-blue-400 font-bold">基准/中性情景权重</span>
                  <span className="font-mono text-white">{baseProb}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={baseProb}
                  onChange={(e) => setBaseProb(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-rose-400 font-bold">熊市/极限压力权重</span>
                  <span className="font-mono text-white">{bearProb}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={bearProb}
                  onChange={(e) => setBearProb(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 3 Scenario Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bull Case */}
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 shadow-lg space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  乐观情景 (Bull Case)
                </span>
                <span className="text-xs font-mono text-slate-400">
                  概率: {normBull.toFixed(0)}%
                </span>
              </div>

              <div>
                <div className="text-[10px] text-slate-400">目标推演股价</div>
                <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
                  ${explorationData.scenarios.bull.targetPrice}
                </div>
                <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                  预期空间: +{explorationData.scenarios.bull.upsidePercent}%
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">预期3年净利CAGR:</span>
                  <span className="font-mono text-white font-bold">+{explorationData.scenarios.bull.cagrGrowth}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">估值给予PE:</span>
                  <span className="font-mono text-white font-bold">{explorationData.scenarios.bull.targetPe}x</span>
                </div>
                <div className="pt-2 text-slate-300 text-[11px] leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-emerald-400 block mb-1">关键催化爆发驱动:</span>
                  {explorationData.scenarios.bull.catalystSummary}
                </div>
              </div>
            </div>

            {/* Base Case */}
            <div className="bg-slate-900/90 border border-blue-500/30 rounded-2xl p-5 shadow-lg space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  基准情景 (Base Case)
                </span>
                <span className="text-xs font-mono text-slate-400">
                  概率: {normBase.toFixed(0)}%
                </span>
              </div>

              <div>
                <div className="text-[10px] text-slate-400">目标推演股价</div>
                <div className="text-2xl font-black font-mono text-blue-400 mt-0.5">
                  ${explorationData.scenarios.base.targetPrice}
                </div>
                <div className="text-xs font-bold text-blue-400 font-mono mt-0.5">
                  预期空间: +{explorationData.scenarios.base.upsidePercent}%
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">预期3年净利CAGR:</span>
                  <span className="font-mono text-white font-bold">+{explorationData.scenarios.base.cagrGrowth}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">估值给予PE:</span>
                  <span className="font-mono text-white font-bold">{explorationData.scenarios.base.targetPe}x</span>
                </div>
                <div className="pt-2 text-slate-300 text-[11px] leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-blue-400 block mb-1">稳态基准假设:</span>
                  {explorationData.scenarios.base.catalystSummary}
                </div>
              </div>
            </div>

            {/* Bear Case */}
            <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-5 shadow-lg space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  熊市压力 (Bear Case)
                </span>
                <span className="text-xs font-mono text-slate-400">
                  概率: {normBear.toFixed(0)}%
                </span>
              </div>

              <div>
                <div className="text-[10px] text-slate-400">底线支撑推演股价</div>
                <div className="text-2xl font-black font-mono text-rose-400 mt-0.5">
                  ${explorationData.scenarios.bear.targetPrice}
                </div>
                <div className="text-xs font-bold text-rose-400 font-mono mt-0.5">
                  潜在最大回撤: {explorationData.scenarios.bear.upsidePercent}%
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">预期3年净利CAGR:</span>
                  <span className="font-mono text-white font-bold">+{explorationData.scenarios.bear.cagrGrowth}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">估值给予PE:</span>
                  <span className="font-mono text-white font-bold">{explorationData.scenarios.bear.targetPe}x</span>
                </div>
                <div className="pt-2 text-slate-300 text-[11px] leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-rose-400 block mb-1">极端压力冲击因素:</span>
                  {explorationData.scenarios.bear.catalystSummary}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 波特五力与商业模式护城河 (Porter's Five Forces & Moat) */}
      {activeTab === 'porter' && (
        <div className="space-y-6">
          {/* Moat Banner */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs text-indigo-400 font-bold uppercase mb-1">
                <Award className="w-4 h-4 text-indigo-400" />
                <span>综合护城河定级评定 (Moat Rating)</span>
              </div>
              <h3 className="text-2xl font-black text-white flex items-center space-x-3">
                <span>{explorationData.porterForces.overallMoatRating}</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  演变趋势: {explorationData.porterForces.moatTrend === 'Widening' ? '护城河持续拓宽 (Widening)' : '护城河维持稳固 (Stable)'}
                </span>
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {explorationData.porterForces.moatSources.map((source, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/80 flex items-center space-x-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{source}</span>
                </span>
              ))}
            </div>
          </div>

          {/* 5 Forces Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: '供应商议价权 (Supplier Power)',
                data: explorationData.porterForces.supplierPower,
                tag: explorationData.porterForces.supplierPower.level === 'low' ? '低威胁 (定价权在公司)' : '中高威胁',
                tagColor: explorationData.porterForces.supplierPower.level === 'low' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10',
              },
              {
                title: '买方客户议价权 (Buyer Power)',
                data: explorationData.porterForces.buyerPower,
                tag: explorationData.porterForces.buyerPower.level === 'low' ? '强客户黏性 (无替代品)' : '存在议价压力',
                tagColor: explorationData.porterForces.buyerPower.level === 'low' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10',
              },
              {
                title: '潜在新进入者威胁 (New Entrants)',
                data: explorationData.porterForces.threatOfNewEntrants,
                tag: explorationData.porterForces.threatOfNewEntrants.level === 'low' ? '壁垒极高 (后发劣势)' : '进入壁垒一般',
                tagColor: explorationData.porterForces.threatOfNewEntrants.level === 'low' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10',
              },
              {
                title: '替代品威胁 (Threat of Substitutes)',
                data: explorationData.porterForces.threatOfSubstitutes,
                tag: explorationData.porterForces.threatOfSubstitutes.level === 'low' ? '不可替代核心资产' : '存在跨界竞争',
                tagColor: explorationData.porterForces.threatOfSubstitutes.level === 'low' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10',
              },
              {
                title: '同业竞争烈度 (Competitive Rivalry)',
                data: explorationData.porterForces.competitiveRivalry,
                tag: explorationData.porterForces.competitiveRivalry.level === 'low' ? '寡头垄断优势明显' : '同业博弈竞争',
                tagColor: explorationData.porterForces.competitiveRivalry.level === 'low' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10',
              },
            ].map((force, i) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{force.title}</span>
                  <span className="text-xs font-mono font-bold text-indigo-400">{force.data.score}/100</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all"
                    style={{ width: `${force.data.score}%` }}
                  />
                </div>
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold inline-block ${force.tagColor}`}>
                  {force.tag}
                </span>
                <p className="text-xs text-slate-400 leading-relaxed pt-1">
                  {force.data.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: 行业龙头横向对标矩阵 (Peer Benchmark Matrix) */}
      {activeTab === 'peers' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs text-slate-300">
            <span className="font-bold text-white">行业同台横向对标原则：</span>
            在相同行业赛道中，挑选市值规模或业务模式最具可比性的核心同行，穿透对比估值、盈利质量与成长性。
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3 font-semibold">标的名称/代码</th>
                    <th className="px-4 py-3 font-semibold">最新股价</th>
                    <th className="px-4 py-3 font-semibold">PE(TTM)</th>
                    <th className="px-4 py-3 font-semibold">PE历史分位</th>
                    <th className="px-4 py-3 font-semibold">毛利率 (Gross Margin)</th>
                    <th className="px-4 py-3 font-semibold">ROE (净资产收益率)</th>
                    <th className="px-4 py-3 font-semibold">营收增速 (YoY)</th>
                    <th className="px-4 py-3 font-semibold">股息率 (Dividend Yield)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {explorationData.peers.map((peer) => {
                    const isSelf = peer.symbol === stock.symbol;
                    return (
                      <tr
                        key={peer.symbol}
                        className={`transition-colors ${
                          isSelf
                            ? 'bg-indigo-950/40 text-white font-bold'
                            : 'hover:bg-slate-800/40 text-slate-300'
                        }`}
                      >
                        <td className="px-5 py-4 flex items-center space-x-2">
                          <span className="font-sans font-bold text-white">{peer.name}</span>
                          <span className="text-slate-400 text-[11px]">({peer.symbol})</span>
                          {isSelf && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-sans">
                              当前标的
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-white">${peer.currentPrice}</td>
                        <td className="px-4 py-4 text-indigo-300">{peer.peTTM}x</td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              peer.pePercentile <= 20
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : peer.pePercentile >= 70
                                ? 'bg-rose-500/10 text-rose-400'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {peer.pePercentile}%
                          </span>
                        </td>
                        <td className="px-4 py-4 text-emerald-400 font-bold">{peer.grossMargin}%</td>
                        <td className="px-4 py-4 text-blue-400 font-bold">{peer.roe}%</td>
                        <td className="px-4 py-4 text-slate-200">+{peer.revenueGrowth}%</td>
                        <td className="px-4 py-4 text-amber-400">{peer.dividendYield}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: 芒格逆向思考：事前验尸反脆弱推演 (Pre-Mortem Inverted Analysis) */}
      {activeTab === 'pre-mortem' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl flex items-start space-x-4">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mt-1">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                芒格逆向投资法则：“如果我知道我会死在哪里，我将永远不去那个地方”
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                事前验尸 (Pre-Mortem) 机制要求投资人在建仓前预先假设“这笔投资在未来3年遭遇惨败与重大亏损”，
                穷尽导致致命败局的核心黑天鹅与触发条件，并提前制定不可动摇的风控减仓防守纪律。
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {explorationData.preMortem.map((item, idx) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-white">
                      黑天鹅假说 #{idx + 1}: {item.riskScenario}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      发生概率: {item.probability === 'high' ? '高' : item.probability === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                  <div className="text-rose-400 font-mono font-bold">
                    推演潜在最大回撤: {item.potentialDrawdown}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">触发导火索事件</span>
                    <p className="text-slate-300 leading-relaxed text-[11px]">{item.triggerEvent}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-amber-500 uppercase font-semibold">早期预警雷达信号</span>
                    <p className="text-amber-200 leading-relaxed text-[11px]">{item.earlyWarningSignal}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-emerald-400 uppercase font-semibold">资深买方减仓防御预案</span>
                    <p className="text-emerald-200 leading-relaxed text-[11px]">{item.mitigationPlan}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AI 深度专题探索引擎 (AI Deep Topic Explorer) */}
      {activeTab === 'ai-explorer' && (
        <div className="space-y-6">
          {/* AI Explorer Launchpad */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>AI 深度穿透研判工作台 (POWERED BY DEEPSEEK)</span>
            </div>

            <p className="text-xs text-slate-300">
              选择或输入您关心的深度投资论题，系统将调用资深证券研究所首席模型，对标的进行全方位的买方穿透式分析。
            </p>

            {/* Quick Topic Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_TOPICS.map((topic, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedTopic(topic);
                    setCustomTopicInput('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    selectedTopic === topic && !customTopicInput
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>

            {/* Custom Topic Input */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="或自定义输入您想要深度探索的议题 (如: 汇率波动冲击、大模型算力成本下降对毛利的影响...)"
                value={customTopicInput}
                onChange={(e) => setCustomTopicInput(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => handleRunAiExploration()}
                disabled={isAiLoading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isAiLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>首席研判中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>生成深度研报</span>
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {aiError}
              </div>
            )}
          </div>

          {/* AI Result Report Presentation */}
          {aiResult && (
            <div className="bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">
                    深度探索研报 (INSTITUTIONAL DEEP SCAN)
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">
                    {aiResult.topic}
                  </h3>
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  {stock.name} ({stock.symbol})
                </span>
              </div>

              {/* 1. Executive Insight */}
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-indigo-300">
                  <Award className="w-4 h-4" />
                  <span>核心穿透性洞察 (Executive Insight)</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {aiResult.executiveInsight}
                </p>
              </div>

              {/* 2. Bull vs Bear In-Depth */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>乐观情景传导与爆发空间 (Bull Case)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {aiResult.bullCaseAnalysis}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-rose-400">
                    <ShieldAlert className="w-4 h-4" />
                    <span>极限压力测试与事前验尸 (Bear Case)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {aiResult.bearCaseAnalysis}
                  </p>
                </div>
              </div>

              {/* 3. Moat Durability & Micro Structure */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-blue-400">
                  <Layers className="w-4 h-4" />
                  <span>微观结构与护城河持久性剖析 (Moat Durability)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {aiResult.moatDurability}
                </p>
              </div>

              {/* 4. Actionable Discipline */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-purple-400">
                  <Zap className="w-4 h-4" />
                  <span>机构执行策略与仓位博弈纪律 (Actionable Discipline)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {aiResult.actionableFramework}
                </p>
              </div>
            </div>
          )}

          {!aiResult && !isAiLoading && (
            <div className="p-10 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400 space-y-2">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto opacity-60" />
              <p className="text-sm font-medium text-slate-300">点击上方“生成深度研报”启动穿透式研判</p>
              <p className="text-xs text-slate-500">
                支持对当前标的的核心驱动、护城河演变、极限压力情景进行一键智能解构
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
