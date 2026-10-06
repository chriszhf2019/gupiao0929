import React from 'react';
import { PersonalInvestmentDecision, StockData } from '../../types/stock';
import { PRESET_STOCKS } from '../../data/presetStocks';
import { BookOpenCheck, ExternalLink, Target, Sparkles, ShieldAlert, Edit3, Trash2 } from 'lucide-react';

export function ActiveDecisionList({
  activeDecisions,
  currentStock,
  onSelectStock,
  onClose,
  handleStartClosing,
  handleEditDecision,
  handleDeleteDecision,
}: {
  activeDecisions: PersonalInvestmentDecision[];
  currentStock: StockData;
  onSelectStock: (symbol: string) => void;
  onClose: () => void;
  handleStartClosing: (d: PersonalInvestmentDecision) => void;
  handleEditDecision: (d: PersonalInvestmentDecision) => void;
  handleDeleteDecision: (id: string) => void;
}) {
  return (
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
  );
}
