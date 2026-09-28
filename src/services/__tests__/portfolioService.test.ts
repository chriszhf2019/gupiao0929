import { describe, it, expect } from 'vitest';
import { computePositions, computeCash, computeTotalCapitalCny } from '../portfolioService';
import { InvestmentTransaction, InvestmentAccount } from '../../types/portfolio';

function tx(partial: Partial<InvestmentTransaction>): InvestmentTransaction {
  return {
    id: Math.random().toString(36).slice(2),
    accountId: 'acct1',
    type: 'BUY',
    symbol: '600519',
    date: '2026-01-01',
    price: 100,
    quantity: 100,
    fee: 0,
    note: '',
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

describe('computePositions 加权平均成本', () => {
  it('两次买入合并持仓并计算加权成本', () => {
    const txs = [
      tx({ id: 'a', type: 'BUY', price: 100, quantity: 100 }),
      tx({ id: 'b', type: 'BUY', price: 200, quantity: 100 }),
    ];
    const positions = computePositions(txs);
    expect(positions['600519'].quantity).toBe(200);
    expect(positions['600519'].totalCost).toBe(30000);
  });

  it('卖出结转已实现盈亏', () => {
    const txs = [
      tx({ id: 'a', type: 'BUY', price: 100, quantity: 100 }),
      tx({ id: 'b', type: 'SELL', price: 150, quantity: 100 }),
    ];
    const positions = computePositions(txs);
    expect(positions['600519'].quantity).toBe(0);
    expect(positions['600519'].realizedPnL).toBe(5000);
  });

  it('超卖数量被截断，不产生负持仓', () => {
    const txs = [
      tx({ id: 'a', type: 'BUY', price: 100, quantity: 100 }),
      tx({ id: 'b', type: 'SELL', price: 150, quantity: 500 }),
    ];
    const positions = computePositions(txs);
    expect(positions['600519'].quantity).toBe(0);
  });
});

describe('computeCash 现金流', () => {
  it('入金/买/卖/分红/费用的现金流汇总正确', () => {
    const txs = [
      tx({ id: 'a', type: 'DEPOSIT', price: 10000, quantity: 0, symbol: undefined }),
      tx({ id: 'b', type: 'BUY', price: 100, quantity: 10, fee: 5 }),
      tx({ id: 'c', type: 'DIVIDEND', price: 200, quantity: 0, symbol: undefined }),
      tx({ id: 'd', type: 'FEE', price: 50, quantity: 0, symbol: undefined }),
    ];
    // 10000 - (100*10+5) + 200 - 50 = 9145
    expect(computeCash(txs)).toBe(9145);
  });
});

describe('computeTotalCapitalCny 组合总资本折算', () => {
  const accounts: InvestmentAccount[] = [
    { id: 'acct1', name: 'A股', type: 'brokerage', currency: 'CNY', createdAt: '' },
  ];
  it('持仓成本 + 现金', () => {
    const txs = [
      tx({ id: 'a', type: 'DEPOSIT', price: 100000, quantity: 0, symbol: undefined }),
      tx({ id: 'b', type: 'BUY', price: 100, quantity: 300 }),
    ];
    // 持仓成本 30000 + 现金 (100000 - 30000) = 100000
    expect(computeTotalCapitalCny(accounts, txs)).toBe(100000);
  });
});
