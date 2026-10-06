import React from 'react';
import { PersonalInvestmentDecision } from '../../types/stock';
import { Award } from 'lucide-react';

export function ClosedDecisionList({ closedDecisions }: { closedDecisions: PersonalInvestmentDecision[] }) {
  return (
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
  );
}
