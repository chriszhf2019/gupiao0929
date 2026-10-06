import { AIStockStrategy } from '../types/stock';

export const STRATEGY_LIBRARY_KEY = 'zane_strategy_library_v1';
const LIBRARY_LIMIT = 8;

type StrategyStore = Pick<Storage, 'getItem' | 'setItem'>;

function browserStore(): StrategyStore | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function readStrategyLibrary(store: StrategyStore | null = browserStore()): AIStockStrategy[] {
  if (!store) return [];
  try {
    const raw = store.getItem(STRATEGY_LIBRARY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, LIBRARY_LIMIT) : [];
  } catch {
    return [];
  }
}

export function writeStrategyLibrary(items: AIStockStrategy[], store: StrategyStore | null = browserStore()): AIStockStrategy[] {
  const next = items.slice(0, LIBRARY_LIMIT);
  store?.setItem(STRATEGY_LIBRARY_KEY, JSON.stringify(next));
  return next;
}
