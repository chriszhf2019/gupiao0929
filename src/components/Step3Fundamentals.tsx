import React, { useState } from 'react';
import { StockData, InstitutionalHoldingOverview } from '../types/stock';
import { ShieldCheck, CheckCircle2, AlertCircle, TrendingUp, Users2, ChevronDown, ChevronUp, Fingerprint, Activity, ShieldAlert, Database, Sparkles, RefreshCw, FileSearch, Loader2 } from 'lucide-react';
import { SemanticBadge } from './common/SemanticBadge';
import { calculateFundamentalScan } from '../utils/stockCalculator';
import { describeFundamentalRules } from '../utils/fundamentalProfile';
import { fetchStockHoldings } from '../data/holdingsData';
import { calculateBeneishAndAltman } from '../utils/institutionalForensics';
import { PiotroskiCard } from './fundamentals/PiotroskiCard';
import { request } from '../services/apiClient';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface Step3FundamentalsProps {
  stock: StockData;
}

export const Step3Fundamentals: React.FC<Step3FundamentalsProps> = ({ stock }) => {
  const f = calculateFundamentalScan(stock);
  const forensics = calculateBeneishAndAltman(stock);
  const [financialReading, setFinancialReading] = useState<any | null>(null);
  const [readingLoading, setReadingLoading] = useState(false);
  const [readingError, setReadingError] = useState<string | null>(null);
  const [holdings, setHoldings] = useState<InstitutionalHoldingOverview | null>(null);
  const [holdingsLoading, setHoldingsLoading] = useState(false);

  React.useEffect(() => {
    let active = true;
    setHoldingsLoading(true);
    fetchStockHoldings(stock.symbol)
      .then((data) => {
        if (active) setHoldings(data);
      })
      .catch(() => {
        if (active) setHoldings(null);
      })
      .finally(() => {
        if (active) setHoldingsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [stock.symbol]);

  const yoyRows = React.useMemo(() => {
    const rows = [...stock.financialHistory];
    return rows.map((row, idx) => {
      const prev = idx > 0 ? rows[idx - 1] : null;
      const yoy = (cur: number, base: number) => {
        if (!prev || !base) return '--';
        const v = ((cur - base) / Math.abs(base)) * 100;
        return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
      };
      return {
        year: row.year,
        revenue: row.revenue,
        revenueYoy: yoy(row.revenue, prev?.revenue ?? 0),
        netProfit: row.netProfit,
        netProfitYoy: yoy(row.netProfit, prev?.netProfit ?? 0),
        grossMargin: row.grossMargin,
        grossMarginDelta: prev ? `${row.grossMargin - prev.grossMargin >= 0 ? '+' : ''}${(row.grossMargin - prev.grossMargin).toFixed(1)}pct` : '--',
        roe: row.roe,
        roeDelta: prev ? `${row.roe - prev.roe >= 0 ? '+' : ''}${(row.roe - prev.roe).toFixed(1)}pct` : '--',
        freeCashFlow: row.freeCashFlow,
        freeCashFlowToEquity: row.freeCashFlowToEquity,
      };
    }).reverse();
  }, [stock.financialHistory]);

  const fetchFinancialReading = async () => {
    setReadingLoading(true);
    setReadingError(null);
    setFinancialReading(null);
    try {
      const res = await request<{ success: boolean; report?: any; error?: string }>('/api/financial-analysis', {
        method: 'POST',
        body: JSON.stringify({ symbol: stock.symbol }),
        timeoutMs: 25000,
      });
      if (res?.report) setFinancialReading(res.report);
      else setReadingError(res?.error || '解读生成失败');
    } catch (err: any) {
      setReadingError(err?.message || '解读生成失败');
    } finally {
      setReadingLoading(false);
    }
  };

  const rules = describeFundamentalRules({ ...stock, fundamentals: f });

  return (
    <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-6 shadow-xs mb-8 transition-colors">
      {/* 模块标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E3E7E1] dark:border-[#2A383A] pb-4 mb-6 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#1F3437]/10 text-[#1F3437] dark:text-[#76B4B9] border border-[#1F3437]/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                Step 3: 公司基本面财报扫描与排雷
              </h2>
              <SemanticBadge tier="fact" subText="经审计财务附注" />
            </div>
            <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] mt-0.5">
              运用 6 维度量化阈值穿透资产负债表与现金流量表，识破造假做账
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#576F73] dark:text-[#9BB2B4]">财务健康度:</span>
          <span
            className={`text-xs font-serif font-bold px-3 py-1 rounded-lg border ${
              f.grade.startsWith('A')
                ? 'bg-[#4A7C6F]/15 text-[#376156] dark:text-[#67A394] border-[#4A7C6F]/40'
                : f.grade === 'B'
                ? 'bg-[#3E6F73]/15 text-[#2B5458] dark:text-[#5B9DA2] border-[#3E6F73]/40'
                : 'bg-[#A84A3E]/15 text-[#7D3228] dark:text-[#D1766B] border-[#A84A3E]/40'
            }`}
          >
            评级 {f.grade}
          </span>
        </div>
      </div>

      {/* 核心扫描结论提示 */}
      <div className="p-4 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] mb-6 flex items-start space-x-3">
        <div className="w-2 h-2 rounded-full bg-[#3E6F73] shrink-0 mt-1.5" />
        <div>
          <div className="text-xs font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
            财报排雷结论：{stock.name} 财务综合评级为【{f.grade}】
          </div>
          <p className="text-xs mt-1 text-[#576F73] dark:text-[#9BB2B4] leading-relaxed">
            {f.grossMarginPass ? `毛利率 (${f.grossMarginValue}%) 稳固超 30% 优质商业模式线；` : `毛利率 (${f.grossMarginValue}%) 稍低或属竞争激烈工业品；`}
            {f.netMarginPass ? ` 净利率 (${f.netMarginValue}%) 变现能力突出；` : ''}
            {f.debtRatioPass ? ` 资产负债率 (${f.debtRatioValue}%) 在安全负债范围以内，偿债抗风险韧性良好。` : ` 资产负债率 (${f.debtRatioValue}%) 偏高，需密切注意现金流偿付。`}
          </p>
        </div>
      </div>

      {/* 六大排雷检验指标 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-8">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`p-3.5 rounded-xl border transition-all ${
              rule.pass
                ? 'bg-[#F6F7F5]/80 dark:bg-[#141A1B]/70 border-[#E3E7E1] dark:border-[#2A383A] hover:border-[#4A7C6F]/50'
                : 'bg-[#F8ECE9]/70 dark:bg-[#2D1D1B]/50 border-[#ECC5BE] dark:border-[#522E29]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-[#1F3437] dark:text-[#E5EBEA]">{rule.label}</span>
              {rule.pass ? (
                <span className="inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded bg-[#4A7C6F]/15 text-[#376156] dark:text-[#67A394] font-bold border border-[#4A7C6F]/30">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>达标</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded bg-[#A84A3E]/15 text-[#8C3A2F] dark:text-[#E2897E] font-medium border border-[#A84A3E]/30">
                  <AlertCircle className="w-3 h-3" />
                  <span>预警</span>
                </span>
              )}
            </div>

            <div className="text-lg font-bold font-mono text-[#1F3437] dark:text-white mb-1 tabular-nums">
              {rule.value}
            </div>

            <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] leading-tight">
              {rule.desc}
            </p>
          </div>
        ))}
      </div>

      {/* 机构级财务排雷量化取证 (Beneish M-Score & Altman Z-Score) */}
      <div className="mb-8 p-5 rounded-2xl bg-white dark:bg-[#1C2426] border border-[#CBD5E1] dark:border-[#2A383A] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3E7E1] dark:border-[#2A383A] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#3E6F73]/15 text-[#3E6F73] dark:text-[#76B4B9]">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-2">
                <span>机构级财务造假与破产穿透量化模型 (Forensic Quant Radar)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#3E6F73]/10 text-[#3E6F73] dark:text-[#76B4B9] font-mono font-bold">
                  华尔街对冲基金风控基准
                </span>
                {forensics.dataQuality === 'real' ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#4A7C6F]/10 text-[#4A7C6F] font-mono font-bold">
                    基于真实资产负债表
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#A84A3E]/10 text-[#A84A3E] font-mono font-bold">
                    数据不足
                  </span>
                )}
              </h4>
              <p className="text-xs text-[#576F73] dark:text-[#9BB2B4]">
                五变量 M-Score，TATA 用经营现金流。Z-Score 用净利润近似 EBIT、账面权益近似市值，不适用于银行。
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Beneish M-Score 卡片 */}
          <div className={`p-4 rounded-xl border ${
            forensics.isManipulationRiskHigh
              ? 'bg-[#A84A3E]/5 border-[#A84A3E]/35'
              : forensics.mScoreRating === 'gray_zone'
              ? 'bg-amber-500/5 border-amber-500/30'
              : 'bg-[#4A7C6F]/5 border-[#4A7C6F]/30'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#1F3437] dark:text-white flex items-center space-x-1.5">
                <ShieldAlert className={`w-4 h-4 ${forensics.isManipulationRiskHigh ? 'text-[#A84A3E]' : 'text-[#4A7C6F]'}`} />
                <span>Beneish M-Score 财务操纵造假指数</span>
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                forensics.isManipulationRiskHigh
                  ? 'bg-[#A84A3E]/15 text-[#A84A3E]'
                  : forensics.mScoreRating === 'gray_zone'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  : 'bg-[#4A7C6F]/15 text-[#4A7C6F]'
              }`}>
                {forensics.isManipulationRiskHigh ? '高度造假风险' : forensics.mScoreRating === 'gray_zone' ? '中性观察' : '极度安全'}
              </span>
            </div>

            <div className="flex items-baseline space-x-2 my-1">
              <span className="text-2xl font-mono font-black tabular-nums text-[#1F3437] dark:text-white">
                {forensics.dataQuality === 'real' ? forensics.mScore : '--'}
              </span>
              <span className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">
                (警戒基准线: &gt; -1.78)
              </span>
            </div>

            <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] leading-relaxed mb-2.5">
              {forensics.dataQuality === 'real' ? forensics.mScoreAnalysis : forensics.dataQualityNote}
            </p>

            <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-[#576F73] dark:text-[#9BB2B4] pt-2 border-t border-black/5 dark:border-white/5">
              <div>应收异动: <span className="font-bold text-[#1F3437] dark:text-white">{forensics.dataQuality === 'real' ? forensics.components.dsri : '--'}</span></div>
              <div>毛利变动: <span className="font-bold text-[#1F3437] dark:text-white">{forensics.dataQuality === 'real' ? forensics.components.gmi : '--'}</span></div>
              <div>应计利润比: <span className="font-bold text-[#1F3437] dark:text-white">{forensics.dataQuality === 'real' ? forensics.components.tata : '--'}</span></div>
            </div>
          </div>

          {/* Altman Z-Score 卡片 */}
          <div className={`p-4 rounded-xl border ${
            forensics.zScoreRating === 'distress'
              ? 'bg-[#A84A3E]/5 border-[#A84A3E]/35'
              : forensics.zScoreRating === 'gray'
              ? 'bg-amber-500/5 border-amber-500/30'
              : 'bg-[#4A7C6F]/5 border-[#4A7C6F]/30'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#1F3437] dark:text-white flex items-center space-x-1.5">
                <Activity className={`w-4 h-4 ${forensics.zScoreRating === 'distress' ? 'text-[#A84A3E]' : 'text-[#4A7C6F]'}`} />
                <span>Altman Z-Score 财务困境破产模型</span>
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                forensics.zScoreRating === 'distress'
                  ? 'bg-[#A84A3E]/15 text-[#A84A3E]'
                  : forensics.zScoreRating === 'gray'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  : 'bg-[#4A7C6F]/15 text-[#4A7C6F]'
              }`}>
                {forensics.zScoreRating === 'distress' ? '破产高危区' : forensics.zScoreRating === 'gray' ? '灰色带' : '绿灯安全区'}
              </span>
            </div>

            <div className="flex items-baseline space-x-2 my-1">
              <span className="text-2xl font-mono font-black tabular-nums text-[#1F3437] dark:text-white">
                {forensics.dataQuality === 'real' ? forensics.zScore : '--'}
              </span>
              <span className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">
                (安全临界线: &gt; 2.99)
              </span>
            </div>

            <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] leading-relaxed mb-2.5">
              {forensics.dataQuality === 'real' ? forensics.zScoreAnalysis : forensics.dataQualityNote}
            </p>

            <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] pt-2 border-t border-black/5 dark:border-white/5">
              考量营运资金、留存收益、息税前利润与市值杠杆五维权重，防范非预期戴维斯双杀。
            </div>
          </div>
        </div>
      </div>

      {/* Piotroski F-Score 财务质量评分（与 Beneish 排雷、Altman 破产互补） */}
      <PiotroskiCard stock={stock} />

      {/* 5 年财务趋势对比图表 */}
      <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#3E6F73]" />
              <span>近 5 年财务趋势（营业收入 / 归母净利润 / ROE）</span>
            </h3>
            <p className="text-xs text-[#576F73] dark:text-[#9BB2B4]">
              柱状图对比营收与净利润（亿元），折线反映 ROE（%）资产回报率曲线
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={stock.financialHistory} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" opacity={0.3} />
              <XAxis dataKey="year" stroke="#7A9194" fontSize={11} tickLine={false} />
              <YAxis
                yAxisId="left"
                stroke="#7A9194"
                fontSize={11}
                tickLine={false}
                label={{ value: '金额 (亿元)', angle: -90, position: 'insideLeft', fill: '#7A9194', fontSize: 10 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#3E6F73"
                fontSize={11}
                tickLine={false}
                label={{ value: 'ROE (%)', angle: 90, position: 'insideRight', fill: '#3E6F73', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F3437',
                  borderColor: '#3E6F73',
                  borderRadius: '0.75rem',
                  color: '#FFFFFF',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar yAxisId="left" dataKey="revenue" name="营业收入 (亿元)" fill="#1F3437" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="netProfit" name="归母净利润 (亿元)" fill="#4A7C6F" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="roe" name="ROE 净资产收益率 (%)" stroke="#3E6F73" strokeWidth={2.5} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 真实财报逐年数据明细表 */}
      <div className="mt-6 bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-2">
              <Database className="w-4 h-4 text-[#3E6F73]" />
              <span>逐年真实财报核心数据明细 (单位：亿元 / %)</span>
            </h3>
            <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] mt-1">
              {stock.financialSource === 'tushare' || stock.financialSource === 'eastmoney'
                ? `已接入真实财报数据${stock.financialSource === 'tushare' ? ' (Tushare Pro)' : ' (东方财富)'} · 最近报告期 ${stock.financialHistory[stock.financialHistory.length - 1]?.reportDate || 'N/A'}`
                : '当前展示内置样例财报口径；联网后将自动切换为东方财富真实财报数据'}
              。自由现金流 = 经营现金流 − 购建长期资产支付的现金；缺资本开支时显示 --。
            </p>
          </div>
          {stock.financialSource === 'tushare' || stock.financialSource === 'eastmoney' ? (
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#4A7C6F]/12 text-[#376156] dark:text-[#67A394] border border-[#4A7C6F]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4A7C6F] animate-pulse" />
              真实财报已同步
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              内置样例数据
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-[#E3E7E1] dark:border-[#2A383A] text-[#7A9194] text-[10px] uppercase font-serif">
                <th className="pb-2 pl-1">报告期</th>
                <th className="pb-2 text-right">营业收入</th>
                <th className="pb-2 text-right">归母净利润</th>
                <th className="pb-2 text-right">毛利率</th>
                <th className="pb-2 text-right">净利率</th>
                <th className="pb-2 text-right">ROE</th>
                <th className="pb-2 text-right">资产负债率</th>
                <th className="pb-2 text-right">经营现金流</th>
                <th className="pb-2 text-right">自由现金流</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E7E1]/50 dark:divide-[#2A383A]/50">
              {[...stock.financialHistory].reverse().map((row) => (
                <tr key={row.year} className="hover:bg-white/60 dark:hover:bg-[#1C2426]/60 transition-colors">
                  <td className="py-2.5 pl-1 font-mono font-bold text-[#1F3437] dark:text-[#E5EBEA]">{row.year}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-[#1F3437] dark:text-[#E5EBEA]">{row.revenue.toFixed(1)}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums font-bold text-[#3E6F73] dark:text-[#76B4B9]">{row.netProfit.toFixed(1)}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-[#576F73] dark:text-[#9BB2B4]">{row.grossMargin.toFixed(1)}%</td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-[#576F73] dark:text-[#9BB2B4]">{row.netMargin.toFixed(1)}%</td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-[#576F73] dark:text-[#9BB2B4]">{row.roe.toFixed(1)}%</td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-[#576F73] dark:text-[#9BB2B4]">{row.debtToAsset.toFixed(1)}%</td>
                  <td className={`py-2.5 text-right font-mono tabular-nums ${row.freeCashFlow < 0 ? 'text-[#A84A3E] dark:text-[#E2897E]' : 'text-[#4A7C6F] dark:text-[#67A394]'}`}>
                    {row.freeCashFlow.toFixed(1)}
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-[#576F73] dark:text-[#9BB2B4]">
                    {row.freeCashFlowToEquity == null ? '--' : row.freeCashFlowToEquity.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 同比/环比财报对比 */}
      <div className="mt-6 bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#3E6F73]" />
              <span>财报纵向对比（同比 / 环比变化）</span>
            </h3>
            <p className="text-xs text-[#576F73] dark:text-[#9BB2B4]">逐期对比营收与净利润增速、毛利率与 ROE 变动，识别增长是否被利润率侵蚀</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-[#E3E7E1] dark:border-[#2A383A] text-[#7A9194] text-[10px] uppercase font-serif">
                <th className="pb-2 pl-1">报告期</th>
                <th className="pb-2 text-right">营收 (亿)</th>
                <th className="pb-2 text-right">营收同比</th>
                <th className="pb-2 text-right">归母净利 (亿)</th>
                <th className="pb-2 text-right">净利同比</th>
                <th className="pb-2 text-right">毛利率</th>
                <th className="pb-2 text-right">毛利率环比</th>
                <th className="pb-2 text-right">ROE</th>
                <th className="pb-2 text-right">ROE 环比</th>
                <th className="pb-2 text-right">经营现金流</th>
                <th className="pb-2 text-right">自由现金流</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E7E1]/50 dark:divide-[#2A383A]/50">
              {yoyRows.map((row) => (
                <tr key={row.year} className="hover:bg-white/60 dark:hover:bg-[#1C2426]/60 transition-colors">
                  <td className="py-2.5 pl-1 font-mono font-bold text-[#1F3437] dark:text-[#E5EBEA]">{row.year}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-[#1F3437] dark:text-[#E5EBEA]">{row.revenue.toFixed(1)}</td>
                  <td className={`py-2.5 text-right font-mono tabular-nums ${row.revenueYoy === '--' ? 'text-[#7A9194]' : row.revenueYoy.startsWith('-') ? 'text-[#A84A3E]' : 'text-[#4A7C6F]'}`}>{row.revenueYoy}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums font-bold text-[#3E6F73] dark:text-[#76B4B9]">{row.netProfit.toFixed(1)}</td>
                  <td className={`py-2.5 text-right font-mono tabular-nums ${row.netProfitYoy === '--' ? 'text-[#7A9194]' : row.netProfitYoy.startsWith('-') ? 'text-[#A84A3E]' : 'text-[#4A7C6F]'}`}>{row.netProfitYoy}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-[#576F73] dark:text-[#9BB2B4]">{row.grossMargin.toFixed(1)}%</td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-[#7A9194]">{row.grossMarginDelta}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-[#576F73] dark:text-[#9BB2B4]">{row.roe.toFixed(1)}%</td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-[#7A9194]">{row.roeDelta}</td>
                  <td className={`py-2.5 text-right font-mono tabular-nums ${row.freeCashFlow < 0 ? 'text-[#A84A3E]' : 'text-[#4A7C6F]'}`}>{row.freeCashFlow.toFixed(1)}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-[#576F73]">{row.freeCashFlowToEquity == null ? '--' : row.freeCashFlowToEquity.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 财报 vs 实际情况 AI 深度解读 */}
      <div className="mt-6 bg-white dark:bg-[#1C2426] border border-[#3E6F73]/25 dark:border-[#3E6F73]/30 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#3E6F73]/12 text-[#3E6F73] dark:text-[#76B4B9] border border-[#3E6F73]/25">
              <FileSearch className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">财报 vs 实际情况 深度解读</h3>
              <p className="text-xs text-[#576F73] dark:text-[#9BB2B4]">AI 逐期阅读财报，横向印证账面利润与经营现金流，指出数字与真实经营的落差</p>
            </div>
          </div>
          <button
            onClick={fetchFinancialReading}
            disabled={readingLoading}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#1F3437] hover:bg-[#274246] text-white text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-60"
          >
            <Sparkles className={`w-3.5 h-3.5 ${readingLoading ? 'animate-pulse' : ''}`} />
            <span>{financialReading ? '重新解读' : readingLoading ? '解读中...' : '生成财报解读'}</span>
          </button>
        </div>

        {readingLoading && (
          <div className="flex items-center justify-center py-10 text-sm text-[#7A9194]">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" /> AI 正在逐期阅读 {stock.name} 的财报与现金流...
          </div>
        )}

        {readingError && !readingLoading && (
          <div className="text-sm text-[#A84A3E] py-4">{readingError}</div>
        )}

        {financialReading && !readingLoading && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] text-xs text-[#1F3437] dark:text-[#E5EBEA] leading-relaxed">
              <div className="font-bold mb-1">总体判断</div>
              {financialReading.summary}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[#4A7C6F]/5 border border-[#4A7C6F]/20">
                <div className="text-xs font-bold text-[#376156] dark:text-[#67A394] mb-2">积极信号</div>
                <ul className="space-y-1.5">
                  {(financialReading.highlights || []).map((h: string, i: number) => (
                    <li key={i} className="text-xs text-[#576F73] dark:text-[#9BB2B4] flex items-start space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#4A7C6F] shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-[#A84A3E]/5 border border-[#A84A3E]/20">
                <div className="text-xs font-bold text-[#7D3228] dark:text-[#E2897E] mb-2">需要警惕</div>
                <ul className="space-y-1.5">
                  {(financialReading.concerns || []).map((c: string, i: number) => (
                    <li key={i} className="text-xs text-[#576F73] dark:text-[#9BB2B4] flex items-start space-x-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-[#A84A3E] shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#3E6F73]/5 border border-[#3E6F73]/20">
              <div className="text-xs font-bold text-[#2B5458] dark:text-[#76B4B9] mb-1">财报 vs 实际经营</div>
              <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] leading-relaxed">{financialReading.realityGap}</p>
            </div>

            <div className="p-3 rounded-lg bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A]">
              <div className="text-xs font-bold text-[#1F3437] dark:text-[#E5EBEA] mb-1">结论</div>
              <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] leading-relaxed">{financialReading.conclusion}</p>
            </div>
          </div>
        )}
      </div>

      {/* 核心股东与主力机构持仓透视 */}
      <div className="mt-6 bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-2">
              <Users2 className="w-4 h-4 text-[#3E6F73]" />
              <span>前十大流通股东与机构筹码透视 ({stock.name})</span>
            </h3>
            <p className="text-xs text-[#576F73] dark:text-[#9BB2B4]">
              数据来源：
              {holdings?.source === 'eastmoney' ? (
                <span className="font-semibold text-[#4A7C6F]">东方财富 F10 真实披露</span>
              ) : holdings?.source === 'preset-snapshot' ? (
                <span className="font-semibold text-[#B0803C]">内置历史披露快照（非实时）</span>
              ) : (
                <span className="font-semibold text-[#A84A3E]">暂无真实股东披露数据</span>
              )}
              <span className="mx-1.5">·</span>
              前十大集中度: <strong className="text-[#3E6F73] dark:text-[#76B4B9] font-mono">{holdings ? `${holdings.top10ConcentrationPercent}%` : '--'}</strong>
              <span className="mx-1.5">·</span>
              机构持股总数: <span className="font-mono">{holdings && holdings.totalInstitutionsCount > 0 ? `${holdings.totalInstitutionsCount}家` : '--'}</span>
              <span className="mx-1.5">·</span>
              陆股通外资: <span className="font-mono">{holdings ? `${holdings.northboundHoldingPercent}%` : '--'}</span>
            </p>
          </div>
          <div className="flex items-center space-x-2 text-[11px]">
            {holdings?.nationalTeamPresent && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#4A7C6F]/15 text-[#4A7C6F] border border-[#4A7C6F]/30">
                汇金/证金在场
              </span>
            )}
            {holdings?.socialSecurityPresent && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3E6F73]/15 text-[#3E6F73] border border-[#3E6F73]/30">
                社保基金重仓
              </span>
            )}
          </div>
        </div>

        {holdingsLoading ? (
          <div className="flex items-center justify-center py-8 text-[#576F73] dark:text-[#9BB2B4] text-xs space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>正在拉取前十大股东披露数据...</span>
          </div>
        ) : holdings && holdings.shareholders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E3E7E1] dark:border-[#2A383A] text-[#7A9194] text-[10px] uppercase font-serif">
                  <th className="pb-2 pl-1">排名</th>
                  <th className="pb-2">前十大流通股东名称</th>
                  <th className="pb-2">股东性质</th>
                  <th className="pb-2 text-right">持股数量</th>
                  <th className="pb-2 text-right">持股比例</th>
                  <th className="pb-2 text-center">变动</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E7E1]/50 dark:divide-[#2A383A]/50">
                {holdings.shareholders.slice(0, 7).map((s) => (
                  <tr key={s.rank} className="hover:bg-white/60 dark:hover:bg-[#1C2426]/60 transition-colors">
                    <td className="py-2.5 pl-1 font-mono text-[#7A9194]">{s.rank}</td>
                    <td className="py-2.5 font-bold text-[#1F3437] dark:text-[#E5EBEA] max-w-[260px]">
                      {s.name}
                    </td>
                    <td className="py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-white dark:bg-[#1C2426] text-[#576F73] dark:text-[#9BB2B4] border border-[#E3E7E1] dark:border-[#2A383A]">
                        {s.shareholderType}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-[#1F3437] dark:text-[#E5EBEA]">
                      {s.holdingShares}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-[#3E6F73] dark:text-[#76B4B9]">
                      {s.holdingPercent}%
                    </td>
                    <td className="py-2.5 text-center">
                      {s.changeStatus === 'increase' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-[#4A7C6F] bg-[#4A7C6F]/10">
                          {s.changeShares || '增持'}
                        </span>
                      )}
                      {s.changeStatus === 'decrease' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-[#A84A3E] bg-[#A84A3E]/10">
                          {s.changeShares || '减持'}
                        </span>
                      )}
                      {s.changeStatus === 'new' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-[#3E6F73] bg-[#3E6F73]/15">
                          新进
                        </span>
                      )}
                      {s.changeStatus === 'unchanged' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[#7A9194]">
                          未变
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[#576F73] dark:text-[#9BB2B4] border border-dashed border-[#E3E7E1] dark:border-[#2A383A] rounded-xl">
            当前标的暂无前十大股东披露数据（该代码可能为港股/美股或数据源暂未覆盖）。数据接口仅支持 6 位 A 股代码。
          </div>
        )}
      </div>
    </div>
  );
};
