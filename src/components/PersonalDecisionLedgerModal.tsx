import React, { useState, useEffect, useMemo } from 'react';
import {
  PersonalInvestmentDecision,
  DecisionActionType,
  DecisionStatusType,
  ExitReasonType,
  StockData,
} from '../types/stock';
import { PRESET_STOCKS } from '../data/presetStocks';
import { calculateBeneishAndAltman } from '../utils/institutionalForensics';
import { usePortfolio } from '../context/PortfolioContext';
import { VaultPasswordGate } from './portfolio/VaultPasswordGate';
import { computeTotalCapitalCny } from '../services/portfolioService';
import {
  BookOpenCheck,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Target,
  Clock,
  X,
  Download,
  Upload,
  Sparkles,
  Award,
  DollarSign,
  Scale,
  Percent,
  ExternalLink,
  ChevronRight,
  FileText,
  HelpCircle,
} from 'lucide-react';

interface PersonalDecisionLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStock: StockData;
  onSelectStock: (symbol: string) => void;
  initialNewDecision?: boolean;
}

export const PersonalDecisionLedgerModal: React.FC<PersonalDecisionLedgerModalProps> = ({
  isOpen,
  onClose,
  currentStock,
  onSelectStock,
  initialNewDecision = false,
}) => {

  const [activeTab, setActiveTab] = useState<'active' | 'closed' | 'editor'>('active');
  const [editingId, setEditingId] = useState<string | null>(null);

  // 平仓复盘 Modal 状态
  const [closingDecision, setClosingDecision] = useState<PersonalInvestmentDecision | null>(null);
  const [closeExitPrice, setCloseExitPrice] = useState<number>(0);
  const [closeExitDate, setCloseExitDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [closeReason, setCloseReason] = useState<ExitReasonType>('TARGET_HIT');
  const [closeDisciplineRating, setCloseDisciplineRating] = useState<number>(5);
  const [closeLessonLearned, setCloseLessonLearned] = useState<string>('');

  // 新建/编辑表单字段
  const [formSymbol, setFormSymbol] = useState(currentStock.symbol);
  const [formStockName, setFormStockName] = useState(currentStock.name);
  const [formAction, setFormAction] = useState<DecisionActionType>('BUY');
  const [formThesis, setFormThesis] = useState('');
  const [formCatalysts, setFormCatalysts] = useState<string>('');
  const [formFalsification, setFormFalsification] = useState('');
  const [formEntryPrice, setFormEntryPrice] = useState<number>(currentStock.currentPrice);
  const [formTargetPrice, setFormTargetPrice] = useState<number>(
    Number((currentStock.currentPrice * 1.25).toFixed(2))
  );
  const [formStopLossPrice, setFormStopLossPrice] = useState<number>(
    Number((currentStock.currentPrice * 0.92).toFixed(2))
  );
  const [formPlannedShares, setFormPlannedShares] = useState<number>(500);
  const [formTotalCapital, setFormTotalCapital] = useState<number>(300000);
  const [formHoldingPeriod, setFormHoldingPeriod] = useState<string>('6-12个月');

  // 读取真实组合总资本（组合已解锁时），用于默认总资本与仓位占比计算，替代硬编码 30 万
  const {
    status: portfolioStatus,
    accounts,
    transactions,
    decisions,
    setDecisions,
    error: vaultError,
    unlock,
    setup,
    reset,
  } = usePortfolio();
  const realTotalCapital = useMemo(
    () => (portfolioStatus === 'ready' ? computeTotalCapitalCny(accounts, transactions) : 0),
    [portfolioStatus, accounts, transactions]
  );

  // 当外部唤起新建时
  useEffect(() => {
    if (initialNewDecision) {
      handleOpenCreateForStock(currentStock);
    }
  }, [initialNewDecision, currentStock]);

  // 重置并打开针对某个股票的立项表单
  const handleOpenCreateForStock = (stockToUse: StockData) => {
    setEditingId(null);
    setFormSymbol(stockToUse.symbol);
    setFormStockName(stockToUse.name);
    setFormAction('BUY');
    setFormEntryPrice(stockToUse.currentPrice);
    setFormTargetPrice(Number((stockToUse.currentPrice * 1.25).toFixed(2)));
    setFormStopLossPrice(
      stockToUse.technical?.positionStrategy?.stopLossPrice ||
        Number((stockToUse.currentPrice * 0.92).toFixed(2))
    );
    setFormPlannedShares(500);
    setFormTotalCapital(realTotalCapital > 0 ? realTotalCapital : 300000);
    setFormThesis(
      `${stockToUse.name} 属于优质资产，当前 PE 分位为 ${stockToUse.valuation.historicalPePercentile}%，具备良好安全边际。`
    );
    setFormCatalysts('1. 核心业务稳步放量\n2. 行业政策利好与估值修复\n3. 业绩中报超预期');
    setFormFalsification(
      '若连续两季度毛利率下滑超 3 个百分点，或股价破位跌穿硬核止损线，无条件认错止损。'
    );
    setActiveTab('editor');
  };

  const handleEditDecision = (d: PersonalInvestmentDecision) => {
    setEditingId(d.id);
    setFormSymbol(d.symbol);
    setFormStockName(d.stockName);
    setFormAction(d.action);
    setFormEntryPrice(d.entryPrice);
    setFormTargetPrice(d.targetPrice);
    setFormStopLossPrice(d.stopLossPrice);
    setFormPlannedShares(d.plannedShares);
    setFormThesis(d.thesis);
    setFormCatalysts(d.catalysts.join('\n'));
    setFormFalsification(d.falsificationCriteria);
    setFormHoldingPeriod(d.expectedHoldingPeriod);
    setActiveTab('editor');
  };

  // 保存决策档案
  const handleSaveDecision = () => {
    if (!formThesis.trim()) {
      alert('请填写投资逻辑 (Thesis)，决策必须有理有据');
      return;
    }
    if (!formFalsification.trim()) {
      alert('请填写证伪底线 (Falsification Criteria)，专业投资必须有撤退条件');
      return;
    }

    const allocated = Number((formEntryPrice * formPlannedShares).toFixed(2));
    const weight = formTotalCapital > 0 ? Number(((allocated / formTotalCapital) * 100).toFixed(1)) : 10;
    const upside = formTargetPrice - formEntryPrice;
    const downside = Math.max(formEntryPrice - formStopLossPrice, 0.1);
    const rrRatio = Number((upside / downside).toFixed(2));

    const targetStock = PRESET_STOCKS[formSymbol] || currentStock;
    const forensics = calculateBeneishAndAltman(targetStock);

    if (editingId) {
      setDecisions((prev) =>
        prev.map((item) => {
          if (item.id !== editingId) return item;
          return {
            ...item,
            updatedAt: new Date().toISOString().split('T')[0],
            action: formAction,
            thesis: formThesis,
            catalysts: formCatalysts.split('\n').filter((c) => c.trim().length > 0),
            falsificationCriteria: formFalsification,
            entryPrice: formEntryPrice,
            targetPrice: formTargetPrice,
            stopLossPrice: formStopLossPrice,
            plannedShares: formPlannedShares,
            capitalAllocated: allocated,
            portfolioWeight: weight,
            riskRewardRatio: rrRatio,
            expectedHoldingPeriod: formHoldingPeriod,
          };
        })
      );
    } else {
      const newRecord: PersonalInvestmentDecision = {
        id: `decision_${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        symbol: formSymbol,
        stockName: formStockName,
        action: formAction,
        status: 'OPEN',
        thesis: formThesis,
        catalysts: formCatalysts.split('\n').filter((c) => c.trim().length > 0),
        falsificationCriteria: formFalsification,
        entryPrice: formEntryPrice,
        targetPrice: formTargetPrice,
        stopLossPrice: formStopLossPrice,
        plannedShares: formPlannedShares,
        capitalAllocated: allocated,
        portfolioWeight: weight,
        riskRewardRatio: rrRatio,
        expectedHoldingPeriod: formHoldingPeriod,
        healthScoreAtEntry: targetStock.fundamentals?.overallHealthScore || 85,
        mScoreAtEntry: forensics.mScore,
        zScoreAtEntry: forensics.zScore,
        pePercentileAtEntry: targetStock.valuation?.historicalPePercentile || 30,
      };
      setDecisions((prev) => [newRecord, ...prev]);
    }

    setActiveTab('active');
    setEditingId(null);
  };

  const handleDeleteDecision = (id: string) => {
    if (confirm('确定要删除这笔投资决策档案吗？建议保留作为历史复盘对照。')) {
      setDecisions((prev) => prev.filter((d) => d.id !== id));
    }
  };

  // 打开平仓复盘弹窗
  const handleStartClosing = (d: PersonalInvestmentDecision) => {
    const liveStock = PRESET_STOCKS[d.symbol] || currentStock;
    setClosingDecision(d);
    setCloseExitPrice(liveStock.currentPrice);
    setCloseExitDate(new Date().toISOString().split('T')[0]);
    setCloseReason(
      liveStock.currentPrice >= d.targetPrice
        ? 'TARGET_HIT'
        : liveStock.currentPrice <= d.stopLossPrice
        ? 'STOP_LOSS_HIT'
        : 'BETTER_OPPORTUNITY'
    );
    setCloseDisciplineRating(5);
    setCloseLessonLearned('');
  };

  // 确认平仓复盘并结项
  const handleConfirmClosing = () => {
    if (!closingDecision) return;

    const realizedPnl = Number(
      ((closeExitPrice - closingDecision.entryPrice) * closingDecision.plannedShares).toFixed(2)
    );
    const realizedPnlPercent = Number(
      (((closeExitPrice - closingDecision.entryPrice) / closingDecision.entryPrice) * 100).toFixed(2)
    );

    setDecisions((prev) =>
      prev.map((item) => {
        if (item.id !== closingDecision.id) return item;
        return {
          ...item,
          status: 'CLOSED',
          updatedAt: closeExitDate,
          exitDate: closeExitDate,
          exitPrice: closeExitPrice,
          realizedPnl,
          realizedPnlPercent,
          exitReason: closeReason,
          disciplineRating: closeDisciplineRating,
          lessonLearned: closeLessonLearned || '按既定原则执行平仓离场。',
        };
      })
    );

    setClosingDecision(null);
    setActiveTab('closed');
  };

  // 统计数据
  const activeDecisions = useMemo(() => decisions.filter((d) => d.status !== 'CLOSED'), [decisions]);
  const closedDecisions = useMemo(() => decisions.filter((d) => d.status === 'CLOSED'), [decisions]);

  const closedProfitCount = closedDecisions.filter((d) => (d.realizedPnl || 0) > 0).length;
  const winRate = closedDecisions.length > 0
    ? Number(((closedProfitCount / closedDecisions.length) * 100).toFixed(1))
    : 0;

  const totalRealizedPnl = closedDecisions.reduce((sum, d) => sum + (d.realizedPnl || 0), 0);
  const avgDiscipline = closedDecisions.length > 0
    ? Number(
        (
          closedDecisions.reduce((sum, d) => sum + (d.disciplineRating || 5), 0) /
          closedDecisions.length
        ).toFixed(1)
      )
    : 5.0;

  // 导出 JSON 数据
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(decisions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `zane_investment_decisions_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!isOpen) return null;

  if (portfolioStatus !== 'ready') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
        <div className="relative">
          <button onClick={onClose} className="absolute -top-2 right-2 text-xs text-white">关闭</button>
          <VaultPasswordGate status={portfolioStatus} error={vaultError} onUnlock={unlock} onSetup={setup} onReset={reset} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* 顶部标题 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E3E7E1] dark:border-[#2A383A] bg-[#F6F7F5] dark:bg-[#141A1B]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#3E6F73]/15 text-[#3E6F73] dark:text-[#76B4B9]">
              <BookOpenCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                  个人投资决策档案与复盘系统 (Decision & Review Ledger)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#4A7C6F]/15 text-[#376156] dark:text-[#76B4B9] font-mono font-bold">
                  精准立项·执行复盘
                </span>
              </div>
              <p className="text-xs text-[#576F73] dark:text-[#9BB2B4]">
                杜绝冲动交易：买前白纸黑字写清逻辑与证伪底线，卖后严明纪律复盘沉淀心法
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] dark:border-[#2A383A] hover:bg-black/5 dark:hover:bg-white/5 text-xs text-[#576F73] dark:text-[#9BB2B4] cursor-pointer"
              title="导出决策档案到本地 JSON 备份"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">导出备份</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#576F73] hover:text-[#1F3437] dark:text-[#9BB2B4] dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 决策绩效核心指标矩阵 */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-6 py-3 bg-[#3E6F73]/5 border-b border-[#E3E7E1] dark:border-[#2A383A] text-xs">
          <div>
            <span className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] block">有效决策立项</span>
            <span className="font-mono font-bold text-sm text-[#1F3437] dark:text-white">
              {decisions.length} 笔 ({activeDecisions.length} 在仓)
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] block">已平仓胜率 (Win Rate)</span>
            <span className="font-mono font-bold text-sm text-[#4A7C6F]">
              {winRate}% ({closedProfitCount}/{closedDecisions.length || 0})
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] block">已实现总盈亏</span>
            <span className={`font-mono font-bold text-sm ${totalRealizedPnl >= 0 ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'}`}>
              {totalRealizedPnl >= 0 ? `+¥${totalRealizedPnl.toLocaleString()}` : `-¥${Math.abs(totalRealizedPnl).toLocaleString()}`}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] block">平均纪律遵守星级</span>
            <span className="font-mono font-bold text-sm text-amber-500 flex items-center">
              ★ {avgDiscipline} / 5.0
            </span>
          </div>
          <div className="flex items-center justify-end">
            <button
              onClick={() => handleOpenCreateForStock(currentStock)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#3E6F73] hover:bg-[#2B5458] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>为 {currentStock.name} 立项</span>
            </button>
          </div>
        </div>

        {/* 选项卡导航 */}
        <div className="flex items-center px-6 border-b border-[#E3E7E1] dark:border-[#2A383A] bg-white dark:bg-[#1C2426]">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'active'
                ? 'border-[#3E6F73] text-[#3E6F73] dark:text-[#76B4B9]'
                : 'border-transparent text-[#576F73] dark:text-[#9BB2B4] hover:text-[#1F3437]'
            }`}
          >
            <span>在仓决策跟踪 ({activeDecisions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('closed')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'closed'
                ? 'border-[#3E6F73] text-[#3E6F73] dark:text-[#76B4B9]'
                : 'border-transparent text-[#576F73] dark:text-[#9BB2B4] hover:text-[#1F3437]'
            }`}
          >
            <span>历史平仓复盘库 ({closedDecisions.length})</span>
          </button>
          <button
            onClick={() => {
              if (activeTab !== 'editor') handleOpenCreateForStock(currentStock);
            }}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'editor'
                ? 'border-[#3E6F73] text-[#3E6F73] dark:text-[#76B4B9]'
                : 'border-transparent text-[#576F73] dark:text-[#9BB2B4] hover:text-[#1F3437]'
            }`}
          >
            <span>{editingId ? '编辑投资决策备忘录' : '撰写新决策备忘录'}</span>
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: 在仓监控 */}
          {activeTab === 'active' && (
            <div className="space-y-4">
              {activeDecisions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#CBD5E1] dark:border-[#2A383A] rounded-2xl">
                  <BookOpenCheck className="w-8 h-8 text-[#576F73] dark:text-[#9BB2B4] mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold text-[#1F3437] dark:text-white">暂无在仓决策记录</p>
                  <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mt-1">
                    点击右上角“为当前股票立项”，把您的投资逻辑与止损边界记录下来。
                  </p>
                </div>
              ) : (
                activeDecisions.map((d) => {
                  const liveStock = PRESET_STOCKS[d.symbol] || currentStock;
                  const currentPrice = liveStock.currentPrice;
                  const floatingPnl = Number(((currentPrice - d.entryPrice) * d.plannedShares).toFixed(2));
                  const floatingPnlPercent = Number((((currentPrice - d.entryPrice) / d.entryPrice) * 100).toFixed(2));
                  const isStopLossBreached = currentPrice <= d.stopLossPrice;
                  const isStopLossNear = !isStopLossBreached && currentPrice <= d.stopLossPrice * 1.03;
                  const isTargetHit = currentPrice >= d.targetPrice;

                  return (
                    <div
                      key={d.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isStopLossBreached
                          ? 'bg-[#A84A3E]/5 border-[#A84A3E]/50 shadow-md'
                          : isStopLossNear
                          ? 'bg-amber-500/5 border-amber-500/40'
                          : 'bg-white dark:bg-[#1C2426] border-[#E3E7E1] dark:border-[#2A383A]'
                      }`}
                    >
                      {/* 卡片头部 */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3E7E1] dark:border-[#2A383A] pb-3 mb-3">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-sm font-bold text-[#1F3437] dark:text-white">
                            {d.stockName} ({d.symbol})
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#3E6F73]/15 text-[#3E6F73] dark:text-[#76B4B9]">
                            {d.expectedHoldingPeriod}
                          </span>
                          <span className="text-[10px] text-[#576F73] dark:text-[#9BB2B4]">
                            立项日期: {d.createdAt}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3">
                          {isStopLossBreached && (
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#A84A3E] text-white animate-pulse">
                              已击穿止损线！坚决认错
                            </span>
                          )}
                          {isStopLossNear && (
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500 text-white">
                              逼近止损警戒线
                            </span>
                          )}
                          {isTargetHit && (
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#4A7C6F] text-white">
                              已达公允价值目标！建议止盈
                            </span>
                          )}

                          <button
                            onClick={() => {
                              onSelectStock(d.symbol);
                              onClose();
                            }}
                            className="text-xs text-[#3E6F73] dark:text-[#76B4B9] hover:underline flex items-center space-x-0.5"
                          >
                            <span>深度投研</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* 核心量化数据对比 */}
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 p-3 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] mb-3 text-xs">
                        <div>
                          <span className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] block">买入成本</span>
                          <span className="font-mono font-bold text-[#1F3437] dark:text-white">
                            ¥{d.entryPrice}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] block">最新现价</span>
                          <span className="font-mono font-bold text-[#1F3437] dark:text-white">
                            ¥{currentPrice}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] block">浮动盈亏</span>
                          <span
                            className={`font-mono font-bold ${
                              floatingPnl >= 0 ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'
                            }`}
                          >
                            {floatingPnl >= 0 ? `+¥${floatingPnl.toLocaleString()}` : `-¥${Math.abs(floatingPnl).toLocaleString()}`} ({floatingPnlPercent}%)
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] block">目标止盈</span>
                          <span className="font-mono font-bold text-[#4A7C6F]">
                            ¥{d.targetPrice}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] block">硬核止损</span>
                          <span className="font-mono font-bold text-[#A84A3E]">
                            ¥{d.stopLossPrice}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] block">计划持股/本金</span>
                          <span className="font-mono font-bold text-[#1F3437] dark:text-white">
                            {d.plannedShares}股 / ¥{(d.capitalAllocated / 10000).toFixed(1)}万
                          </span>
                        </div>
                      </div>

                      {/* 核心投资逻辑与证伪条件 (白纸黑字) */}
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-1">
                            <Target className="w-3.5 h-3.5 text-[#3E6F73]" />
                            <span>核心投资逻辑 (Thesis):</span>
                          </span>
                          <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mt-0.5 leading-relaxed bg-white/60 dark:bg-[#1C2426]/60 p-2 rounded-lg border border-[#E3E7E1] dark:border-[#2A383A]">
                            {d.thesis}
                          </p>
                        </div>

                        {d.catalysts && d.catalysts.length > 0 && (
                          <div>
                            <span className="font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              <span>预期催化剂 (Catalysts):</span>
                            </span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {d.catalysts.map((c, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[#576F73] dark:text-[#9BB2B4] border border-[#E3E7E1] dark:border-[#2A383A]"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <span className="font-bold text-[#A84A3E] flex items-center space-x-1">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>证伪底线 (Falsification Criteria，出现即无条件认错):</span>
                          </span>
                          <p className="text-[11px] text-[#A84A3E] mt-0.5 leading-relaxed bg-[#A84A3E]/5 p-2 rounded-lg border border-[#A84A3E]/20">
                            {d.falsificationCriteria}
                          </p>
                        </div>
                      </div>

                      {/* 底部操作行 */}
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E3E7E1] dark:border-[#2A383A]">
                        <div className="text-[10px] text-[#7A9194] font-mono">
                          立项质检快照: 排雷分 {d.healthScoreAtEntry} | 造假指数 {d.mScoreAtEntry} | 破产安全系数 {d.zScoreAtEntry} | PE分位 {d.pePercentileAtEntry}%
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleStartClosing(d)}
                            className="px-3 py-1 rounded-lg bg-[#1F3437] dark:bg-[#3E6F73] hover:bg-[#274246] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                          >
                            结项平仓复盘
                          </button>
                          <button
                            onClick={() => handleEditDecision(d)}
                            className="p-1 text-[#576F73] hover:text-[#1F3437] dark:text-[#9BB2B4] dark:hover:text-white cursor-pointer"
                            title="修改"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDecision(d.id)}
                            className="p-1 text-[#576F73] hover:text-[#A84A3E] cursor-pointer"
                            title="删除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: 历史平仓复盘库 */}
          {activeTab === 'closed' && (
            <div className="space-y-4">
              {closedDecisions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#CBD5E1] dark:border-[#2A383A] rounded-2xl">
                  <Award className="w-8 h-8 text-[#576F73] dark:text-[#9BB2B4] mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold text-[#1F3437] dark:text-white">暂无已平仓复盘档案</p>
                  <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mt-1">
                    在“在仓决策跟踪”中，平仓卖出时点击“结项平仓复盘”，记录您的实战教训与认知迭代。
                  </p>
                </div>
              ) : (
                closedDecisions.map((d) => {
                  const isProfit = (d.realizedPnl || 0) >= 0;
                  return (
                    <div
                      key={d.id}
                      className="p-4 rounded-2xl bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3E7E1] dark:border-[#2A383A] pb-2.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-[#1F3437] dark:text-white">
                            {d.stockName} ({d.symbol})
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                            isProfit ? 'bg-[#4A7C6F]/15 text-[#4A7C6F]' : 'bg-[#A84A3E]/15 text-[#A84A3E]'
                          }`}>
                            {isProfit ? `盈利 +¥${(d.realizedPnl || 0).toLocaleString()} (+${d.realizedPnlPercent}%)` : `亏损 -¥${Math.abs(d.realizedPnl || 0).toLocaleString()} (${d.realizedPnlPercent}%)`}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[#576F73] dark:text-[#9BB2B4]">
                            离场原因: {
                              d.exitReason === 'TARGET_HIT' ? '🎯 达到公允价值止盈' :
                              d.exitReason === 'STOP_LOSS_HIT' ? '🛑 严格纪律止损' :
                              d.exitReason === 'LOGIC_FALSIFIED' ? '⚠️ 核心逻辑证伪' :
                              d.exitReason === 'BETTER_OPPORTUNITY' ? '🔄 调仓更优标的' : '情绪化误操作'
                            }
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-amber-500">
                            {'★'.repeat(d.disciplineRating || 5)} 纪律评级
                          </span>
                          <span className="text-[10px] text-[#576F73] dark:text-[#9BB2B4]">
                            {d.createdAt} ~ {d.exitDate}
                          </span>
                        </div>
                      </div>

                      {/* 交易过程数据 */}
                      <div className="grid grid-cols-4 gap-2 text-xs bg-[#F6F7F5] dark:bg-[#141A1B] p-2.5 rounded-xl border border-[#E3E7E1] dark:border-[#2A383A] font-mono">
                        <div>
                          <span className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] block">买入价</span>
                          <span className="font-bold text-[#1F3437] dark:text-white">¥{d.entryPrice}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] block">平仓价</span>
                          <span className="font-bold text-[#1F3437] dark:text-white">¥{d.exitPrice}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] block">持股数量</span>
                          <span className="font-bold text-[#1F3437] dark:text-white">{d.plannedShares} 股</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] block">原计划止损价</span>
                          <span className="font-bold text-[#A84A3E]">¥{d.stopLossPrice}</span>
                        </div>
                      </div>

                      {/* 核心教训与复盘反思 */}
                      <div className="p-3 rounded-xl bg-[#3E6F73]/5 border border-[#3E6F73]/20 space-y-1">
                        <span className="text-xs font-bold text-[#1F3437] dark:text-white flex items-center space-x-1.5">
                          <Award className="w-3.5 h-3.5 text-[#3E6F73] dark:text-[#76B4B9]" />
                          <span>实战经验反思与教训沉淀 (Lesson Learned):</span>
                        </span>
                        <p className="text-xs text-[#576F73] dark:text-[#CBD8DA] leading-relaxed">
                          {d.lessonLearned || '执行到位，保持买方理性，持续优化胜率与盈亏比。'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: 新增/编辑备忘录表单 */}
          {activeTab === 'editor' && (
            <div className="space-y-4 p-4 rounded-2xl bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A]">
              <div className="flex items-center justify-between border-b border-[#E3E7E1] dark:border-[#2A383A] pb-3">
                <h4 className="text-sm font-bold text-[#1F3437] dark:text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[#3E6F73]" />
                  <span>{editingId ? '编辑投资备忘录' : '撰写正式投资立项备忘录 (Investment Memo)'}</span>
                </h4>
                <span className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">
                  当前标的: {formStockName} ({formSymbol})
                </span>
              </div>

              {/* 标的与动作 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1">
                    标的代码与名称
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${formStockName} (${formSymbol})`}
                    className="w-full px-2.5 py-1.5 bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#CBD5E1] dark:border-[#2A383A] rounded-lg text-xs font-bold text-[#1F3437] dark:text-white opacity-80"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1">
                    决策动作
                  </label>
                  <select
                    value={formAction}
                    onChange={(e) => setFormAction(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1C2426] border border-[#CBD5E1] dark:border-[#2A383A] rounded-lg text-xs font-bold text-[#1F3437] dark:text-white"
                  >
                    <option value="BUY">🟢 坚定建仓买入 (BUY)</option>
                    <option value="WATCH">🟡 列入观察池等待右侧 (WATCH)</option>
                    <option value="SELL">🔴 逻辑破坏/减仓离场 (SELL)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1">
                    预期持有周期
                  </label>
                  <select
                    value={formHoldingPeriod}
                    onChange={(e) => setFormHoldingPeriod(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1C2426] border border-[#CBD5E1] dark:border-[#2A383A] rounded-lg text-xs font-bold text-[#1F3437] dark:text-white"
                  >
                    <option value="1-3个月">1-3个月 (波段战术)</option>
                    <option value="3-6个月">3-6个月 (中期业绩兑现)</option>
                    <option value="6-12个月">6-12个月 (戴维斯双击)</option>
                    <option value="1-2年">1-2年 (深度价值复利)</option>
                    <option value="3年以上">3年以上 (巴菲特级核心资产)</option>
                  </select>
                </div>
              </div>

              {/* 量化价格与仓位边界 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A]">
                <div>
                  <label className="block text-[10px] text-[#576F73] dark:text-[#9BB2B4] mb-1">
                    计划建仓成本价 (元)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formEntryPrice}
                    onChange={(e) => setFormEntryPrice(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded bg-white dark:bg-[#1C2426] border border-[#CBD5E1] dark:border-[#2A383A] text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#576F73] dark:text-[#9BB2B4] mb-1">
                    目标公允止盈价 (元)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formTargetPrice}
                    onChange={(e) => setFormTargetPrice(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded bg-white dark:bg-[#1C2426] border border-[#CBD5E1] dark:border-[#2A383A] text-xs font-mono font-bold text-[#4A7C6F]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#576F73] dark:text-[#9BB2B4] mb-1">
                    硬核纪律止损价 (元)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formStopLossPrice}
                    onChange={(e) => setFormStopLossPrice(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded bg-white dark:bg-[#1C2426] border border-[#CBD5E1] dark:border-[#2A383A] text-xs font-mono font-bold text-[#A84A3E]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#576F73] dark:text-[#9BB2B4] mb-1">
                    计划买入股数 (股)
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={formPlannedShares}
                    onChange={(e) => setFormPlannedShares(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded bg-white dark:bg-[#1C2426] border border-[#CBD5E1] dark:border-[#2A383A] text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#576F73] dark:text-[#9BB2B4] mb-1">
                    组合总资本 (元，用于算仓位占比)
                  </label>
                  <input
                    type="number"
                    step="10000"
                    value={formTotalCapital}
                    onChange={(e) => setFormTotalCapital(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2 py-1 rounded bg-white dark:bg-[#1C2426] border border-[#CBD5E1] dark:border-[#2A383A] text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] mt-1 text-[#7A9194]">
                    {realTotalCapital > 0
                      ? `已自动读取组合总资本 ¥${realTotalCapital.toLocaleString()}（可修改）`
                      : '组合尚未解锁，默认 ¥300,000，可在"组合仓位"页解锁后自动同步'}
                  </p>
                </div>
              </div>

              {/* 核心买入逻辑 (Thesis) */}
              <div>
                <label className="block text-xs font-bold text-[#1F3437] dark:text-white mb-1">
                  🎯 核心投资逻辑 (Investment Thesis) <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1.5">
                  写清楚为什么看好：它的护城河是什么？行业格局如何？当前估值是否具备充足的安全边际？
                </p>
                <textarea
                  rows={3}
                  value={formThesis}
                  onChange={(e) => setFormThesis(e.target.value)}
                  placeholder="例如：行业龙头地位稳固，自由现金流充沛，当前 PE 分位仅 18%，且具备 3% 股息率托底..."
                  className="w-full px-3 py-2 bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#CBD5E1] dark:border-[#2A383A] rounded-xl text-xs text-[#1F3437] dark:text-white focus:outline-none focus:border-[#3E6F73]"
                />
              </div>

              {/* 预期催化剂 (Catalysts) */}
              <div>
                <label className="block text-xs font-bold text-[#1F3437] dark:text-white mb-1">
                  ⚡ 预期关键催化剂 (Catalysts，每行一个)
                </label>
                <textarea
                  rows={2}
                  value={formCatalysts}
                  onChange={(e) => setFormCatalysts(e.target.value)}
                  placeholder="1. 某某新产线投产放量&#10;2. 季度财报营收超预期&#10;3. 产品提价与海外市场突破"
                  className="w-full px-3 py-2 bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#CBD5E1] dark:border-[#2A383A] rounded-xl text-xs text-[#1F3437] dark:text-white focus:outline-none focus:border-[#3E6F73]"
                />
              </div>

              {/* 证伪底线 (Falsification Criteria) */}
              <div>
                <label className="block text-xs font-bold text-[#A84A3E] mb-1">
                  🛑 证伪底线 (Falsification Criteria，出现即无条件认错) <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1.5">
                  机构投资精髓：在下注之前写明“在何种情况下证明我看错了”，避免亏损时陷入自我欺骗与死扛。
                </p>
                <textarea
                  rows={2}
                  value={formFalsification}
                  onChange={(e) => setFormFalsification(e.target.value)}
                  placeholder="例如：若经营性现金流连续两季度低于净利润的 50%，或者关键产品价格跌破成本线，立刻离场认错..."
                  className="w-full px-3 py-2 bg-[#A84A3E]/5 border border-[#A84A3E]/30 rounded-xl text-xs text-[#1F3437] dark:text-white focus:outline-none focus:border-[#A84A3E]"
                />
              </div>

              {/* 保存操作按钮 */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => {
                    setActiveTab('active');
                    setEditingId(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#2A383A] text-xs font-semibold text-[#576F73] dark:text-[#9BB2B4] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveDecision}
                  className="px-5 py-2 rounded-xl bg-[#3E6F73] hover:bg-[#2B5458] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {editingId ? '更新立项备忘录' : '正式确立投资决策并归档'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 平仓结项浮层 */}
        {closingDecision && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60">
            <div className="bg-white dark:bg-[#1C2426] border border-[#CBD5E1] dark:border-[#2A383A] rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#E3E7E1] dark:border-[#2A383A] pb-3">
                <h4 className="text-sm font-bold text-[#1F3437] dark:text-white flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>结项平仓与纪律复盘: {closingDecision.stockName}</span>
                </h4>
                <button
                  onClick={() => setClosingDecision(null)}
                  className="text-[#576F73] hover:text-[#1F3437] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1">
                    实际平仓均价 (元)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={closeExitPrice}
                    onChange={(e) => setCloseExitPrice(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#CBD5E1] dark:border-[#2A383A] text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1">
                    平仓离场主因
                  </label>
                  <select
                    value={closeReason}
                    onChange={(e) => setCloseReason(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#CBD5E1] dark:border-[#2A383A] text-xs font-bold"
                  >
                    <option value="TARGET_HIT">🎯 达到公允价值止盈</option>
                    <option value="STOP_LOSS_HIT">🛑 触及硬核纪律止损</option>
                    <option value="LOGIC_FALSIFIED">⚠️ 核心逻辑证伪认错</option>
                    <option value="BETTER_OPPORTUNITY">🔄 调仓至更高盈亏比标的</option>
                    <option value="EMOTIONAL_MISTAKE">❌ 盘中情绪化误操作</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1">
                  执行纪律评分 (是否遵守了买入前的约定)
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCloseDisciplineRating(star)}
                      className={`text-lg transition-transform cursor-pointer ${
                        star <= closeDisciplineRating ? 'text-amber-500 scale-110' : 'text-gray-300 dark:text-gray-600'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-xs font-mono text-[#576F73] dark:text-[#9BB2B4] ml-2">
                    {closeDisciplineRating} 星
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1">
                  反思与教训总结 (复盘心得)
                </label>
                <textarea
                  rows={3}
                  value={closeLessonLearned}
                  onChange={(e) => setCloseLessonLearned(e.target.value)}
                  placeholder="写下这笔交易最大的教训或做对的地方，沉淀为未来的行为准则..."
                  className="w-full px-3 py-2 bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#CBD5E1] dark:border-[#2A383A] rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2.5 pt-2">
                <button
                  onClick={() => setClosingDecision(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#CBD5E1] dark:border-[#2A383A] text-xs font-semibold text-[#576F73] dark:text-[#9BB2B4]"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmClosing}
                  className="px-4 py-1.5 rounded-lg bg-[#3E6F73] hover:bg-[#2B5458] text-white text-xs font-bold"
                >
                  确认平仓并归档复盘
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 底部条 */}
        <div className="px-6 py-3.5 border-t border-[#E3E7E1] dark:border-[#2A383A] bg-[#F6F7F5] dark:bg-[#141A1B] flex items-center justify-between text-xs text-[#576F73] dark:text-[#9BB2B4]">
          <div className="flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#3E6F73]" />
            <span>专业投资第一铁律：买入即确定止损，买后严格跟踪证伪，让每一笔盈亏都有迹可循</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#1F3437] hover:bg-[#274246] text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
