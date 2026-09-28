import React, { useState } from 'react';
import { StockData } from '../types/stock';
import { useInvestigativeReport, InvestigativeStage } from '../hooks/useInvestigativeReport';
import { InvestigativeHeaderBar } from './investigative/InvestigativeHeaderBar';
import { AnomalousContrastSection } from './investigative/AnomalousContrastSection';
import { ClosedLoopSection } from './investigative/ClosedLoopSection';
import { ExtremeDataSection } from './investigative/ExtremeDataSection';
import { EmotionalMediaSection } from './investigative/EmotionalMediaSection';
import { WhistleblowerModal } from './investigative/WhistleblowerModal';
import {
  AlertTriangle,
  Radio,
  FileSpreadsheet,
  Cpu,
  Share2,
  RefreshCw,
  ShieldCheck,
  Send,
  Eye,
  Flame,
  Scale,
  Sparkles,
} from 'lucide-react';

interface InvestigativeDeepDiveModuleProps {
  stock: StockData;
  onSelectStock?: (symbol: string) => void;
}

export const InvestigativeDeepDiveModule: React.FC<InvestigativeDeepDiveModuleProps> = ({
  stock,
  onSelectStock,
}) => {
  const {
    report,
    activeStage,
    setActiveStage,
    isLoading,
    errorMessage,
    leaks,
    runInvestigation,
    loadPresetCase,
    submitWhistleblowerLeak,
  } = useInvestigativeReport(stock);

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* 顶部搜索与实战案例切换控制器 */}
      <InvestigativeHeaderBar
        currentTargetName={report.targetName}
        isLoading={isLoading}
        onSearch={(target, prompt) => runInvestigation(target, prompt)}
        onSelectPresetCase={(caseKey) => {
          loadPresetCase(caseKey);
          if (onSelectStock && report.targetSymbol && report.targetSymbol.length === 6) {
            onSelectStock(report.targetSymbol);
          }
        }}
      />

      {/* 错误提示条 */}
      {errorMessage && (
        <div className="p-3 bg-rose-600/90 text-white rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => runInvestigation()}
            className="px-2.5 py-1 rounded bg-white text-rose-700 text-xs font-bold cursor-pointer"
          >
            重试
          </button>
        </div>
      )}

      {/* 四步闭环导航标签页 */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveStage('pipeline')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeStage === 'pipeline'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20'
                : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>全景流水线视图</span>
          </button>

          <button
            onClick={() => setActiveStage('radar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeStage === 'radar'
                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                : 'bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>01 反常现象</span>
          </button>

          <button
            onClick={() => setActiveStage('dissection')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeStage === 'dissection'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>02 利益闭环</span>
          </button>

          <button
            onClick={() => setActiveStage('generation')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeStage === 'generation'
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                : 'bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>03 实锤数据</span>
          </button>

          <button
            onClick={() => setActiveStage('amplification')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeStage === 'amplification'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                : 'bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>04 情绪引爆</span>
          </button>
        </div>

        {/* 吹哨人报料触发按钮 */}
        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-emerald-500/30 text-xs font-semibold text-emerald-300 transition-all cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>匿名吹哨人提交</span>
        </button>
      </div>

      {/* 主体内容渲染 */}
      {isLoading ? (
        <div className="p-16 text-center space-y-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-rose-500 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-white">正在调用买方穿透算法与大数据核查中...</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            系统正在穿透上市公司财报附注、比对供应链终端真实上险/复购数据、拆解多方分润闭环模型并生成引爆内容矩阵。
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 步骤 1: 反常现象 */}
          {(activeStage === 'pipeline' || activeStage === 'radar') && (
            <AnomalousContrastSection
              contrast={report.anomalousContrast}
              hookQuestion={report.hookQuestion}
              contrastStatement={report.contrastStatement}
            />
          )}

          {/* 步骤 2: 利益闭环 */}
          {(activeStage === 'pipeline' || activeStage === 'dissection') && (
            <ClosedLoopSection
              mechanics={report.closedLoopMechanics}
              steps={report.hiddenClosedLoop}
              logicSummary={report.logicChainAnalysis}
            />
          )}

          {/* 步骤 3: 实锤数据 */}
          {(activeStage === 'pipeline' || activeStage === 'generation') && (
            <ExtremeDataSection
              extremeData={report.extremeContrastData}
              revenueStructure={report.revenueStructure}
              valuationContrast={report.valuationContrast}
              auditRedFlags={report.auditRedFlags}
              coldHardDataSummary={report.coldHardDataSummary}
            />
          )}

          {/* 步骤 4: 情绪引爆与多渠道长文/分镜脚本 */}
          {(activeStage === 'pipeline' || activeStage === 'amplification') && (
            <EmotionalMediaSection
              emotional={report.emotionalExplosion}
              viralTitles={report.viralTitles}
              wechatArticle={report.wechatArticle}
              shortVideoScript={report.shortVideoScript}
              socialPost={report.socialPost}
              complianceDisclaimer={report.complianceDisclaimer}
            />
          )}

          {/* 吹哨人核验线索库 */}
          {leaks && leaks.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    已入库供应链与内部吹哨人核验证据线索池
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">已接入沙箱加密存储</span>
              </div>
              <div className="space-y-2">
                {leaks.slice(0, 3).map((leak) => (
                  <div
                    key={leak.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-bold text-slate-200">{leak.companyName} · {leak.category}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        leak.credibility === 'verified'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {leak.credibility === 'verified' ? '已核验' : '审核中'} · {leak.timestamp}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed font-mono text-[11px]">{leak.evidenceSnippet}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 吹哨人线索提交弹窗 */}
      <WhistleblowerModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        defaultCompany={report.targetName}
        onSubmit={(comp, cat, snip) => submitWhistleblowerLeak(comp, cat, snip)}
      />
    </div>
  );
};
