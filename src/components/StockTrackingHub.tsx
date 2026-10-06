import React, { useState } from 'react';
import { TrackedStockItem, TrackStatus, StockData } from '../types/stock';
import { STATUS_MAP, createTrackedStockFromStockData } from '../data/trackingData';
import { usePortfolio } from '../context/PortfolioContext';
import { VaultPasswordGate } from './portfolio/VaultPasswordGate';
import { TrackedStockList } from './tracking/TrackedStockList';
import { TrackingTargetCard } from './tracking/TrackingTargetCard';
import { TrackingEventsCard } from './tracking/TrackingEventsCard';
import { TrackingNotesCard } from './tracking/TrackingNotesCard';
import { AddTrackedStockModal } from './tracking/AddTrackedStockModal';
import { TrackingRegimeStatus } from './tracking/TrackingRegimeStatus';
import { applyStrategyToTracked, outlookFromStock } from '../utils/strategyPipeline';
import { PRESET_STOCKS } from '../data/presetStocks';
import { stockService } from '../services/stockService';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Plus,
  Compass,
  Activity,
  Trash2,
  Edit3,
  TrendingUp,
  Target,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Check,
  Clock,
  Sparkles,
  Search,
} from 'lucide-react';

interface StockTrackingHubProps {
  currentSymbol: string;
  onSelectStock: (symbol: string) => void;
  onNavigateToFiveStep: (symbol: string) => void;
  onNavigateToDeepExplore: (symbol: string) => void;
}

export const StockTrackingHub: React.FC<StockTrackingHubProps> = ({
  currentSymbol,
  onSelectStock,
  onNavigateToFiveStep,
  onNavigateToDeepExplore,
}) => {
  const {
    status,
    trackedStocks: trackedList,
    setTrackedStocks,
    error: vaultError,
    unlock,
    setup,
    reset,
  } = usePortfolio();
  const [selectedSymbol, setSelectedSymbol] = useState<string>(currentSymbol);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addSearchInput, setAddSearchInput] = useState('');
  const [addCustomCode, setAddCustomCode] = useState('');
  const [addCustomLoading, setAddCustomLoading] = useState(false);
  const [addCustomError, setAddCustomError] = useState<string | null>(null);
  const [refreshingOutlook, setRefreshingOutlook] = useState(false);
  const [isEditingTargets, setIsEditingTargets] = useState(false);

  // New Note inputs
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteStage, setNewNoteStage] = useState('日常跟踪');
  const [newNoteSentiment, setNewNoteSentiment] = useState<'bullish' | 'neutral' | 'cautious'>('bullish');

  // New Event inputs
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<'earnings' | 'policy' | 'product' | 'macro' | 'technical' | 'catalyst'>('earnings');
  const [newEventNote, setNewEventNote] = useState('');

  // Target price edit inputs
  const activeTracked = trackedList.find((i) => i.symbol === selectedSymbol) || trackedList[0];
  const [editBuyPrice, setEditBuyPrice] = useState<number>(activeTracked ? activeTracked.targetBuyPrice : 0);
  const [editPullbackPrice, setEditPullbackPrice] = useState<number>(activeTracked ? activeTracked.targetPullbackBuyPrice : 0);
  const [editStopLoss, setEditStopLoss] = useState<number>(activeTracked ? activeTracked.targetStopLossPrice : 0);
  const [editTakeProfit, setEditTakeProfit] = useState<number>(activeTracked ? activeTracked.targetTakeProfitPrice : 0);

  // Keep edit state synced when activeTracked changes
  React.useEffect(() => {
    if (activeTracked) {
      setEditBuyPrice(activeTracked.targetBuyPrice);
      setEditPullbackPrice(activeTracked.targetPullbackBuyPrice);
      setEditStopLoss(activeTracked.targetStopLossPrice);
      setEditTakeProfit(activeTracked.targetTakeProfitPrice);
    }
  }, [selectedSymbol]);

  // Sync latest live price from PRESET_STOCKS if available
  const currentPrice = PRESET_STOCKS[activeTracked?.symbol]?.currentPrice || activeTracked?.currentPrice || 100;
  const currency = activeTracked?.currency || 'CNY';

  const handleUpdateList = (updated: TrackedStockItem[]) => {
    setTrackedStocks(updated);
  };

  const handleStatusChange = (symbol: string, newStatus: TrackStatus) => {
    const updated = trackedList.map((item) => {
      if (item.symbol === symbol) {
        return {
          ...item,
          trackStatus: newStatus,
          statusLabelZh: STATUS_MAP[newStatus].label,
        };
      }
      return item;
    });
    handleUpdateList(updated);
  };

  const handleToggleAlerts = (symbol: string) => {
    const updated = trackedList.map((item) => {
      if (item.symbol === symbol) {
        return { ...item, alertsEnabled: !item.alertsEnabled };
      }
      return item;
    });
    handleUpdateList(updated);
  };

  const handleRemoveTracked = (symbol: string) => {
    const updated = trackedList.filter((i) => i.symbol !== symbol);
    handleUpdateList(updated);
    if (selectedSymbol === symbol && updated.length > 0) {
      setSelectedSymbol(updated[0].symbol);
    }
  };

  const handleSaveTargets = () => {
    const updated = trackedList.map((item) => {
      if (item.symbol === selectedSymbol) {
        return {
          ...item,
          targetBuyPrice: Number(editBuyPrice),
          targetPullbackBuyPrice: Number(editPullbackPrice),
          targetStopLossPrice: Number(editStopLoss),
          targetTakeProfitPrice: Number(editTakeProfit),
        };
      }
      return item;
    });
    handleUpdateList(updated);
    setIsEditingTargets(false);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !activeTracked) return;

    const newNote = {
      id: `n-${Date.now()}`,
      timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
      stage: newNoteStage,
      author: 'Zane投研',
      content: newNoteContent.trim(),
      sentiment: newNoteSentiment,
    };

    const updated = trackedList.map((item) => {
      if (item.symbol === selectedSymbol) {
        return {
          ...item,
          notes: [newNote, ...item.notes],
        };
      }
      return item;
    });

    handleUpdateList(updated);
    setNewNoteContent('');
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate.trim() || !activeTracked) return;

    const newEv = {
      id: `ev-${Date.now()}`,
      date: newEventDate,
      title: newEventTitle.trim(),
      impact: 'high' as const,
      category: newEventCategory,
      note: newEventNote.trim(),
    };

    const updated = trackedList.map((item) => {
      if (item.symbol === selectedSymbol) {
        return {
          ...item,
          upcomingEvents: [...(item.upcomingEvents || []), newEv],
        };
      }
      return item;
    });

    handleUpdateList(updated);
    setIsAddEventOpen(false);
    setNewEventTitle('');
    setNewEventDate('');
    setNewEventNote('');
  };

  const handleRefreshOutlooks = async (symbols: string[]) => {
    if (refreshingOutlook || symbols.length === 0) return;
    setRefreshingOutlook(true);
    try {
      const updates = new Map<string, TrackedStockItem>();
      for (const symbol of symbols) {
        const existing = trackedList.find((item) => item.symbol === symbol);
        const strategyName = existing?.strategyOutlook?.strategyName;
        if (!existing || !strategyName) continue;
        const stock = await stockService.getStockBySymbol(symbol);
        const drafted = createTrackedStockFromStockData(stock, existing.trackStatus);
        const next = applyStrategyToTracked(drafted, outlookFromStock(stock), strategyName);
        next.upcomingEvents = existing.upcomingEvents;
        next.notes = [...next.notes, ...existing.notes.filter((note) => note.stage !== '策略预测')];
        next.priority = existing.priority;
        next.alertsEnabled = existing.alertsEnabled;
        next.addedDate = existing.addedDate;
        updates.set(symbol, next);
      }
      if (updates.size > 0) {
        setTrackedStocks((prev) => prev.map((item) => updates.get(item.symbol) || item));
      }
    } finally {
      setRefreshingOutlook(false);
    }
  };

  const handleAddStock = (stock: StockData) => {
    const existing = trackedList.find((i) => i.symbol === stock.symbol);
    if (existing) {
      setSelectedSymbol(existing.symbol);
      setIsAddModalOpen(false);
      return;
    }
    const newItem = createTrackedStockFromStockData(stock, 'observe');
    const updated = [newItem, ...trackedList];
    handleUpdateList(updated);
    setSelectedSymbol(newItem.symbol);
    setIsAddModalOpen(false);
  };

  // 通过任意代码直接添加跟踪标的（拉取实时行情与五步法参数）
  const handleAddCustomCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = addCustomCode.trim().toUpperCase();
    if (!code || addCustomLoading) return;
    setAddCustomLoading(true);
    setAddCustomError(null);
    try {
      const stock = await stockService.getStockBySymbol(code);
      handleAddStock(stock);
      setAddCustomCode('');
    } catch (err: any) {
      setAddCustomError(err?.message || '加载该代码失败，请确认代码格式（如 601318 / 00700 / NVDA）');
    } finally {
      setAddCustomLoading(false);
    }
  };

  // Filtered tracked items
  const filteredList = trackedList.filter((item) => {
    if (statusFilter === 'all') return true;
    return item.trackStatus === statusFilter;
  });

  // Calculate stats
  const totalCount = trackedList.length;
  const inBuyZoneCount = trackedList.filter((i) => {
    const p = PRESET_STOCKS[i.symbol]?.currentPrice || i.currentPrice;
    return p <= i.targetBuyPrice * 1.03;
  }).length;
  const inAlertCount = trackedList.filter((i) => {
    const p = PRESET_STOCKS[i.symbol]?.currentPrice || i.currentPrice;
    return p <= i.targetStopLossPrice || i.trackStatus === 'high_alert';
  }).length;

  if (status !== 'ready') {
    return <VaultPasswordGate status={status} error={vaultError} onUnlock={unlock} onSetup={setup} onReset={reset} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Stats & Quick Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4 text-blue-400" />
            <span>ZANE INVEST SURVEILLANCE & ACTIVE TRACKING</span>
          </div>
          <h2 className="text-xl font-black text-white">标的动态跟踪与触发器监控中心</h2>
          <p className="text-xs text-slate-400 mt-1">
            全生命周期跟踪标的走势、五步买点触发预警、关键事件日程及投研复盘手记
          </p>
        </div>

        {/* Stats Metrics & Add Button */}
        <div className="flex items-center flex-wrap gap-3">
          <div className="flex items-center space-x-3 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/80">
            <div className="text-center">
              <div className="text-[10px] text-slate-400 uppercase">跟踪标的总数</div>
              <div className="text-lg font-black font-mono text-white">{totalCount}</div>
            </div>
            <div className="w-[1px] h-6 bg-slate-700" />
            <div className="text-center">
              <div className="text-[10px] text-slate-400 uppercase">已到买点窗口</div>
              <div className="text-lg font-black font-mono text-emerald-400">{inBuyZoneCount}</div>
            </div>
            <div className="w-[1px] h-6 bg-slate-700" />
            <div className="text-center">
              <div className="text-[10px] text-slate-400 uppercase">止损/预警项</div>
              <div className="text-lg font-black font-mono text-rose-400">{inAlertCount}</div>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>添加跟踪标的</span>
          </button>
        </div>
      </div>

      <TrackingRegimeStatus tracked={trackedList} busy={refreshingOutlook} onRefresh={(symbols) => { void handleRefreshOutlooks(symbols); }} />

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-semibold flex items-center space-x-1 pl-1">
          <Filter className="w-3.5 h-3.5" />
          <span>跟踪状态:</span>
        </span>

        {[
          { key: 'all', label: '全部标的' },
          { key: 'initial_position', label: '已建底仓跟踪' },
          { key: 'waiting_pullback', label: '等待回踩支撑' },
          { key: 'breakout_watch', label: '突破加仓监控' },
          { key: 'observe', label: '观望研判中' },
          { key: 'high_alert', label: '高估警惕预警' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === tab.key
                ? 'bg-slate-200 text-slate-900 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Left Tracked Stock List & Right Stock Deep Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Tracked Cards List (5 Cols) */}
        <TrackedStockList
          filteredList={filteredList}
          selectedSymbol={selectedSymbol}
          setSelectedSymbol={setSelectedSymbol}
          setStatusFilter={setStatusFilter}
        />

        {/* Right Column: Selected Stock Deep Tracking Dossier (7 Cols) */}
        {activeTracked ? (
          <div className="lg:col-span-7 space-y-6">
            {/* Stock Master Dossier Card */}
            <TrackingTargetCard
              activeTracked={activeTracked}
              isEditingTargets={isEditingTargets}
              setIsEditingTargets={setIsEditingTargets}
              editBuyPrice={editBuyPrice}
              setEditBuyPrice={setEditBuyPrice}
              editPullbackPrice={editPullbackPrice}
              setEditPullbackPrice={setEditPullbackPrice}
              editStopLoss={editStopLoss}
              setEditStopLoss={setEditStopLoss}
              editTakeProfit={editTakeProfit}
              setEditTakeProfit={setEditTakeProfit}
              handleStatusChange={handleStatusChange}
              handleToggleAlerts={handleToggleAlerts}
              handleRemoveTracked={handleRemoveTracked}
              handleSaveTargets={handleSaveTargets}
              onNavigateToFiveStep={onNavigateToFiveStep}
              onNavigateToDeepExplore={onNavigateToDeepExplore}
            />

            {/* Upcoming Milestones & Catalysts (重大催化与跟踪节点) */}
            <TrackingEventsCard
              activeTracked={activeTracked}
              isAddEventOpen={isAddEventOpen}
              setIsAddEventOpen={setIsAddEventOpen}
              handleAddEvent={handleAddEvent}
              newEventTitle={newEventTitle}
              setNewEventTitle={setNewEventTitle}
              newEventDate={newEventDate}
              setNewEventDate={setNewEventDate}
              newEventNote={newEventNote}
              setNewEventNote={setNewEventNote}
            />

            {/* Tracking Notes Journal (投研复盘手记时间轴) */}
            <TrackingNotesCard
              activeTracked={activeTracked}
              handleAddNote={handleAddNote}
              newNoteStage={newNoteStage}
              setNewNoteStage={setNewNoteStage}
              newNoteSentiment={newNoteSentiment}
              setNewNoteSentiment={setNewNoteSentiment}
              newNoteContent={newNoteContent}
              setNewNoteContent={setNewNoteContent}
            />

          </div>
        ) : (
          <div className="lg:col-span-7 flex items-center justify-center p-12 bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400">
            请在左侧选择需要查看的跟踪标的
          </div>
        )}

      </div>

      {/* Modal: Add Tracked Stock */}
      {isAddModalOpen && (
        <AddTrackedStockModal
          trackedList={trackedList}
          addSearchInput={addSearchInput}
          setAddSearchInput={setAddSearchInput}
          handleAddStock={handleAddStock}
          addCustomCode={addCustomCode}
          setAddCustomCode={setAddCustomCode}
          handleAddCustomCode={handleAddCustomCode}
          addCustomLoading={addCustomLoading}
          addCustomError={addCustomError}
          setIsAddModalOpen={setIsAddModalOpen}
        />
      )}

    </div>
  );
};
