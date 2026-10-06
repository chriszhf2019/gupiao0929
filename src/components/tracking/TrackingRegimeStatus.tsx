import React, { useEffect, useMemo, useState } from 'react';
import { request } from '../../services/apiClient';
import { TrackedStockItem } from '../../types/stock';
import { assessMarketRegime, RegimeBar, RegimeBreadth, RegimeIndex, splitTrackedByRegime } from '../../utils/marketRegime';
import { isStrategyStyle } from '../../utils/strategyPipeline';

export function TrackingRegimeStatus({
  tracked,
  busy,
  onRefresh,
}: {
  tracked: TrackedStockItem[];
  busy: boolean;
  onRefresh: (symbols: string[]) => void;
}) {
  const [indices, setIndices] = useState<RegimeIndex[]>([]);
  const [breadth, setBreadth] = useState<RegimeBreadth | null>(null);
  const [bars, setBars] = useState<RegimeBar[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [overview, breadthRes, kline] = await Promise.all([
          request<{ indices?: RegimeIndex[] }>('/api/market-overview'),
          request<{ breadth?: RegimeBreadth }>('/api/market-breadth'),
          request<{ bars?: RegimeBar[] }>('/api/kline/sh000001?days=120'),
        ]);
        if (!active) return;
        setIndices(overview?.indices || []);
        setBreadth(breadthRes?.breadth || null);
        setBars(kline?.bars || []);
      } catch {
        if (active) setIndices([]);
      }
    };
    void load();
    const timer = window.setInterval(load, 60000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const regime = useMemo(
    () => assessMarketRegime({ indices, breadth, shanghaiBars: bars }),
    [indices, breadth, bars],
  );
  const names = tracked.map((item) => item.strategyOutlook?.strategyName || '').filter(Boolean);
  const split = splitTrackedByRegime(names, regime.preferredStyles);
  const stillSymbols = tracked
    .filter((item) => {
      const style = item.strategyOutlook?.strategyName;
      return Boolean(style && isStrategyStyle(style) && split.still.includes(style));
    })
    .map((item) => item.symbol);
  const ready = indices.length > 0 || bars.length > 0;

  if (!ready || names.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-xs text-slate-300 space-y-2">
      <div className="font-bold text-white">跟进是否还符合当前主策略</div>
      <p>上证趋势：{regime.trendZh}。当前主策略：{regime.preferredStyles.join('、')}。页面打开时每分钟重读行情，不会自动改你已经写下的跟踪价。</p>
      {split.still.length > 0 && <p>仍匹配：{split.still.join('、')}。</p>}
      {split.dropped.length > 0 && <p>已不在主策略：{split.dropped.join('、')}。这些标的先留在名单里，价格保持上次写入的结果。</p>}
      {stillSymbols.length > 0 && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onRefresh(stillSymbols)}
          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold cursor-pointer disabled:opacity-60"
        >
          {busy ? '重算中...' : '按当前财报重算仍匹配标的的跟踪价'}
        </button>
      )}
    </div>
  );
}
