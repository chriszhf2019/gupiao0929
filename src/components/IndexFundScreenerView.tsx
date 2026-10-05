import React, { useState, useEffect, useMemo } from 'react';
import {
  IndexFundItem,
  TargetIndexType,
  CostSimulationResult,
  AssetAllocationRecommendation,
} from '../types/indexFund';
import {
  getIndexFunds,
  getCostComparison,
  getAssetAllocationProfiles,
  getAIDiagnosis,
  getFundRealInfo,
  AIDiagnosisResult,
} from '../services/indexFundService';
import { INDEX_FUND_SNAPSHOT_DATE, PRESET_INDEX_FUNDS } from '../data/indexFundData';
import {
  Search,
  Filter,
  ShieldCheck,
  Percent,
  Clock,
  Coins,
  Scale,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  Info,
  Layers,
  Code2,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  PieChart as PieChartIcon,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';

interface IndexFundScreenerProps {
  onSelectFundCode?: (code: string) => void;
}

async function mapWithLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

export function IndexFundScreenerView({ onSelectFundCode }: IndexFundScreenerProps) {
  // 1. 筛选状态
  const [selectedIndex, setSelectedIndex] = useState<string>('all');
  const [quotaOnly, setQuotaOnly] = useState<boolean>(true); // 规则1: 额度优先
  const [maxTrackingError, setMaxTrackingError] = useState<number>(2.0); // 规则2: 跟踪误差<=2%
  const [minAssets, setMinAssets] = useState<number>(1.0); // 规则4: 规模>=1亿
  const [holdingDays, setHoldingDays] = useState<number>(365); // 规则5: A/C选择
  const [investmentAmount, setInvestmentAmount] = useState<number>(50000); // 测算金额 (元)
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // 2. 数据与加载状态
  const [funds, setFunds] = useState<IndexFundItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const hasLoadedFunds = React.useRef(false);
  const [selectedFundForDetail, setSelectedFundForDetail] = useState<IndexFundItem | null>(null);

  // 3. 实时基金名称/费率校正（来自天天基金，用于发现静态数据的错误映射）
  const [realFundMap, setRealFundMap] = useState<Record<string, { name: string; subscriptionFeeRate: number }>>({});

  useEffect(() => {
    let active = true;
    const codes = PRESET_INDEX_FUNDS.map((f) => f.code).filter((c) => /^\d{6}$/.test(c));
    mapWithLimit(codes, 4, (c) => getFundRealInfo(c))
      .then((results) => {
        if (!active) return;
        const map: Record<string, { name: string; subscriptionFeeRate: number }> = {};
        results.forEach((r) => {
          if (r) map[r.code] = { name: r.name, subscriptionFeeRate: r.subscriptionFeeRate };
        });
        setRealFundMap(map);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // 3. 进阶子标签页
  const [activeSubTab, setActiveSubTab] = useState<'screener' | 'crossover' | 'allocation' | 'rules' | 'code'>('screener');

  // 4. 资产配置预设
  const [allocationProfiles, setAllocationProfiles] = useState<AssetAllocationRecommendation[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<'aggressive' | 'balanced' | 'conservative'>('balanced');

  // 5. AI 指数研报状态
  const [aiDiagnosis, setAiDiagnosis] = useState<AIDiagnosisResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // 6. 代码复制反馈
  const [hasCopiedCode, setHasCopiedCode] = useState<boolean>(false);

  // 加载基金列表
  const loadFunds = async () => {
    if (!hasLoadedFunds.current) setIsLoading(true);
    try {
      const res = await getIndexFunds({
        targetIndex: selectedIndex,
        minAssets,
        maxTrackingError,
        holdingDays,
        quotaOnly,
        investmentAmount,
      });
      setFunds(res.funds);
      hasLoadedFunds.current = true;
      if (res.funds.length > 0 && !selectedFundForDetail) {
        setSelectedFundForDetail(res.funds[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFunds();
  }, [selectedIndex, quotaOnly, maxTrackingError, minAssets, holdingDays, investmentAmount]);

  useEffect(() => {
    getAssetAllocationProfiles().then(setAllocationProfiles);
  }, []);

  // 触发 AI 研报诊断
  const handleGenerateAIDiagnosis = async () => {
    setIsAiLoading(true);
    try {
      const holdingYears = Math.max(1, Math.round(holdingDays / 365));
      const res = await getAIDiagnosis(
        selectedIndex === 'all' ? '纳指100与标普500' : selectedIndex,
        holdingYears,
        selectedProfile
      );
      setAiDiagnosis(res);
    } finally {
      setIsAiLoading(false);
    }
  };

  // 快捷调整持有天数预设
  const holdingPresets = [
    { label: '30天 (超短波段)', days: 30 },
    { label: '90天 (季度趋势)', days: 90 },
    { label: '180天 (半年分界)', days: 180 },
    { label: '1年 (经典持有)', days: 365 },
    { label: '2年 (中长期复利)', days: 730 },
    { label: '3年+ (跨周期底仓)', days: 1095 },
  ];

  // 过滤搜索关键字
  const displayedFunds = useMemo(() => {
    if (!searchKeyword.trim()) return funds;
    const kw = searchKeyword.toLowerCase();
    return funds.filter(
      (f) =>
        f.name.toLowerCase().includes(kw) ||
        f.code.toLowerCase().includes(kw) ||
        f.fundCompany.toLowerCase().includes(kw) ||
        f.targetIndexZh.toLowerCase().includes(kw)
    );
  }, [funds, searchKeyword]);

  // A/C 份额平衡临界点精准测算数据
  const activeFundForCalc = selectedFundForDetail || displayedFunds[0] || null;
  const costSim = useMemo(() => {
    if (!activeFundForCalc) return null;
    const holdingYears = holdingDays / 365.0;
    const subFee = investmentAmount * (activeFundForCalc.discountedSubscriptionFee / 100);
    const holdFeeA = investmentAmount * ((activeFundForCalc.managementFee + activeFundForCalc.custodyFee) / 100) * holdingYears;
    const costA = Math.round((subFee + holdFeeA) * 100) / 100;

    const salesFee = activeFundForCalc.salesServiceFee > 0 ? activeFundForCalc.salesServiceFee : 0.25;
    const holdFeeC = investmentAmount * ((activeFundForCalc.managementFee + activeFundForCalc.custodyFee + salesFee) / 100) * holdingYears;
    const costC = Math.round(holdFeeC * 100) / 100;

    const crossoverDays = Math.round((activeFundForCalc.discountedSubscriptionFee / salesFee) * 365);
    const diff = Math.abs(Math.round((costA - costC) * 100) / 100);
    const recClass = costA <= costC ? 'A类' : 'C类';

    return {
      costA,
      costC,
      crossoverDays,
      diff,
      recClass,
      salesFee,
      subFee,
    };
  }, [activeFundForCalc, holdingDays, investmentAmount]);

  // Python 筛选代码示例内容
  const pythonScriptExample = `# -*- coding: utf-8 -*-
"""
机构级指数基金四步筛选法量化脚本
1. 额度优先 (QDII额度检测)
2. 跟踪误差 <= 2.0%
3. 规模 >= 1.0 亿元 (剔除迷你基金清盘风险)
4. 持有成本最小化 (管理费+托管费+销售服务费升序)
5. A/C类份额自动匹配推荐
"""

import pandas as pd
# 可选真实数据源: akshare (国内QDII与ETF) 或 yfinance (美股原生ETF)
# import akshare as ak

def screen_index_funds(
    index_name: str = 'Nasdaq 100',
    holding_days: int = 365,
    min_assets_yi: float = 1.0,
    max_tracking_error: float = 2.0,
    quota_only: bool = True
) -> pd.DataFrame:
    """
    根据四步优选法执行指数基金筛选
    """
    # 模拟从 akshare 获取的底层基金宽表 (实际可通过 ak.fund_etf_spot_em() 获取)
    sample_funds = [
        {"code": "000834", "name": "大成纳斯达克100ETF联接A", "index": "Nasdaq 100", "size": 148.6, "te": 0.82, "fee_hold": 0.65, "sub_fee": 0.12, "sales_fee": 0.0, "quota": "限额1000元"},
        {"code": "006479", "name": "广发纳斯达克100ETF联接C", "index": "Nasdaq 100", "size": 92.4, "te": 0.84, "fee_hold": 0.90, "sub_fee": 0.0, "sales_fee": 0.25, "quota": "限额1000元"},
        {"code": "513100", "name": "国泰纳斯达克100ETF(场内)", "index": "Nasdaq 100", "size": 125.8, "te": 0.65, "fee_hold": 0.65, "sub_fee": 0.03, "sales_fee": 0.0, "quota": "开放交易"},
        {"code": "161130", "name": "易方达纳斯达克100LOF", "index": "Nasdaq 100", "size": 68.3, "te": 1.15, "fee_hold": 0.80, "sub_fee": 0.12, "sales_fee": 0.0, "quota": "暂停申购"},
{"code": "161125", "name": "易方达标普500指数A", "index": "S&P 500", "size": 110.5, "te": 0.62, "fee_hold": 0.65, "sub_fee": 0.12, "sales_fee": 0.0, "quota": "限额500元"},
        {"code": "050025", "name": "博时标普500ETF联接A", "index": "S&P 500", "size": 142.1, "te": 0.68, "fee_hold": 0.80, "sub_fee": 0.12, "sales_fee": 0.0, "quota": "限额2000元"},
    ]
    df = pd.DataFrame(sample_funds)
    
    # 步骤 1: 指数匹配
    df = df[df['index'] == index_name]
    
    # 步骤 2: 额度优先 (剔除暂停申购标的)
    if quota_only:
        df = df[df['quota'] != '暂停申购']
        
    # 步骤 3: 跟踪误差 <= 2.0%
    df = df[df['te'] <= max_tracking_error]
    
    # 步骤 4: 基金规模 >= 1.0 亿元
    df = df[df['size'] >= min_assets_yi]
    
    # 步骤 5: 推荐 A/C 类份额
    # 盈亏平衡临界点: 申购费率 / 销售服务费率 * 365天
    def recommend_share_class(row):
        if '场内' in row['name']:
            return '场内ETF'
        # 持有期天数 >= 180天 或 1年推荐 A类
        return 'A类份额' if holding_days >= 180 else 'C类份额'
        
    df['推荐份额'] = df.apply(recommend_share_class, axis=1)
    
    # 规则: 按持有成本升序排序
    return df.sort_values('fee_hold', ascending=True)

# 执行筛选测试: 筛选纳指100，预计持有1年(365天)
if __name__ == '__main__':
    result = screen_index_funds('Nasdaq 100', holding_days=365)
    print("=== 纳指100 四步筛选法优选结果 ===")
    print(result[['code', 'name', 'size', 'te', 'fee_hold', 'quota', '推荐份额']])
`;

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(pythonScriptExample);
    setHasCopiedCode(true);
    setTimeout(() => setHasCopiedCode(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 顶部主标题横幅与核心四步法则徽标 */}
      <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-[#1F3437] text-white">
                <Scale className="w-5 h-5 text-[#76B4B9]" />
              </div>
              <h2 className="text-xl font-bold font-serif text-[#1F3437] dark:text-[#E5EBEA]">
                指数优选工作台 · 核心四步筛选法
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#4A7C6F]/10 text-[#4A7C6F] border border-[#4A7C6F]/30">
                QDII & 宽基严选
              </span>
            </div>
            <p className="mt-1 text-xs text-[#576F73] dark:text-[#9BB2B4] max-w-3xl leading-relaxed">
              聚焦纳斯达克100、标普500与中国核心宽基：通过「额度优先检测 → 跟踪误差≤2% → 持有成本最低化 → 规模≥1亿排雷 → A/C份额持有期限智能推荐」，构建抗摩擦成本的全球资产底仓。
            </p>
            <div className="mt-2 inline-flex items-start space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#B0803C]/10 border border-[#B0803C]/30 text-[11px] text-[#8A6226] dark:text-[#D9B77C]">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>基金池为静态快照数据（截至 {INDEX_FUND_SNAPSHOT_DATE}），非实时行情；费率/规模/限额/收益率请以基金公司官方披露为准。</span>
            </div>
          </div>

          {/* AI 诊断一键调用与子导航切换 */}
          <div className="flex items-center space-x-2.5 flex-wrap">
            <button
              onClick={handleGenerateAIDiagnosis}
              disabled={isAiLoading}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#1F3437] hover:bg-[#284347] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer border border-[#3E6F73]/40 disabled:opacity-60"
            >
              <Sparkles className={`w-3.5 h-3.5 text-[#76B4B9] ${isAiLoading ? 'animate-spin' : ''}`} />
              <span>{isAiLoading ? 'AI 正在推演...' : 'AI 指数配置研判'}</span>
            </button>
          </div>
        </div>

        {/* 四步法则逻辑流程指示器 (视觉化流程卡) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mt-5 pt-4 border-t border-[#E3E7E1] dark:border-[#2A383A]">
          <div className="p-3 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] flex items-start space-x-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#3E6F73] text-white text-xs font-bold flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <div className="text-xs font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-1">
                <span>额度优先</span>
                <ShieldCheck className="w-3 h-3 text-[#4A7C6F]" />
              </div>
              <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mt-0.5">
                检测QDII申购额度与限额，剔除暂停申购盲区
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] flex items-start space-x-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#3E6F73] text-white text-xs font-bold flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <div className="text-xs font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-1">
                <span>跟踪误差</span>
                <Percent className="w-3 h-3 text-[#3E6F73]" />
              </div>
              <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mt-0.5">
                硬性指标 $\le 2.0\%$，确保真实复刻指数 Beta
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] flex items-start space-x-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#3E6F73] text-white text-xs font-bold flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <div className="text-xs font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-1">
                <span>持有成本最低</span>
                <Coins className="w-3 h-3 text-amber-500" />
              </div>
              <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mt-0.5">
                管理费+托管费+销售服务费升序，拒绝费率蚕食
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] flex items-start space-x-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#3E6F73] text-white text-xs font-bold flex items-center justify-center shrink-0">
              4
            </div>
            <div>
              <div className="text-xs font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-1">
                <span>规模 $\ge 1$ 亿元</span>
                <Layers className="w-3 h-3 text-[#3E6F73]" />
              </div>
              <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mt-0.5">
                剔除迷你微盘基金，防范清盘与高赎回挤兑
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] flex items-start space-x-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#1F3437] text-white text-xs font-bold flex items-center justify-center shrink-0">
              5
            </div>
            <div>
              <div className="text-xs font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-1">
                <span>A/C类期限匹配</span>
                <Clock className="w-3 h-3 text-[#4A7C6F]" />
              </div>
              <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mt-0.5">
                持有 $\ge 1$ 年推荐A类买断，短线推荐C类零申购
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI 研报建议抽屉展示（若已生成） */}
      {aiDiagnosis && (
        <div className="p-4 rounded-2xl bg-[#EAF3F4] dark:bg-[#1C2729] border border-[#B7D9DC] dark:border-[#2A4447] text-[#1F3437] dark:text-[#E5EBEA] shadow-xs animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-[#CBD9DB] dark:border-[#2F474A]">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#3E6F73] dark:text-[#76B4B9]" />
              <span className="font-serif font-bold text-sm">AI 机构级指数宏观与四步筛选诊断</span>
            </div>
            <button
              onClick={() => setAiDiagnosis(null)}
              className="text-xs text-[#576F73] dark:text-[#9BB2B4] hover:text-[#1F3437] cursor-pointer"
            >
              收起
            </button>
          </div>
          <p className="text-xs text-[#2A5A5E] dark:text-[#A8C4C7] mt-2 leading-relaxed">
            {aiDiagnosis.executiveSummary}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
            {aiDiagnosis.keyTakeaways.map((tip, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-xs bg-white/70 dark:bg-[#141A1B]/70 p-2 rounded-xl border border-[#CBD9DB]/50 dark:border-[#2F474A]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4A7C6F] shrink-0 mt-0.5" />
                <span className="text-[#1F3437] dark:text-[#E5EBEA]">{tip}</span>
              </div>
            ))}
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#CBD9DB]/40 text-[11px] text-[#576F73] dark:text-[#9BB2B4] flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-[#3E6F73]" />
            <span>{aiDiagnosis.crossoverAnalysis}</span>
          </div>
        </div>
      )}

      {/* 二级导航标签：主筛选工作台 / A与C类盈亏平衡点测算 / 全球大类资产配置 / QDII与交易规则 / Python量化代码 */}
      <div className="flex items-center space-x-2 border-b border-[#E3E7E1] dark:border-[#2A383A] pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveSubTab('screener')}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
            activeSubTab === 'screener'
              ? 'bg-[#1F3437] text-white shadow-xs'
              : 'text-[#576F73] dark:text-[#9BB2B4] hover:bg-white dark:hover:bg-[#1C2426]'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>四步优选列表 ({displayedFunds.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('crossover')}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
            activeSubTab === 'crossover'
              ? 'bg-[#1F3437] text-white shadow-xs'
              : 'text-[#576F73] dark:text-[#9BB2B4] hover:bg-white dark:hover:bg-[#1C2426]'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-[#4A7C6F]" />
          <span>A/C类持有成本平衡测算器</span>
        </button>

        <button
          onClick={() => setActiveSubTab('allocation')}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
            activeSubTab === 'allocation'
              ? 'bg-[#1F3437] text-white shadow-xs'
              : 'text-[#576F73] dark:text-[#9BB2B4] hover:bg-white dark:hover:bg-[#1C2426]'
          }`}
        >
          <PieChartIcon className="w-3.5 h-3.5 text-[#3E6F73]" />
          <span>大类资产配置建议 (美股+A股+美债)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('rules')}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
            activeSubTab === 'rules'
              ? 'bg-[#1F3437] text-white shadow-xs'
              : 'text-[#576F73] dark:text-[#9BB2B4] hover:bg-white dark:hover:bg-[#1C2426]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>QDII交易规则与溢价避坑</span>
        </button>

        <button
          onClick={() => setActiveSubTab('code')}
          className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
            activeSubTab === 'code'
              ? 'bg-[#1F3437] text-white shadow-xs'
              : 'text-[#576F73] dark:text-[#9BB2B4] hover:bg-white dark:hover:bg-[#1C2426]'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Python 量化筛选实现</span>
        </button>
      </div>

      {/* ===== 视图 1: 主四步筛选工作台 ===== */}
      {activeSubTab === 'screener' && (
        <div className="space-y-4">
          {/* 筛选控制器面板 */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] shadow-xs space-y-4">
            
            {/* 行 1: 指数标的选择 + 搜索框 */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
                <span className="text-xs font-semibold text-[#576F73] dark:text-[#9BB2B4] mr-1">标的指数:</span>
                {[
                  { id: 'all', label: '全部核心指数' },
                  { id: 'Nasdaq 100', label: '纳指100 (科技)' },
                  { id: 'S&P 500', label: '标普500 (宽基)' },
                  { id: 'CSI 300', label: '沪深300 (A股核心)' },
                  { id: 'Hang Seng Tech', label: '恒生科技 (港股)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedIndex(item.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      selectedIndex === item.id
                        ? 'bg-[#1F3437] text-white'
                        : 'bg-[#F6F7F5] dark:bg-[#141A1B] text-[#576F73] dark:text-[#9BB2B4] hover:bg-[#ECEFEA] dark:hover:bg-[#253235]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* 搜索代码或名称 */}
              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#576F73]" />
                <input
                  type="text"
                  placeholder="搜索基金代码 / 名称 / 公司..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl text-[#1F3437] dark:text-[#E5EBEA] placeholder-[#7A9194] focus:outline-none focus:border-[#3E6F73]"
                />
              </div>
            </div>

            {/* 行 2: 四步规则过滤开关与滑块 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[#E3E7E1] dark:border-[#2A383A]">
              
              {/* 条件 1: 额度优先 */}
              <div className="p-3 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-1">
                    <span>规则 1: 额度优先</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#4A7C6F]" />
                  </div>
                  <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">仅显示有额度基金</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quotaOnly}
                    onChange={(e) => setQuotaOnly(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4A7C6F]"></div>
                </label>
              </div>

              {/* 条件 2: 跟踪误差门槛 */}
              <div className="p-3 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1F3437] dark:text-[#E5EBEA]">规则 2: 跟踪误差上限</span>
                  <span className="font-mono font-bold text-[#3E6F73] dark:text-[#76B4B9]">&le; {maxTrackingError}%</span>
                </div>
                <div className="flex items-center space-x-1.5 mt-2">
                  {[1.0, 1.5, 2.0, 2.5].map((val) => (
                    <button
                      key={val}
                      onClick={() => setMaxTrackingError(val)}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                        maxTrackingError === val
                          ? 'bg-[#1F3437] text-white'
                          : 'bg-white dark:bg-[#1C2426] text-[#576F73] hover:bg-gray-200 dark:hover:bg-gray-800'
                      }`}
                    >
                      &le;{val}%
                    </button>
                  ))}
                </div>
              </div>

              {/* 条件 3: 基金规模门槛 */}
              <div className="p-3 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1F3437] dark:text-[#E5EBEA]">规则 4: 基金规模门槛</span>
                  <span className="font-mono font-bold text-[#3E6F73] dark:text-[#76B4B9]">&ge; {minAssets} 亿元</span>
                </div>
                <div className="flex items-center space-x-1.5 mt-2">
                  {[0.5, 1.0, 5.0, 10.0].map((val) => (
                    <button
                      key={val}
                      onClick={() => setMinAssets(val)}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                        minAssets === val
                          ? 'bg-[#1F3437] text-white'
                          : 'bg-white dark:bg-[#1C2426] text-[#576F73] hover:bg-gray-200 dark:hover:bg-gray-800'
                      }`}
                    >
                      &ge;{val}亿
                    </button>
                  ))}
                </div>
              </div>

              {/* 条件 4: 预计持有期限 (A/C份额推荐) */}
              <div className="p-3 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1F3437] dark:text-[#E5EBEA]">规则 5: 预计持有期限</span>
                  <span className="font-mono font-bold text-[#4A7C6F]">
                    {holdingDays >= 365 ? `${Math.round((holdingDays / 365) * 10) / 10}年` : `${holdingDays}天`}
                    <span className="ml-1 text-[10px] px-1 py-0.2 rounded bg-[#4A7C6F]/10">
                      {holdingDays >= 180 ? '推荐A类' : '推荐C类'}
                    </span>
                  </span>
                </div>
                <select
                  value={holdingDays}
                  onChange={(e) => setHoldingDays(Number(e.target.value))}
                  className="w-full mt-2 px-2 py-1 text-xs bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-lg text-[#1F3437] dark:text-[#E5EBEA] focus:outline-none"
                >
                  {holdingPresets.map((p) => (
                    <option key={p.days} value={p.days}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* 筛选结果列表统计栏 */}
          <div className="flex items-center justify-between text-xs text-[#576F73] dark:text-[#9BB2B4] px-1">
            <div className="flex items-center space-x-2">
              <span>共筛选出 <strong className="text-[#1F3437] dark:text-[#E5EBEA] font-mono">{displayedFunds.length}</strong> 只达标指数标的</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1F3437]/5 dark:bg-white/5 border border-[#E3E7E1] dark:border-[#2A383A]">
                默认按综合年持有成本 (费率) 升序排列
              </span>
            </div>
            <span className="text-[11px] text-[#7A9194]">
              测算基准金额: ¥{investmentAmount.toLocaleString()} 元
            </span>
          </div>

          {/* 基金卡片与明细矩阵 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {displayedFunds.map((fund) => {
              const isSelected = selectedFundForDetail?.code === fund.code;
              const isACClassRecommended = holdingDays >= 180 ? 'A类' : 'C类';

              return (
                <div
                  key={fund.code}
                  onClick={() => setSelectedFundForDetail(fund)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-[#1C2426] hover:shadow-md ${
                    isSelected
                      ? 'border-[#3E6F73] ring-1 ring-[#3E6F73] dark:border-[#76B4B9]'
                      : 'border-[#E3E7E1] dark:border-[#2A383A]'
                  }`}
                >
                  {/* 头部：代码、名称、份额类型与综合得分 */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#1F3437] text-white">
                          {fund.code}
                        </span>
                        <span className="text-[11px] font-semibold text-[#3E6F73] dark:text-[#76B4B9]">
                          {fund.targetIndexZh}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold font-serif text-[#1F3437] dark:text-[#E5EBEA] mt-1 line-clamp-1" title={fund.name}>
                        {fund.name}
                      </h3>
                      {realFundMap[fund.code] && realFundMap[fund.code].name !== fund.name && (
                        <div className="mt-1 text-[10px] text-[#8A6226] dark:text-[#D9B77C] bg-[#B0803C]/10 border border-[#B0803C]/30 rounded px-1.5 py-0.5 inline-block">
                          实时名称：{realFundMap[fund.code].name}
                        </div>
                      )}
                      <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">
                        {fund.fundCompany} · {fund.shareType}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4]">四步严选得分</div>
                      <span className="font-mono font-black text-base text-[#4A7C6F]">
                        {fund.score}
                      </span>
                    </div>
                  </div>

                  {/* 四步核心指标标签条 */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#E3E7E1] dark:border-[#2A383A] text-xs">
                    
                    {/* 1. 额度状态 */}
                    <div className="p-2 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B]">
                      <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] flex items-center space-x-1">
                        <ShieldCheck className="w-3 h-3 text-[#4A7C6F]" />
                        <span>额度状态</span>
                      </div>
                      <div className="font-semibold text-[11px] mt-0.5 truncate">
                        {fund.quotaStatus === 'unlimited' ? (
                          <span className="text-[#4A7C6F] font-bold">🟢 额度充足开放</span>
                        ) : fund.quotaStatus === 'daily_limit' ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">
                            🟡 限额 ¥{fund.dailyLimitAmount}/日
                          </span>
                        ) : (
                          <span className="text-[#A84A3E] font-bold">🔴 暂停申购</span>
                        )}
                      </div>
                    </div>

                    {/* 2. 跟踪误差 */}
                    <div className="p-2 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B]">
                      <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] flex items-center space-x-1">
                        <Percent className="w-3 h-3 text-[#3E6F73]" />
                        <span>年化跟踪误差</span>
                      </div>
                      <div className="font-mono font-bold text-[12px] text-[#1F3437] dark:text-[#E5EBEA] mt-0.5">
                        {fund.trackingError}%
                        <span className="text-[10px] font-normal text-[#4A7C6F] ml-1">
                          {fund.trackingError <= 1.0 ? '(极优)' : '(达标)'}
                        </span>
                      </div>
                    </div>

                    {/* 3. 持有成本 */}
                    <div className="p-2 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B]">
                      <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] flex items-center space-x-1">
                        <Coins className="w-3 h-3 text-amber-500" />
                        <span>年持有总成本</span>
                      </div>
                      <div className="font-mono font-bold text-[12px] text-[#1F3437] dark:text-[#E5EBEA] mt-0.5">
                        {fund.totalExpenseRatio}%/年
                      </div>
                    </div>

                    {/* 4. 基金规模 */}
                    <div className="p-2 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B]">
                      <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] flex items-center space-x-1">
                        <Layers className="w-3 h-3 text-[#3E6F73]" />
                        <span>基金资产规模</span>
                      </div>
                      <div className="font-mono font-bold text-[12px] text-[#1F3437] dark:text-[#E5EBEA] mt-0.5">
                        {fund.fundSize} 亿元
                      </div>
                    </div>

                  </div>

                  {/* 推荐份额与预计持有成本小结 */}
                  <div className="mt-3 p-2.5 rounded-xl bg-[#EAF3F4] dark:bg-[#182628] border border-[#B7D9DC]/60 dark:border-[#274044] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-[#576F73] dark:text-[#9BB2B4]">
                        持有 {holdingDays} 天份额推荐
                      </span>
                      <div className="font-bold text-[#1F3437] dark:text-[#76B4B9] flex items-center space-x-1">
                        <span>{isACClassRecommended}</span>
                        <span className="text-[10px] font-normal text-[#576F73] dark:text-[#9BB2B4]">
                          (费率更具性价比)
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-[10px] text-[#576F73] dark:text-[#9BB2B4]">近1年收益</span>
                      <div className={`font-bold text-xs ${fund.recentReturn1Y >= 0 ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'}`}>
                        {fund.recentReturn1Y >= 0 ? '+' : ''}{fund.recentReturn1Y}%
                      </div>
                    </div>
                  </div>

                  {/* 额度详情提示 */}
                  <p className="mt-2 text-[11px] text-[#576F73] dark:text-[#9BB2B4] line-clamp-1">
                    ℹ️ {fund.quotaRemark}
                  </p>
                </div>
              );
            })}
          </div>

          {displayedFunds.length === 0 && (
            <div className="p-8 text-center bg-white dark:bg-[#1C2426] rounded-2xl border border-[#E3E7E1] dark:border-[#2A383A]">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-[#1F3437] dark:text-[#E5EBEA]">未找到符合当前严苛条件的指数基金</h4>
              <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] mt-1">
                建议放宽「跟踪误差」门槛或关闭「仅看有额度」选项查看全部标的。
              </p>
              <button
                onClick={() => {
                  setQuotaOnly(false);
                  setMaxTrackingError(2.5);
                  setMinAssets(0.5);
                }}
                className="mt-3 px-3 py-1.5 rounded-xl bg-[#1F3437] text-white text-xs font-semibold cursor-pointer"
              >
                重置为宽松筛选参数
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== 视图 2: A/C 类持有成本盈亏平衡测算器 ===== */}
      {activeSubTab === 'crossover' && activeFundForCalc && costSim && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-[#E3E7E1] dark:border-[#2A383A]">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#1F3437] text-white">
                  {activeFundForCalc.code}
                </span>
                <h3 className="text-base font-bold font-serif text-[#1F3437] dark:text-[#E5EBEA]">
                  【{activeFundForCalc.name}】A类 vs C类 持有成本动态交叉平衡点测算
                </h3>
              </div>
              <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] mt-1">
                根据「一次性申购费」与「持续年化销售服务费」的数学收敛模型，自动计算临界平衡天数。
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#576F73] dark:text-[#9BB2B4]">测算金额:</span>
              <input
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(Math.max(1000, Number(e.target.value)))}
                className="w-28 px-2.5 py-1 text-xs font-mono font-bold bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl text-[#1F3437] dark:text-[#E5EBEA]"
              />
              <span className="text-xs text-[#576F73]">元</span>
            </div>
          </div>

          {/* 持有天数交互滑块 */}
          <div className="p-4 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                预计持有时长调节: <strong className="font-mono text-[#3E6F73] dark:text-[#76B4B9] text-sm">{holdingDays} 天</strong> ({Math.round((holdingDays / 365) * 10) / 10} 年)
              </span>
              <span className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">
                临界平衡点 (Crossover Point): 约 <strong className="text-amber-600 font-mono">{costSim.crossoverDays} 天</strong>
              </span>
            </div>

            <input
              type="range"
              min="7"
              max="1095"
              step="7"
              value={holdingDays}
              onChange={(e) => setHoldingDays(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#3E6F73]"
            />

            <div className="flex justify-between text-[10px] text-[#7A9194] font-mono">
              <span>7天 (超短线)</span>
              <span>90天 (季度)</span>
              <span>180天 (半年平衡区)</span>
              <span>365天 (1年)</span>
              <span>730天 (2年)</span>
              <span>1095天 (3年长线)</span>
            </div>
          </div>

          {/* 两类份额核心成本对照卡 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* A 类份额卡 */}
            <div className={`p-4 rounded-2xl border transition-all ${
              costSim.recClass === 'A类'
                ? 'bg-[#EAF3F4] dark:bg-[#1C292B] border-[#4A7C6F] ring-1 ring-[#4A7C6F]'
                : 'bg-white dark:bg-[#141A1B] border-[#E3E7E1] dark:border-[#2A383A]'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-1.5">
                    <span>A 类份额 (代码末尾带A / 场外前端收费)</span>
                    {costSim.recClass === 'A类' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4A7C6F] text-white">
                        当前持有期推荐
                      </span>
                    )}
                  </span>
                  <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mt-0.5">
                    买入时单次付清申购费，持有无销售服务费，越拿越划算
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between text-[#576F73] dark:text-[#9BB2B4]">
                  <span>前端申购费 (1折后 {activeFundForCalc.discountedSubscriptionFee}%):</span>
                  <span className="font-mono font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                    ¥{costSim.subFee.toFixed(2)} 元
                  </span>
                </div>
                <div className="flex justify-between text-[#576F73] dark:text-[#9BB2B4]">
                  <span>年化持有费 (管理费{activeFundForCalc.managementFee}% + 托管费{activeFundForCalc.custodyFee}%):</span>
                  <span className="font-mono font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                    {(activeFundForCalc.managementFee + activeFundForCalc.custodyFee).toFixed(2)}%/年
                  </span>
                </div>
                <div className="flex justify-between text-[#576F73] dark:text-[#9BB2B4]">
                  <span>销售服务费 (持续扣除):</span>
                  <span className="font-mono font-bold text-[#4A7C6F]">0.00% (不收取)</span>
                </div>
                <div className="pt-2 border-t border-[#CBD9DB] dark:border-[#2F474A] flex justify-between items-baseline">
                  <span className="font-bold text-[#1F3437] dark:text-[#E5EBEA]">持有 {holdingDays} 天总支出预估:</span>
                  <span className="font-mono font-black text-lg text-[#1F3437] dark:text-[#E5EBEA]">
                    ¥{costSim.costA.toFixed(2)} 元
                  </span>
                </div>
              </div>
            </div>

            {/* C 类份额卡 */}
            <div className={`p-4 rounded-2xl border transition-all ${
              costSim.recClass === 'C类'
                ? 'bg-[#EAF3F4] dark:bg-[#1C292B] border-[#4A7C6F] ring-1 ring-[#4A7C6F]'
                : 'bg-white dark:bg-[#141A1B] border-[#E3E7E1] dark:border-[#2A383A]'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-1.5">
                    <span>C 类份额 (代码末尾带C / 场外零申购费)</span>
                    {costSim.recClass === 'C类' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4A7C6F] text-white">
                        当前持有期推荐
                      </span>
                    )}
                  </span>
                  <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mt-0.5">
                    0申购费，持有超7天免赎回费，按日计提销售服务费
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between text-[#576F73] dark:text-[#9BB2B4]">
                  <span>前端申购费:</span>
                  <span className="font-mono font-bold text-[#4A7C6F]">¥0.00 元 (零申购费)</span>
                </div>
                <div className="flex justify-between text-[#576F73] dark:text-[#9BB2B4]">
                  <span>年化持有费 (管理费{activeFundForCalc.managementFee}% + 托管费{activeFundForCalc.custodyFee}%):</span>
                  <span className="font-mono font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                    {(activeFundForCalc.managementFee + activeFundForCalc.custodyFee).toFixed(2)}%/年
                  </span>
                </div>
                <div className="flex justify-between text-[#576F73] dark:text-[#9BB2B4]">
                  <span>销售服务费 (持续扣除):</span>
                  <span className="font-mono font-bold text-amber-600">
                    {costSim.salesFee}%/年 (按日从净值扣减)
                  </span>
                </div>
                <div className="pt-2 border-t border-[#CBD9DB] dark:border-[#2F474A] flex justify-between items-baseline">
                  <span className="font-bold text-[#1F3437] dark:text-[#E5EBEA]">持有 {holdingDays} 天总支出预估:</span>
                  <span className="font-mono font-black text-lg text-[#1F3437] dark:text-[#E5EBEA]">
                    ¥{costSim.costC.toFixed(2)} 元
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* 结论性诊断 */}
          <div className="p-3.5 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] text-xs leading-relaxed flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-[#3E6F73] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                测算结论与决策法则：
              </span>
              <p className="text-[#576F73] dark:text-[#9BB2B4] mt-0.5">
                在当前设定（拟投资 ¥{investmentAmount.toLocaleString()} 元、预计持有 {holdingDays} 天）下，
                选择【<strong className="text-[#4A7C6F] font-bold">{costSim.recClass}</strong>】能为您节省约{' '}
                <strong className="font-mono text-[#4A7C6F] font-bold">¥{costSim.diff} 元</strong> 费用摩擦。
                若预计持有 <strong className="text-amber-600">低于 {costSim.crossoverDays} 天</strong>，选 C 类更优；
                若持有 <strong className="text-[#4A7C6F]">超过 {costSim.crossoverDays} 天（约半年到1年）</strong>，A 类买断申购费更优。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== 视图 3: 全球大类资产配置建议 (美股+A股+美债) ===== */}
      {activeSubTab === 'allocation' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-[#E3E7E1] dark:border-[#2A383A]">
            <div>
              <h3 className="text-base font-bold font-serif text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-2">
                <span>全球核心指数大类资产配置建议矩阵</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#3E6F73]/10 text-[#3E6F73] dark:text-[#76B4B9]">
                  美股 + A/港股 + 固收美债
                </span>
              </h3>
              <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] mt-1">
                避免押注单一市场风险：结合马科维茨现代投资组合理论（MPT）与跨国界资产低相关性原理。
              </p>
            </div>

            {/* 风险偏好切换 */}
            <div className="flex items-center space-x-1.5">
              {[
                { id: 'aggressive', label: '进取进攻型' },
                { id: 'balanced', label: '均衡稳健型' },
                { id: 'conservative', label: '防御避险型' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProfile(p.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedProfile === p.id
                      ? 'bg-[#1F3437] text-white shadow-xs'
                      : 'bg-[#F6F7F5] dark:bg-[#141A1B] text-[#576F73] hover:bg-[#ECEFEA]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 当前选中的配置画像 */}
          {(() => {
            const currentProf = allocationProfiles.find((p) => p.profile === selectedProfile) || allocationProfiles[1];
            if (!currentProf) return null;

            return (
              <div className="space-y-4">
                {/* 预期收益与波动性指标 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A]">
                    <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4]">预期年化复合回报区间</div>
                    <div className="font-mono font-bold text-base text-[#4A7C6F] mt-0.5">
                      {currentProf.expectedAnnualReturn}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A]">
                    <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4]">回撤波动容忍度</div>
                    <div className="font-semibold text-xs text-[#1F3437] dark:text-[#E5EBEA] mt-0.5">
                      {currentProf.volatilityTolerance}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A]">
                    <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4]">动态再平衡周期</div>
                    <div className="font-semibold text-xs text-[#3E6F73] dark:text-[#76B4B9] mt-0.5">
                      半年度或偏离度 &gt; 5% 时再平衡
                    </div>
                  </div>
                </div>

                {/* 资产配比横条可视化 */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                    投资组合推荐仓位配比:
                  </div>
                  <div className="w-full h-4 rounded-full overflow-hidden flex bg-gray-200">
                    {currentProf.allocations.map((a, i) => {
                      const colors = ['bg-[#1F3437]', 'bg-[#3E6F73]', 'bg-[#4A7C6F]', 'bg-amber-600'];
                      return (
                        <div
                          key={a.assetName}
                          style={{ width: `${a.ratio}%` }}
                          className={`${colors[i % colors.length]} h-full transition-all`}
                          title={`${a.assetName}: ${a.ratio}%`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* 各大类资产详细拆解卡 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {currentProf.allocations.map((item, idx) => (
                    <div
                      key={item.assetName}
                      className="p-3.5 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#1F3437] dark:text-[#E5EBEA]">
                          {item.assetName}
                        </span>
                        <span className="font-mono font-black text-sm text-[#3E6F73] dark:text-[#76B4B9]">
                          {item.ratio}%
                        </span>
                      </div>
                      <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">
                        {item.role}
                      </p>
                      <div className="flex items-center space-x-1.5 flex-wrap pt-1 text-[10px] text-[#7A9194]">
                        <span>优选代表标的:</span>
                        {item.representativeFunds.map((rf) => (
                          <span
                            key={rf}
                            className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1C2426] font-mono text-[#1F3437] dark:text-[#E5EBEA] border border-[#E3E7E1] dark:border-[#2A383A]"
                          >
                            {rf}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 逻辑要点清单 */}
                <div className="p-3.5 rounded-xl bg-[#EAF3F4] dark:bg-[#1C292B] border border-[#B7D9DC] dark:border-[#2F474A] space-y-1.5 text-xs">
                  <div className="font-bold text-[#2A5A5E] dark:text-[#76B4B9] flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>配置逻辑支撑与执行纪律：</span>
                  </div>
                  <ul className="list-disc list-inside text-[#1F3437] dark:text-[#E5EBEA] space-y-1 text-[11px] pl-1">
                    {currentProf.rationales.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ===== 视图 4: QDII交易规则与溢价避坑指南 ===== */}
      {activeSubTab === 'rules' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] shadow-xs space-y-5">
          <div className="pb-3 border-b border-[#E3E7E1] dark:border-[#2A383A]">
            <h3 className="text-base font-bold font-serif text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-2">
              <span>QDII 基金投资交易规则与避坑指南</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#A84A3E]/10 text-[#A84A3E] border border-[#A84A3E]/30">
                防踩坑必备
              </span>
            </h3>
            <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] mt-1">
              梳理国内投资者申赎境外指数基金时常见的额度受限、交割时间差、场内高溢价等三大盲区。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 陷阱 1: 场内高溢价陷阱 */}
            <div className="p-4 rounded-xl bg-[#F8ECE9] dark:bg-[#2D1D1B] border border-[#ECC5BE] dark:border-[#522E29] space-y-2">
              <div className="flex items-center space-x-2 text-[#8E362C] dark:text-[#DE867A] font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>陷阱 1: 场内ETF非理性高溢价</span>
              </div>
              <p className="text-[11px] text-[#8E362C] dark:text-[#DE867A] leading-relaxed">
                当场外申购暂停时，部分投资者涌入二级市场买入ETF，推高价格脱离真实净值（例如溢价 &gt; 5%~10%）。
                一旦场外额度恢复开放，套利资金涌入将导致溢价瞬间抹平，买入即面临无谓亏损。
              </p>
              <div className="text-[10px] font-bold text-[#8E362C] dark:text-[#DE867A] bg-white/40 dark:bg-black/20 p-2 rounded-lg">
                ✅ 避坑准则：场内溢价 &gt; 1.5% 时坚决不追买，优先寻找尚有额度的场外联接基金定投。
              </div>
            </div>

            {/* 陷阱 2: 申赎时间差与日历不对齐 */}
            <div className="p-4 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] space-y-2">
              <div className="flex items-center space-x-2 text-[#1F3437] dark:text-[#E5EBEA] font-bold text-xs">
                <Clock className="w-4 h-4 text-[#3E6F73] shrink-0" />
                <span>陷阱 2: QDII 申购确认 T+2 与赎回 T+4</span>
              </div>
              <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] leading-relaxed">
                境外基金由于跨时区时差与美股清算机制，申购通常在 T+2 日才确认份额与净值，赎回到账需 T+3~T+5 个工作日。
                若遇上美股节假日（如独立日、感恩节、圣诞节）或国内法定假日，确认时间顺延。
              </p>
              <div className="text-[10px] font-bold text-[#3E6F73] dark:text-[#76B4B9] bg-white dark:bg-[#1C2426] p-2 rounded-lg border border-[#E3E7E1] dark:border-[#2A383A]">
                ✅ 避坑准则：切勿用短期应急资金购买QDII基金；急需资金应提前1周申请赎回。
              </div>
            </div>

            {/* 陷阱 3: 大额限购定投策略 */}
            <div className="p-4 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] space-y-2">
              <div className="flex items-center space-x-2 text-[#1F3437] dark:text-[#E5EBEA] font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-[#4A7C6F] shrink-0" />
                <span>陷阱 3: 单笔大额申购被拒</span>
              </div>
              <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] leading-relaxed">
                基金公司外汇总额度由国家外汇管理局统一批复。在资金出境需求旺盛期，基金公司往往设置 100元、500元或1000元/日的单账户申购上限，单笔大额买入会被直接退款。
              </p>
              <div className="text-[10px] font-bold text-[#4A7C6F] bg-white dark:bg-[#1C2426] p-2 rounded-lg border border-[#E3E7E1] dark:border-[#2A383A]">
                ✅ 避坑准则：开启「每日定投」或分散在 2~3 家不同公募基金公司（如华夏+博时+易方达）平摊建仓。
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ===== 视图 5: 可运行 Python 量化代码模版 ===== */}
      {activeSubTab === 'code' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E3E7E1] dark:border-[#2A383A]">
            <div>
              <h3 className="text-base font-bold font-serif text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-2">
                <span>四步筛选法 Python 量化程序脚本</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-600/10 text-emerald-600 font-mono">
                  Python 3.9+ 兼容
                </span>
              </h3>
              <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] mt-0.5">
                可直接嵌入本地定时任务或 Jupyter Notebook，自动对接 akshare 或 yfinance 数据接口拉取基金清洗数据。
              </p>
            </div>

            <button
              onClick={copyCodeToClipboard}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#1F3437] text-white hover:bg-[#284347] text-xs font-semibold cursor-pointer shadow-xs transition-all"
            >
              {hasCopiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>已复制代码</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>一键复制代码</span>
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <pre className="p-4 rounded-xl bg-[#141A1B] text-[#E5EBEA] text-xs font-mono overflow-x-auto leading-relaxed border border-[#2A383A]">
              <code>{pythonScriptExample}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
