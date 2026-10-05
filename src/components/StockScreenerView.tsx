import React, { useEffect, useMemo, useRef, useState } from 'react';
import { request } from '../services/apiClient';
import { BatchBacktestPanel } from './BatchBacktestPanel';
import {
  Search,
  TrendingUp,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  Loader2,
  Sparkles,
  Download,
} from 'lucide-react';

interface ScreenerItem {
  code: string;
  name: string;
  market: 'SH' | 'SZ' | 'BJ';
  industry: string;
  price: number;
  changePercent: number;
  pe: number;
  pb: number;
  roe: number;
  marketCapYi: number;
  turnoverRate: number;
  amountYi: number;
  isSt?: boolean;
}

interface EnrichedItem extends ScreenerItem {
  valueSignal: number; // 格林布拉特"魔法公式"价值信号：盈利收益率 + ROE（越高越具价值+质量）
}

interface ScreenerResponse {
  success: boolean;
  updatedAt?: string;
  total?: number;
  items?: ScreenerItem[];
  error?: string;
  stale?: boolean;
}

interface StockScreenerViewProps {
  currentSymbol: string;
  onSelectStock: (symbol: string) => void;
  presetSymbols?: string[] | null;
  onClearPreset?: () => void;
}

type SortKey = 'price' | 'changePercent' | 'pe' | 'pb' | 'roe' | 'marketCapYi' | 'turnoverRate' | 'valueSignal';

const PAGE_SIZE = 20;

function marketLabel(market: ScreenerItem['market']): string {
  if (market === 'SH') return '沪';
  if (market === 'SZ') return '深';
  return '京';
}

function fmtMoneyYi(yi: number): string {
  if (!Number.isFinite(yi) || yi <= 0) return '--';
  if (yi >= 10000) return `${(yi / 10000).toFixed(2)}万亿`;
  return `${yi.toFixed(0)}亿`;
}

function fmtNum(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return '--';
  return n.toFixed(digits);
}

// 格林布拉特"魔法公式"价值信号：盈利收益率(1/PE) + ROE，越高越具"便宜+优质"属性
function valueSignalOf(i: ScreenerItem): number {
  const earningsYield = i.pe > 0 ? 100 / i.pe : 0; // 1/PE 的百分数近似
  const roe = i.roe > 0 ? i.roe : 0;
  return Number((earningsYield + roe).toFixed(1));
}

export const StockScreenerView: React.FC<StockScreenerViewProps> = ({ currentSymbol, onSelectStock, presetSymbols, onClearPreset }) => {
  const [items, setItems] = useState<ScreenerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>();
  const [stale, setStale] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [industry, setIndustry] = useState('全部');
  const [peMin, setPeMin] = useState('');
  const [peMax, setPeMax] = useState('');
  const [roeMin, setRoeMin] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('marketCapYi');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [excludeSt, setExcludeSt] = useState(true);
  const hasItems = useRef(false);

  const load = async (manual = false) => {
    if (manual || !hasItems.current) setLoading(true);
    if (manual) setError(null);
    try {
      const res = await request<ScreenerResponse>('/api/screener', { timeoutMs: 15000 });
      if (res?.items && res.items.length > 0) {
        setItems(res.items);
        setUpdatedAt(res.updatedAt);
        setStale(Boolean(res.stale));
        hasItems.current = true;
        setError(null);
      } else if (!hasItems.current) {
        setError(res?.error || '未获取到行情数据，请稍后重试');
      }
    } catch (err: any) {
      if (!hasItems.current || manual) setError(err?.message || '加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(false);
    // 每 60 秒静默刷新全市场快照（服务端已做 60s 缓存，不会刷爆行情源）
    const timer = setInterval(() => load(false), 60000);
    return () => clearInterval(timer);
  }, []);

  const industries = useMemo(() => {
    const set = new Set<string>();
    for (const i of items) {
      if (i.industry) set.add(i.industry);
    }
    const list = Array.from(set);
    list.sort((a: string, b: string) => a.localeCompare(b, 'zh-CN'));
    return ['全部', ...list];
  }, [items]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const presetSet = presetSymbols && presetSymbols.length > 0 ? new Set(presetSymbols) : null;
    const list: EnrichedItem[] = items
      .filter((i) => {
        if (presetSet && !presetSet.has(i.code)) return false;
        if (excludeSt && i.isSt) return false;
        if (industry !== '全部' && i.industry !== industry) return false;
        if (kw && !(i.name.toLowerCase().includes(kw) || i.code.includes(kw) || i.industry.toLowerCase().includes(kw))) return false;
        if (peMin && (i.pe <= 0 || i.pe < Number(peMin))) return false;
        if (peMax && (i.pe <= 0 || i.pe > Number(peMax))) return false;
        if (roeMin && i.roe < Number(roeMin)) return false;
        if (priceMin && i.price < Number(priceMin)) return false;
        if (priceMax && i.price > Number(priceMax)) return false;
        return true;
      })
      .map((i) => ({ ...i, valueSignal: valueSignalOf(i) }));

    const dir = sortDir === 'asc' ? 1 : -1;
    return list.sort((a, b) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      return (va - vb) * dir;
    });
  }, [items, keyword, industry, peMin, peMax, roeMin, priceMin, priceMax, sortKey, sortDir, presetSymbols, excludeSt]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // 价值信号榜（不随当前排序变化，始终按价值信号降序），供批量回测取前 N 只
  const valueRanked = useMemo(
    () =>
      items
        .filter((i) => !excludeSt || !i.isSt)
        .map((i) => ({ ...i, valueSignal: valueSignalOf(i) }))
        .sort((a, b) => b.valueSignal - a.valueSignal),
    [items, excludeSt]
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const resetFilters = () => {
    setKeyword('');
    setIndustry('全部');
    setPeMin('');
    setPeMax('');
    setRoeMin('');
    setPriceMin('');
    setPriceMax('');
    setPage(1);
  };

  // 一键切换到"魔法公式"价值信号榜：盈利收益率 + ROE 综合排序
  const applyValueRanking = () => {
    setSortKey('valueSignal');
    setSortDir('desc');
    setPeMin('');
    setPeMax('');
    setRoeMin('');
    setPriceMin('');
    setPriceMax('');
    setPage(1);
  };

  const exportCsv = () => {
    const header = ['代码', '名称', '市场', '行业', '最新价', '涨跌幅%', 'PE', 'PB', 'ROE%', '总市值(亿)', '换手率%', '价值信号'];
    const rows = filtered.map((i) => [
      i.code,
      i.name,
      i.market,
      i.industry,
      i.price.toFixed(2),
      i.changePercent.toFixed(2),
      i.pe > 0 ? i.pe.toFixed(1) : '',
      i.pb > 0 ? i.pb.toFixed(2) : '',
      i.roe > 0 ? i.roe.toFixed(1) : '',
      i.marketCapYi > 0 ? i.marketCapYi.toFixed(0) : '',
      i.turnoverRate.toFixed(2),
      i.valueSignal.toFixed(1),
    ]);
    const csv = [header, ...rows]
      .map((r) =>
        r
          .map((cell) => {
            const s = String(cell);
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(',')
      )
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `选股雷达-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const SortHeader: React.FC<{ label: string; k: SortKey; className?: string }> = ({ label, k, className }) => (
    <th className={`${className || ''} pb-2.5`}>
      <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-[#1F3437] dark:hover:text-white">
        {label}
        {sortKey === k ? (
          sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
        ) : (
          <ArrowDown className="w-3 h-3 opacity-25" />
        )}
      </button>
    </th>
  );

  return (
    <div className="space-y-5">
      {/* 标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#3E6F73]/10 text-[#3E6F73] dark:text-[#76B4B9] border border-[#3E6F73]/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">全市场选股雷达</h2>
            <p className="text-xs text-[#576F73] dark:text-[#9BB2B4]">
              沪深京 A 股实时行情快照，支持行业、估值、ROE 与价格筛选，点击「研究」进入五步深度研判
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {presetSymbols && presetSymbols.length > 0 && (
            <span className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-[#4A7C6F]/10 border border-[#4A7C6F]/30 text-[11px] font-semibold text-[#376156] dark:text-[#76B4B9]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>策略候选 {presetSymbols.length} 只</span>
              {onClearPreset && (
                <button onClick={onClearPreset} className="ml-1 text-[#7A9194] hover:text-[#A84A3E]" title="清除策略候选过滤">
                  ✕
                </button>
              )}
            </span>
          )}
          {stale && (
            <span className="text-[11px] text-[#A84A3E]">行情源临时限流，展示最近一次缓存</span>
          )}
          {updatedAt && (
            <span className="text-[11px] text-[#7A9194] font-mono">
              更新于 {new Date(updatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
              showFilters
                ? 'bg-[#3E6F73]/10 border-[#3E6F73]/40 text-[#2B5458] dark:text-[#76B4B9]'
                : 'bg-white dark:bg-[#1C2426] border-[#E3E7E1] dark:border-[#2A383A] text-[#1F3437] dark:text-[#E5EBEA]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>筛选</span>
          </button>
          <button
            onClick={applyValueRanking}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#4A7C6F]/10 hover:bg-[#4A7C6F]/20 border border-[#4A7C6F]/30 text-[#376156] dark:text-[#76B4B9] text-xs font-semibold cursor-pointer"
            title="格林布拉特魔法公式：盈利收益率 + ROE 综合排序，寻找'便宜且优质'的标的"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>价值信号榜</span>
          </button>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-[#E3E7E1] dark:border-[#2A383A] bg-white dark:bg-[#1C2426] text-[#1F3437] dark:text-[#E5EBEA] text-xs font-semibold cursor-pointer disabled:opacity-50"
            title="导出当前筛选结果为 CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出 CSV</span>
          </button>
          <button
            onClick={() => load(true)}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#1F3437] hover:bg-[#274246] text-white text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>
        </div>
      </div>

      {/* 搜索与筛选 */}
      <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A9194]" />
            <input
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              placeholder="搜索名称 / 代码 / 行业..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl text-[#1F3437] dark:text-[#E5EBEA] placeholder-[#8C9E9E] focus:outline-none focus:border-[#3E6F73]"
            />
          </div>
          <select
            value={industry}
            onChange={(e) => {
              setIndustry(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl text-[#1F3437] dark:text-[#E5EBEA] focus:outline-none focus:border-[#3E6F73] max-w-xs"
          >
            {industries.map((ind) => (
              <option key={ind} value={ind}>{ind === '全部' ? '全部行业' : ind}</option>
            ))}
          </select>
          <label className="flex items-center space-x-1.5 px-2.5 py-2 text-xs text-[#576F73] dark:text-[#9BB2B4] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={excludeSt}
              onChange={(e) => {
                setExcludeSt(e.target.checked);
                setPage(1);
              }}
              className="accent-[#3E6F73]"
            />
            <span>排除 ST/退市</span>
          </label>
          {showFilters && (
            <button onClick={resetFilters} className="px-3 py-2 text-xs text-[#7A9194] hover:text-[#A84A3E] cursor-pointer whitespace-nowrap">
              清除筛选
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-[#7A9194]">PE 下限</span>
              <input value={peMin} onChange={(e) => { setPeMin(e.target.value); setPage(1); }} type="number" min="0" placeholder="如 0" className="px-2 py-1.5 text-xs rounded-lg border border-[#E3E7E1] dark:border-[#2A383A] bg-[#F6F7F5] dark:bg-[#141A1B]" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-[#7A9194]">PE 上限</span>
              <input value={peMax} onChange={(e) => { setPeMax(e.target.value); setPage(1); }} type="number" min="0" placeholder="如 30" className="px-2 py-1.5 text-xs rounded-lg border border-[#E3E7E1] dark:border-[#2A383A] bg-[#F6F7F5] dark:bg-[#141A1B]" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-[#7A9194]">ROE 下限 (%)</span>
              <input value={roeMin} onChange={(e) => { setRoeMin(e.target.value); setPage(1); }} type="number" step="0.1" placeholder="如 15" className="px-2 py-1.5 text-xs rounded-lg border border-[#E3E7E1] dark:border-[#2A383A] bg-[#F6F7F5] dark:bg-[#141A1B]" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-[#7A9194]">价格下限</span>
              <input value={priceMin} onChange={(e) => { setPriceMin(e.target.value); setPage(1); }} type="number" min="0" placeholder="如 10" className="px-2 py-1.5 text-xs rounded-lg border border-[#E3E7E1] dark:border-[#2A383A] bg-[#F6F7F5] dark:bg-[#141A1B]" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-[#7A9194]">价格上限</span>
              <input value={priceMax} onChange={(e) => { setPriceMax(e.target.value); setPage(1); }} type="number" min="0" placeholder="如 100" className="px-2 py-1.5 text-xs rounded-lg border border-[#E3E7E1] dark:border-[#2A383A] bg-[#F6F7F5] dark:bg-[#141A1B]" />
            </label>
          </div>
        )}
      </div>

      {/* 数据表 */}
      <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-[#7A9194]">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> 正在拉取沪深京 A 股实时行情...
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-sm text-[#A84A3E] mb-3">{error}</p>
            <button onClick={() => load(true)} className="px-4 py-2 rounded-xl bg-[#1F3437] text-white text-xs font-semibold cursor-pointer">重新加载</button>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-[#E3E7E1] dark:border-[#2A383A] flex items-center justify-between">
              <span className="text-xs text-[#576F73] dark:text-[#9BB2B4]">共 {filtered.length} 只标的</span>
              <span className="text-[11px] text-[#7A9194]">数据来源：东方财富实时行情快照</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[860px]">
                <thead>
                  <tr className="border-b border-[#E3E7E1] dark:border-[#2A383A] text-[#7A9194] text-[10px] uppercase">
                    <th className="pb-2.5 pl-4">标的</th>
                    <th className="pb-2.5 hidden sm:table-cell">行业</th>
                    <SortHeader label="最新价" k="price" className="text-right" />
                    <SortHeader label="涨跌幅" k="changePercent" className="text-right" />
                    <SortHeader label="PE" k="pe" className="text-right" />
                    <SortHeader label="PB" k="pb" className="text-right" />
                    <SortHeader label="ROE" k="roe" className="text-right" />
                    <SortHeader label="价值信号" k="valueSignal" className="text-right" />
                    <SortHeader label="总市值" k="marketCapYi" className="text-right" />
                    <SortHeader label="换手率" k="turnoverRate" className="text-right hidden lg:table-cell" />
                    <th className="pb-2.5 pr-4 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E7E1]/60 dark:divide-[#2A383A]/60">
                  {paged.map((i) => {
                    const gain = i.changePercent >= 0;
                    const active = i.code === currentSymbol;
                    return (
                      <tr key={i.code} className={`hover:bg-[#F6F7F5]/70 dark:hover:bg-[#141A1B]/70 transition-colors ${active ? 'bg-[#3E6F73]/5' : ''}`}>
                        <td className="py-2.5 pl-4">
                          <div className="flex items-center space-x-2">
                            <span className={`w-6 h-5 rounded text-center text-[10px] font-bold ${i.market === 'SH' ? 'bg-[#A84A3E]/10 text-[#A84A3E]' : i.market === 'SZ' ? 'bg-[#3E6F73]/10 text-[#3E6F73]' : 'bg-[#4A7C6F]/10 text-[#4A7C6F]'}`}>
                              {marketLabel(i.market)}
                            </span>
                            <div>
                              <div className="font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-1">
                                <span>{i.name}</span>
                                {i.isSt && (
                                  <span className="text-[9px] px-1 py-0.5 rounded bg-[#A84A3E]/10 text-[#A84A3E] font-bold">ST</span>
                                )}
                              </div>
                              <div className="font-mono text-[10px] text-[#7A9194]">{i.code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 text-[#576F73] dark:text-[#9BB2B4] hidden sm:table-cell">{i.industry}</td>
                        <td className="py-2.5 text-right font-mono font-semibold text-[#1F3437] dark:text-white">{fmtNum(i.price)}</td>
                        <td className={`py-2.5 text-right font-mono font-bold ${gain ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'}`}>
                          {gain ? '+' : ''}{fmtNum(i.changePercent)}%
                        </td>
                        <td className="py-2.5 text-right font-mono text-[#576F73] dark:text-[#9BB2B4]">{i.pe > 0 ? fmtNum(i.pe, 1) : '--'}</td>
                        <td className="py-2.5 text-right font-mono text-[#576F73] dark:text-[#9BB2B4]">{i.pb > 0 ? fmtNum(i.pb) : '--'}</td>
                        <td className="py-2.5 text-right font-mono text-[#576F73] dark:text-[#9BB2B4]">{i.roe > 0 ? `${fmtNum(i.roe, 1)}%` : '--'}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-[#2B5458] dark:text-[#76B4B9]">
                          {i.pe > 0 || i.roe > 0 ? fmtNum(i.valueSignal, 1) : '--'}
                        </td>
                        <td className="py-2.5 text-right font-mono text-[#576F73] dark:text-[#9BB2B4]">{fmtMoneyYi(i.marketCapYi)}</td>
                        <td className="py-2.5 text-right font-mono text-[#576F73] dark:text-[#9BB2B4] hidden lg:table-cell">{fmtNum(i.turnoverRate)}%</td>
                        <td className="py-2.5 pr-4 text-center">
                          <button
                            onClick={() => onSelectStock(i.code)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#3E6F73]/10 text-[#3E6F73] dark:text-[#76B4B9] hover:bg-[#3E6F73]/20 cursor-pointer"
                          >
                            研究
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-14 text-sm text-[#7A9194]">没有符合当前筛选条件的标的，试试放宽条件。</div>
            )}

            {/* 分页 */}
            <div className="px-4 py-3 border-t border-[#E3E7E1] dark:border-[#2A383A] flex items-center justify-between">
              <span className="text-xs text-[#7A9194]">第 {safePage} / {totalPages} 页</span>
              <div className="flex items-center gap-1">
                <button
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-[#E3E7E1] dark:border-[#2A383A] text-[#576F73] dark:text-[#9BB2B4] disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-[#E3E7E1] dark:border-[#2A383A] text-[#576F73] dark:text-[#9BB2B4] disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 候选池批量回测 */}
      <BatchBacktestPanel candidates={valueRanked} />
    </div>
  );
};
