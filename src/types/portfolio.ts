export type AccountType = 'brokerage' | 'fund' | 'cash' | 'wealth' | 'liability';

export interface InvestmentAccount {
  id: string;
  name: string;
  type: AccountType;
  institution?: string;
  currency: string;
  createdAt: string;
}

export type TransactionType = 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAW' | 'DIVIDEND' | 'FEE';

export interface InvestmentTransaction {
  id: string;
  accountId: string;
  type: TransactionType;
  symbol?: string;
  date: string; // YYYY-MM-DD
  price: number; // 每股价格；现金类交易时为金额
  quantity: number; // 股数；现金类交易时为 0
  fee: number;
  note?: string;
  createdAt: string;
}

export interface ComputedPosition {
  symbol: string;
  quantity: number;
  totalCost: number; // 剩余持仓的总成本
  realizedPnL: number; // 已实现盈亏
}

export interface PortfolioQuote {
  symbol: string;
  name: string;
  currentPrice: number;
  changePercent: number;
  currency: string;
}
