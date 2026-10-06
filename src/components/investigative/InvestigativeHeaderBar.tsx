import React, { useState } from 'react';
import { Search, Sparkles, RefreshCw, Cpu, Layers } from 'lucide-react';

interface InvestigativeHeaderBarProps {
  currentTargetName: string;
  isLoading: boolean;
  onSearch: (target: string, prompt?: string) => void;
  onSelectPresetCase: (caseKey: string) => void;
}

const PRESET_CASE_BUTTONS = [
  { key: '300124', label: '编辑案例1: 人形机器人' },
  { key: '601127', label: '编辑案例2: 新能源4S退网' },
  { key: '600276', label: '编辑案例3: 医药回扣反腐' },
  { key: 'invoice', label: '编辑案例4: 税收洼地虚开' },
  { key: '600519', label: '编辑案例: 白酒金融蓄水池' },
];

export const InvestigativeHeaderBar: React.FC<InvestigativeHeaderBarProps> = ({
  currentTargetName,
  isLoading,
  onSearch,
  onSelectPresetCase,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [promptVal, setPromptVal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onSearch(inputVal.trim(), promptVal.trim() || undefined);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
              通用分析框架实战应用
            </span>
            <span className="text-xs text-slate-400">编辑案例 / 模型推演，下列数字不是公司披露，不能和财报模块的真实科目混读</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white mt-1">
            深度商业穿透引擎 · 当前聚焦：
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-indigo-300 ml-1.5">
              {currentTargetName}
            </span>
          </h2>
        </div>

        {/* 预置标杆实战案例切换 */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            编辑案例：
          </span>
          {PRESET_CASE_BUTTONS.map((item) => (
            <button
              key={item.key}
              onClick={() => onSelectPresetCase(item.key)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80 hover:border-indigo-500/50 transition-all cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 搜索与生成输入栏 */}
      <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="输入任意上市公司代码/行业/商业模式（如 688256、创新药集采、微盘股做局）"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>
        <div className="sm:w-64">
          <input
            type="text"
            value={promptVal}
            onChange={(e) => setPromptVal(e.target.value)}
            placeholder="可选：指定调查切入痛点"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-xs font-bold text-white flex items-center justify-center space-x-1.5 shadow-lg shadow-rose-500/20 disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>深度穿透中...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>四步穿透推演</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
