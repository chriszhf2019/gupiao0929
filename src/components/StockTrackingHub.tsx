import React, { useState } from 'react';
import { TrackedStockItem, TrackStatus, StockData } from '../types/stock';
import { STATUS_MAP, loadTrackedStocks, saveTrackedStocks, createTrackedStockFromStockData } from '../data/trackingData';
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
  const [trackedList, setTrackedList] = useState<TrackedStockItem[]>(() => loadTrackedStocks());
  const [selectedSymbol, setSelectedSymbol] = useState<string>(() => {
    const list = loadTrackedStocks();
    const found = list.find((i) => i.symbol === currentSymbol);
    return found ? found.symbol : (list[0]?.symbol || '600519');
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addSearchInput, setAddSearchInput] = useState('');
  const [addCustomCode, setAddCustomCode] = useState('');
  const [addCustomLoading, setAddCustomLoading] = useState(false);
  const [addCustomError, setAddCustomError] = useState<string | null>(null);
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
    setTrackedList(updated);
    saveTrackedStocks(updated);
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
        <div className="lg:col-span-5 space-y-3">
          {filteredList.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400">
              <p className="text-sm">暂无该状态下的跟踪标的</p>
              <button
                onClick={() => setStatusFilter('all')}
                className="mt-3 text-xs text-blue-400 hover:underline cursor-pointer"
              >
                查看全部跟踪标的
              </button>
            </div>
          ) : (
            filteredList.map((item) => {
              const livePrice = PRESET_STOCKS[item.symbol]?.currentPrice || item.currentPrice;
              const liveChange = PRESET_STOCKS[item.symbol]?.changePercent || 0;
              const isSelected = item.symbol === selectedSymbol;
              const st = STATUS_MAP[item.trackStatus] || STATUS_MAP.observe;

              // Distance to target buy price (%)
              const buyDistPercent = Number((((livePrice - item.targetBuyPrice) / item.targetBuyPrice) * 100).toFixed(1));
              const isCloseToBuy = Math.abs(buyDistPercent) <= 3 || livePrice <= item.targetBuyPrice;

              // Distance to stop loss (%)
              const stopDistPercent = Number((((livePrice - item.targetStopLossPrice) / livePrice) * 100).toFixed(1));
              const isStopLossBreached = livePrice <= item.targetStopLossPrice;

              return (
                <div
                  key={item.symbol}
                  onClick={() => setSelectedSymbol(item.symbol)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-blue-500/80 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/50'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-white text-base">{item.name}</span>
                        <span className="font-mono text-xs text-slate-400">{item.symbol}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {item.market}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 mt-1 font-mono text-xs">
                        <span className="text-white font-bold">${livePrice}</span>
                        <span className={`font-semibold ${liveChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {liveChange >= 0 ? '+' : ''}{liveChange}%
                        </span>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="text-right">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border ${st.color} ${st.bg} ${st.border}`}>
                        {st.label}
                      </span>
                    </div>
                  </div>

                  {/* Trigger Progress / Comparison Bars */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>距第一买点</span>
                        <span className="font-mono">${item.targetBuyPrice}</span>
                      </div>
                      <div className="mt-1 font-mono font-bold flex items-center space-x-1">
                        {isCloseToBuy ? (
                          <span className="text-emerald-400 flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            进入买入区 ({buyDistPercent > 0 ? `+${buyDistPercent}%` : `${buyDistPercent}%`})
                          </span>
                        ) : (
                          <span className="text-slate-300">
                            {buyDistPercent > 0 ? `高出 +${buyDistPercent}%` : `低于 ${buyDistPercent}%`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>止损安全垫</span>
                        <span className="font-mono">${item.targetStopLossPrice}</span>
                      </div>
                      <div className="mt-1 font-mono font-bold">
                        {isStopLossBreached ? (
                          <span className="text-rose-400 flex items-center">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                            击穿止损线!
                          </span>
                        ) : (
                          <span className="text-slate-300">
                            垫度 +{stopDistPercent}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes and events count footer */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{item.notes.length} 条跟踪手记</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-indigo-400" />
                      <span>{item.upcomingEvents?.length || 0} 个跟踪节点</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Stock Deep Tracking Dossier (7 Cols) */}
        {activeTracked ? (
          <div className="lg:col-span-7 space-y-6">
            {/* Stock Master Dossier Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
              
              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-2xl font-black text-white">{activeTracked.name}</h3>
                    <span className="font-mono text-slate-400 text-sm">({activeTracked.symbol})</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono font-bold">
                      {activeTracked.market}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    跟踪建档时间: {activeTracked.addedDate} · 优先级: 高度关注
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Status Dropdown */}
                  <select
                    value={activeTracked.trackStatus}
                    onChange={(e) => handleStatusChange(activeTracked.symbol, e.target.value as TrackStatus)}
                    className="bg-slate-800 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
                  >
                    <option value="observe">观望研判中</option>
                    <option value="waiting_pullback">等待回踩支撑</option>
                    <option value="initial_position">已建底仓跟踪</option>
                    <option value="breakout_watch">突破加仓监控</option>
                    <option value="high_alert">高估警惕预警</option>
                  </select>

                  <button
                    onClick={() => handleToggleAlerts(activeTracked.symbol)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      activeTracked.alertsEnabled
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                    title={activeTracked.alertsEnabled ? '警报监听已开启' : '警报已静音'}
                  >
                    <Bell className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleRemoveTracked(activeTracked.symbol)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-all cursor-pointer"
                    title="从跟踪列表中移除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Target Price Triggers Config & Status */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                    <Target className="w-4 h-4 text-indigo-400" />
                    <span>五步法目标买点与风控触发参数</span>
                  </div>
                  {!isEditingTargets ? (
                    <button
                      onClick={() => setIsEditingTargets(true)}
                      className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>调整目标参数</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSaveTargets}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>保存</span>
                      </button>
                      <button
                        onClick={() => setIsEditingTargets(false)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs cursor-pointer"
                      >
                        取消
                      </button>
                    </div>
                  )}
                </div>

                {isEditingTargets ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">第一买点(底仓)</label>
                      <input
                        type="number"
                        value={editBuyPrice}
                        onChange={(e) => setEditBuyPrice(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">第二买点(回踩)</label>
                      <input
                        type="number"
                        value={editPullbackPrice}
                        onChange={(e) => setEditPullbackPrice(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">止损风控线</label>
                      <input
                        type="number"
                        value={editStopLoss}
                        onChange={(e) => setEditStopLoss(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-rose-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">目标止盈线</label>
                      <input
                        type="number"
                        value={editTakeProfit}
                        onChange={(e) => setEditTakeProfit(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-emerald-400 font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block">第一批底仓目标</span>
                      <span className="text-base font-black font-mono text-blue-400 mt-1 block">
                        ${activeTracked.targetBuyPrice}
                      </span>
                      <span className="text-[10px] text-slate-400">第一支撑位附近</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block">回踩加仓目标</span>
                      <span className="text-base font-black font-mono text-purple-400 mt-1 block">
                        ${activeTracked.targetPullbackBuyPrice}
                      </span>
                      <span className="text-[10px] text-slate-400">强支撑确认</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block">严格止损防线</span>
                      <span className="text-base font-black font-mono text-rose-400 mt-1 block">
                        ${activeTracked.targetStopLossPrice}
                      </span>
                      <span className="text-[10px] text-rose-400/80">跌破离场减仓</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block">阶段止盈目标</span>
                      <span className="text-base font-black font-mono text-emerald-400 mt-1 block">
                        ${activeTracked.targetTakeProfitPrice}
                      </span>
                      <span className="text-[10px] text-emerald-400/80">合理价值兑现</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Jump Action Bar */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigateToFiveStep(activeTracked.symbol)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-all cursor-pointer"
                >
                  <Activity className="w-4 h-4" />
                  <span>载入五步深度研判</span>
                </button>

                <button
                  onClick={() => onNavigateToDeepExplore(activeTracked.symbol)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold shadow transition-all cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>深度探索与三维情景</span>
                </button>
              </div>

            </div>

            {/* Upcoming Milestones & Catalysts (重大催化与跟踪节点) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  <Calendar className="w-4 h-4" />
                  <span>关键催化节点与事件追踪日历</span>
                </div>
                <button
                  onClick={() => setIsAddEventOpen(!isAddEventOpen)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddEventOpen ? '收起' : '添加事件'}</span>
                </button>
              </div>

              {isAddEventOpen && (
                <form onSubmit={handleAddEvent} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-1">事件名称 / 催化主题</label>
                      <input
                        type="text"
                        placeholder="如: 三季度财报发布会、海外产线落地..."
                        value={newEventTitle}
                        onChange={(e) => setNewEventTitle(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">预计日期</label>
                      <input
                        type="date"
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">跟踪要点与预期影响</label>
                    <input
                      type="text"
                      placeholder="重点观察指标或预期驱动逻辑..."
                      value={newEventNote}
                      onChange={(e) => setNewEventNote(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsAddEventOpen(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                    >
                      确定添加
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2.5">
                {activeTracked.upcomingEvents?.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mt-0.5">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{ev.title}</span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                            {ev.date}
                          </span>
                        </div>
                        {ev.note && <p className="text-slate-400 text-[11px] mt-1">{ev.note}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking Notes Journal (投研复盘手记时间轴) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Edit3 className="w-4 h-4" />
                <span>投研跟踪日记与复盘手记 (Research Journal)</span>
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    placeholder="阶段标签 (如: 中报复盘、批价追踪、加仓执行...)"
                    value={newNoteStage}
                    onChange={(e) => setNewNoteStage(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-white max-w-xs"
                  />

                  <div className="flex items-center space-x-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setNewNoteSentiment('bullish')}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                        newNoteSentiment === 'bullish'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      看多偏好
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewNoteSentiment('neutral')}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                        newNoteSentiment === 'neutral'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      中性观望
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewNoteSentiment('cautious')}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                        newNoteSentiment === 'cautious'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      谨慎防守
                    </button>
                  </div>
                </div>

                <textarea
                  rows={2}
                  placeholder="记录跟踪心得、财报点评、关键点位触碰观察或仓位决策思考..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition-all cursor-pointer"
                  >
                    写入跟踪日记
                  </button>
                </div>
              </form>

              {/* Notes Timeline List */}
              <div className="space-y-3 pt-2">
                {activeTracked.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-xl bg-slate-800/40 border border-slate-800/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-700 text-[11px]">
                          {note.stage}
                        </span>
                        <span className="text-slate-400 text-[11px] font-mono">{note.timestamp}</span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          note.sentiment === 'bullish'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : note.sentiment === 'cautious'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {note.sentiment === 'bullish' ? '看多' : note.sentiment === 'cautious' ? '谨慎' : '中性'}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-xs">{note.content}</p>
                  </div>
                ))}
              </div>

            </div>

          </div>
        ) : (
          <div className="lg:col-span-7 flex items-center justify-center p-12 bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400">
            请在左侧选择需要查看的跟踪标的
          </div>
        )}

      </div>

      {/* Modal: Add Tracked Stock */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Plus className="w-5 h-5 text-blue-400" />
                <span>载入新标的至跟踪中心</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索标的名称或代码 (如 贵州茅台, 300750, NVDA)..."
                value={addSearchInput}
                onChange={(e) => setAddSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/60">
              {Object.values(PRESET_STOCKS)
                .filter(
                  (s) =>
                    s.name.toLowerCase().includes(addSearchInput.toLowerCase()) ||
                    s.symbol.toLowerCase().includes(addSearchInput.toLowerCase())
                )
                .map((stock) => {
                  const isAlreadyTracked = trackedList.some((i) => i.symbol === stock.symbol);
                  return (
                    <div
                      key={stock.symbol}
                      className="pt-2 flex items-center justify-between text-xs py-1"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center space-x-2">
                          <span>{stock.name}</span>
                          <span className="text-slate-400 font-mono">({stock.symbol})</span>
                        </div>
                        <span className="text-slate-400 text-[11px] font-mono">
                          最新价: ${stock.currentPrice} · PE: {stock.peTTM}
                        </span>
                      </div>

                      <button
                        onClick={() => handleAddStock(stock)}
                        disabled={isAlreadyTracked}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isAlreadyTracked
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow'
                        }`}
                      >
                        {isAlreadyTracked ? '已在跟踪中' : '加入跟踪'}
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* 任意代码直接添加 */}
            <div className="mt-3 pt-3 border-t border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 mb-2">
                直接输入任意代码添加跟踪（支持 A 股 / 港股 / 美股）
              </div>
              <form onSubmit={handleAddCustomCode} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={addCustomCode}
                  onChange={(e) => setAddCustomCode(e.target.value)}
                  placeholder="如 601318 / 00700 / NVDA"
                  className="flex-1 px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={addCustomLoading || !addCustomCode.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white cursor-pointer shadow shrink-0"
                >
                  {addCustomLoading ? '加载中...' : '添加跟踪'}
                </button>
              </form>
              {addCustomError && (
                <div className="mt-1.5 text-[11px] text-rose-400">{addCustomError}</div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
