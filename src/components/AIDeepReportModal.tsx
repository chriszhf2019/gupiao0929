import React, { useState, useEffect } from 'react';
import { StockData, AIAnalysisReport } from '../types/stock';
import { aiService } from '../services/aiService';
import { Sparkles, X, CheckCircle2, AlertTriangle, ShieldCheck, PieChart, LineChart, RefreshCw, Layers } from 'lucide-react';

interface AIDeepReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockData;
  macroSlider: number;
}

export const AIDeepReportModal: React.FC<AIDeepReportModalProps> = ({
  isOpen,
  onClose,
  stock,
  macroSlider,
}) => {
  const [report, setReport] = useState<AIAnalysisReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAIAnalysis = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const result = await aiService.getFiveStepAnalysis(stock, macroSlider);
      setReport(result);
    } catch (err: any) {
      console.warn("AI analysis failed:", err);
      setErrorMsg(err.message || '生成报告失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAIAnalysis();
    }
  }, [isOpen, stock.symbol, macroSlider]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100 flex flex-col">
        
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-slate-900/95 border-b border-slate-800 p-5 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>DeepSeek AI 五步法深度研报</span>
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {stock.name} ({stock.symbol})
                </span>
              </h2>
              <p className="text-xs text-slate-400">基于最新财报、估值历史分布与技术指标计算的深度推理引擎</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-200">AI 正在调取 ${stock.name} 的财务报表与估值历史...</p>
                <p className="text-xs text-slate-400 mt-1">正在逐一步骤推演：宏观环境 → 财务扫描 → 估值百分位 → 技术买点</p>
              </div>
            </div>
          ) : report ? (
            <>
              {/* Verdict Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900 border border-slate-700/80 shadow-inner flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">
                    五步法综合结论
                  </div>
                  <div className="text-xl font-bold text-white">
                    {report.summary}
                  </div>
                </div>

                <div className="flex items-center space-x-4 shrink-0 bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400">AI 综合得分</div>
                    <div className="text-2xl font-black font-mono text-indigo-400">
                      {report.fiveStepScore} <span className="text-xs font-normal text-slate-400">/100</span>
                    </div>
                  </div>
                  <div className="h-8 w-[1px] bg-slate-800" />
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400">建议动作</div>
                    <div className="text-xs font-bold text-emerald-400 mt-1 px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      {report.verdictZh}
                    </div>
                  </div>
                </div>
              </div>

              {/* 数据来源与合规声明 */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-1">
                <span
                  className={`inline-flex items-center self-start px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                    report.source === 'ai'
                      ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {report.source === 'ai' ? '来源：DeepSeek 大模型研判' : '来源：本地量化规则引擎（AI 不可用时的降级结论）'}
                </span>
              </div>
              <div className="flex items-start space-x-2 px-3 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] leading-relaxed text-amber-200/80">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  本研报由 AI/规则引擎自动生成，仅供研究参考，不构成任何投资建议或收益承诺。结论中的“建议动作”仅描述方法论结论，实际交易请结合三步门禁核验与个人风险承受能力独立决策。
                </span>
              </div>

              {/* Step 1 & 2 Diagnosis */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center space-x-2">
                  <Layers className="w-4 h-4" />
                  <span>Step 1 & 2: 宏观与行业环境研判</span>
                </h3>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {report.macroDiagnosis}
                </p>
              </div>

              {/* Step 3 Diagnosis */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Step 3: 公司基本面扫描</span>
                </h3>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {report.fundamentalDiagnosis}
                </p>
              </div>

              {/* Step 4 Diagnosis */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center space-x-2">
                  <PieChart className="w-4 h-4" />
                  <span>Step 4: 估值水平与百分位分析</span>
                </h3>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {report.valuationDiagnosis}
                </p>
              </div>

              {/* Step 5 Diagnosis */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2 flex items-center space-x-2">
                  <LineChart className="w-4 h-4" />
                  <span>Step 5: 技术走势与分批建仓决策</span>
                </h3>
                <p className="text-xs text-slate-200 leading-relaxed mb-3">
                  {report.technicalDiagnosis}
                </p>
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs text-indigo-300">
                  <strong className="text-white">推荐买入操作：</strong> {report.recommendedAction}
                </div>
              </div>

              {/* Key Risks to Watch */}
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
                <h4 className="text-xs font-bold text-rose-400 mb-2 flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>核心跟踪与风险提示</span>
                </h4>
                <ul className="space-y-1.5">
                  {report.keyRisksToWatch?.map((risk, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start space-x-1.5">
                      <span className="text-rose-400">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 z-10 bg-slate-900 border-t border-slate-800 p-4 flex items-center justify-between">
          <button
            onClick={fetchAIAnalysis}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>重新扫描生成</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-all cursor-pointer"
          >
            确认并关闭
          </button>
        </div>

      </div>
    </div>
  );
};
