import React from 'react';
import { ExitReasonType, PersonalInvestmentDecision } from '../../types/stock';
import { Award, X } from 'lucide-react';

export function CloseDecisionDialog(props: {
  closingDecision: PersonalInvestmentDecision;
  setClosingDecision: (value: PersonalInvestmentDecision | null) => void;
  closeExitPrice: number;
  setCloseExitPrice: (value: number) => void;
  closeReason: ExitReasonType;
  setCloseReason: (value: ExitReasonType) => void;
  closeDisciplineRating: number;
  setCloseDisciplineRating: (value: number) => void;
  closeLessonLearned: string;
  setCloseLessonLearned: (value: string) => void;
  handleConfirmClosing: () => void;
}) {
  const {
    closingDecision, setClosingDecision, closeExitPrice, setCloseExitPrice, closeReason, setCloseReason,
    closeDisciplineRating, setCloseDisciplineRating, closeLessonLearned, setCloseLessonLearned, handleConfirmClosing,
  } = props;
  return (
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
  );
}
