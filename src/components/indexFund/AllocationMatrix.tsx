import React from 'react';
import { AssetAllocationRecommendation } from '../../types/indexFund';
import { CheckCircle2 } from 'lucide-react';

type ProfileId = 'aggressive' | 'balanced' | 'conservative';

export function AllocationMatrix({
  profiles,
  selected,
  onSelect,
}: {
  profiles: AssetAllocationRecommendation[];
  selected: ProfileId;
  onSelect: (id: ProfileId) => void;
}) {
  const allocationProfiles = profiles;
  const selectedProfile = selected;
  const setSelectedProfile = onSelect;
  return (
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
  );
}
