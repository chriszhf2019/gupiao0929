import { WorkbenchView } from '../types/stock';

export const WORKBENCH_VIEWS: WorkbenchView[] = [
  'market',
  'five-step',
  'index-fund',
  'tracking',
  'deep-exploration',
  'watchlist',
  'portfolio',
  'memo',
  'strategy',
];

const SYMBOL_VIEWS = new Set<WorkbenchView>(['five-step', 'tracking', 'deep-exploration', 'memo']);

export interface WorkbenchLocation {
  view: WorkbenchView;
  symbol: string | null;
}

export function parseWorkbenchPath(pathname: string): WorkbenchLocation {
  const parts = pathname.split('/').filter(Boolean).map((part) => decodeURIComponent(part));
  const head = parts[0] as WorkbenchView | undefined;
  const view = head && WORKBENCH_VIEWS.includes(head) ? head : 'five-step';
  const rawSymbol = parts[1]?.trim().toUpperCase() || '';
  const symbol = SYMBOL_VIEWS.has(view) && rawSymbol ? rawSymbol : null;
  return { view, symbol };
}

export function buildWorkbenchPath(view: WorkbenchView, symbol?: string | null): string {
  const clean = symbol?.trim().toUpperCase();
  if (clean && SYMBOL_VIEWS.has(view)) {
    return `/${view}/${encodeURIComponent(clean)}`;
  }
  return `/${view}`;
}
