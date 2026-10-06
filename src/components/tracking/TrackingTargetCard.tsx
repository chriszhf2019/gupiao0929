import React from 'react';
import { TrackedStockItem, TrackStatus } from '../../types/stock';
import { Activity, Bell, Trash2, Target, Edit3, Check, Compass } from 'lucide-react';

export function TrackingTargetCard(props: {
  activeTracked: TrackedStockItem;
  isEditingTargets: boolean;
  setIsEditingTargets: (value: boolean) => void;
  editBuyPrice: number;
  setEditBuyPrice: (value: number) => void;
  editPullbackPrice: number;
  setEditPullbackPrice: (value: number) => void;
  editStopLoss: number;
  setEditStopLoss: (value: number) => void;
  editTakeProfit: number;
  setEditTakeProfit: (value: number) => void;
  handleStatusChange: (symbol: string, status: TrackStatus) => void;
  handleToggleAlerts: (symbol: string) => void;
  handleRemoveTracked: (symbol: string) => void;
  handleSaveTargets: () => void;
  onNavigateToFiveStep: (symbol: string) => void;
  onNavigateToDeepExplore: (symbol: string) => void;
}) {
  const {
    activeTracked, isEditingTargets, setIsEditingTargets, editBuyPrice, setEditBuyPrice,
    editPullbackPrice, setEditPullbackPrice, editStopLoss, setEditStopLoss, editTakeProfit, setEditTakeProfit,
    handleStatusChange, handleToggleAlerts, handleRemoveTracked, handleSaveTargets,
    onNavigateToFiveStep, onNavigateToDeepExplore,
  } = props;
  return (
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
  );
}
