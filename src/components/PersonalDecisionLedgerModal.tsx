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
import { ActiveDecisionList } from './decision/ActiveDecisionList';
import { ClosedDecisionList } from './decision/ClosedDecisionList';
import { DecisionMemoForm } from './decision/DecisionMemoForm';
import { CloseDecisionDialog } from './decision/CloseDecisionDialog';
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
            <ActiveDecisionList
              activeDecisions={activeDecisions}
              currentStock={currentStock}
              onSelectStock={onSelectStock}
              onClose={onClose}
              handleStartClosing={handleStartClosing}
              handleEditDecision={handleEditDecision}
              handleDeleteDecision={handleDeleteDecision}
            />
          )}

          {activeTab === 'closed' && <ClosedDecisionList closedDecisions={closedDecisions} />}

          {activeTab === 'editor' && (
            <DecisionMemoForm
              editingId={editingId}
              formStockName={formStockName}
              formSymbol={formSymbol}
              formAction={formAction}
              setFormAction={setFormAction}
              formHoldingPeriod={formHoldingPeriod}
              setFormHoldingPeriod={setFormHoldingPeriod}
              formEntryPrice={formEntryPrice}
              setFormEntryPrice={setFormEntryPrice}
              formTargetPrice={formTargetPrice}
              setFormTargetPrice={setFormTargetPrice}
              formStopLossPrice={formStopLossPrice}
              setFormStopLossPrice={setFormStopLossPrice}
              formPlannedShares={formPlannedShares}
              setFormPlannedShares={setFormPlannedShares}
              formTotalCapital={formTotalCapital}
              setFormTotalCapital={setFormTotalCapital}
              realTotalCapital={realTotalCapital}
              formThesis={formThesis}
              setFormThesis={setFormThesis}
              formCatalysts={formCatalysts}
              setFormCatalysts={setFormCatalysts}
              formFalsification={formFalsification}
              setFormFalsification={setFormFalsification}
              setActiveTab={setActiveTab}
              setEditingId={setEditingId}
              handleSaveDecision={handleSaveDecision}
            />
          )}
        </div>

        {/* 平仓结项浮层 */}
        {closingDecision && (
          <CloseDecisionDialog
            closingDecision={closingDecision}
            setClosingDecision={setClosingDecision}
            closeExitPrice={closeExitPrice}
            setCloseExitPrice={setCloseExitPrice}
            closeReason={closeReason}
            setCloseReason={setCloseReason}
            closeDisciplineRating={closeDisciplineRating}
            setCloseDisciplineRating={setCloseDisciplineRating}
            closeLessonLearned={closeLessonLearned}
            setCloseLessonLearned={setCloseLessonLearned}
            handleConfirmClosing={handleConfirmClosing}
          />
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
