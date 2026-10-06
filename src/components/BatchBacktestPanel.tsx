import React, { useState } from 'react';
import { runSimpleBacktest, SimpleBacktestResult } from '../utils/simpleBacktest';
import { Activity, Loader2, TrendingUp, AlertTriangle } from 'lucide-react';

interface Candidate {
  code: string;
  name: string;
  isSt?: boolean;
}

interface BatchBacktestPanelProps {
  candidates: Candidate[]; // 已按价值信号排序的候选池，取前 N 只回测
}

const TOP_N = 8;

interface KlineResponse {
  success: boolean;
  bars?: { date: string; price: number }[];
}

interface RowResult {
  code: string;
  name: string;
  result: SimpleBacktestResult;
}

export const BatchBacktestPanel: React.FC<BatchBacktestPanelProps> = ({ candidates }) => {
  const [rows, setRows] = useState<RowResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  const run = async () => {
    setLoading(true);
    setRows([]);
    const top = candidates.slice(0, TOP_N);
    try {
      const results = await Promise.all(
        top.map(async (c) => {
          try {
            const res = await fetch(`/api/kline/${c.code}?days=250`);
            const json: KlineResponse = res.ok ? await res.json() : null;
            const bars = json?.bars || [];
            return { code: c.code, name: c.name, result: runSimpleBacktest(bars) };
          } catch {
            return { code: c.code, name: c.name, result: runSimpleBacktest([]) };
          }
        })
      );
      setRows(results);
    } finally {
      setLoading(false);
      setRan(true);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-2">
            <Activity className="w-4 h-4 text-[#3E6F73]" />
            <span>候选池批量回测（MA20 均线策略 · 含交易成本）</span>
          </h3>
          <p className="text-xs text-[#576F73] dark:text-[#9BB2B4]">
            对价值信号榜前 {TOP_N} 只候选跑真实历史回测，对比"买入持有 vs MA20 策略"；历史不预示未来
          </p>
        </div>
        <button
          onClick={run}
          disabled={loading || candidates.length === 0}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#1F3437] hover:bg-[#274246] text-white text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
          <span>{loading ? '回测中...' : '批量回测前 ' + TOP_N + ' 只'}</span>
        </button>
      </div>

      {!ran ? (
        <div className="text-center py-6 text-xs text-[#7A9194]">
          点击"批量回测"对当前候选池（价值信号榜前 {TOP_N} 只）运行 MA20 均线穿越策略的历史回测。
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-[#E3E7E1] dark:border-[#2A383A] text-[#7A9194] text-[10px] uppercase">
                <th className="pb-2">标的</th>
                <th className="pb-2 text-right">买入持有</th>
                <th className="pb-2 text-right">MA20 策略</th>
                <th className="pb-2 text-right">年化</th>
                <th className="pb-2 text-right">最大回撤</th>
                <th className="pb-2 text-right">胜率</th>
                <th className="pb-2 text-right">交易次数</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E7E1]/60 dark:divide-[#2A383A]/60">
              {rows.map((r) => (
                <tr key={r.code} className="hover:bg-[#F6F7F5]/60 dark:hover:bg-[#141A1B]/60">
                  <td className="py-2 font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                    {r.name}
                    <span className="ml-1.5 font-mono text-[10px] text-[#7A9194]">{r.code}</span>
                  </td>
                  {r.result.dataQuality === 'insufficient' ? (
                    <td colSpan={6} className="py-2 text-[#7A9194] flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>K线数据不足，无法回测</span>
                    </td>
                  ) : (
                    <>
                      <td className={`py-2 text-right font-mono ${r.result.buyHoldReturnPercent >= 0 ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'}`}>
                        {r.result.buyHoldReturnPercent >= 0 ? '+' : ''}{r.result.buyHoldReturnPercent}%
                      </td>
                      <td className={`py-2 text-right font-mono font-bold ${r.result.strategyReturnPercent >= 0 ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'}`}>
                        {r.result.strategyReturnPercent >= 0 ? '+' : ''}{r.result.strategyReturnPercent}%
                      </td>
                      <td className="py-2 text-right font-mono text-[#576F73] dark:text-[#9BB2B4]">
                        {r.result.annualizedReliable === false ? '--' : `${r.result.annualizedReturnPercent >= 0 ? '+' : ''}${r.result.annualizedReturnPercent}%`}
                      </td>
                      <td className="py-2 text-right font-mono text-[#A84A3E]">-{r.result.maxDrawdownPercent}%</td>
                      <td className="py-2 text-right font-mono text-[#576F73] dark:text-[#9BB2B4]">
                        {r.result.totalTrades > 0 ? `${r.result.winRatePercent}%` : '--'}
                      </td>
                      <td className="py-2 text-right font-mono text-[#576F73] dark:text-[#9BB2B4]">{r.result.totalTrades}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
