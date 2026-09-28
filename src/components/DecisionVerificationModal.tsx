import React, { useState } from 'react';
import { StockData, StockAnalysisArchetype } from '../types/stock';
import { auditStockReliability } from '../utils/reliabilityAuditor';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  X,
  FileCheck,
  RotateCcw,
  Sparkles,
  Info,
  Scale,
  Compass,
} from 'lucide-react';

interface DecisionVerificationModalProps {
  stock: StockData;
  isOpen: boolean;
  onClose: () => void;
}

export const DecisionVerificationModal: React.FC<DecisionVerificationModalProps> = ({
  stock,
  isOpen,
  onClose,
}) => {
  const [archetype, setArchetype] = useState<StockAnalysisArchetype>('value_leader');
  const [humanChecks, setHumanChecks] = useState<Record<string, boolean>>({});
  const [copiedToast, setCopiedToast] = useState(false);

  if (!isOpen) return null;

  const report = auditStockReliability(stock, archetype, humanChecks);

  const toggleCheck = (id: string) => {
    setHumanChecks((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyAuditMemo = () => {
    const text = `# 【Zane Invest 选股可靠性决策审计纪要】
- 标的: ${stock.name} (${stock.symbol}) | 现价: ${stock.currency === 'USD' ? '$' : '¥'}${stock.currentPrice}
- 评估模式: ${report.archetypeZh}
- 综合可靠性评分: ${report.auditScore} / 100
- 最终决策结论: 【${report.canBuyDecisionZh}】

## 门禁一：财务排雷与防伪装 (Gate 1)
- 状态: ${report.gate1AntiFraudPass ? '通过 (无纸面虚增与暴雷隐患)' : '未通过 (存在利润含金量严重缺失/高负债隐患)'}

## 门禁二：安全边际与性价比 (Gate 2)
- 状态: ${report.gate2ValuationPass ? '通过 (估值百分位合理，下行有安全垫)' : '需警惕 (估值偏贵或缺乏下行支撑)'}

## 门禁三：防黑天鹅人工核验 (Gate 3)
${report.humanChecklist.map((h) => `- [${h.checked ? 'x' : ' '}] ${h.question} -> ${h.description}`).join('\n')}

---
审计时间: ${new Date().toLocaleString()} | 系统: Zane Invest WORKBENCH`;

    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E3E7E1] dark:border-[#2A383A] bg-[#F6F7F5] dark:bg-[#141A1B]">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${
              report.canBuyDecision === 'pass'
                ? 'bg-[#4A7C6F]/20 text-[#4A7C6F]'
                : report.canBuyDecision === 'strictly_forbidden'
                ? 'bg-[#A84A3E]/20 text-[#A84A3E]'
                : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
            }`}>
              {report.canBuyDecision === 'pass' ? (
                <ShieldCheck className="w-5 h-5" />
              ) : report.canBuyDecision === 'strictly_forbidden' ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                  选股可靠性决策验证 (三步门禁闭环)
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#3E6F73]/10 text-[#3E6F73] dark:text-[#76B4B9] font-mono font-bold">
                  {stock.name} ({stock.symbol})
                </span>
              </div>
              <p className="text-xs text-[#576F73] dark:text-[#9BB2B4]">
                “不踩雷第一，算准成本第二，确认时机第三”——杜绝纸面繁荣与盲目冲动
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#576F73] hover:text-[#1F3437] dark:text-[#9BB2B4] dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容滚动区域 */}
        <div className="p-6 overflow-y-auto space-y-6 text-[#1F3437] dark:text-[#E5EBEA]">
          
          {/* 1. 股票类型适配切换器 */}
          <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2.5 gap-2">
              <span className="text-xs font-bold text-[#1F3437] dark:text-white flex items-center space-x-1.5">
                <Compass className="w-4 h-4 text-[#3E6F73]" />
                <span>标的投资类型适配 (消除周期股/成长股指标陷阱)</span>
              </span>
              <span className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">不同类型匹配专属排雷与估值红线</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {[
                { key: 'value_leader', label: '价值白马', sub: '看现金流/ROE' },
                { key: 'cyclical_recovery', label: '周期复苏', sub: '看PB/供需拐点' },
                { key: 'growth_innovator', label: '成长科技', sub: '看营收增速/研发' },
                { key: 'dividend_defensive', label: '红利防御', sub: '看股息率/分红' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setArchetype(item.key as StockAnalysisArchetype)}
                  className={`px-3 py-2 rounded-xl text-left border transition-all cursor-pointer ${
                    archetype === item.key
                      ? 'bg-[#1F3437] text-white border-[#1F3437] dark:bg-[#3E6F73] dark:border-[#3E6F73] shadow-xs'
                      : 'bg-white dark:bg-[#1C2426] text-[#1F3437] dark:text-[#E5EBEA] border-[#E3E7E1] dark:border-[#2A383A] hover:bg-[#ECEFEA]'
                  }`}
                >
                  <div className="text-xs font-bold">{item.label}</div>
                  <div className="text-[10px] opacity-75">{item.sub}</div>
                </button>
              ))}
            </div>

            <div className="text-xs text-[#576F73] dark:text-[#9BB2B4] bg-white/70 dark:bg-[#1C2426]/70 p-2.5 rounded-lg border border-[#E3E7E1] dark:border-[#2A383A] flex items-start space-x-2">
              <Info className="w-4 h-4 text-[#3E6F73] shrink-0 mt-0.5" />
              <span>{report.archetypeGuideline}</span>
            </div>
          </div>

          {/* 2. 核心审计评分与最终决策大卡片 */}
          <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
            report.canBuyDecision === 'pass'
              ? 'bg-[#4A7C6F]/10 border-[#4A7C6F]/40'
              : report.canBuyDecision === 'strictly_forbidden'
              ? 'bg-[#A84A3E]/10 border-[#A84A3E]/40'
              : 'bg-amber-500/10 border-amber-500/40'
          }`}>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-3xl font-black font-mono tabular-nums tracking-tight">
                  {report.auditScore}
                </div>
                <div className="text-[10px] uppercase font-bold text-[#576F73] dark:text-[#9BB2B4]">综合可靠度</div>
              </div>
              <div className="h-10 w-px bg-black/10 dark:bg-white/10" />
              <div>
                <div className="text-xs text-[#576F73] dark:text-[#9BB2B4] font-medium">机器与人工综合决策结论</div>
                <div className={`text-base font-serif font-black flex items-center space-x-2 ${
                  report.canBuyDecision === 'pass'
                    ? 'text-[#376156] dark:text-[#4A7C6F]'
                    : report.canBuyDecision === 'strictly_forbidden'
                    ? 'text-[#8E3B30] dark:text-[#C55A4D]'
                    : 'text-amber-800 dark:text-amber-300'
                }`}>
                  <span>{report.canBuyDecisionZh}</span>
                  {report.canBuyDecision === 'pass' && <CheckCircle2 className="w-4 h-4" />}
                  {report.canBuyDecision === 'strictly_forbidden' && <XCircle className="w-4 h-4" />}
                  {report.canBuyDecision === 'conditional_buy' && <AlertTriangle className="w-4 h-4" />}
                </div>
                <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mt-0.5">
                  {report.canBuyDecision === 'strictly_forbidden'
                    ? '已触犯 Gate 1 财务硬指标红线，无论估值多便宜或近期涨势多猛，坚决禁止重仓买入！'
                    : report.canBuyDecision === 'pass'
                    ? '核心财务真实，估值处于安全边际区间，且已完成人工黑天鹅核查。'
                    : '基础排雷合格，但当前估值性价比或支撑位尚不完美，需按纪律分批建仓并完成人工清单。'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs shrink-0">
              <div className="text-right">
                <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">第一批买点参考</div>
                <div className="font-mono font-bold text-[#1F3437] dark:text-white">
                  {stock.currency === 'USD' ? '$' : '¥'}{stock.technical.positionStrategy.firstBatch.targetPrice}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">防守止损线</div>
                <div className="font-mono font-bold text-[#A84A3E]">
                  {stock.currency === 'USD' ? '$' : '¥'}{stock.technical.positionStrategy.stopLossPrice}
                </div>
              </div>
            </div>
          </div>

          {/* 3. 门禁清单：Gate 1 & Gate 2 指标细项 */}
          <div className="space-y-3">
            <h4 className="text-xs font-serif font-bold text-[#1F3437] dark:text-white flex items-center justify-between">
              <span>门禁一与门禁二：定量核查指标（算法客观执行）</span>
              <span className="text-[11px] font-mono text-[#576F73] dark:text-[#9BB2B4]">
                通过: {report.items.filter((i) => i.isPassed).length} / {report.items.length}
              </span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.items.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    item.isPassed
                      ? 'bg-white dark:bg-[#1C2426] border-[#E3E7E1] dark:border-[#2A383A]'
                      : 'bg-[#A84A3E]/5 border-[#A84A3E]/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#1F3437] dark:text-white flex items-center space-x-1.5">
                      {item.isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#4A7C6F]" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-[#A84A3E]" />
                      )}
                      <span>{item.name}</span>
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      item.isPassed
                        ? 'bg-[#4A7C6F]/10 text-[#4A7C6F]'
                        : 'bg-[#A84A3E]/15 text-[#A84A3E]'
                    }`}>
                      {item.isPassed ? '达标' : '未达标'}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-[#576F73] dark:text-[#9BB2B4] mb-1">
                    当前值: <strong className="text-[#1F3437] dark:text-white">{item.currentValueDisplay}</strong> | 门槛: {item.criterion}
                  </div>

                  <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] leading-relaxed">
                    {item.explanation}
                  </p>

                  {!item.isPassed && (
                    <div className="mt-2 text-[10px] text-[#A84A3E] font-medium bg-[#A84A3E]/10 p-1.5 rounded">
                      ⚠️ 应对纪律: {item.actionIfFailed}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 4. 门禁三：防黑天鹅人工核验 Checklist (不可量化事项) */}
          <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#1F3437] dark:text-white flex items-center space-x-1.5">
                <FileCheck className="w-4 h-4 text-[#3E6F73]" />
                <span>门禁三：防黑天鹅人工核验 Checklist（下单前必须勾选核查）</span>
              </span>
              <span className={`text-[11px] font-mono font-bold ${
                report.gate3HumanChecklistPendingCount === 0 ? 'text-[#4A7C6F]' : 'text-amber-600 dark:text-amber-400'
              }`}>
                {report.gate3HumanChecklistPendingCount === 0 ? '✅ 已全部确认' : `待核对: ${report.gate3HumanChecklistPendingCount} 项`}
              </span>
            </div>
            <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-3">
              历史数据无法预见隔夜监管新政或高管暴雷。请在行情软件中快速查验以下 4 项事实，确认无误后点击勾选：
            </p>

            <div className="space-y-2">
              {report.humanChecklist.map((q) => (
                <label
                  key={q.id}
                  onClick={() => toggleCheck(q.id)}
                  className={`flex items-start space-x-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                    q.checked
                      ? 'bg-white dark:bg-[#1C2426] border-[#4A7C6F]/40'
                      : 'bg-white/60 dark:bg-[#1C2426]/60 border-[#E3E7E1] dark:border-[#2A383A] hover:border-[#3E6F73]/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={q.checked}
                    onChange={() => {}}
                    className="mt-0.5 rounded border-[#CBD5E1] text-[#3E6F73] focus:ring-[#3E6F73] cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-[#1F3437] dark:text-white flex items-center space-x-2">
                      <span>{q.question}</span>
                      {q.checked && <span className="text-[10px] text-[#4A7C6F] font-mono font-normal">(已查验合格)</span>}
                    </div>
                    <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mt-0.5">
                      {q.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* 底部操作工具栏 */}
        <div className="px-6 py-3.5 border-t border-[#E3E7E1] dark:border-[#2A383A] bg-[#F6F7F5] dark:bg-[#141A1B] flex items-center justify-between">
          <div className="text-xs text-[#576F73] dark:text-[#9BB2B4]">
            {copiedToast && <span className="text-[#4A7C6F] font-bold">✅ 审计纪要已复制到剪贴板</span>}
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleCopyAuditMemo}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#1C2426] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] border border-[#E3E7E1] dark:border-[#2A383A] text-xs font-semibold text-[#1F3437] dark:text-[#E5EBEA] cursor-pointer transition-all"
            >
              <FileCheck className="w-3.5 h-3.5 text-[#3E6F73]" />
              <span>复制审计合规报告</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#1F3437] hover:bg-[#274246] text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
            >
              完成核查并关闭
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
