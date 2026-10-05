import React, { useEffect, useMemo, useRef, useState } from 'react';
import { request } from '../services/apiClient';
import { LayoutDashboard, RefreshCw, Sparkles, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

interface MarketIndex {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface MarketOverviewResponse {
  success: boolean;
  updatedAt?: string;
  indices?: MarketIndex[];
}

interface MarketBreadth {
  up: number;
  down: number;
  flat: number;
  total: number;
}

interface BoardQuote {
  code: string;
  name: string;
  changePercent: number;
  netInflow?: number;
}

interface MarketBreadthResponse {
  success: boolean;
  updatedAt?: string;
  breadth?: MarketBreadth | null;
  leaders?: BoardQuote[];
  fundFlow?: BoardQuote[];
}

interface MarketReviewResponse {
  success: boolean;
  review?: string;
  error?: string;
}

interface QuickQuote {
  symbol: string;
  name: string;
  currentPrice: number;
  changePercent: number;
  currency: string;
}

function fmtPrice(price: number): string {
  return price.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTime(iso?: string): string {
  if (!iso) return '--';
  return new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export const MarketDashboardView: React.FC = () => {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>();
  const [quotes, setQuotes] = useState<QuickQuote[]>([]);
  const [breadth, setBreadth] = useState<MarketBreadth | null>(null);
  const [leaders, setLeaders] = useState<BoardQuote[]>([]);
  const [fundFlow, setFundFlow] = useState<BoardQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<string>();
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string>();
  const hasMarketData = useRef(false);

  const loadMarket = async (manual = false) => {
    if (manual || !hasMarketData.current) setLoading(true);
    try {
      const [overview, quick, breadthRes] = await Promise.all([
        request<MarketOverviewResponse>('/api/market-overview'),
        request<{ success: boolean; quotes?: QuickQuote[] }>('/api/quick-quotes'),
        request<MarketBreadthResponse>('/api/market-breadth'),
      ]);
      if (overview?.indices) {
        setIndices(overview.indices);
        setUpdatedAt(overview.updatedAt);
        if (overview.indices.length > 0) hasMarketData.current = true;
      }
      if (quick?.quotes) setQuotes(quick.quotes);
      if (breadthRes?.breadth) setBreadth(breadthRes.breadth);
      if (breadthRes?.leaders) setLeaders(breadthRes.leaders);
      if (breadthRes?.fundFlow) setFundFlow(breadthRes.fundFlow);
    } catch (error) {
      console.warn('加载市场数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarket(false);
    // 每 60 秒静默刷新，避免整页进入加载态
    const timer = setInterval(() => loadMarket(false), 60000);
    return () => clearInterval(timer);
  }, []);

  const generateReview = async () => {
    setReviewLoading(true);
    setReviewError(undefined);
    try {
      const res = await request<MarketReviewResponse>('/api/market-ai-review', {
        method: 'POST',
        body: JSON.stringify({}),
        timeoutMs: 20000,
      });
      if (res?.review) setReview(res.review);
      else setReviewError(res?.error || '生成失败');
    } catch (error: any) {
      setReviewError(error?.message || '生成失败');
    } finally {
      setReviewLoading(false);
    }
  };

  const upCount = useMemo(() => quotes.filter((q) => q.changePercent >= 0).length, [quotes]);
  const downCount = quotes.length - upCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#3E6F73]/10 text-[#3E6F73] dark:text-[#76B4B9] border border-[#3E6F73]/20">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">市场大盘</h2>
            <p className="text-xs text-[#576F73] dark:text-[#9BB2B4]">主要指数与核心标的行情 · 数据来自东方财富/腾讯公开接口</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#7A9194]">更新于 {formatTime(updatedAt)}</span>
          <button
            onClick={() => loadMarket(true)}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] text-xs font-semibold text-[#1F3437] dark:text-[#E5EBEA] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>
        </div>
      </div>

      {/* 指数卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {indices.map((idx) => {
          const isUp = idx.changePercent >= 0;
          return (
            <div key={idx.code} className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-4">
              <div className="text-xs font-semibold text-[#576F73] dark:text-[#9BB2B4]">{idx.name}</div>
              <div className="mt-1 text-xl font-black font-mono text-[#1F3437] dark:text-white">{fmtPrice(idx.price)}</div>
              <div className={`mt-1 text-xs font-mono font-bold flex items-center ${isUp ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'}`}>
                {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                {isUp ? '+' : ''}{idx.change.toFixed(2)} ({isUp ? '+' : ''}{idx.changePercent.toFixed(2)}%)
              </div>
            </div>
          );
        })}
      </div>

      {/* 涨跌分布与板块 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-5">
          <h3 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA] mb-4">市场涨跌分布</h3>
          {breadth ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#576F73] dark:text-[#9BB2B4]">上涨家数</span>
                <span className="font-mono font-bold text-[#4A7C6F]">{breadth.up}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#576F73] dark:text-[#9BB2B4]">下跌家数</span>
                <span className="font-mono font-bold text-[#A84A3E]">{breadth.down}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#576F73] dark:text-[#9BB2B4]">平盘家数</span>
                <span className="font-mono font-bold text-[#7A9194]">{breadth.flat}</span>
              </div>
              <div className="pt-3 border-t border-[#E3E7E1] dark:border-[#2A383A] flex items-center justify-between text-xs">
                <span className="text-[#576F73] dark:text-[#9BB2B4]">总家数</span>
                <span className="font-mono font-black text-[#1F3437] dark:text-white">{breadth.total}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#7A9194] py-4">涨跌分布加载中...</div>
          )}
        </div>

        <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-5">
          <h3 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA] mb-4">领涨板块</h3>
          <div className="space-y-2">
            {leaders.map((b) => (
              <div key={b.code} className="flex items-center justify-between text-xs">
                <span className="text-[#1F3437] dark:text-[#E5EBEA]">{b.name}</span>
                <span className="font-mono font-bold text-[#4A7C6F]">{b.changePercent >= 0 ? '+' : ''}{b.changePercent.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-5">
          <h3 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA] mb-4">主力净流入板块</h3>
          <div className="space-y-2">
            {fundFlow.map((b) => {
              const inflowYi = b.netInflow ? (b.netInflow / 1e8).toFixed(2) : '--';
              return (
                <div key={b.code} className="flex items-center justify-between text-xs">
                  <span className="text-[#1F3437] dark:text-[#E5EBEA]">{b.name}</span>
                  <span className="font-mono font-bold text-[#3E6F73] dark:text-[#76B4B9]">+{inflowYi}亿</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI 一句话复盘 */}
      <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#3E6F73]" />
            <h3 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">AI 今日盘面复盘</h3>
          </div>
          <button
            onClick={generateReview}
            disabled={reviewLoading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#1F3437] hover:bg-[#274246] text-white text-xs font-semibold cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${reviewLoading ? 'animate-pulse' : ''}`} />
            <span>{reviewLoading ? '生成中...' : '生成一句话复盘'}</span>
          </button>
        </div>
        {review ? (
          <p className="text-sm leading-relaxed text-[#1F3437] dark:text-[#E5EBEA]">{review}</p>
        ) : reviewError ? (
          <p className="text-sm text-[#A84A3E]">{reviewError}</p>
        ) : (
          <p className="text-sm text-[#7A9194]">点击右侧按钮，让 AI 基于当前指数数据生成客观复盘。</p>
        )}
      </div>

      {/* 核心标的行情 */}
      <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-[#3E6F73]" />
            <h3 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">核心标的行情</h3>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="px-2 py-1 rounded bg-[#4A7C6F]/10 text-[#4A7C6F]">上涨 {upCount}</span>
            <span className="px-2 py-1 rounded bg-[#A84A3E]/10 text-[#A84A3E]">下跌 {downCount}</span>
          </div>
        </div>

        {quotes.length === 0 ? (
          <div className="text-center py-10 text-sm text-[#7A9194]">行情加载中...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {quotes.map((q) => {
              const isUp = q.changePercent >= 0;
              return (
                <div key={q.symbol} className="p-3 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1F3437] dark:text-[#E5EBEA]">{q.name}</span>
                    <span className="text-[10px] font-mono text-[#7A9194]">{q.symbol}</span>
                  </div>
                  <div className="mt-1 flex items-end justify-between">
                    <span className="text-lg font-mono font-black text-[#1F3437] dark:text-white">
                      {q.currency === 'USD' ? '$' : '¥'}{fmtPrice(q.currentPrice)}
                    </span>
                    <span className={`text-xs font-mono font-bold ${isUp ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'}`}>
                      {isUp ? '+' : ''}{q.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
