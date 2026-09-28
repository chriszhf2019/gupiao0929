import React, { useState } from 'react';
import { Globe, TrendingUp, TrendingDown, Layers, ArrowUpRight, ArrowDownRight, Compass, ShieldCheck, Activity } from 'lucide-react';
import { SemanticBadge } from '../common/SemanticBadge';

interface MacroIndicator {
  name: string;
  code: string;
  category: string;
  currentValue: string;
  change: string;
  isPositive: boolean;
  historicalPercentile: number; // 0 - 100
  signalZh: string;
  statusType: 'bullish' | 'neutral' | 'bearish';
  interpretation: string;
}

const MACRO_INDICATORS: MacroIndicator[] = [
  {
    name: '中美10年期国债利差',
    code: '10Y CN-US SPREAD',
    category: '全球流动性',
    currentValue: '-195 BP',
    change: '+12 BP 收窄',
    isPositive: true,
    historicalPercentile: 25,
    signalZh: '倒挂趋缓 · 汇率压力减轻',
    statusType: 'neutral',
    interpretation: '中美10年期国债收益率倒挂程度近期逐步收窄，减轻离岸资本外流摩擦，有利于北向外资回流A股核心白马。',
  },
  {
    name: '全市场风险溢价率 (ERP)',
    code: 'EQUITY RISK PREMIUM',
    category: '股债性价比',
    currentValue: '5.82%',
    change: '+0.15% 处历史高位',
    isPositive: true,
    historicalPercentile: 88,
    signalZh: '权益极具性价比 · 胜率极高',
    statusType: 'bullish',
    interpretation: '全市场风险溢价 ERP = 1/PE - 10年期中债收益率(2.15%)。当前处于近10年88%历史极高分位，表明股票相对债券具有极高的长期风险补偿。',
  },
  {
    name: 'M1 - M2 货币活化剪刀差',
    code: 'M1-M2 SCISSORS',
    category: '企业流动性',
    currentValue: '-6.4%',
    change: '+0.8% 底部向上修复',
    isPositive: true,
    historicalPercentile: 32,
    signalZh: '资金活化蓄力 · 筑底企稳',
    statusType: 'neutral',
    interpretation: 'M1反映企业活期存款意愿，M1增速与M2增速剪刀差负向收窄，表明企业结算与经营性现金回流出现边际改善。',
  },
  {
    name: '两融杠杆资金风险偏好',
    code: 'MARGIN TRADING LEVERAGE',
    category: '市场情绪与微观杠杆',
    currentValue: '1.68 万亿元',
    change: '+180 亿元',
    isPositive: true,
    historicalPercentile: 65,
    signalZh: '杠杆温和入场 · 风险可控',
    statusType: 'bullish',
    interpretation: '沪深两市融资融券余额占全市场流通市值约 2.2%，处于健康可控区间，杠杆资金活跃但未出现2015年的极端泡沫迹象。',
  },
  {
    name: '离岸人民币汇率 (USD/CNH)',
    code: 'USD/CNH FX',
    category: '外汇与汇率中枢',
    currentValue: '7.1850',
    change: '-0.0250 汇率升值',
    isPositive: true,
    historicalPercentile: 55,
    signalZh: '汇率双向波动 · 韧性充沛',
    statusType: 'bullish',
    interpretation: '离岸人民币在7.15~7.25区间宽幅双向波动，央行中间价逆周期因子稳健，宏观工具箱充裕，外资持有意愿稳固。',
  },
];

export const GlobalLiquidityRadar: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', '全球流动性', '股债性价比', '企业流动性', '市场情绪与微观杠杆', '外汇与汇率中枢'];

  const filtered = selectedCategory === 'all'
    ? MACRO_INDICATORS
    : MACRO_INDICATORS.filter((i) => i.category === selectedCategory);

  return (
    <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-6 shadow-xs space-y-6 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E3E7E1] dark:border-[#2A383A] pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#3E6F73]/10 text-[#3E6F73] dark:text-[#76B4B9] border border-[#3E6F73]/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                宏观先行指标与全球流动性雷达
              </h3>
              <SemanticBadge tier="fact" subText="央行/国债/外汇实时宏观" />
            </div>
            <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] mt-0.5">
              量化中美利差、股权风险溢价 ERP、M1-M2 货币剪刀差与两融杠杆水温
            </p>
          </div>
        </div>

        {/* 综合宏观流动性水温评级 */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#4A7C6F]/10 border border-[#4A7C6F]/30 text-xs">
          <ShieldCheck className="w-4 h-4 text-[#4A7C6F]" />
          <span className="font-serif font-bold text-[#4A7C6F]">宏观股债性价比处于【极具配置价值】区间</span>
        </div>
      </div>

      {/* 指标卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          return (
            <div
              key={item.code}
              className="p-4 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] space-y-3 flex flex-col justify-between hover:border-[#3E6F73]/50 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[#7A9194]">
                    {item.category}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      item.statusType === 'bullish'
                        ? 'bg-[#4A7C6F]/15 text-[#4A7C6F]'
                        : item.statusType === 'bearish'
                        ? 'bg-[#A84A3E]/15 text-[#A84A3E]'
                        : 'bg-[#3E6F73]/15 text-[#3E6F73] dark:text-[#76B4B9]'
                    }`}
                  >
                    {item.signalZh}
                  </span>
                </div>

                <div>
                  <div className="text-xs font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                    {item.name}
                  </div>
                  <div className="text-[10px] font-mono text-[#7A9194]">{item.code}</div>
                </div>

                <div className="flex items-baseline space-x-2 pt-1">
                  <span className="text-xl font-black font-mono text-[#1F3437] dark:text-[#E5EBEA]">
                    {item.currentValue}
                  </span>
                  <span
                    className={`text-[11px] font-mono flex items-center font-bold ${
                      item.isPositive ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'
                    }`}
                  >
                    {item.isPositive ? (
                      <ArrowUpRight className="w-3 h-3 mr-0.5" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 mr-0.5" />
                    )}
                    {item.change}
                  </span>
                </div>

                {/* 分位数进度条 */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-[#7A9194] font-mono">
                    <span>10年历史百分位</span>
                    <span className="font-bold text-[#3E6F73] dark:text-[#76B4B9]">{item.historicalPercentile}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E3E7E1] dark:bg-[#2A383A] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3E6F73] rounded-full transition-all"
                      style={{ width: `${item.historicalPercentile}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 机构解读 */}
              <div className="pt-2 border-t border-[#E3E7E1] dark:border-[#2A383A] text-[11px] text-[#576F73] dark:text-[#9BB2B4] leading-relaxed">
                {item.interpretation}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
