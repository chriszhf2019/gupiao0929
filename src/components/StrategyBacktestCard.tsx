import React, { useState, useEffect } from 'react';
import { StockData } from '../types/stock';
import { runStrategyBacktest, BacktestStrategyType, BenchmarkBar } from '../utils/backtestEngine';
import {
  Activity,
  TrendingUp,
  Percent,
  ShieldCheck,
  Award,
  Zap,
  RotateCcw,
  Sliders,
  ChevronRight,
  Info,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

interface StrategyBacktestCardProps {
  stock: StockData;
}

const BENCHMARK_SYMBOL = 'sh000300'; // 沪深300 真实日K

export const StrategyBacktestCard: React.FC<StrategyBacktestCardProps> = ({ stock }) => {
  const [strategyType, setStrategyType] = useState<BacktestStrategyType>('ma_pullback');
  const [capital, setCapital] = useState<number>(100000);
  const [showSignalLogs, setShowSignalLogs] = useState<boolean>(false);
  const [benchmark, setBenchmark] = useState<BenchmarkBar[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/kline/${BENCHMARK_SYMBOL}?days=120`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (active && json?.success && Array.isArray(json.bars)) {
          setBenchmark(json.bars);
        }
      })
      .catch(() => {
        // 基准拉取失败时回测仍可运行，仅基准曲线不可用
      });
    return () => {
      active = false;
    };
  }, [stock.symbol]);

  const result = runStrategyBacktest(stock, strategyType, capital, {
    benchmark: benchmark || undefined,
  });

  if (result.insufficientData) {
    return (
      <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-6 shadow-xs mb-8 transition-colors">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-[#3E6F73]/10 text-[#3E6F73] dark:text-[#76B4B9] border border-[#3E6F73]/20">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-base font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
            策略历史量化回测模拟引擎 (Backtest Simulation)
          </h3>
        </div>
        <div className="flex items-start space-x-2.5 p-4 rounded-xl bg-[#B0803C]/10 border border-[#B0803C]/30 text-[#8A6226] dark:text-[#D9B77C] text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-1">无法执行回测</p>
            <p>{result.insufficientReason}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-6 shadow-xs mb-8 transition-colors">
      {/* 标题与策略切换 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E3E7E1] dark:border-[#2A383A] pb-4 mb-5 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#3E6F73]/10 text-[#3E6F73] dark:text-[#76B4B9] border border-[#3E6F73]/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                策略历史量化回测模拟引擎 (Backtest Simulation)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#4A7C6F]/10 text-[#4A7C6F] font-mono font-semibold">
                真实行情 · 含交易成本
              </span>
            </div>
            <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] mt-0.5">
              基于真实日K验证买点纪律、止损防守与分批加仓，含佣金/印花税/滑点与{benchmark ? '真实沪深300' : '（基准不可用）'}对比
            </p>
          </div>
        </div>

        {/* 策略模式切换 Tabs */}
        <div className="flex items-center space-x-1.5 bg-[#F6F7F5] dark:bg-[#141A1B] p-1 rounded-xl border border-[#E3E7E1] dark:border-[#2A383A]">
          <button
            onClick={() => setStrategyType('ma_pullback')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              strategyType === 'ma_pullback'
                ? 'bg-[#1F3437] text-white dark:bg-[#3E6F73] shadow-xs'
                : 'text-[#576F73] dark:text-[#9BB2B4] hover:text-[#1F3437] dark:hover:text-white'
            }`}
          >
            均线回踩企稳
          </button>
          <button
            onClick={() => setStrategyType('safety_margin_staged')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              strategyType === 'safety_margin_staged'
                ? 'bg-[#1F3437] text-white dark:bg-[#3E6F73] shadow-xs'
                : 'text-[#576F73] dark:text-[#9BB2B4] hover:text-[#1F3437] dark:hover:text-white'
            }`}
          >
            安全边际分批
          </button>
          <button
            onClick={() => setStrategyType('breakout_momentum')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              strategyType === 'breakout_momentum'
                ? 'bg-[#1F3437] text-white dark:bg-[#3E6F73] shadow-xs'
                : 'text-[#576F73] dark:text-[#9BB2B4] hover:text-[#1F3437] dark:hover:text-white'
            }`}
          >
            右侧放量突破
          </button>
        </div>
      </div>

      {/* 回测核心 KPI 指标矩阵 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-3.5">
          <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1">累计收益率</div>
          <div className={`text-xl font-black font-mono tabular-nums ${
            result.totalReturnPercent >= 0 ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'
          }`}>
            {result.totalReturnPercent >= 0 ? '+' : ''}{result.totalReturnPercent}%
          </div>
          <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4]">
            年化: <span className="font-mono font-semibold">{result.annualizedReturnPercent}%</span>
          </div>
        </div>

        <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-3.5">
          <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1">跑赢沪深300基准</div>
          <div className={`text-xl font-black font-mono tabular-nums ${
            result.excessReturnPercent >= 0 ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'
          }`}>
            {result.benchmarkAvailable ? `${result.excessReturnPercent >= 0 ? '+' : ''}${result.excessReturnPercent}%` : '--'}
          </div>
          <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4]">
            基准收益: <span className="font-mono">{result.benchmarkAvailable ? `${result.benchmarkReturnPercent}%` : '不可用'}</span>
          </div>
        </div>

        <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-3.5">
          <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1">动态最大回撤 (MDD)</div>
          <div className="text-xl font-black font-mono tabular-nums text-[#A84A3E]">
            -{result.maxDrawdownPercent}%
          </div>
          <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4]">
            风控防守底线
          </div>
        </div>

        <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-3.5">
          <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1">夏普比率 (Sharpe)</div>
          <div className="text-xl font-black font-mono tabular-nums text-[#3E6F73] dark:text-[#76B4B9]">
            {result.sharpeRatio}
          </div>
          <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4]">
            日收益年化口径
          </div>
        </div>

        <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-3.5">
          <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1">策略胜率 (Win Rate)</div>
          <div className="text-xl font-black font-mono tabular-nums text-[#1F3437] dark:text-white">
            {result.totalTrades > 0 ? `${result.winRatePercent}%` : '--'}
          </div>
          <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4]">
            总交易: <span className="font-mono">{result.totalTrades} 次</span>
          </div>
        </div>

        <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-3.5">
          <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1">盈亏比 (Profit Factor)</div>
          <div className="text-xl font-black font-mono tabular-nums text-[#4A7C6F]">
            {result.totalTrades > 0 ? `${result.profitFactor}:1` : '--'}
          </div>
          <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4]">
            大赚小赔保护
          </div>
        </div>
      </div>

      {/* 成本假设说明 */}
      {result.costNote && (
        <div className="flex items-center space-x-1.5 mb-4 px-3 py-2 rounded-lg bg-[#3E6F73]/8 border border-[#3E6F73]/20 text-[11px] text-[#2B5458] dark:text-[#76B4B9]">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>{result.costNote}；夏普按日收益年化（无风险利率 2%）。</span>
        </div>
      )}

      {/* 净值对比折线走势图 */}
      <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-serif font-bold text-[#1F3437] dark:text-white">
              策略净值走势 vs. 标的买入持有 vs. 沪深300基准 (初始净值 1.00)
            </span>
          </div>
          <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] font-mono">
            {result.period}
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={result.performanceSeries} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" opacity={0.3} />
              <XAxis dataKey="date" stroke="#7A9194" fontSize={11} tickLine={false} />
              <YAxis
                domain={['auto', 'auto']}
                stroke="#7A9194"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => val.toFixed(2)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F3437',
                  borderColor: '#3E6F73',
                  borderRadius: '0.75rem',
                  color: '#FFFFFF',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [val, '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <ReferenceLine y={1.0} stroke="#94A3B8" strokeDasharray="3 3" label={{ value: '保本基准线 (1.00)', fill: '#94A3B8', fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="strategyReturn"
                name={`本策略 (${result.strategyName.split('+')[0]})`}
                stroke="#3E6F73"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="stockHoldReturn"
                name={`${stock.name} 买入持有不动`}
                stroke="#4A7C6F"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
              />
              {result.benchmarkAvailable && (
                <Line
                  type="monotone"
                  dataKey="benchmarkReturn"
                  name="沪深300基准"
                  stroke="#94A3B8"
                  strokeWidth={1.2}
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 交易信号明细折叠面板 */}
      <div className="border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl overflow-hidden">
        <button
          onClick={() => setShowSignalLogs(!showSignalLogs)}
          className="w-full px-4 py-3 bg-[#F6F7F5] dark:bg-[#141A1B] flex items-center justify-between text-xs font-bold text-[#1F3437] dark:text-white cursor-pointer hover:bg-[#ECEFEA] dark:hover:bg-[#1F2729] transition-all"
        >
          <span className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-[#3E6F73]" />
            <span>查看回测产生的买卖信号记录 ({result.tradeSignalsSummary.length} 笔)</span>
          </span>
          <span className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">
            {showSignalLogs ? '收起明细 ▲' : '展开交易日志 ▼'}
          </span>
        </button>

        {showSignalLogs && (
          <div className="p-4 space-y-2 bg-white dark:bg-[#1C2426] text-xs max-h-56 overflow-y-auto">
            {result.tradeSignalsSummary.length === 0 ? (
              <p className="text-[#576F73] dark:text-[#9BB2B4] text-center py-2">
                在此回测周期内该策略保持观望持仓或未触发极端买卖点。
              </p>
            ) : (
              result.tradeSignalsSummary.map((sig, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A]"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      sig.type === 'BUY'
                        ? 'bg-[#4A7C6F]/15 text-[#4A7C6F]'
                        : 'bg-[#A84A3E]/15 text-[#A84A3E]'
                    }`}>
                      {sig.type === 'BUY' ? '买入' : '平仓卖出'}
                    </span>
                    <span className="font-mono text-[#576F73] dark:text-[#9BB2B4] text-[11px]">{sig.date}</span>
                    <span className="font-mono font-bold text-[#1F3437] dark:text-white">
                      {stock.currency === 'USD' ? '$' : '¥'}{sig.price}
                    </span>
                    <span className="text-[#576F73] dark:text-[#9BB2B4]">{sig.reason}</span>
                  </div>

                  {sig.pnlPercent !== undefined && (
                    <div className={`font-mono font-bold tabular-nums text-xs ${
                      sig.pnlPercent >= 0 ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'
                    }`}>
                      {sig.pnlPercent >= 0 ? '+' : ''}{sig.pnlPercent}%
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
