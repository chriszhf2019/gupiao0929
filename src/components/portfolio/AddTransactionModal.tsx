import React, { useState } from 'react';
import { InvestmentAccount, TransactionType } from '../../types/portfolio';
import { STOCK_TRANSACTION_TYPES, TRANSACTION_TYPE_LABELS } from '../../services/portfolioService';
import { X } from 'lucide-react';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AddTransactionModal({ accounts, onClose, onSubmit }: {
  accounts: InvestmentAccount[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [type, setType] = useState<TransactionType>('BUY');
  const isStock = STOCK_TRANSACTION_TYPES.includes(type);
  const defaultAccountId = accounts[0]?.id || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white dark:bg-[#1C2426] rounded-2xl border border-[#E3E7E1] dark:border-[#2A383A] p-5 my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">记一笔流水</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-[#7A9194] hover:bg-black/5 dark:hover:bg-white/5"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs text-[#576F73] dark:text-[#9BB2B4] mb-1">账户</span>
            <select name="accountId" defaultValue={defaultAccountId} className="w-full px-3 py-2 rounded-xl border border-[#E3E7E1] dark:border-[#2A383A] bg-white dark:bg-[#141A1B] text-xs text-[#1F3437] dark:text-[#E5EBEA]">
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="block text-xs text-[#576F73] dark:text-[#9BB2B4] mb-1">类型</span>
            <select name="type" value={type} onChange={(e) => setType(e.target.value as TransactionType)} className="w-full px-3 py-2 rounded-xl border border-[#E3E7E1] dark:border-[#2A383A] bg-white dark:bg-[#141A1B] text-xs text-[#1F3437] dark:text-[#E5EBEA]">
              {Object.entries(TRANSACTION_TYPE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
        </div>

        {isStock && (
          <label className="block mt-3">
            <span className="block text-xs text-[#576F73] dark:text-[#9BB2B4] mb-1">股票代码</span>
            <input name="symbol" placeholder="例如 600519 / 00700 / NVDA" className="w-full px-3 py-2 rounded-xl border border-[#E3E7E1] dark:border-[#2A383A] bg-white dark:bg-[#141A1B] text-xs text-[#1F3437] dark:text-[#E5EBEA]" />
          </label>
        )}

        <div className="grid grid-cols-2 gap-3 mt-3">
          <label className="block">
            <span className="block text-xs text-[#576F73] dark:text-[#9BB2B4] mb-1">日期</span>
            <input name="date" type="date" defaultValue={today()} className="w-full px-3 py-2 rounded-xl border border-[#E3E7E1] dark:border-[#2A383A] bg-white dark:bg-[#141A1B] text-xs text-[#1F3437] dark:text-[#E5EBEA]" />
          </label>
          <label className="block">
            <span className="block text-xs text-[#576F73] dark:text-[#9BB2B4] mb-1">{isStock ? '成交价格' : '金额'}</span>
            <input name="price" type="number" step="0.01" min="0" placeholder={isStock ? '每股价格' : '金额'} className="w-full px-3 py-2 rounded-xl border border-[#E3E7E1] dark:border-[#2A383A] bg-white dark:bg-[#141A1B] text-xs text-[#1F3437] dark:text-[#E5EBEA]" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          {isStock && (
            <label className="block">
              <span className="block text-xs text-[#576F73] dark:text-[#9BB2B4] mb-1">数量</span>
              <input name="quantity" type="number" step="1" min="0" placeholder="股数" className="w-full px-3 py-2 rounded-xl border border-[#E3E7E1] dark:border-[#2A383A] bg-white dark:bg-[#141A1B] text-xs text-[#1F3437] dark:text-[#E5EBEA]" />
            </label>
          )}
          <label className="block">
            <span className="block text-xs text-[#576F73] dark:text-[#9BB2B4] mb-1">手续费</span>
            <input name="fee" type="number" step="0.01" min="0" defaultValue="0" className="w-full px-3 py-2 rounded-xl border border-[#E3E7E1] dark:border-[#2A383A] bg-white dark:bg-[#141A1B] text-xs text-[#1F3437] dark:text-[#E5EBEA]" />
          </label>
        </div>

        <label className="block mt-3">
          <span className="block text-xs text-[#576F73] dark:text-[#9BB2B4] mb-1">备注</span>
          <input name="note" placeholder="买入理由、计划等（可选）" className="w-full px-3 py-2 rounded-xl border border-[#E3E7E1] dark:border-[#2A383A] bg-white dark:bg-[#141A1B] text-xs text-[#1F3437] dark:text-[#E5EBEA]" />
        </label>

        <button type="submit" className="w-full mt-4 py-2.5 rounded-xl bg-[#1F3437] hover:bg-[#274246] text-white text-xs font-semibold">保存流水</button>
      </form>
    </div>
  );
}

