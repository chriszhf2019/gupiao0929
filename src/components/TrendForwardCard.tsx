import React, { useEffect, useState } from 'react';
import { StockData } from '../types/stock';
import { analyzeTrendForwardReturns, TrendForwardResult } from '../utils/trendForwardReturns';
import { Activity, Loader2, TrendingUp, TrendingDown, Info } from 'lucide-react';

interface TrendForwardCardProps {
  stock: StockData;
}

interface KlineResponse {
  success: boolean;
  bars?: { date: string; price: number }[];
}

export const TrendForwardCard: React.FC<TrendForwardCardProps> = ({ stock }) => {
  const [result, setResult] = useState<TrendForwardResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/kline/${stock.symbol}?days=250`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json: KlineResponse | null) => {
        if (!active) return;
        if (json?.success && Array.isArray(json.bars)) {
          setResult(analyzeTrendForwardReturns(json.bars));
        } else {
          setResult(analyzeTrendForwardReturns([]));
        }
      })
      .catch(() => {
        if (active) setResult(analyzeTrendForwardReturns([]));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [stock.symbol]);

  const renderStats = (stats: { horizon: number; meanPercent: number; medianPercent: number; winRate: number; samples: number }[]) =>
    stats.map((s) => (
      <div key={s.horizon} className="text-center">
        <div className="text-[10px] text-[#7A9194] mb-1">后 {s.horizon} 日</div>
        {s.samples === 0 ? (
          <div className="text-sm font-mono text-[#7A9194]">--</div>
        ) : (
          <>
            <div className={`text-sm font-mono font-bold ${s.meanPercent >= 0 ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'}`}>
              {s.meanPercent >= 0 ? '+' : ''}{s.meanPercent}%
            </div>
            <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4]">胜率 {s.winRate}%</div>
            <div className="text-[9px] text-[#7A9194]">中位 {s.medianPercent >= 0 ? '+' : ''}{s.medianPercent}% · n={s.samples}</div>
          </>
        )}
      </div>
    ));

  const stateZh = result?.currentState === 'bullish' ? '多头（MACD 金叉态）' : result?.currentState === 'bearish' ? '空头（MACD 死叉态）' : '中性';

  return (
    <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-2">
            <Activity className="w-4 h-4 text-[#3E6F73]" />
            <span>历史相似形态后续表现（趋势参考 · 非预测）</span>
          </h3>
          <p className="text-xs text-[#576F73] dark:text-[#9BB2B4]">
            基于真实日K，统计「MACD 金叉/死叉」出现后 5/10/20 日的平均涨跌与胜率；历史不预示未来，仅供概率参考
          </p>
        </div>
        {result?.dataQuality === 'real' && (
          <span className={`text-[11px] px-2.5 py-1 rounded-md font-bold border ${
            result.currentState === 'bullish'
              ? 'bg-[#4A7C6F]/10 text-[#4A7C6F] border-[#4A7C6F]/30'
              : result.currentState === 'bearish'
              ? 'bg-[#A84A3E]/10 text-[#A84A3E] border-[#A84A3E]/30'
              : 'bg-[#B0803C]/10 text-[#8A6226] border-[#B0803C]/30'
          }`}>
            当前：{stateZh}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-xs text-[#576F73] dark:text-[#9BB2B4] space-x-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>正在拉取 250 日真实K线并统计历史形态...</span>
        </div>
      ) : result?.dataQuality === 'insufficient' ? (
        <div className="py-6 text-center text-xs text-[#576F73] dark:text-[#9BB2B4] border border-dashed border-[#E3E7E1] dark:border-[#2A383A] rounded-xl">
          {result.note}
        </div>
      ) : (
        <div className="space-y-4">
          {/* 金叉后表现 */}
          <div>
            <div className="text-[11px] font-bold text-[#4A7C6F] mb-2 flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>历史 MACD 金叉（看多信号）出现后</span>
            </div>
            <div className="grid grid-cols-3 gap-2">{renderStats(result!.goldenCrossStats)}</div>
          </div>
          {/* 死叉后表现 */}
          <div>
            <div className="text-[11px] font-bold text-[#A84A3E] mb-2 flex items-center space-x-1.5">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>历史 MACD 死叉（看空信号）出现后</span>
            </div>
            <div className="grid grid-cols-3 gap-2">{renderStats(result!.deathCrossStats)}</div>
          </div>
          <div className="flex items-start space-x-1.5 pt-1 border-t border-[#E3E7E1] dark:border-[#2A383A] text-[10px] text-[#7A9194]">
            <Info className="w-3 h-3 shrink-0 mt-0.5" />
            <span>{result!.note} 平均/中位数指"持有 N 日"的涨跌幅，样本为历史所有同类信号。</span>
          </div>
        </div>
      )}
    </div>
  );
};
