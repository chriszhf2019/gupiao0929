import React from 'react';
import { ExtremeContrastData, InvestigativeReport } from '../../types/stock';
import { Scale, AlertOctagon, CheckCircle2, ShieldAlert, FileText, Database } from 'lucide-react';

interface ExtremeDataSectionProps {
  extremeData?: ExtremeContrastData;
  revenueStructure?: InvestigativeReport['revenueStructure'];
  valuationContrast?: InvestigativeReport['valuationContrast'];
  auditRedFlags?: string[];
  coldHardDataSummary?: string;
}

export const ExtremeDataSection: React.FC<ExtremeDataSectionProps> = ({
  extremeData,
  revenueStructure = [],
  valuationContrast,
  auditRedFlags = [],
  coldHardDataSummary,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2.5">
          <span className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-black text-xs">
            03
          </span>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              第三步：用“实锤数据”击穿虚假繁荣
            </h3>
            <p className="text-xs text-slate-400">
              公开可查实锤证据，用两组悬殊的极端反差数据形成不可辩驳的视觉与心理冲击
            </p>
          </div>
        </div>
      </div>

      {/* 两组极端反差数据对撞（天平对比卡片） */}
      {extremeData && (
        <div className="p-5 rounded-xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-amber-300">
              <Scale className="w-4 h-4 text-amber-400" />
              极端对撞双数据天平
            </span>
            <span className="text-slate-500 text-[11px]">可核验实锤依据</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 指标 A */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 space-y-1">
              <span className="text-xs text-slate-400 font-semibold">{extremeData.metricA.label}</span>
              <div className="text-2xl font-black text-white tracking-tight">{extremeData.metricA.value}</div>
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 mt-2">
                {extremeData.metricA.context}
              </p>
            </div>

            {/* 指标 B */}
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 space-y-1">
              <span className="text-xs text-rose-300 font-semibold">{extremeData.metricB.label}</span>
              <div className="text-2xl font-black text-rose-400 tracking-tight">{extremeData.metricB.value}</div>
              <p className="text-[11px] text-rose-300/80 pt-1 border-t border-rose-900/40 mt-2">
                {extremeData.metricB.context}
              </p>
            </div>
          </div>

          {/* 冲击力与核验源 */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
            <div className="text-amber-200/90 font-medium">
              <span className="font-bold text-amber-400">反差冲击：</span>
              {extremeData.contrastImpact}
            </div>
            <div className="text-slate-500 text-[11px] flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>来源：{extremeData.verifiableSource}</span>
            </div>
          </div>
        </div>
      )}

      {/* 真实商业化造血 vs 概念性非商业结构拆解 */}
      {revenueStructure && revenueStructure.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>穿透业务收入结构（真实工业复购 vs 关联/概念/补贴）</span>
            {valuationContrast && (
              <span className="text-rose-400 font-semibold text-[11px]">
                真实商业占比：{valuationContrast.realSharePercent}%
              </span>
            )}
          </div>

          <div className="space-y-2">
            {revenueStructure.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  item.isRealCommercial
                    ? 'bg-emerald-950/15 border-emerald-800/40 text-emerald-200'
                    : 'bg-rose-950/15 border-rose-800/40 text-rose-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.isRealCommercial
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {item.isRealCommercial ? '真实商业造血' : '非内生概念/过桥/补贴'}
                    </span>
                    <span className="font-bold text-white">{item.segment}</span>
                  </div>
                  <p className="text-[11px] opacity-80">{item.note}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base font-black text-white">{item.percentage}%</div>
                  <div className="text-[10px] opacity-70">{item.amount}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 审计红旗警示列表 */}
      {auditRedFlags && auditRedFlags.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-rose-400">
            <AlertOctagon className="w-4 h-4" />
            <span>专业审计底稿四大疑点与风险红旗：</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {auditRedFlags.map((flag, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                <span className="leading-relaxed">{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 财报冰冷总结 */}
      {coldHardDataSummary && (
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-400 leading-relaxed">
          <span className="font-bold text-slate-300">底稿速查：</span>
          {coldHardDataSummary}
        </div>
      )}
    </div>
  );
};
