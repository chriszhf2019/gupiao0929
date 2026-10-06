import React from 'react';
import { DecisionActionType } from '../../types/stock';
import { FileText } from 'lucide-react';

export function DecisionMemoForm(props: {
  editingId: string | null;
  formStockName: string;
  formSymbol: string;
  formAction: DecisionActionType;
  setFormAction: (value: DecisionActionType) => void;
  formHoldingPeriod: string;
  setFormHoldingPeriod: (value: string) => void;
  formEntryPrice: number;
  setFormEntryPrice: (value: number) => void;
  formTargetPrice: number;
  setFormTargetPrice: (value: number) => void;
  formStopLossPrice: number;
  setFormStopLossPrice: (value: number) => void;
  formPlannedShares: number;
  setFormPlannedShares: (value: number) => void;
  formTotalCapital: number;
  setFormTotalCapital: (value: number) => void;
  realTotalCapital: number;
  formThesis: string;
  setFormThesis: (value: string) => void;
  formCatalysts: string;
  setFormCatalysts: (value: string) => void;
  formFalsification: string;
  setFormFalsification: (value: string) => void;
  setActiveTab: (tab: 'active' | 'closed' | 'editor') => void;
  setEditingId: (id: string | null) => void;
  handleSaveDecision: () => void;
}) {
  const {
    editingId, formStockName, formSymbol, formAction, setFormAction, formHoldingPeriod, setFormHoldingPeriod,
    formEntryPrice, setFormEntryPrice, formTargetPrice, setFormTargetPrice, formStopLossPrice, setFormStopLossPrice,
    formPlannedShares, setFormPlannedShares, formTotalCapital, setFormTotalCapital, realTotalCapital,
    formThesis, setFormThesis, formCatalysts, setFormCatalysts, formFalsification, setFormFalsification,
    setActiveTab, setEditingId, handleSaveDecision,
  } = props;
  return (
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
  );
}
