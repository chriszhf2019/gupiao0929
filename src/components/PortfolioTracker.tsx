import React, { useEffect, useMemo, useState } from 'react';
import { stockService } from '../services/stockService';
import { usePortfolio } from '../context/PortfolioContext';
import {
  AccountType,
  ComputedPosition,
  InvestmentAccount,
  InvestmentTransaction,
  PortfolioQuote,
  TransactionType,
} from '../types/portfolio';
import {
  ACCOUNT_TYPE_LABELS,
  CASH_TRANSACTION_TYPES,
  STOCK_TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
  computePositions,
  createAccount,
  createTransaction,
  formatMoney,
  formatPercent,
  round2,
} from '../services/portfolioService';
import { toCny, symbolCurrency, FX_NOTE } from '../utils/fx';
import { SmartLedgerImportModal } from './portfolio/SmartLedgerImportModal';
import { PortfolioStressTestModal } from './portfolio/PortfolioStressTestModal';
import {
  Wallet,
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Landmark,
  ReceiptText,
  X,
  Download,
  Upload,
  Lock,
  KeyRound,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface PortfolioTrackerProps {
  onSelectStock: (symbol: string) => void;
}

interface AddFormState {
  accountId: string;
  type: TransactionType;
  symbol: string;
  date: string;
  price: string;
  quantity: string;
  fee: string;
  note: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export const PortfolioTracker: React.FC<PortfolioTrackerProps> = ({ onSelectStock }) => {
  const {
    status,
    error: secureError,
    accounts,
    transactions,
    unlock,
    setup,
    setAccounts,
    setTransactions,
    reset,
  } = usePortfolio();
  const [quotes, setQuotes] = useState<Record<string, PortfolioQuote>>({});
  const [showAddTx, setShowAddTx] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showSmartImport, setShowSmartImport] = useState(false);
  const [showStressTest, setShowStressTest] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<AccountType>('brokerage');

  const positions = useMemo<Record<string, ComputedPosition>>(() => computePositions(transactions), [transactions]);
  const positionList = useMemo<ComputedPosition[]>(() => Object.values(positions), [positions]);
  const activeSymbols = useMemo<string[]>(
    () => positionList.filter((p) => p.quantity > 0).map((p) => p.symbol),
    [positionList]
  );

  useEffect(() => {
    if (status !== 'ready' || activeSymbols.length === 0) return;
    let active = true;
    stockService
      .getQuotes(activeSymbols)
      .then((results) => {
        if (!active) return;
        const map: Record<string, PortfolioQuote> = {};
        results.forEach((quote) => {
          if (quote && Number.isFinite(quote.currentPrice) && quote.currentPrice > 0) {
            map[quote.symbol] = {
              symbol: quote.symbol,
              name: quote.name || quote.symbol,
              currentPrice: quote.currentPrice,
              changePercent: quote.changePercent || 0,
              currency: quote.currency || 'CNY',
            };
          }
        });
        setQuotes(map);
      })
      .catch(() => {
        // 行情请求失败时保留最后一次可用价格。
      });
    return () => {
      active = false;
    };
  }, [activeSymbols.join('|'), status]);

  const holdingRows = activeSymbols.map((symbol) => {
    const pos = positions[symbol];
    const quote = quotes[symbol];
    const price = quote?.currentPrice ?? 0;
    const marketValue = pos.quantity * price;
    const avgCost = pos.quantity > 0 ? pos.totalCost / pos.quantity : 0;
    const unrealizedPnL = marketValue - pos.totalCost;
    const unrealizedPercent = pos.totalCost > 0 ? (unrealizedPnL / pos.totalCost) * 100 : 0;
    const currency = quote?.currency || symbolCurrency(symbol);
    return {
      symbol,
      name: quote?.name || symbol,
      currency,
      quantity: pos.quantity,
      avgCost,
      price,
      marketValue,
      totalCost: pos.totalCost,
      unrealizedPnL,
      unrealizedPercent,
      marketValueCny: toCny(marketValue, currency),
      totalCostCny: toCny(pos.totalCost, currency),
      unrealizedPnLCny: toCny(unrealizedPnL, currency),
    };
  });

  // 各账户现金余额（按账户币种分别计算，再统一折算人民币）
  const cashByAccount = useMemo<Record<string, { cash: number; currency: string }>>(() => {
    const map: Record<string, { cash: number; currency: string }> = {};
    for (const a of accounts) map[a.id] = { cash: 0, currency: a.currency };
    for (const tx of transactions) {
      const entry = map[tx.accountId];
      if (!entry) continue;
      const price = Number(tx.price) || 0;
      const quantity = Number(tx.quantity) || 0;
      const fee = Number(tx.fee) || 0;
      switch (tx.type) {
        case 'DEPOSIT': entry.cash += price; break;
        case 'WITHDRAW': entry.cash -= price; break;
        case 'DIVIDEND': entry.cash += price; break;
        case 'FEE': entry.cash -= price; break;
        case 'BUY': entry.cash -= price * quantity + fee; break;
        case 'SELL': entry.cash += price * quantity - fee; break;
      }
    }
    return map;
  }, [accounts, transactions]);

  const totalStockValueCny = holdingRows.reduce((sum, r) => sum + r.marketValueCny, 0);
  const totalCostCny = holdingRows.reduce((sum, r) => sum + r.totalCostCny, 0);
  const totalUnrealizedPnLCny = totalStockValueCny - totalCostCny;
  const totalRealizedPnLCny = positionList.reduce((sum, p) => sum + toCny(p.realizedPnL, symbolCurrency(p.symbol)), 0);
  const totalCashCny = (Object.values(cashByAccount) as { cash: number; currency: string }[]).reduce(
    (sum, e) => sum + toCny(e.cash, e.currency),
    0
  );
  const totalAssetsCny = totalStockValueCny + totalCashCny;

  const sortedTransactions = [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });

  const handleAddTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const type = String(data.get('type')) as TransactionType;
    const isStock = STOCK_TRANSACTION_TYPES.includes(type);
    const symbol = isStock ? String(data.get('symbol') || '').trim().toUpperCase() : undefined;
    if (isStock && !symbol) return;

    const tx = createTransaction({
      accountId: String(data.get('accountId') || accounts[0]?.id || ''),
      type,
      symbol,
      date: String(data.get('date') || today()),
      price: Number(data.get('price') || 0),
      quantity: isStock ? Number(data.get('quantity') || 0) : 0,
      fee: Number(data.get('fee') || 0),
      note: String(data.get('note') || ''),
    });
    setTransactions([...transactions, tx]);
    setShowAddTx(false);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;
    const account = createAccount(newAccountName.trim(), newAccountType);
    setAccounts([...accounts, account]);
    setNewAccountName('');
    setShowAddAccount(false);
  };

  const handleExport = () => {
    const payload = {
      app: 'zane-invest',
      version: 1,
      exportedAt: new Date().toISOString(),
      accounts,
      transactions,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zane-portfolio-${today()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (Array.isArray(data.accounts) && Array.isArray(data.transactions)) {
          setAccounts(data.accounts);
          setTransactions(data.transactions);
        } else {
          alert('备份文件格式不正确');
        }
      } catch {
        alert('备份文件解析失败');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (status !== 'ready') {
    return <PasswordGate status={status} error={secureError} onUnlock={unlock} onSetup={setup} onReset={reset} />;
  }

  return (
    <div className="space-y-6">
      {/* 顶部标题与操作 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#3E6F73]/10 text-[#3E6F73] dark:text-[#76B4B9] border border-[#3E6F73]/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">个人账户与组合</h2>
            <p className="text-xs text-[#576F73] dark:text-[#9BB2B4]">交易流水驱动持仓，成本与盈亏自动重算，数据本地持久化</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowStressTest(true)}
            disabled={holdingRows.length === 0}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#A84A3E]/10 border border-[#A84A3E]/30 text-xs font-semibold text-[#A84A3E] hover:bg-[#A84A3E]/20 disabled:opacity-40 cursor-pointer"
            title="模拟历史极端黑天鹅危机下的组合抗跌能力与VaR风险暴露"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>黑天鹅压力测试</span>
          </button>
          <button
            onClick={() => setShowSmartImport(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#3E6F73]/10 border border-[#3E6F73]/30 text-xs font-semibold text-[#3E6F73] dark:text-[#76B4B9] hover:bg-[#3E6F73]/20 cursor-pointer"
            title="一键粘贴券商持仓或交割单明细文本快速导入"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>智能交割单解析</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] text-xs font-semibold text-[#1F3437] dark:text-[#E5EBEA] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] cursor-pointer"
            title="将账户与流水导出为JSON备份"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出备份</span>
          </button>
          <label className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] text-xs font-semibold text-[#1F3437] dark:text-[#E5EBEA] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>导入备份</span>
            <input type="file" accept="application/json" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={() => setShowAddAccount(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] text-xs font-semibold text-[#1F3437] dark:text-[#E5EBEA] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] cursor-pointer"
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>添加账户</span>
          </button>
          <button
            onClick={() => setShowAddTx(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#1F3437] hover:bg-[#274246] text-white text-xs font-semibold shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>记一笔流水</span>
          </button>
        </div>
      </div>

      {/* 账户列表 */}
      <div className="flex flex-wrap gap-2">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] text-xs"
          >
            <span className="w-2 h-2 rounded-full bg-[#4A7C6F]" />
            <span className="font-semibold text-[#1F3437] dark:text-[#E5EBEA]">{account.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3E6F73]/10 text-[#3E6F73] dark:text-[#76B4B9]">
              {ACCOUNT_TYPE_LABELS[account.type]}
            </span>
            <span className="text-[#7A9194] font-mono">{account.currency}</span>
          </div>
        ))}
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-5">
          <div className="text-xs text-[#7A9194] mb-1">总资产净值（折算人民币）</div>
          <div className="text-2xl font-black font-mono text-[#1F3437] dark:text-white">{formatMoney(round2(totalAssetsCny))}</div>
          <div className="text-[11px] text-[#7A9194] mt-1">持仓 {formatMoney(round2(totalStockValueCny))} + 现金 {formatMoney(round2(totalCashCny))}</div>
        </div>

        <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-5">
          <div className="text-xs text-[#7A9194] mb-1">累计未实现盈亏</div>
          <div className={`text-2xl font-black font-mono ${totalUnrealizedPnLCny >= 0 ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'}`}>
            {formatMoney(round2(totalUnrealizedPnLCny))}
          </div>
          <div className={`text-[11px] font-mono mt-1 flex items-center ${totalUnrealizedPnLCny >= 0 ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'}`}>
            {totalUnrealizedPnLCny >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
            {totalCostCny > 0 ? formatPercent((totalUnrealizedPnLCny / totalCostCny) * 100) : '0.00%'}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-5">
          <div className="text-xs text-[#7A9194] mb-1">累计已实现盈亏</div>
          <div className={`text-2xl font-black font-mono ${totalRealizedPnLCny >= 0 ? 'text-[#3E6F73]' : 'text-[#A84A3E]'}`}>
            {formatMoney(round2(totalRealizedPnLCny))}
          </div>
          <div className="text-[11px] text-[#7A9194] mt-1">来自已卖出部分的落袋盈亏</div>
        </div>

        <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-5">
          <div className="text-xs text-[#7A9194] mb-1">现金余额</div>
          <div className="text-2xl font-black font-mono text-[#3E6F73] dark:text-[#76B4B9]">{formatMoney(round2(totalCashCny))}</div>
          <div className="text-[11px] text-[#7A9194] mt-1">现金仓位 {totalAssetsCny > 0 ? ((totalCashCny / totalAssetsCny) * 100).toFixed(1) : '0.0'}%</div>
        </div>
      </div>

      <div className="text-[11px] text-[#7A9194] -mt-3 flex items-center space-x-1.5">
        <span>{FX_NOTE}</span>
      </div>

      {/* 持仓表 */}
      <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-[#3E6F73]" />
            <h3 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">当前持仓</h3>
          </div>
          <span className="text-xs text-[#7A9194]">行情为实时价格，成本由流水自动计算</span>
        </div>

        {holdingRows.length === 0 ? (
          <div className="text-center py-12 text-sm text-[#7A9194]">暂无持仓，点击右上角「记一笔流水」开始记录。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-[#E3E7E1] dark:border-[#2A383A] text-[#7A9194] text-[10px] uppercase">
                  <th className="pb-2 pl-1">标的</th>
                  <th className="pb-2 text-right">持股数</th>
                  <th className="pb-2 text-right">成本均价</th>
                  <th className="pb-2 text-right">最新价</th>
                  <th className="pb-2 text-right">持仓市值</th>
                  <th className="pb-2 text-right">未实现盈亏</th>
                  <th className="pb-2 text-right">仓位占比</th>
                  <th className="pb-2 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E7E1]/50 dark:divide-[#2A383A]/50">
                {holdingRows.map((row) => {
                  const weight = totalAssetsCny > 0 ? (row.marketValueCny / totalAssetsCny) * 100 : 0;
                  const isGain = row.unrealizedPnL >= 0;
                  return (
                    <tr key={row.symbol} className="hover:bg-[#F6F7F5]/60 dark:hover:bg-[#141A1B]/60">
                      <td className="py-2.5 pl-1">
                        <button
                          onClick={() => onSelectStock(row.symbol)}
                          className="text-left hover:text-[#3E6F73] dark:hover:text-[#76B4B9] transition-colors"
                        >
                          <div className="font-bold text-[#1F3437] dark:text-[#E5EBEA]">{row.name}</div>
                          <div className="font-mono text-[10px] text-[#7A9194]">{row.symbol}</div>
                        </button>
                      </td>
                      <td className="py-2.5 text-right font-mono">{row.quantity}</td>
                      <td className="py-2.5 text-right font-mono">{formatMoney(round2(row.avgCost), row.currency)}</td>
                      <td className="py-2.5 text-right font-mono font-semibold text-[#1F3437] dark:text-white">{formatMoney(round2(row.price), row.currency)}</td>
                      <td className="py-2.5 text-right font-mono">{formatMoney(round2(row.marketValue), row.currency)}</td>
                      <td className={`py-2.5 text-right font-mono font-bold ${isGain ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'}`}>
                        {formatMoney(round2(row.unrealizedPnL), row.currency)} ({formatPercent(row.unrealizedPercent)})
                      </td>
                      <td className="py-2.5 text-right font-mono">{weight.toFixed(1)}%</td>
                      <td className="py-2.5 text-center">
                        <button
                          onClick={() => onSelectStock(row.symbol)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#3E6F73]/10 text-[#3E6F73] dark:text-[#76B4B9] hover:bg-[#3E6F73]/20"
                        >
                          研究
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 交易流水 */}
      <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-5">
        <div className="flex items-center space-x-2 mb-4">
          <ReceiptText className="w-4 h-4 text-[#3E6F73]" />
          <h3 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">交易流水</h3>
        </div>

        {sortedTransactions.length === 0 ? (
          <div className="text-center py-10 text-sm text-[#7A9194]">暂无流水记录。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[680px]">
              <thead>
                <tr className="border-b border-[#E3E7E1] dark:border-[#2A383A] text-[#7A9194] text-[10px] uppercase">
                  <th className="pb-2 pl-1">日期</th>
                  <th className="pb-2">账户</th>
                  <th className="pb-2">类型</th>
                  <th className="pb-2">标的</th>
                  <th className="pb-2 text-right">价格/金额</th>
                  <th className="pb-2 text-right">数量</th>
                  <th className="pb-2 text-right">手续费</th>
                  <th className="pb-2">备注</th>
                  <th className="pb-2 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E7E1]/50 dark:divide-[#2A383A]/50">
                {sortedTransactions.map((tx) => {
                  const account = accounts.find((a) => a.id === tx.accountId);
                  return (
                    <tr key={tx.id} className="hover:bg-[#F6F7F5]/60 dark:hover:bg-[#141A1B]/60">
                      <td className="py-2 pl-1 font-mono text-[#576F73] dark:text-[#9BB2B4]">{tx.date}</td>
                      <td className="py-2 text-[#1F3437] dark:text-[#E5EBEA]">{account?.name || '未知账户'}</td>
                      <td className="py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          tx.type === 'BUY' || tx.type === 'DEPOSIT'
                            ? 'bg-[#4A7C6F]/10 text-[#4A7C6F]'
                            : tx.type === 'SELL' || tx.type === 'WITHDRAW'
                            ? 'bg-[#A84A3E]/10 text-[#A84A3E]'
                            : 'bg-[#3E6F73]/10 text-[#3E6F73]'
                        }`}>
                          {TRANSACTION_TYPE_LABELS[tx.type]}
                        </span>
                      </td>
                      <td className="py-2 font-mono">{tx.symbol || '-'}</td>
                      <td className="py-2 text-right font-mono">{formatMoney(round2(tx.price), account?.currency || 'CNY')}</td>
                      <td className="py-2 text-right font-mono">{tx.quantity || '-'}</td>
                      <td className="py-2 text-right font-mono">{tx.fee ? formatMoney(round2(tx.fee), account?.currency || 'CNY') : '-'}</td>
                      <td className="py-2 max-w-[180px] truncate text-[#7A9194]">{tx.note || '-'}</td>
                      <td className="py-2 text-center">
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="p-1.5 rounded-lg text-[#A84A3E] hover:bg-[#A84A3E]/10"
                          title="删除这条流水"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 记流水弹窗 */}
      {showAddTx && <AddTransactionModal accounts={accounts} onClose={() => setShowAddTx(false)} onSubmit={handleAddTransaction} />}

      {/* 智能交割单解析弹窗 */}
      {showSmartImport && (
        <SmartLedgerImportModal
          accountId={accounts[0]?.id || ''}
          accountName={accounts[0]?.name || '默认账户'}
          onClose={() => setShowSmartImport(false)}
          onImport={(importedTxs) => {
            setTransactions([...transactions, ...importedTxs]);
          }}
        />
      )}

      {/* 黑天鹅压力测试弹窗 */}
      {showStressTest && (
        <PortfolioStressTestModal
          holdingRows={holdingRows.map((h) => ({
            ...h,
            weight: totalAssetsCny > 0 ? (h.marketValueCny / totalAssetsCny) * 100 : 0,
          }))}
          totalAssetsCny={totalAssetsCny}
          totalCashCny={totalCashCny}
          onClose={() => setShowStressTest(false)}
        />
      )}

      {/* 添加账户弹窗 */}
      {showAddAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleAddAccount} className="w-full max-w-sm bg-white dark:bg-[#1C2426] rounded-2xl border border-[#E3E7E1] dark:border-[#2A383A] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">添加账户</h3>
              <button type="button" onClick={() => setShowAddAccount(false)} className="p-1 rounded-lg text-[#7A9194] hover:bg-black/5 dark:hover:bg-white/5"><X className="w-4 h-4" /></button>
            </div>
            <label className="block text-xs text-[#576F73] dark:text-[#9BB2B4] mb-1">账户名称</label>
            <input value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} placeholder="例如：A股主账户" className="w-full mb-3 px-3 py-2 rounded-xl border border-[#E3E7E1] dark:border-[#2A383A] bg-white dark:bg-[#141A1B] text-xs text-[#1F3437] dark:text-[#E5EBEA] focus:outline-none focus:border-[#3E6F73]" />
            <label className="block text-xs text-[#576F73] dark:text-[#9BB2B4] mb-1">账户类型</label>
            <select value={newAccountType} onChange={(e) => setNewAccountType(e.target.value as AccountType)} className="w-full mb-4 px-3 py-2 rounded-xl border border-[#E3E7E1] dark:border-[#2A383A] bg-white dark:bg-[#141A1B] text-xs text-[#1F3437] dark:text-[#E5EBEA]">
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <button type="submit" className="w-full py-2 rounded-xl bg-[#1F3437] hover:bg-[#274246] text-white text-xs font-semibold">保存账户</button>
          </form>
        </div>
      )}
    </div>
  );
};

function AddTransactionModal({ accounts, onClose, onSubmit }: {
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

function PasswordGate({ status, error, onUnlock, onSetup, onReset }: {
  status: 'loading' | 'new' | 'locked';
  error: string | null;
  onUnlock: (pass: string) => Promise<boolean>;
  onSetup: (pass: string) => Promise<boolean>;
  onReset: () => void;
}) {
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isNew = status === 'new';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (isNew) {
      if (pass.length < 4) {
        setLocalError('密码至少 4 位');
        return;
      }
      if (pass !== confirm) {
        setLocalError('两次输入的密码不一致');
        return;
      }
    }
    setBusy(true);
    const ok = isNew ? await onSetup(pass) : await onUnlock(pass);
    setBusy(false);
    if (!ok && !error) setLocalError('操作失败，请重试');
  };

  const handleReset = () => {
    if (window.confirm('确定清空本地加密的组合数据吗？此操作不可恢复，建议先确认已有导出备份。')) {
      onReset();
      setPass('');
      setConfirm('');
      setLocalError(null);
    }
  };

  if (status === 'loading') {
    return <div className="text-center py-16 text-sm text-[#7A9194]">正在读取本地加密数据...</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-6">
      <div className="flex items-center space-x-3 mb-5">
        <div className="p-2.5 rounded-xl bg-[#3E6F73]/10 text-[#3E6F73] dark:text-[#76B4B9] border border-[#3E6F73]/20">
          {isNew ? <Lock className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
        </div>
        <div>
          <h3 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
            {isNew ? '设置组合访问密码' : '解锁组合数据'}
          </h3>
          <p className="text-xs text-[#576F73] dark:text-[#9BB2B4]">
            {isNew ? '账户与交易流水将用该密码加密后保存在本机' : '请输入之前设置的访问密码'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="block text-xs text-[#576F73] dark:text-[#9BB2B4] mb-1">访问密码</span>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoFocus
            className="w-full px-3 py-2.5 rounded-xl border border-[#E3E7E1] dark:border-[#2A383A] bg-white dark:bg-[#141A1B] text-sm text-[#1F3437] dark:text-[#E5EBEA] focus:outline-none focus:border-[#3E6F73]"
          />
        </label>

        {isNew && (
          <label className="block">
            <span className="block text-xs text-[#576F73] dark:text-[#9BB2B4] mb-1">确认密码</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E3E7E1] dark:border-[#2A383A] bg-white dark:bg-[#141A1B] text-sm text-[#1F3437] dark:text-[#E5EBEA] focus:outline-none focus:border-[#3E6F73]"
            />
          </label>
        )}

        {(error || localError) && <p className="text-xs text-[#A84A3E]">{error || localError}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 rounded-xl bg-[#1F3437] hover:bg-[#274246] text-white text-xs font-semibold disabled:opacity-60"
        >
          {busy ? '处理中...' : isNew ? '加密并保存' : '解锁'}
        </button>

        {!isNew && (
          <button
            type="button"
            onClick={handleReset}
            className="w-full text-[11px] text-[#7A9194] hover:text-[#A84A3E] py-1"
          >
            忘记密码？清空本地加密数据
          </button>
        )}
      </form>
    </div>
  );
}
