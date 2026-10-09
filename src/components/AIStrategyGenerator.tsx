import React, { useState } from 'react';
import { AIStockStrategy } from '../types/stock';
import { aiService } from '../services/aiService';
import { 
  Sparkles, 
  Send, 
  ShieldAlert, 
  Target, 
  Sliders, 
  CheckCircle2, 
  Bookmark, 
  TrendingUp, 
  Clock, 
  Compass, 
  Layers,
  ArrowRight,
  RefreshCw,
  BookOpen
} from 'lucide-react';

interface AIStrategyGeneratorProps {
  onSelectStock: (symbol: string) => void;
  onApplyStrategyFilter?: (strategy: AIStockStrategy) => void;
}

const INSPIRATION_IDEAS = [
  {
    title: '普通人三维选股模型',
    prompt: '基于「股价=EPS×PE」公式赚三种钱：1.盈利增长维度(增速≥15%,ROE≥15%,毛利率≥20%,现金流覆盖80%); 2.估值安全维度(PE分位<30%,PEG≤1,行业对比低20%,排除PE>100); 3.股息收益维度(股息率≥2.5%,分红率≥30%,连续分红≥5年,现金流覆盖分红1.5倍)。根据牛熊阶段调权重。',
  },
  {
    title: '巴菲特护城河白马',
    prompt: '寻找毛利率持续大于40%，近3年ROE大于15%，现金流净额覆盖净利润，且当前估值PE处于历史30%分位以下的行业龙头白马。',
  },
  {
    title: '低估值高股息奶牛',
    prompt: '大类资产防守配置：寻找股息率大于4.5%，资产负债率低于55%，自由现金流充沛且市净率PB合理的央国企与公用事业龙头。',
  },
  {
    title: '硬科技高研发突破',
    prompt: '硬科技产业链突围：研发费用率大于8%，处于高景气周期，行业具备国产替代壁垒，技术面在关键均线支撑位企稳。',
  },
  {
    title: '出海破局全球化领军',
    prompt: '寻找海外营收占比大于30%，具备全球成本与供应链定价权优势，PEG小于1.2的全球化高端制造领头羊。',
  },
];

export const AIStrategyGenerator: React.FC<AIStrategyGeneratorProps> = ({
  onSelectStock,
  onApplyStrategyFilter,
}) => {
  const [ideaInput, setIdeaInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStrategy, setCurrentStrategy] = useState<AIStockStrategy | null>(null);
  const [savedStrategies, setSavedStrategies] = useState<AIStockStrategy[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  const handleGenerate = async (promptToUse?: string) => {
    const text = (promptToUse || ideaInput).trim();
    if (!text) return;

    setIsGenerating(true);
    setIsSaved(false);

    try {
      const strategy = await aiService.generateStrategy(text);
      if (strategy) {
        setCurrentStrategy(strategy);
      }
    } catch (e) {
      console.error('Failed to generate strategy:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveStrategy = () => {
    if (!currentStrategy) return;
    if (!savedStrategies.some((s) => s.id === currentStrategy.id)) {
      setSavedStrategies([currentStrategy, ...savedStrategies]);
    }
    setIsSaved(true);
  };

  return (
    <div className="space-y-6">
      {/* 头部标题与设计理念 */}
      <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] p-6 rounded-2xl shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-[#3E6F73] dark:text-[#76B4B9] font-bold uppercase tracking-wider mb-1">
              <Compass className="w-4 h-4 text-[#3E6F73]" />
              <span>AI 自然语言思路转量化选股策略引擎</span>
            </div>
            <h2 className="text-xl font-serif font-black text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-2">
              <span>输入投资灵感思路，一键生成买方量化选股方案</span>
            </h2>
            <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] mt-1 max-w-3xl">
              不再被机械参数所束缚。您可以输入任意日常投资思考、赛道偏好或护城河假设，AI 将自动拆解为严谨的【盈利壁垒、排雷指标、估值分位、建仓纪律及匹配候选池】。
            </p>
          </div>

          {savedStrategies.length > 0 && (
            <div className="flex items-center space-x-2 bg-[#F6F7F5] dark:bg-[#141A1B] px-3 py-1.5 rounded-xl border border-[#E3E7E1] dark:border-[#2A383A] text-xs font-mono text-[#576F73] dark:text-[#9BB2B4]">
              <Bookmark className="w-3.5 h-3.5 text-[#3E6F73]" />
              <span>已归档策略: {savedStrategies.length} 套</span>
            </div>
          )}
        </div>

        {/* 灵感快捷芯片 */}
        <div className="mt-4 pt-4 border-t border-[#E3E7E1] dark:border-[#2A383A]">
          <div className="text-[11px] font-bold text-[#576F73] dark:text-[#9BB2B4] mb-2 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#3E6F73]" />
            <span>精选买方策略思路灵感（点击直接填入并测试）：</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {INSPIRATION_IDEAS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIdeaInput(item.prompt);
                  handleGenerate(item.prompt);
                }}
                disabled={isGenerating}
                className="px-3 py-1.5 rounded-xl text-xs bg-[#F6F7F5] dark:bg-[#141A1B] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] text-[#1F3437] dark:text-[#E5EBEA] border border-[#E3E7E1] dark:border-[#2A383A] transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <span className="font-semibold">{item.title}</span>
                <span className="text-[10px] text-[#7A9194] line-clamp-1 max-w-[120px] sm:max-w-[200px]">
                  {item.prompt}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 输入框与触发器 */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <textarea
              rows={2}
              value={ideaInput}
              onChange={(e) => setIdeaInput(e.target.value)}
              placeholder="例如：寻找毛利率大于35%，近3年ROE>15%，自由现金流健康，且估值PE处于历史25%低分位的新能源或高端制造出海龙头..."
              className="w-full px-4 py-2.5 text-xs bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl text-[#1F3437] dark:text-[#E5EBEA] placeholder-[#8C9E9E] focus:outline-none focus:border-[#3E6F73] transition-colors resize-none"
            />
          </div>
          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating || !ideaInput.trim()}
            className={`px-6 py-2.5 rounded-xl text-xs font-serif font-bold text-white transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer ${
              isGenerating || !ideaInput.trim()
                ? 'bg-[#A3B3B5] cursor-not-allowed'
                : 'bg-[#1F3437] hover:bg-[#274246] active:scale-98'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#76B4B9]" />
                <span>量化策略解构中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#76B4B9]" />
                <span>生成选股策略</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 策略呈现区域 */}
      {currentStrategy && (
        <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-6 shadow-xs space-y-6 transition-colors">
          {/* 策略标题与操作栏 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3E7E1] dark:border-[#2A383A] pb-5">
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#1F3437]/10 dark:bg-[#3E6F73]/20 text-[#1F3437] dark:text-[#76B4B9] border border-[#3E6F73]/30">
                  {currentStrategy.styleTag}
                </span>
                <h3 className="text-lg font-serif font-black text-[#1F3437] dark:text-[#E5EBEA]">
                  {currentStrategy.strategyName}
                </h3>
              </div>
              <div className="flex items-center space-x-4 text-xs text-[#576F73] dark:text-[#9BB2B4] mt-1.5">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-[#3E6F73]" />
                  <span>周期: {currentStrategy.expectedHoldingPeriod}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Target className="w-3.5 h-3.5 text-[#3E6F73]" />
                  <span>风险等级: {currentStrategy.riskLevel}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveStrategy}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center space-x-1.5 ${
                  isSaved
                    ? 'bg-[#4A7C6F]/15 border-[#4A7C6F]/40 text-[#4A7C6F]'
                    : 'bg-[#F6F7F5] dark:bg-[#141A1B] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] border-[#E3E7E1] dark:border-[#2A383A] text-[#1F3437] dark:text-[#E5EBEA]'
                }`}
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>已收藏至策略库</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>归档此策略</span>
                  </>
                )}
              </button>

              {onApplyStrategyFilter && (
                <button
                  onClick={() => onApplyStrategyFilter(currentStrategy)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#1F3437] hover:bg-[#274246] text-white transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#76B4B9]" />
                  <span>应用此策略筛选自选池</span>
                </button>
              )}
            </div>
          </div>

          {/* 投资哲学与底层逻辑 */}
          <div className="bg-[#F6F7F5] dark:bg-[#141A1B] p-4 rounded-xl border border-[#E3E7E1] dark:border-[#2A383A]">
            <div className="text-xs font-bold text-[#1F3437] dark:text-[#E5EBEA] mb-1 flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#3E6F73]" />
              <span>投资逻辑与超额收益来源 (Thesis & Alpha Origin)</span>
            </div>
            <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] leading-relaxed">
              {currentStrategy.philosophy}
            </p>
          </div>

          {/* 两列排布：指标量化阈值 vs 买卖纪律 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 左侧：严谨量化筛选条件清单 */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-xs font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                <Sliders className="w-4 h-4 text-[#3E6F73]" />
                <span>量化筛选指标与硬性阈值</span>
              </div>
              <div className="space-y-2">
                {currentStrategy.rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] text-[#1F3437] dark:text-[#E5EBEA]">
                          {rule.dimension}
                        </span>
                        <span className="font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                          {rule.metric}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-[#3E6F73] dark:text-[#76B4B9] bg-[#3E6F73]/10 px-2 py-0.5 rounded">
                        {rule.condition}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">
                      {rule.rationale}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧：买卖执行纪律与一票否决 */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                <Target className="w-4 h-4 text-[#3E6F73]" />
                <span>严格执行纪律与仓位风控</span>
              </div>

              <div className="p-4 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] space-y-3 text-xs">
                <div>
                  <span className="font-bold text-[#1F3437] dark:text-[#E5EBEA] block mb-0.5">
                    🔹 分批建仓标准：
                  </span>
                  <p className="text-[#576F73] dark:text-[#9BB2B4]">
                    {currentStrategy.executionPlan.entryStrategy}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-[#A84A3E] block mb-0.5">
                    🛑 严苛止损红线：
                  </span>
                  <p className="text-[#576F73] dark:text-[#9BB2B4]">
                    {currentStrategy.executionPlan.stopLossRule}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-[#4A7C6F] block mb-0.5">
                    🎯 动态止盈机制：
                  </span>
                  <p className="text-[#576F73] dark:text-[#9BB2B4]">
                    {currentStrategy.executionPlan.takeProfitRule}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-[#1F3437] dark:text-[#E5EBEA] block mb-0.5">
                    ⚖️ 组合仓位配比控制：
                  </span>
                  <p className="text-[#576F73] dark:text-[#9BB2B4]">
                    {currentStrategy.executionPlan.positionLimit}
                  </p>
                </div>
              </div>

              {/* 一票否决排雷 */}
              <div className="p-4 rounded-xl bg-[#A84A3E]/5 border border-[#A84A3E]/20 text-xs">
                <div className="text-[11px] font-bold text-[#A84A3E] mb-2 flex items-center space-x-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#A84A3E]" />
                  <span>一票否决排雷红线（命中任一直接剔除）：</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentStrategy.negativeChecklist.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-1.5 text-[11px] text-[#A84A3E]/90">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A84A3E]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 匹配度最高的候选标的池 */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-xs font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                <TrendingUp className="w-4 h-4 text-[#3E6F73]" />
                <span>基于此策略实时匹配的候选资产池（Top Matches）</span>
              </div>
              <span className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">
                点击任意标的即可深入研判
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {currentStrategy.matchedStocks.map((stock) => (
                <div
                  key={stock.symbol}
                  onClick={() => onSelectStock(stock.symbol)}
                  className="p-4 rounded-xl bg-[#F6F7F5] dark:bg-[#141A1B] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] border border-[#E3E7E1] dark:border-[#2A383A] transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-1.5">
                        <span>{stock.name}</span>
                        <span className="text-xs font-mono text-[#7A9194]">({stock.symbol})</span>
                      </div>
                      <div className="text-[11px] text-[#7A9194]">{stock.market}</div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#4A7C6F]/15 text-[#4A7C6F] border border-[#4A7C6F]/30">
                        匹配度 {stock.matchScore}%
                      </span>
                    </div>
                  </div>

                  {/* 核心指标快照 */}
                  <div className="grid grid-cols-3 gap-1 py-2 my-2 border-y border-[#E3E7E1] dark:border-[#2A383A] text-center font-mono">
                    <div>
                      <div className="text-[10px] text-[#7A9194]">毛利率</div>
                      <div className="text-xs font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                        {stock.metricsSnapshot.grossMargin}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#7A9194]">ROE</div>
                      <div className="text-xs font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                        {stock.metricsSnapshot.roe}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#7A9194]">PE分位</div>
                      <div className="text-xs font-bold text-[#3E6F73] dark:text-[#76B4B9]">
                        {stock.metricsSnapshot.pePercentile}%
                      </div>
                    </div>
                  </div>

                  {/* 高亮原因 */}
                  <div className="space-y-1 mb-3">
                    {stock.highlightReasons.map((reason, rIdx) => (
                      <div key={rIdx} className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] flex items-center space-x-1">
                        <span className="w-1 h-1 rounded-full bg-[#3E6F73]" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs font-medium text-[#3E6F73] dark:text-[#76B4B9] group-hover:translate-x-0.5 transition-transform pt-1">
                    <span>深入五步完整研判</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
