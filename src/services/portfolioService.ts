import {
  AccountType,
  ComputedPosition,
  InvestmentAccount,
  InvestmentTransaction,
  TransactionType,
} from '../types/portfolio';
import { toCny, symbolCurrency } from '../utils/fx';

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  brokerage: '证券账户',
  fund: '基金账户',
  cash: '现金账户',
  wealth: '理财账户',
  liability: '负债账户',
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  BUY: '买入',
  SELL: '卖出',
  DEPOSIT: '存入',
  WITHDRAW: '取出',
  DIVIDEND: '分红',
  FEE: '费用',
};

export const STOCK_TRANSACTION_TYPES: TransactionType[] = ['BUY', 'SELL'];
export const CASH_TRANSACTION_TYPES: TransactionType[] = ['DEPOSIT', 'WITHDRAW', 'DIVIDEND', 'FEE'];

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function dateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function createAccount(name: string, type: AccountType, currency = 'CNY', institution?: string): InvestmentAccount {
  return {
    id: uid('acct'),
    name,
    type,
    institution,
    currency,
    createdAt: new Date().toISOString(),
  };
}

export function createTransaction(
  input: Omit<InvestmentTransaction, 'id' | 'createdAt'>
): InvestmentTransaction {
  return {
    ...input,
    id: uid('tx'),
    createdAt: new Date().toISOString(),
  };
}

export function defaultAccounts(): InvestmentAccount[] {
  return [createAccount('A股主账户', 'brokerage', 'CNY', '示例券商')];
}

export function defaultTransactions(accountId: string): InvestmentTransaction[] {
  const base = { accountId };
  return [
    createTransaction({ ...base, type: 'DEPOSIT', date: '2026-01-05', price: 1000000, quantity: 0, fee: 0, note: '期初入金' }),
    createTransaction({ ...base, type: 'BUY', symbol: '600519', date: '2026-01-08', price: 1420, quantity: 200, fee: 50, note: '消费龙头底仓' }),
    createTransaction({ ...base, type: 'BUY', symbol: '300750', date: '2026-02-10', price: 215, quantity: 1200, fee: 30, note: '新能源成长仓' }),
    createTransaction({ ...base, type: 'BUY', symbol: '00700', date: '2026-03-12', price: 375, quantity: 800, fee: 80, note: '港股互联网仓' }),
  ];
}

function sortedTxs(transactions: InvestmentTransaction[]): InvestmentTransaction[] {
  return [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  });
}

export function computePositions(transactions: InvestmentTransaction[]): Record<string, ComputedPosition> {
  const positions = new Map<string, ComputedPosition>();

  for (const tx of sortedTxs(transactions)) {
    if (!tx.symbol || tx.type === 'DEPOSIT' || tx.type === 'WITHDRAW' || tx.type === 'DIVIDEND' || tx.type === 'FEE') {
      continue;
    }
    const symbol = tx.symbol.trim().toUpperCase();
    const current = positions.get(symbol) || {
      symbol,
      quantity: 0,
      totalCost: 0,
      realizedPnL: 0,
    };

    if (tx.type === 'BUY') {
      current.quantity += Number(tx.quantity) || 0;
      current.totalCost += (Number(tx.price) || 0) * (Number(tx.quantity) || 0) + (Number(tx.fee) || 0);
    } else if (tx.type === 'SELL') {
      const sellQty = Math.min(Number(tx.quantity) || 0, current.quantity);
      if (sellQty <= 0) continue;
      const avgCost = current.quantity > 0 ? current.totalCost / current.quantity : 0;
      const costOfSold = avgCost * sellQty;
      current.realizedPnL += ((Number(tx.price) || 0) - avgCost) * sellQty - (Number(tx.fee) || 0);
      current.quantity -= sellQty;
      current.totalCost = Math.max(0, current.totalCost - costOfSold);
    }

    if (current.quantity > 0) {
      positions.set(symbol, current);
    } else {
      // 保留已实现盈亏，即使已清仓也保留历史记录，便于累计统计。
      positions.set(symbol, { ...current, totalCost: 0 });
    }
  }

  const result: Record<string, ComputedPosition> = {};
  positions.forEach((p) => {
    result[p.symbol] = p;
  });
  return result;
}

export function computeCash(transactions: InvestmentTransaction[]): number {
  let cash = 0;
  for (const tx of transactions) {
    const price = Number(tx.price) || 0;
    const quantity = Number(tx.quantity) || 0;
    const fee = Number(tx.fee) || 0;
    switch (tx.type) {
      case 'DEPOSIT':
        cash += price;
        break;
      case 'WITHDRAW':
        cash -= price;
        break;
      case 'DIVIDEND':
        cash += price;
        break;
      case 'FEE':
        cash -= price;
        break;
      case 'BUY':
        cash -= price * quantity + fee;
        break;
      case 'SELL':
        cash += price * quantity - fee;
        break;
    }
  }
  return cash;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * 组合总资本（折算人民币）：持仓成本 + 各账户现金余额。
 * 用于决策档案"总资本"、体检"组合规模"等处的默认值，替代硬编码。
 */
export function computeTotalCapitalCny(
  accounts: InvestmentAccount[],
  transactions: InvestmentTransaction[]
): number {
  const positions = computePositions(transactions);
  let total = 0;
  for (const p of Object.values(positions)) {
    total += toCny(p.totalCost, symbolCurrency(p.symbol));
  }
  for (const a of accounts) {
    const acctTxs = transactions.filter((t) => t.accountId === a.id);
    total += toCny(computeCash(acctTxs), a.currency);
  }
  return Math.round(total);
}

export function formatMoney(value: number, currency = 'CNY'): string {
  const symbol = currency === 'USD' ? '$' : currency === 'HKD' ? 'HK$' : '¥';
  return `${symbol}${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function transactionDateLabel(date: string): string {
  return date || '';
}

export const SEED_ACCOUNT = createAccount('A股主账户', 'brokerage', 'CNY', '示例券商');
export const SEED_TRANSACTIONS = defaultTransactions(SEED_ACCOUNT.id);
