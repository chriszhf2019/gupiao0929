import React, { useState } from 'react';
import { ShieldAlert, Activity, AlertTriangle, PieChart, TrendingDown, CheckCircle, Info, X } from 'lucide-react';
import { formatMoney, formatPercent, round2 } from '../../services/portfolioService';

interface HoldingItem {
  symbol: string;
  name: string;
  currency: string;
  marketValueCny: number;
  totalCostCny: number;
  unrealizedPnLCny: number;
  weight: number;
}

interface PortfolioStressTestModalProps {
  holdingRows: HoldingItem[];
  totalAssetsCny: number;
  totalCashCny: number;
  onClose: () => void;
}

interface HistoricalScenario {
  id: string;
  name: string;
  period: string;
  description: string;
  marketDrop: number;
  sectorImpacts: Record<string, number>;
}

const HISTORICAL_SCENARIOS: HistoricalScenario[] = [
  {
    id: 'gfc_2008',
    name: '2008 全球金融海啸',
    period: '2008.01 - 2008.11',
    description: '次贷危机引发全球流动性枯竭与恐慌抛售，上证指数自6124点单边下跌超65%。',
    marketDrop: -52,
    sectorImpacts: { 银行: -48, 消费: -38, 新能源: -58, 科技: -65, 医药: -32, 周期: -68 },
  },
  {
    id: 'deleveraging_2015',
    name: '2015 A股去杠杆流动性危机',
    period: '2015.06 - 2015.08',
    description: '场外配资清理引发千股跌停与踩踏熔断，高估值成长股流动性急剧冰冻。',
    marketDrop: -42,
    sectorImpacts: { 银行: -25, 消费: -35, 新能源: -46, 科技: -55, 医药: -38, 周期: -48 },
  },
  {
    id: 'covid_2020',
    name: '2020 全球疫情多重熔断',
    period: '2020.02 - 2020.03',
    description: '公共卫生事件引发全球供应链与需求急冻，美股发生四次历史级熔断。',
    marketDrop: -28,
    sectorImpacts: { 银行: -18, 消费: -24, 新能源: -22, 科技: -30, 医药: -12, 周期: -32 },
  },
  {
    id: 'tightening_2022',
    name: '2022 美联储激进加息与地缘滞胀',
    period: '2022.01 - 2022.10',
    description: '全球通胀高企，美联储单次加息75BP收紧离岸美元，成长股估值大幅压缩。',
    marketDrop: -22,
    sectorImpacts: { 银行: -12, 消费: -18, 新能源: -32, 科技: -36, 医药: -25, 周期: -15 },
  },
];

export const PortfolioStressTestModal: React.FC<PortfolioStressTestModalProps> = ({
  holdingRows,
  totalAssetsCny,
  totalCashCny,
  onClose,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('deleveraging_2015');

  // 计算行业集中度 HHI (Herfindahl-Hirschman Index)
  const stockAssetsTotal = holdingRows.reduce((sum, h) => sum + h.marketValueCny, 0);
  const hhi = holdingRows.reduce((sum, h) => {
    const share = stockAssetsTotal > 0 ? (h.marketValueCny / stockAssetsTotal) * 100 : 0;
    return sum + (share * share) / 10000;
  }, 0);

  // 95% 置信度单日在险价值 (Parametric 1-Day 95% VaR)
  // 假设投资组合日化波动率约为 1.8%，1.65 为 95% 正态分布分位数
  const portfolioDailyVol = 0.018;
  const var95_1DayCny = stockAssetsTotal * 1.65 * portfolioDailyVol;
  const var95Percent = totalAssetsCny > 0 ? (var95_1DayCny / totalAssetsCny) * 100 : 0;

  const currentScenario =
    HISTORICAL_SCENARIOS.find((s) => s.id === selectedScenarioId) || HISTORICAL_SCENARIOS[0];

  // 模拟压力测试下的预估损失
  const estimatedStockDropPercent = currentScenario.marketDrop;
  const estimatedLossCny = stockAssetsTotal * (Math.abs(estimatedStockDropPercent) / 100);
  const remainingAssetsCny = totalAssetsCny - estimatedLossCny;
  const portfolioDrawdownPercent = totalAssetsCny > 0 ? (estimatedLossCny / totalAssetsCny) * 100 : 0;

  const getHhiRiskLevel = (val: number) => {
    if (val >= 0.35) return { text: '极度集中 (高脆弱性)', color: 'text-[#A84A3E] bg-[#A84A3E]/10 border-[#A84A3E]/30' };
    if (val >= 0.2) return { text: '偏度集中 (中等风险)', color: 'text-[#B0803C] bg-[#B0803C]/10 border-[#B0803C]/30' };
    return { text: '分散适度 (健康水平)', color: 'text-[#4A7C6F] bg-[#4A7C6F]/10 border-[#4A7C6F]/30' };
  };

  const hhiLevel = getHhiRiskLevel(hhi);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-[#1C2426] rounded-2xl border border-[#E3E7E1] dark:border-[#2A383A] p-6 shadow-2xl space-y-6 my-8 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E3E7E1] dark:border-[#2A383A] pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#A84A3E]/10 text-[#A84A3E] border border-[#A84A3E]/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                投资组合黑天鹅压力测试与风险暴露审计
              </h3>
              <p className="text-xs text-[#576F73] dark:text-[#9BB2B4]">
                回放历史极端流动性危机与崩盘场景，检验当前持仓的抗跌韧性与最大回撤暴露
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7A9194] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 关键风险指标总览 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A]">
            <div className="text-[11px] text-[#7A9194] mb-1">95% 单日在险价值 (1-Day VaR)</div>
            <div className="text-xl font-black font-mono text-[#A84A3E]">
              -{formatMoney(round2(var95_1DayCny))}
            </div>
            <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] mt-1">
              正常市场波动下单日最大回撤 ≈ {var95Percent.toFixed(2)}%
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A]">
            <div className="text-[11px] text-[#7A9194] mb-1">集中度 HHI 指数</div>
            <div className="text-xl font-black font-mono text-[#3E6F73] dark:text-[#76B4B9]">
              {hhi.toFixed(3)}
            </div>
            <div className="mt-1">
              <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${hhiLevel.color}`}>
                {hhiLevel.text}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A]">
            <div className="text-[11px] text-[#7A9194] mb-1">防御性现金垫缓冲仓位</div>
            <div className="text-xl font-black font-mono text-[#4A7C6F]">
              {totalAssetsCny > 0 ? ((totalCashCny / totalAssetsCny) * 100).toFixed(1) : '0.0'}%
            </div>
            <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] mt-1">
              现金余额 {formatMoney(round2(totalCashCny))} (极端下跌时充当安全气囊)
            </div>
          </div>
        </div>

        {/* 历史压力场景选择 */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-[#3E6F73]" />
            <span>选择历史黑天鹅极端冲击情景：</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {HISTORICAL_SCENARIOS.map((sc) => {
              const isSelected = sc.id === selectedScenarioId;
              return (
                <button
                  key={sc.id}
                  onClick={() => setSelectedScenarioId(sc.id)}
                  className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1F3437] text-white border-[#1F3437] shadow-sm'
                      : 'bg-[#F6F7F5] dark:bg-[#141A1B] text-[#576F73] dark:text-[#9BB2B4] border-[#E3E7E1] dark:border-[#2A383A] hover:bg-[#ECEFEA] dark:hover:bg-[#253235]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`font-serif font-bold text-xs ${isSelected ? 'text-white' : 'text-[#1F3437] dark:text-[#E5EBEA]'}`}>
                      {sc.name}
                    </div>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      isSelected ? 'bg-red-500/20 text-red-200' : 'bg-[#A84A3E]/10 text-[#A84A3E]'
                    }`}>
                      大盘 {sc.marketDrop}%
                    </span>
                  </div>
                  <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-slate-300' : 'text-[#7A9194]'}`}>
                    {sc.period}
                  </div>
                  <p className={`text-[11px] mt-1.5 line-clamp-2 leading-relaxed ${isSelected ? 'text-slate-200' : 'text-[#576F73] dark:text-[#9BB2B4]'}`}>
                    {sc.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 压力测试模拟结果 */}
        <div className="p-4 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-1.5">
              <TrendingDown className="w-4 h-4 text-[#A84A3E]" />
              <span>当前组合在【{currentScenario.name}】下的压力模拟测算</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#A84A3E]">
              组合净值预计回撤: -{portfolioDrawdownPercent.toFixed(2)}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E3E7E1] dark:border-[#2A383A] text-xs font-mono">
            <div>
              <span className="text-[#7A9194] block text-[10px]">当前总资产</span>
              <span className="font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                {formatMoney(round2(totalAssetsCny))}
              </span>
            </div>
            <div>
              <span className="text-[#7A9194] block text-[10px]">权益持仓预估亏损额</span>
              <span className="font-bold text-[#A84A3E]">
                -{formatMoney(round2(estimatedLossCny))}
              </span>
            </div>
            <div>
              <span className="text-[#7A9194] block text-[10px]">极端冲击后剩余净值</span>
              <span className="font-bold text-[#3E6F73] dark:text-[#76B4B9]">
                {formatMoney(round2(Math.max(0, remainingAssetsCny)))}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] text-xs text-[#576F73] dark:text-[#9BB2B4] leading-relaxed">
            <span className="font-bold text-[#1F3437] dark:text-[#E5EBEA] mr-1.5">💡 买方风控启示：</span>
            {totalCashCny / totalAssetsCny < 0.1 ? (
              <span>
                当前现金垫仅为 {((totalCashCny / totalAssetsCny) * 100).toFixed(1)}%，权益仓位极重。一旦遭遇黑天鹅流动性收紧，缺乏在底部低吸优质资产的弹药。建议常态化保持 10%~20% 现金或短债垫。
              </span>
            ) : (
              <span>
                当前保有 {((totalCashCny / totalAssetsCny) * 100).toFixed(1)}% 的现金缓冲仓位，有效降低了组合在黑天鹅时期的全盘最大回撤，并在市场极端折价时具备逆向建仓能力。
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[#E3E7E1] dark:border-[#2A383A]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1F3437] hover:bg-[#274246] text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            完成审计并关闭
          </button>
        </div>
      </div>
    </div>
  );
};
