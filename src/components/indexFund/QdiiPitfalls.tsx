import React from 'react';
import { AlertTriangle, Clock, ShieldCheck } from 'lucide-react';

export function QdiiPitfalls() {
  return (
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
  );
}
