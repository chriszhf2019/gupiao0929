import React from 'react';
import { StockData, TrackedStockItem } from '../../types/stock';
import { PRESET_STOCKS } from '../../data/presetStocks';
import { Plus, Search } from 'lucide-react';

export function AddTrackedStockModal(props: {
  trackedList: TrackedStockItem[];
  addSearchInput: string;
  setAddSearchInput: (value: string) => void;
  handleAddStock: (stock: StockData) => void;
  addCustomCode: string;
  setAddCustomCode: (value: string) => void;
  handleAddCustomCode: (e: React.FormEvent) => void;
  addCustomLoading: boolean;
  addCustomError: string | null;
  setIsAddModalOpen: (value: boolean) => void;
}) {
  const {
    trackedList, addSearchInput, setAddSearchInput, handleAddStock,
    addCustomCode, setAddCustomCode, handleAddCustomCode, addCustomLoading, addCustomError, setIsAddModalOpen,
  } = props;
  return (
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
  );
}
