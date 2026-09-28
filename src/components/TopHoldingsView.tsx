import React, { useState, useEffect } from 'react';
import {
  MARKET_INSTITUTIONAL_PORTFOLIOS,
  fetchStockHoldings,
} from '../data/holdingsData';
import { InstitutionalHoldingOverview, MarketTopHoldingItem } from '../types/stock';
import { PRESET_STOCKS } from '../data/presetStocks';
import {
  Building2,
  Users2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ShieldCheck,
  PieChart,
  Compass,
  ArrowRight,
  Landmark,
  Eye,
  Loader2,
  PlusCircle,
} from 'lucide-react';

interface TopHoldingsViewProps {
  currentSymbol: string;
  onSelectStock: (symbol: string) => void;
  onNavigateToFiveStep: (symbol: string) => void;
  onNavigateToTracking: (symbol: string) => void;
}

export const TopHoldingsView: React.FC<TopHoldingsViewProps> = ({
  currentSymbol,
  onSelectStock,
  onNavigateToFiveStep,
  onNavigateToTracking,
}) => {
  const [activeTab, setActiveTab] = useState<'market_portfolios' | 'stock_shareholders'>('market_portfolios');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<'northbound' | 'mutual_funds' | 'social_security'>('northbound');
  const [targetStockSymbol, setTargetStockSymbol] = useState(currentSymbol || '600519');
  const [customCode, setCustomCode] = useState('');
  const [stockHoldings, setStockHoldings] = useState<InstitutionalHoldingOverview | null>(null);
  const [holdingsLoading, setHoldingsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setHoldingsLoading(true);
    fetchStockHoldings(targetStockSymbol)
      .then((data) => {
        if (active) setStockHoldings(data);
      })
      .catch(() => {
        if (active) setStockHoldings(null);
      })
      .finally(() => {
        if (active) setHoldingsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [targetStockSymbol]);

  const handleCustomCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (customCode.trim()) {
      setTargetStockSymbol(customCode.trim().toUpperCase());
      setCustomCode('');
    }
  };

  const currentPortfolio = MARKET_INSTITUTIONAL_PORTFOLIOS.find((p) => p.id === selectedPortfolioId) || MARKET_INSTITUTIONAL_PORTFOLIOS[0];
  const targetStockObj = PRESET_STOCKS[targetStockSymbol];

  // 机构重仓榜实时数据：优先展示真实披露（拉取失败回退静态快照）
  // northbound 来自 Node 服务端；fund/social 来自 akshare 数据服务（127.0.0.1:8765）
  const [liveData, setLiveData] = useState<
    Record<string, { tradeDate: string; holdings: MarketTopHoldingItem[]; source: string } | null>
  >({ northbound: null, mutual_funds: null, social_security: null });

  const liveHoldingsToItems = (holdings: any[], hasPrice: boolean): MarketTopHoldingItem[] =>
    holdings.map((h: any, idx: number) => ({
      rank: idx + 1,
      symbol: h.symbol || h.code,
      name: h.name,
      market: 'A-Share',
      industry: '—',
      holdingValue: `约 ${(h.holdingValueYi ?? 0).toFixed(0)} 亿`,
      holdingRatioPercent: h.ratio ?? h.holdingRatioPercent ?? 0,
      recentQuarterChange: h.changeStatus === 'increase' ? 'increase' : h.changeStatus === 'decrease' ? 'decrease' : 'unchanged',
      changePercent: h.changePercent ?? h.changeRate ?? 0,
      currentPrice: hasPrice ? (h.closePrice ?? 0) : 0,
      currency: 'CNY',
      peTTM: 0,
    }));

  useEffect(() => {
    let active = true;
    // 北向：Node 服务端
    fetch('/api/institutional/northbound-top10')
      .then((r) => (r.ok ? r.json() : null))
      .then((json: any) => {
        if (!active || !json?.success) return;
        setLiveData((prev) => ({
          ...prev,
          northbound: { tradeDate: json.tradeDate, holdings: liveHoldingsToItems(json.holdings, true), source: '北向' },
        }));
      })
      .catch(() => {});
    // 公募基金重仓：Node 服务端
    fetch('/api/institutional/fund-top10')
      .then((r) => (r.ok ? r.json() : null))
      .then((json: any) => {
        if (!active || !json?.success) return;
        setLiveData((prev) => ({
          ...prev,
          mutual_funds: { tradeDate: json.reportDate, holdings: liveHoldingsToItems(json.holdings, false), source: '公募' },
        }));
      })
      .catch(() => {});
    // 社保基金重仓：Node 服务端
    fetch('/api/institutional/social-security-top10')
      .then((r) => (r.ok ? r.json() : null))
      .then((json: any) => {
        if (!active || !json?.success) return;
        setLiveData((prev) => ({
          ...prev,
          social_security: { tradeDate: json.reportDate, holdings: liveHoldingsToItems(json.holdings, false), source: '社保' },
        }));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const currentLive = liveData[selectedPortfolioId] || null;
  const isLive = currentLive !== null;
  const displayedHoldings = isLive ? currentLive.holdings : currentPortfolio.holdings;
  const displayedUpdatedAt = isLive
    ? `${currentLive.source}真实披露 ${currentLive.tradeDate}`
    : currentPortfolio.updatedAt;

  return (
    <div className="space-y-6">
      {/* 顶部标题与模式切换 */}
      <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] p-6 rounded-2xl shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-[#3E6F73] dark:text-[#76B4B9] font-bold uppercase tracking-wider mb-1">
              <Landmark className="w-4 h-4 text-[#3E6F73]" />
              <span>主力机构前十重仓 & 个股前十大股东穿透中心</span>
            </div>
            <h2 className="text-xl font-serif font-black text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-2">
              <span>主力资金筹码与前十持仓透视</span>
            </h2>
            <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] mt-1 max-w-3xl">
              跟踪聪明钱动向。既可纵览北向陆股通外资、公募顶流基金、全国社保基金的「全市场前十重仓资产池」，亦可深度穿透单一个股的「前十大流通股东结构与筹码集中度」。
            </p>
          </div>

          {/* 模式选择标签页 */}
          <div className="flex items-center bg-[#F6F7F5] dark:bg-[#141A1B] p-1 rounded-xl border border-[#E3E7E1] dark:border-[#2A383A] text-xs">
            <button
              onClick={() => setActiveTab('market_portfolios')}
              className={`px-3.5 py-1.5 rounded-lg font-serif font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'market_portfolios'
                  ? 'bg-white dark:bg-[#1C2426] text-[#1F3437] dark:text-[#E5EBEA] shadow-xs'
                  : 'text-[#576F73] dark:text-[#9BB2B4] hover:text-[#1F3437] dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#3E6F73]" />
              <span>机构前十重仓榜</span>
            </button>
            <button
              onClick={() => setActiveTab('stock_shareholders')}
              className={`px-3.5 py-1.5 rounded-lg font-serif font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'stock_shareholders'
                  ? 'bg-white dark:bg-[#1C2426] text-[#1F3437] dark:text-[#E5EBEA] shadow-xs'
                  : 'text-[#576F73] dark:text-[#9BB2B4] hover:text-[#1F3437] dark:hover:text-white'
              }`}
            >
              <Users2 className="w-3.5 h-3.5 text-[#3E6F73]" />
              <span>个股前十大流通股东</span>
            </button>
          </div>
        </div>
      </div>

      {/* 视图 1：全市场主力机构前十重仓榜 */}
      {activeTab === 'market_portfolios' && (
        <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-6 shadow-xs space-y-5 transition-colors">
          {/* 三大主力机构切换 Tab */}
          <div className="flex flex-wrap gap-2 border-b border-[#E3E7E1] dark:border-[#2A383A] pb-4">
            {MARKET_INSTITUTIONAL_PORTFOLIOS.map((item) => {
              const isSelected = item.id === selectedPortfolioId;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedPortfolioId(item.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                    isSelected
                      ? 'bg-[#1F3437] text-white shadow-xs'
                      : 'bg-[#F6F7F5] dark:bg-[#141A1B] text-[#576F73] dark:text-[#9BB2B4] hover:bg-[#ECEFEA] dark:hover:bg-[#253235]'
                  }`}
                >
                  <span>{item.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-sans ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#E3E7E1] dark:bg-[#2A383A] text-[#1F3437] dark:text-[#E5EBEA]'
                  }`}>
                    {item.tag}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 榜单概要描述 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F6F7F5] dark:bg-[#141A1B] p-3.5 rounded-xl border border-[#E3E7E1] dark:border-[#2A383A] text-xs">
            <div className="text-[#576F73] dark:text-[#9BB2B4]">
              <span className="font-bold text-[#1F3437] dark:text-[#E5EBEA] mr-2">【机构画像】</span>
              {currentPortfolio.description}
            </div>
            <div className="text-right font-mono text-[11px] text-[#7A9194] whitespace-nowrap">
              {isLive && (
                <span className="mr-2 px-1.5 py-0.5 rounded bg-[#4A7C6F]/10 text-[#4A7C6F] border border-[#4A7C6F]/30">实时</span>
              )}
              持股市值: {currentPortfolio.totalMarketValue} · 数据更新: {displayedUpdatedAt}
            </div>
          </div>

          {/* 前十重仓股票表格 */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E3E7E1] dark:border-[#2A383A] text-[#7A9194] text-[11px] uppercase tracking-wider font-serif">
                  <th className="pb-3 pl-2">排名</th>
                  <th className="pb-3">重仓标的 / 代码</th>
                  <th className="pb-3">所属行业</th>
                  <th className="pb-3 text-right">持仓市值</th>
                  <th className="pb-3 text-right">占机构总市值</th>
                  <th className="pb-3 text-center">本期调仓动向</th>
                  <th className="pb-3 text-right">最新股价</th>
                  <th className="pb-3 text-right">PE (TTM)</th>
                  <th className="pb-3 text-right pr-2">深度研判</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E7E1]/60 dark:divide-[#2A383A]/60">
                {displayedHoldings.map((h) => {
                  return (
                    <tr
                      key={h.symbol}
                      className="hover:bg-[#F6F7F5]/80 dark:hover:bg-[#141A1B]/60 transition-colors group cursor-pointer"
                      onClick={() => onSelectStock(h.symbol)}
                    >
                      {/* 排名 */}
                      <td className="py-3 pl-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[11px] ${
                          h.rank <= 3
                            ? 'bg-[#1F3437] text-white'
                            : 'bg-[#E3E7E1] dark:bg-[#2A383A] text-[#576F73] dark:text-[#9BB2B4]'
                        }`}>
                          {h.rank}
                        </span>
                      </td>

                      {/* 股票名/代码 */}
                      <td className="py-3">
                        <div className="font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-1.5">
                          <span>{h.name}</span>
                          <span className="text-[11px] font-mono font-normal text-[#7A9194]">({h.symbol})</span>
                        </div>
                        <span className="text-[10px] text-[#7A9194]">{h.market}</span>
                      </td>

                      {/* 行业 */}
                      <td className="py-3 text-[#576F73] dark:text-[#9BB2B4]">
                        {h.industry}
                      </td>

                      {/* 持仓市值 */}
                      <td className="py-3 text-right font-mono font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                        {h.holdingValue}
                      </td>

                      {/* 占比 */}
                      <td className="py-3 text-right font-mono text-[#3E6F73] dark:text-[#76B4B9] font-bold">
                        {h.holdingRatioPercent}%
                      </td>

                      {/* 调仓动向 */}
                      <td className="py-3 text-center">
                        {h.recentQuarterChange === 'increase' && (
                          <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold text-[#4A7C6F] bg-[#4A7C6F]/10">
                            <ArrowUpRight className="w-3 h-3" />
                            <span>增持 +{h.changePercent}%</span>
                          </span>
                        )}
                        {h.recentQuarterChange === 'decrease' && (
                          <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold text-[#A84A3E] bg-[#A84A3E]/10">
                            <ArrowDownRight className="w-3 h-3" />
                            <span>减持 {h.changePercent}%</span>
                          </span>
                        )}
                        {h.recentQuarterChange === 'new' && (
                          <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold text-[#3E6F73] bg-[#3E6F73]/15">
                            <span>新进重仓</span>
                          </span>
                        )}
                        {h.recentQuarterChange === 'unchanged' && (
                          <span className="inline-flex items-center space-x-0.5 px-2 py-0.5 rounded text-[11px] font-mono text-[#7A9194] bg-[#E3E7E1]/50 dark:bg-[#2A383A]/50">
                            <Minus className="w-3 h-3" />
                            <span>持平未变</span>
                          </span>
                        )}
                      </td>

                      {/* 最新价格 */}
                      <td className="py-3 text-right font-mono text-[#1F3437] dark:text-[#E5EBEA]">
                        {h.currentPrice > 0 ? `${h.currentPrice} ${h.currency}` : '--'}
                      </td>

                      {/* PE */}
                      <td className="py-3 text-right font-mono text-[#576F73] dark:text-[#9BB2B4]">
                        {h.peTTM > 0 ? `${h.peTTM}x` : '--'}
                      </td>

                      {/* 操作 */}
                      <td className="py-3 text-right pr-2">
                        <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onNavigateToFiveStep(h.symbol)}
                            className="p-1.5 rounded-lg bg-[#F6F7F5] dark:bg-[#141A1B] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] text-[#3E6F73] border border-[#E3E7E1] dark:border-[#2A383A] transition-all cursor-pointer"
                            title="五步诊断"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onNavigateToTracking(h.symbol)}
                            className="px-2 py-1 rounded-lg bg-[#1F3437] hover:bg-[#274246] text-white text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
                          >
                            跟踪
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 视图 2：个股前十大流通股东结构穿透 */}
      {activeTab === 'stock_shareholders' && (
        <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-6 shadow-xs space-y-6 transition-colors">
          {/* 标的选择器与概况徽章 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3E7E1] dark:border-[#2A383A] pb-4">
<div className="flex items-center space-x-3 flex-wrap gap-y-2">
            <span className="text-xs font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
              当前穿透标的：
            </span>
            <select
              value={targetStockSymbol}
              onChange={(e) => setTargetStockSymbol(e.target.value)}
              className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] text-[#1F3437] dark:text-[#E5EBEA] text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-[#3E6F73] cursor-pointer font-bold"
            >
              {Object.values(PRESET_STOCKS).map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.name} ({s.symbol}) - {s.sector}
                </option>
              ))}
            </select>

            <form onSubmit={handleCustomCode} className="flex items-center space-x-1.5">
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder="输入6位A股代码 (如 601318)"
                className="w-40 bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] text-[#1F3437] dark:text-[#E5EBEA] text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-[#3E6F73] placeholder-[#7A9194]"
              />
              <button
                type="submit"
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-[#3E6F73]/10 hover:bg-[#3E6F73]/20 text-[#3E6F73] dark:text-[#76B4B9] border border-[#3E6F73]/30 text-xs font-semibold transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>载入</span>
              </button>
            </form>

            <button
              onClick={() => onNavigateToFiveStep(targetStockSymbol)}
              className="px-3 py-1.5 rounded-xl bg-[#1F3437] text-white text-xs font-semibold hover:bg-[#274246] transition-all cursor-pointer"
            >
              查看该股五步诊断
            </button>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-mono text-[#7A9194]">
            {stockHoldings?.source === 'eastmoney' ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#4A7C6F]/15 text-[#4A7C6F] border border-[#4A7C6F]/30">
                东财 F10 真实披露
              </span>
            ) : stockHoldings?.source === 'preset-snapshot' ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#B0803C]/15 text-[#8A6226] dark:text-[#D9B77C] border border-[#B0803C]/30">
                内置历史快照
              </span>
            ) : null}
            <span>报告期: {stockHoldings?.reportPeriod || '--'}</span>
          </div>
          </div>

          {/* 筹码与机构总览数据卡片 (4项指标) */}
          {holdingsLoading ? (
            <div className="flex items-center justify-center py-10 text-xs text-[#576F73] dark:text-[#9BB2B4] space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>正在拉取前十大股东披露数据...</span>
            </div>
          ) : stockHoldings && stockHoldings.shareholders.length > 0 ? (
          <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A]">
              <div className="text-[11px] text-[#7A9194] mb-1">持股机构总家数</div>
              <div className="text-lg font-mono font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                {stockHoldings.totalInstitutionsCount > 0 ? stockHoldings.totalInstitutionsCount : '--'} <span className="text-xs font-normal">{stockHoldings.totalInstitutionsCount > 0 ? '家' : ''}</span>
              </div>
              <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] mt-0.5">
                公募基金 {stockHoldings.mutualFundCount > 0 ? `${stockHoldings.mutualFundCount} 家` : '--'}（接口未覆盖）
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A]">
              <div className="text-[11px] text-[#7A9194] mb-1">前十大股东集中度 (CR10)</div>
              <div className="text-lg font-mono font-bold text-[#3E6F73] dark:text-[#76B4B9]">
                {stockHoldings.top10ConcentrationPercent}%
              </div>
              <div className="text-[10px] text-[#4A7C6F] mt-0.5">前十大流通股东合计占比</div>
            </div>

            <div className="p-4 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A]">
              <div className="text-[11px] text-[#7A9194] mb-1">陆股通外资持股</div>
              <div className="text-lg font-mono font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                {stockHoldings.northboundHoldingPercent > 0 ? `${stockHoldings.northboundHoldingPercent}%` : '--'}
              </div>
              <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] mt-0.5">香港中央结算账户占比</div>
            </div>

            <div className="p-4 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A]">
              <div className="text-[11px] text-[#7A9194] mb-1">国家队与社保基金</div>
              <div className="flex items-center space-x-1.5 mt-1">
                {stockHoldings.nationalTeamPresent && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#4A7C6F]/15 text-[#4A7C6F] border border-[#4A7C6F]/30">
                    汇金/证金在场
                  </span>
                )}
                {stockHoldings.socialSecurityPresent && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3E6F73]/15 text-[#3E6F73] border border-[#3E6F73]/30">
                    社保基金重仓
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 前十大流通股东详细表格 */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E3E7E1] dark:border-[#2A383A] text-[#7A9194] text-[11px] uppercase tracking-wider font-serif">
                  <th className="pb-3 pl-2">序号</th>
                  <th className="pb-3">股东名称</th>
                  <th className="pb-3">股东类型性质</th>
                  <th className="pb-3 text-right">持股数量</th>
                  <th className="pb-3 text-right">占流通股比</th>
                  <th className="pb-3 text-center">增减仓变动</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E7E1]/60 dark:divide-[#2A383A]/60">
                {stockHoldings.shareholders.map((s) => {
                  return (
                    <tr key={s.rank} className="hover:bg-[#F6F7F5]/80 dark:hover:bg-[#141A1B]/60 transition-colors">
                      <td className="py-3.5 pl-2 font-mono text-[#7A9194]">{s.rank}</td>
                      <td className="py-3.5 font-bold text-[#1F3437] dark:text-[#E5EBEA] max-w-[280px]">
                        {s.name}
                      </td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#F6F7F5] dark:bg-[#141A1B] text-[#576F73] dark:text-[#9BB2B4] border border-[#E3E7E1] dark:border-[#2A383A]">
                          {s.shareholderType}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-mono text-[#1F3437] dark:text-[#E5EBEA]">
                        {s.holdingShares}
                      </td>
                      <td className="py-3.5 text-right font-mono font-bold text-[#3E6F73] dark:text-[#76B4B9]">
                        {s.holdingPercent}%
                      </td>
                      <td className="py-3.5 text-center">
                        {s.changeStatus === 'increase' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-[#4A7C6F] bg-[#4A7C6F]/10">
                            {s.changeShares ? s.changeShares : '增持'}
                          </span>
                        )}
                        {s.changeStatus === 'decrease' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-[#A84A3E] bg-[#A84A3E]/10">
                            {s.changeShares ? s.changeShares : '减持'}
                          </span>
                        )}
                        {s.changeStatus === 'new' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-[#3E6F73] bg-[#3E6F73]/15">
                            新进前十
                          </span>
                        )}
                        {s.changeStatus === 'unchanged' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[#7A9194] bg-[#E3E7E1]/50 dark:bg-[#2A383A]/50">
                            未变
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
          ) : (
            <div className="py-10 text-center text-xs text-[#576F73] dark:text-[#9BB2B4] border border-dashed border-[#E3E7E1] dark:border-[#2A383A] rounded-xl">
              当前标的暂无前十大股东披露数据（该代码可能为港股/美股或数据源暂未覆盖）。数据接口仅支持 6 位 A 股代码。
            </div>
          )}
        </div>
      )}
    </div>
  );
};
