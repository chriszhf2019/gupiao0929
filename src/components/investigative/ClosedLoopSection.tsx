import React from 'react';
import { ClosedLoopMechanics, InvestigativeReport } from '../../types/stock';
import { ArrowRight, DollarSign, Wallet, Users, AlertTriangle, HelpCircle, ShieldAlert } from 'lucide-react';

interface ClosedLoopSectionProps {
  mechanics?: ClosedLoopMechanics;
  steps?: InvestigativeReport['hiddenClosedLoop'];
  logicSummary?: string;
}

export const ClosedLoopSection: React.FC<ClosedLoopSectionProps> = ({
  mechanics,
  steps = [],
  logicSummary,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2.5">
          <span className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-black text-xs">
            02
          </span>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              第二步：用“利益闭环”拆解底层逻辑
            </h3>
            <p className="text-xs text-slate-400">
              拆解“多方共赢但无真实需求”的利益闭环：钱从哪来、到哪去、谁在赚钱、谁在买单
            </p>
          </div>
        </div>
      </div>

      {/* 资金流与利益分发 4 节点流水图 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 节点 1: 钱从哪来 */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 relative flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-sky-400 mb-2">
              <DollarSign className="w-4 h-4" />
              <span>1. 钱从哪来 (资金起点)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {mechanics?.moneyOrigin || '财政补贴引导、研发专项与资本市场定增'}
            </p>
          </div>
          <div className="text-[10px] text-slate-500 mt-2">资金注入与杠杆启动</div>
        </div>

        {/* 节点 2: 谁在中间赚钱 */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 relative flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 mb-2">
              <Users className="w-4 h-4" />
              <span>2. 谁在中间分润 (获益者)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {mechanics?.intermediaryBeneficiaries || '项目课题方、数据中间商、做大营收主体'}
            </p>
          </div>
          <div className="text-[10px] text-slate-500 mt-2">政绩业绩双丰收</div>
        </div>

        {/* 节点 3: 钱流到哪去 */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 relative flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-purple-400 mb-2">
              <Wallet className="w-4 h-4" />
              <span>3. 钱到哪去 (最终沉淀)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {mechanics?.moneyDestination || '虚增样机流水、包装财报、高位拉估值变现'}
            </p>
          </div>
          <div className="text-[10px] text-slate-500 mt-2">资本高位兑现离场</div>
        </div>

        {/* 节点 4: 谁买单 */}
        <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/40 relative flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-rose-400 mb-2">
              <ShieldAlert className="w-4 h-4" />
              <span>4. 谁在买单 (最终接盘)</span>
            </div>
            <p className="text-xs text-rose-200/90 leading-relaxed font-medium">
              {mechanics?.costBearer || '二级市场普通投资者、垫资过度的供应链与终端车主'}
            </p>
          </div>
          <div className="text-[10px] text-rose-400/80 mt-2">承担资产贬值与坏账</div>
        </div>
      </div>

      {/* 核心缺失需求 */}
      <div className="p-4 rounded-xl bg-slate-950 border-l-4 border-amber-500 border-y border-r border-slate-800 flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="text-xs font-bold text-amber-300">致命漏洞：为何缺乏真实自发需求？</span>
          <p className="text-xs text-slate-300 leading-relaxed">
            {mechanics?.coreMissingDemand || '商业ROI算不过账，终端客户无自发回购动力，全靠补贴与考核行政命令强推。'}
          </p>
        </div>
      </div>

      {/* 4步循环递进时间轴 */}
      {steps && steps.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            闭环运转的四段递进暗流：
          </span>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {steps.map((s, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 font-semibold">
                  <span className="text-indigo-400 font-bold">阶段 {s.step || idx + 1}</span>
                  <span className="text-[11px] text-white font-bold">{s.title}</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 链条总结 */}
      {(mechanics?.chainSummary || logicSummary) && (
        <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-800/30 text-xs text-indigo-200">
          <span className="font-bold text-indigo-300">链条总结：</span>
          <span className="ml-1">{mechanics?.chainSummary || logicSummary}</span>
        </div>
      )}
    </div>
  );
};
