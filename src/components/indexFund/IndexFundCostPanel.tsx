import React from 'react';
import { Info } from 'lucide-react';
import { IndexFundItem } from '../../types/indexFund';

interface ShareCostSim {
  costA: number;
  costC: number;
  crossoverDays: number;
  diff: number;
  recClass: string;
  salesFee: number;
  subFee: number;
}

export function IndexFundCostPanel({
  fund,
  costSim,
  investmentAmount,
  setInvestmentAmount,
  holdingDays,
  setHoldingDays,
}: {
  fund: IndexFundItem;
  costSim: ShareCostSim;
  investmentAmount: number;
  setInvestmentAmount: (value: number) => void;
  holdingDays: number;
  setHoldingDays: (value: number) => void;
}) {
  return (
<div className="p-5 rounded-2xl bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-[#E3E7E1] dark:border-[#2A383A]">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#1F3437] text-white">
                  {fund.code}
                </span>
                <h3 className="text-base font-bold font-serif text-[#1F3437] dark:text-[#E5EBEA]">
                  【{fund.name}】A类 vs C类 持有成本动态交叉平衡点测算
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
                  <span>前端申购费 (1折后 {fund.discountedSubscriptionFee}%):</span>
                  <span className="font-mono font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                    ¥{costSim.subFee.toFixed(2)} 元
                  </span>
                </div>
                <div className="flex justify-between text-[#576F73] dark:text-[#9BB2B4]">
                  <span>年化持有费 (管理费{fund.managementFee}% + 托管费{fund.custodyFee}%):</span>
                  <span className="font-mono font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                    {(fund.managementFee + fund.custodyFee).toFixed(2)}%/年
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
                  <span>年化持有费 (管理费{fund.managementFee}% + 托管费{fund.custodyFee}%):</span>
                  <span className="font-mono font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                    {(fund.managementFee + fund.custodyFee).toFixed(2)}%/年
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
  );
}
