import React, { useState } from 'react';
import { StockData } from '../types/stock';
import { LineChart, Lightbulb, TrendingUp, Compass, Target, ShieldAlert, PieChart as PieIcon, ShieldCheck, Radio, Calculator, DollarSign, Percent } from 'lucide-react';
import { SemanticBadge } from './common/SemanticBadge';
import { StrategyBacktestCard } from './StrategyBacktestCard';
import { TrendForwardCard } from './TrendForwardCard';
import { calculatePositionSizing } from '../utils/institutionalForensics';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

interface Step5TechnicalProps {
  stock: StockData;
  onOpenDecisionVerification?: () => void;
  onOpenSmartRadar?: () => void;
  onOpenDecisionLedger?: () => void;
}

export const Step5Technical: React.FC<Step5TechnicalProps> = ({ stock, onOpenDecisionVerification, onOpenSmartRadar, onOpenDecisionLedger }) => {
  const t = stock.technical;
  const p = t.positionStrategy;

  // 买方头寸与止损计算器交互状态
  const [totalCapital, setTotalCapital] = useState<number>(300000);
  const [riskTolerancePercent, setRiskTolerancePercent] = useState<number>(1.5);
  const [entryPrice, setEntryPrice] = useState<number>(stock.currentPrice);
  const [stopLossPrice, setStopLossPrice] = useState<number>(p.stopLossPrice);

  const sizingResult = calculatePositionSizing({
    totalCapital,
    riskTolerancePercent,
    entryPrice,
    stopLossPrice,
  });

  return (
    <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-6 shadow-xs mb-8 transition-colors">
      {/* 模块标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E3E7E1] dark:border-[#2A383A] pb-4 mb-6 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#3E6F73]/10 text-[#3E6F73] dark:text-[#76B4B9] border border-[#3E6F73]/20">
            <LineChart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                Step 5: 技术面形态与建仓时机
              </h2>
              <SemanticBadge tier="risk" subText="技术指标存在假突破概率" />
            </div>
            <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] mt-0.5">
              研判均线支撑位、多空筹码密集区与建仓盈亏比，杜绝情绪化追涨杀跌
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] px-3.5 py-1.5 rounded-xl">
          <span className="text-xs text-[#576F73] dark:text-[#9BB2B4]">通道形态:</span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#3E6F73]/15 text-[#2B5458] dark:text-[#5B9DA2] border border-[#3E6F73]/30">
            {t.trendChannelZh} ({t.macdSignalZh})
          </span>
        </div>
      </div>

      {/* 交易决策与时机建议 */}
      <div className="p-4 rounded-xl border border-[#3E6F73]/30 bg-[#3E6F73]/10 text-[#1F3437] dark:text-[#E5EBEA] mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <Lightbulb className="w-5 h-5 text-[#3E6F73] dark:text-[#76B4B9] shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-serif font-bold text-[#1F3437] dark:text-white">
              买入时机与风控边界建议
            </div>
            <p className="text-xs mt-1 text-[#576F73] dark:text-[#CBD8DA] leading-relaxed">
              当前标的处于 <strong className="text-[#3E6F73] dark:text-[#76B4B9]">{t.trendChannelZh}</strong>，
              强支撑位位于 <strong className="text-[#4A7C6F] font-mono">{stock.currency === 'USD' ? '$' : '¥'}{t.supportLevel1}</strong>，
              强压力位位于 <strong className="text-[#A84A3E] font-mono">{stock.currency === 'USD' ? '$' : '¥'}{t.resistanceLevel1}</strong>。
              {t.timingAdvice}
            </p>
          </div>
        </div>

        {onOpenSmartRadar && (
          <button
            onClick={onOpenSmartRadar}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1C2426] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] border border-[#3E6F73]/40 text-[#2B5458] dark:text-[#76B4B9] text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>设为盯盘买点哨兵</span>
          </button>
        )}
      </div>

      {/* 支撑/阻力/均线指标矩阵 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-4">
          <div className="text-xs text-[#576F73] dark:text-[#9BB2B4] mb-1 font-medium">第一强支撑位 (S1)</div>
          <div className="text-2xl font-black font-mono text-[#4A7C6F] mb-1 tabular-nums">
            {stock.currency === 'USD' ? '$' : '¥'}{t.supportLevel1}
          </div>
          <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">关键企稳防守线</div>
        </div>

        <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-4">
          <div className="text-xs text-[#576F73] dark:text-[#9BB2B4] mb-1 font-medium">第一重压力位 (R1)</div>
          <div className="text-2xl font-black font-mono text-[#A84A3E] mb-1 tabular-nums">
            {stock.currency === 'USD' ? '$' : '¥'}{t.resistanceLevel1}
          </div>
          <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">密集成交阻力套牢区</div>
        </div>

        <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-4">
          <div className="text-xs text-[#576F73] dark:text-[#9BB2B4] mb-1 font-medium">20日均线 (MA20)</div>
          <div className="text-2xl font-black font-mono text-[#1F3437] dark:text-white mb-1 tabular-nums">
            {stock.currency === 'USD' ? '$' : '¥'}{t.ma20}
          </div>
          <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">
            MA50: <span className="font-mono font-bold text-[#1F3437] dark:text-white">{t.ma50}</span>
          </div>
        </div>

        <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-4">
          <div className="text-xs text-[#576F73] dark:text-[#9BB2B4] mb-1 font-medium">14日 RSI 强弱指标</div>
          <div className="text-2xl font-black font-mono text-[#3E6F73] dark:text-[#76B4B9] mb-1 tabular-nums">
            {t.rsi14}
          </div>
          <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">
            {t.rsi14 < 30 ? '超卖反弹酝酿区' : t.rsi14 > 70 ? '超买警惕回调' : '常态多空博弈'}
          </div>
        </div>
      </div>

      {/* 历史价格走势与均线图表 */}
      <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#3E6F73]" />
              <span>近 {Math.min(60, stock.priceHistory.length)} 个交易日走势与均线（MA5 / MA20 / 支撑阻力带）</span>
            </h3>
            <p className="text-xs text-[#576F73] dark:text-[#9BB2B4]">
              低饱和度配色护眼，绿色代表收盘价/MA5，青灰色代表MA20
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={stock.priceHistory.slice(-60)} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" opacity={0.3} />
              <XAxis dataKey="date" stroke="#7A9194" fontSize={11} tickLine={false} />
              <YAxis
                domain={['auto', 'auto']}
                stroke="#7A9194"
                fontSize={11}
                tickLine={false}
                label={{ value: '价格', angle: -90, position: 'insideLeft', fill: '#7A9194', fontSize: 10 }}
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
              <ReferenceLine y={t.supportLevel1} stroke="#4A7C6F" strokeDasharray="4 4" label={{ value: '支撑位', fill: '#4A7C6F', fontSize: 10 }} />
              <ReferenceLine y={t.resistanceLevel1} stroke="#A84A3E" strokeDasharray="4 4" label={{ value: '阻力位', fill: '#A84A3E', fontSize: 10 }} />
              <Line type="monotone" dataKey="price" name="收盘价" stroke="#3E6F73" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="ma5" name="MA5 5日均线" stroke="#4A7C6F" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="ma20" name="MA20 20日均线" stroke="#1F3437" strokeWidth={1.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 历史相似形态后续表现（趋势参考） */}
      <TrendForwardCard stock={stock} />

      {/* 交易纪律：建仓三部曲与止损/止盈风控 */}
      <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-2">
            <PieIcon className="w-4 h-4 text-[#3E6F73]" />
            <span>建仓三部曲与盈亏比执行纪律</span>
          </h3>
          <SemanticBadge tier="ai" subText="纪律量化算法" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {/* 第一批 */}
          <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] p-3.5 rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#3E6F73] dark:text-[#76B4B9]">第一批：建立观察底仓</span>
              <span className="text-xs font-mono font-bold text-[#1F3437] dark:text-white bg-[#3E6F73]/15 px-2 py-0.5 rounded border border-[#3E6F73]/30">
                {p.firstBatch.percent}% 仓位
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-[#1F3437] dark:text-white mb-1 tabular-nums">
              买点参考: {stock.currency === 'USD' ? '$' : '¥'}{p.firstBatch.targetPrice}
            </div>
            <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">{p.firstBatch.note}</p>
          </div>

          {/* 第二批 */}
          <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] p-3.5 rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#4A7C6F]">第二批：回踩支撑补仓</span>
              <span className="text-xs font-mono font-bold text-[#1F3437] dark:text-white bg-[#4A7C6F]/15 px-2 py-0.5 rounded border border-[#4A7C6F]/30">
                {p.secondBatch.percent}% 仓位
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-[#1F3437] dark:text-white mb-1 tabular-nums">
              买点参考: {stock.currency === 'USD' ? '$' : '¥'}{p.secondBatch.targetPrice}
            </div>
            <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">{p.secondBatch.note}</p>
          </div>

          {/* 第三批 */}
          <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] p-3.5 rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#1F3437] dark:text-[#A6C0C3]">第三批：右侧放量突破</span>
              <span className="text-xs font-mono font-bold text-[#1F3437] dark:text-white bg-[#1F3437]/10 dark:bg-white/10 px-2 py-0.5 rounded border border-[#1F3437]/20">
                {p.thirdBatch.percent}% 仓位
              </span>
            </div>
            <div className="text-sm font-bold font-mono text-[#1F3437] dark:text-white mb-1 tabular-nums">
              买点参考: {stock.currency === 'USD' ? '$' : '¥'}{p.thirdBatch.targetPrice}
            </div>
            <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">{p.thirdBatch.note}</p>
          </div>
        </div>

        {/* 严格止损止盈红绿线 */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] p-3.5 rounded-xl gap-4 shadow-xs mb-4">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-5 h-5 text-[#A84A3E]" />
            <div>
              <span className="text-xs font-bold text-[#1F3437] dark:text-[#E5EBEA]">止损纪律警戒线 (Stop Loss)</span>
              <div className="text-sm font-bold font-mono text-[#A84A3E] tabular-nums">
                {stock.currency === 'USD' ? '$' : '¥'}{p.stopLossPrice}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Target className="w-5 h-5 text-[#4A7C6F]" />
            <div>
              <span className="text-xs font-bold text-[#1F3437] dark:text-[#E5EBEA]">获利目标止盈线 (Take Profit)</span>
              <div className="text-sm font-bold font-mono text-[#4A7C6F] tabular-nums">
                {stock.currency === 'USD' ? '$' : '¥'}{p.takeProfitPrice}
              </div>
            </div>
          </div>
        </div>

        {/* 专业买方头寸与止损金额计算器 (Position Sizing & VaR Risk Calculator) */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#1C2426] border border-[#CBD5E1] dark:border-[#2A383A] mb-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3E7E1] dark:border-[#2A383A] pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-[#3E6F73]/15 text-[#3E6F73] dark:text-[#76B4B9]">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#1F3437] dark:text-white">
                  买方头寸风控与可承受亏损计算器 (Position Sizing Workbench)
                </span>
                <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">
                  根据总本金与单笔容忍风险，自动计算安全建仓股数，绝不盲目重仓
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#4A7C6F]/10 text-[#4A7C6F] font-mono font-bold self-start sm:self-auto">
              动态风控闭环
            </span>
          </div>

          {/* 输入表单行 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] block mb-1">
                账户证券总资产 (元)
              </label>
              <input
                type="number"
                step="10000"
                value={totalCapital}
                onChange={(e) => setTotalCapital(Math.max(10000, Number(e.target.value)))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#CBD5E1] dark:border-[#2A383A] text-xs font-mono font-bold text-[#1F3437] dark:text-white focus:outline-none focus:border-[#3E6F73]"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] block mb-1">
                单笔最大回撤容忍 %
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="10"
                value={riskTolerancePercent}
                onChange={(e) => setRiskTolerancePercent(Math.max(0.5, Number(e.target.value)))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#CBD5E1] dark:border-[#2A383A] text-xs font-mono font-bold text-[#1F3437] dark:text-white focus:outline-none focus:border-[#3E6F73]"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] block mb-1">
                拟建仓买入价 ({stock.currency === 'USD' ? '$' : '¥'})
              </label>
              <input
                type="number"
                step="0.1"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Math.max(0.1, Number(e.target.value)))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#CBD5E1] dark:border-[#2A383A] text-xs font-mono font-bold text-[#1F3437] dark:text-white focus:outline-none focus:border-[#3E6F73]"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] block mb-1">
                硬核止损价 ({stock.currency === 'USD' ? '$' : '¥'})
              </label>
              <input
                type="number"
                step="0.1"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(Math.max(0.1, Number(e.target.value)))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#CBD5E1] dark:border-[#2A383A] text-xs font-mono font-bold text-[#A84A3E] focus:outline-none focus:border-[#A84A3E]"
              />
            </div>
          </div>

          {/* 测算结果矩阵 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#E3E7E1] dark:border-[#2A383A]">
            <div className="p-2.5 rounded-lg bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A]">
              <span className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] block">推荐建仓股数 (整手)</span>
              <span className="text-base font-mono font-black text-[#1F3437] dark:text-white">
                {sizingResult.recommendedShares.toLocaleString()} 股
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A]">
              <span className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] block">建仓占用金额 (仓位)</span>
              <span className="text-base font-mono font-bold text-[#3E6F73] dark:text-[#76B4B9]">
                ¥{sizingResult.totalInvestment.toLocaleString()} ({sizingResult.portfolioAllocationPercent}%)
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#A84A3E]/5 border border-[#A84A3E]/20">
              <span className="text-[10px] text-[#A84A3E] block">单笔最大亏损上限 (VaR)</span>
              <span className="text-base font-mono font-bold text-[#A84A3E]">
                -¥{sizingResult.maxDollarRisk.toLocaleString()}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#4A7C6F]/5 border border-[#4A7C6F]/20">
              <span className="text-[10px] text-[#4A7C6F] block">触及止损确定性损失</span>
              <span className="text-base font-mono font-bold text-[#4A7C6F]">
                -¥{sizingResult.potentialStopLossAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {sizingResult.isConcentrationWarning && (
            <div className="text-[11px] text-[#A84A3E] bg-[#A84A3E]/10 p-2 rounded-lg flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>集中度警示：计算所得建议持仓超总本金 30%，建议分批建仓以降低非系统性黑天鹅冲击。</span>
            </div>
          )}

          {/* 一键归档为个人投资决策档案按钮 */}
          {onOpenDecisionLedger && (
            <div className="flex items-center justify-between pt-2 border-t border-[#E3E7E1] dark:border-[#2A383A]">
              <span className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">
                测算完毕？将此头寸规模与止损位白纸黑字固化为个人决策档案，坚决杜绝盲目买卖。
              </span>
              <button
                onClick={onOpenDecisionLedger}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#3E6F73] hover:bg-[#2B5458] text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
              >
                <span>📝 建立个人决策立项档案</span>
              </button>
            </div>
          )}
        </div>

        {/* 选股决策可靠性三步门禁核查横幅 */}
        {onOpenDecisionVerification && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[#3E6F73]/10 border border-[#3E6F73]/30 gap-3">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-[#3E6F73] dark:text-[#76B4B9] shrink-0" />
              <div>
                <div className="text-xs font-bold text-[#1F3437] dark:text-white">
                  准备执行买入？先跑一遍【选股可靠性三步门禁】
                </div>
                <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">
                  自动排查现金流欺诈、估值高位透支与人工防黑天鹅清单，确认是否符合稳健建仓条件
                </div>
              </div>
            </div>

            <button
              onClick={onOpenDecisionVerification}
              className="px-4 py-2 rounded-xl bg-[#1F3437] hover:bg-[#284347] text-white text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap flex items-center justify-center space-x-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-[#76B4B9]" />
              <span>启动可靠性决策核验</span>
            </button>
          </div>
        )}
      </div>

      {/* 历史量化策略回测模拟引擎 */}
      <div className="mt-8">
        <StrategyBacktestCard stock={stock} />
      </div>
    </div>
  );
};
