import React, { useMemo } from 'react';
import { PRESET_STOCKS } from '../../data/presetStocks';
import { useStrategyTracking } from '../../hooks/useStrategyTracking';
import { assessMarketRegime, RegimeBar, RegimeBreadth, RegimeIndex, STRATEGY_PLAYBOOK } from '../../utils/marketRegime';
import { rankPresetCandidates, rankSnapshotCandidates, ScreenSnapshot } from '../../utils/strategyPipeline';
import { VaultPasswordGate } from '../portfolio/VaultPasswordGate';

export function MarketRegimePanel({
  indices,
  breadth,
  bars,
  leaders,
  screenItems = [],
  onOpenStrategy,
  onOpenTracking,
  onSelectStock,
}: {
  indices: RegimeIndex[];
  breadth: RegimeBreadth | null;
  bars: RegimeBar[];
  leaders: { name: string }[];
  screenItems?: ScreenSnapshot[];
  onOpenStrategy?: (prompt: string) => void;
  onOpenTracking?: (symbol: string) => void;
  onSelectStock?: (symbol: string) => void;
}) {
  const tracking = useStrategyTracking(onOpenTracking);
  const regime = useMemo(
    () => assessMarketRegime({ indices, breadth, shanghaiBars: bars, leaders }),
    [indices, breadth, bars, leaders],
  );
  const ready = indices.length > 0 || bars.length > 0 || breadth != null;

  return (
    <section className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">现在的市场、趋势，以及该用的策略</h3>
        <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] mt-1">
          当日指数和涨跌家数描述现在；上证近 60 个交易日相对 60 日均线描述趋势。主策略按这个状态挑选，跟进后写入跟踪中心。
        </p>
      </div>

      {!ready && <p className="text-xs text-[#7A9194]">正在读取指数、涨跌家数和上证日 K。</p>}

      {ready && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] p-3">
              <div className="text-[11px] text-[#7A9194] mb-1">现在</div>
              <div className="font-bold text-[#1F3437] dark:text-[#E5EBEA] mb-1">{regime.toneZh}</div>
              <p className="text-[#576F73] dark:text-[#9BB2B4] leading-relaxed">{regime.todaySummary}</p>
            </div>
            <div className="rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] p-3">
              <div className="text-[11px] text-[#7A9194] mb-1">趋势</div>
              <div className="font-bold text-[#1F3437] dark:text-[#E5EBEA] mb-1">上证 {regime.trendZh}</div>
              <p className="text-[#576F73] dark:text-[#9BB2B4] leading-relaxed">{regime.trendDetail}</p>
            </div>
            <div className="rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] p-3">
              <div className="text-[11px] text-[#7A9194] mb-1">策略取舍</div>
              <p className="text-[#576F73] dark:text-[#9BB2B4] leading-relaxed">{regime.reasons[2]}</p>
              <p className="mt-2 text-[#7A9194]">先观察：{regime.deferredStyles.join('、')}</p>
            </div>
          </div>

          <div className="space-y-3">
            {regime.preferredStyles.map((style) => {
              const play = STRATEGY_PLAYBOOK.find((item) => item.style === style);
              const matches = rankPresetCandidates(Object.values(PRESET_STOCKS), style, 3);
              const marketMatches = rankSnapshotCandidates(screenItems, style, 8)
                .filter((item) => !matches.some((preset) => preset.symbol === item.symbol))
                .slice(0, 4);
              return (
                <div key={style} className="rounded-xl border border-[#E3E7E1] dark:border-[#2A383A] p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-[#1F3437] dark:text-[#E5EBEA]">主策略 · {style}</div>
                      <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">{play?.fit}</p>
                    </div>
                    {play && onOpenStrategy && (
                      <button
                        type="button"
                        onClick={() => onOpenStrategy(play.prompt)}
                        className="px-3 py-1.5 rounded-lg border border-[#3E6F73]/40 text-[11px] font-semibold text-[#2B5458] dark:text-[#76B4B9] cursor-pointer"
                      >
                        用这个思路筛选全市场
                      </button>
                    )}
                  </div>
                  {matches.length === 0 ? (
                    <p className="mt-2 text-[11px] text-[#7A9194]">核心池里没有同时满足硬条件的标的，用上面的按钮去全市场快照里找。</p>
                  ) : (
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                      {matches.map((stock) => (
                        <div key={stock.symbol} className="rounded-lg bg-[#F6F7F5] dark:bg-[#141A1B] p-2 text-xs">
                          <button type="button" onClick={() => onSelectStock?.(stock.symbol)} className="font-bold text-[#1F3437] dark:text-[#E5EBEA] cursor-pointer">
                            {stock.name} <span className="font-mono text-[#7A9194]">{stock.symbol}</span>
                          </button>
                          <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mt-1">{stock.highlightReasons.join(' · ')}</p>
                          {stock.outlook.basis === 'scenario' && (
                            <p className="font-mono text-[11px] mt-1 text-[#1F3437] dark:text-[#E5EBEA]">
                              悲观 {stock.outlook.bearPrice} · 基准 {stock.outlook.basePrice} · 乐观 {stock.outlook.bullPrice}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => tracking.track(stock.symbol, style)}
                            className="mt-2 px-2 py-1 rounded-lg bg-[#1F3437] text-white text-[11px] cursor-pointer"
                          >
                            {tracking.busySymbol === stock.symbol ? '写入中...' : '跟进'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {marketMatches.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[11px] text-[#7A9194] mb-2">全市场快照里符合规则的标的。跟进时再拉财报；银行、保险、证券不外推三年目标价。</p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        {marketMatches.map((item) => (
                          <div key={item.symbol} className="rounded-lg border border-[#E3E7E1] dark:border-[#2A383A] p-2 text-xs">
                            <button type="button" onClick={() => onSelectStock?.(item.symbol)} className="font-bold text-[#1F3437] dark:text-[#E5EBEA] cursor-pointer">
                              {item.name} <span className="font-mono text-[#7A9194]">{item.symbol}</span>
                            </button>
                            <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mt-1">{item.reasons.join(' · ')}</p>
                            <button
                              type="button"
                              onClick={() => tracking.track(item.symbol, style)}
                              className="mt-2 px-2 py-1 rounded-lg bg-[#1F3437] text-white text-[11px] cursor-pointer"
                            >
                              {tracking.busySymbol === item.symbol ? '写入中...' : '跟进'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {tracking.pending && (
            <VaultPasswordGate
              status={tracking.vault.status}
              error={tracking.vault.error}
              onUnlock={tracking.vault.unlock}
              onSetup={tracking.vault.setup}
              onReset={tracking.vault.reset}
            />
          )}
          {tracking.error && <p className="text-xs text-[#A84A3E]">{tracking.error}</p>}
        </>
      )}
    </section>
  );
}
