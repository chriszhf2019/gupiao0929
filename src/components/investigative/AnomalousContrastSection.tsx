import React from 'react';
import { AnomalousContrast } from '../../types/stock';
import { AlertCircle, HelpCircle, Eye, TrendingDown, ArrowRight } from 'lucide-react';

interface AnomalousContrastSectionProps {
  contrast?: AnomalousContrast;
  hookQuestion: string;
  contrastStatement: string;
}

export const AnomalousContrastSection: React.FC<AnomalousContrastSectionProps> = ({
  contrast,
  hookQuestion,
  contrastStatement,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2.5">
          <span className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center font-black text-xs">
            01
          </span>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              第一步：从“反常现象”抓核心矛盾
            </h3>
            <p className="text-xs text-slate-400">
              找到预期与现实的强烈反差，提炼“所有人都觉得应该发生，但实际没发生”的破题切口
            </p>
          </div>
        </div>
      </div>

      {/* 预期 vs 现实 双栏高反差对撞 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 预期 */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 mb-2">
              <Eye className="w-4 h-4" />
              <span>大众与资本市场普遍预期</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {contrast?.expected || '大众预期赛道高速成长、技术全面渗透替代，相关企业与渠道应当迎来爆发式盈利。'}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
            表象标签：PPT画饼、万亿赛道叙事、公关大捷
          </div>
        </div>

        {/* 现实 */}
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-rose-400 mb-2">
              <TrendingDown className="w-4 h-4" />
              <span>冷酷冰冷的审计与一线现实</span>
            </div>
            <p className="text-xs text-rose-200/90 leading-relaxed font-medium">
              {contrast?.reality || contrastStatement}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-rose-900/40 text-[11px] text-rose-400/80">
            实情标签：真实复购缺失、渠道深度亏损、库存积压严重
          </div>
        </div>
      </div>

      {/* 转化成直击痛点的第一疑问句 */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-500/30">
        <div className="flex items-start space-x-3">
          <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
              破局抓手 · 核心痛点叩问
            </span>
            <p className="text-sm font-black text-white leading-snug">
              {contrast?.coreDilemmaQuestion || hookQuestion}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
