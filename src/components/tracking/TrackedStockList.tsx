import React from 'react';
import { PRESET_STOCKS } from '../../data/presetStocks';
import { STATUS_MAP } from '../../data/trackingData';
import { TrackedStockItem } from '../../types/stock';
import { CheckCircle2, AlertTriangle, Clock, Calendar } from 'lucide-react';

export function TrackedStockList({
  filteredList,
  selectedSymbol,
  setSelectedSymbol,
  setStatusFilter,
}: {
  filteredList: TrackedStockItem[];
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  setStatusFilter: (value: string) => void;
}) {
  return (
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
  );
}
