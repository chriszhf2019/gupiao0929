import React, { useEffect, useState } from 'react';
import { StockData, DeepExploreAIResult } from '../../types/stock';
import { request } from '../../services/apiClient';
import { Sparkles, RefreshCw, Award, TrendingUp, ShieldAlert, Layers, Zap } from 'lucide-react';

const PRESET_TOPICS = [
  '核心护城河可持续性与未来3年成长天花板推演',
  '极限压力测试：若遭遇行业价格战或地缘关税的抗风险底线',
  '自由现金流回报与分红/回购托底价值深度拆解',
  '技术路线颠覆风险与研发资产转化效率评估',
];

export function AiTopicExplorer({ stock }: { stock: StockData }) {
  const [selectedTopic, setSelectedTopic] = useState<string>(PRESET_TOPICS[0]);
  const [customTopicInput, setCustomTopicInput] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<DeepExploreAIResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    setAiResult(null);
    setAiError(null);
  }, [stock.symbol]);

  const handleRunAiExploration = async (topicToUse?: string) => {
    const finalTopic = topicToUse || customTopicInput.trim() || selectedTopic;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const data = await request<{ success: boolean; report?: DeepExploreAIResult; error?: string }>('/api/deep-explore', {
        method: 'POST',
        body: JSON.stringify({ symbol: stock.symbol, topic: finalTopic }),
        timeoutMs: 25000,
      });
      if (data.success && data.report) setAiResult(data.report);
      else throw new Error(data.error || 'Failed to generate deep exploration');
    } catch (err: any) {
      setAiError(err.message || '网络研判超时，请重试');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
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
  );
}
