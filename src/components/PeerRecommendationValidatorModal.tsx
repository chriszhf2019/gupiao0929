import React, { useState, useEffect } from 'react';
import { StockData, PeerRecommendationRecord } from '../types/stock';
import { auditPeerRecommendation } from '../utils/peerRecommendationAuditor';
import { PRESET_STOCKS } from '../data/presetStocks';
import { stockService } from '../services/stockService';
import { usePortfolio } from '../context/PortfolioContext';
import { VaultPasswordGate } from './portfolio/VaultPasswordGate';
import {
  Users,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Share2,
  X,
  Sparkles,
  HelpCircle,
  MessageSquareQuote,
  BookmarkPlus,
  History,
  TrendingUp,
  Award,
  ThumbsDown,
  Loader2,
} from 'lucide-react';

interface PeerRecommendationValidatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStock: StockData;
  onSelectStock: (symbol: string) => void;
}

export const PeerRecommendationValidatorModal: React.FC<PeerRecommendationValidatorModalProps> = ({
  isOpen,
  onClose,
  currentStock,
  onSelectStock,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'history'>('audit');
  const [symbol, setSymbol] = useState(currentStock.symbol);
  const [recommenderName, setRecommenderName] = useState('老张 / 某投资群球友');
  const [sourceChannel, setSourceChannel] = useState<PeerRecommendationRecord['sourceChannel']>('friend');
  const [recommendedReason, setRecommendedReason] = useState('听说行业出现大反转，近期有主力资金疯狂扫货，目标价看翻倍');
  const [userAttitude, setUserAttitude] = useState<PeerRecommendationRecord['userAttitude']>('skeptical');
  const [copiedToast, setCopiedToast] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [activeStock, setActiveStock] = useState<StockData | null>(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [priceMap, setPriceMap] = useState<Record<string, number>>({});

  const {
    status,
    peerHistory: historyRecords,
    setPeerHistory: setHistoryRecords,
    error: vaultError,
    unlock,
    setup,
    reset,
  } = usePortfolio();

  // 当外部选股改变时同步
  useEffect(() => {
    if (currentStock) {
      setSymbol(currentStock.symbol);
    }
  }, [currentStock]);

  // 按当前 symbol 拉取实时行情（支持任意代码，不仅限于预置池）
  useEffect(() => {
    if (!isOpen || !symbol) return;
    let active = true;
    setStockLoading(true);
    stockService
      .getStockBySymbol(symbol)
      .then((s) => {
        if (active) setActiveStock(s);
      })
      .catch(() => {
        if (active) setActiveStock(null);
      })
      .finally(() => {
        if (active) setStockLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, symbol]);

  // 历史红黑榜：拉取各标的实时现价用于推后表现追踪
  useEffect(() => {
    if (!isOpen || activeTab !== 'history' || historyRecords.length === 0) return;
    let active = true;
    historyRecords.forEach(async (item) => {
      try {
        const s = await stockService.getStockBySymbol(item.symbol);
        if (active && s.currentPrice > 0) {
          setPriceMap((prev) => ({ ...prev, [item.symbol]: s.currentPrice }));
        }
      } catch {
        // 忽略单只失败
      }
    });
    return () => {
      active = false;
    };
  }, [isOpen, activeTab, historyRecords]);

  if (!isOpen) return null;

  if (status !== 'ready') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
        <div>
          <button onClick={onClose} className="mb-2 text-xs text-white">关闭</button>
          <VaultPasswordGate status={status} error={vaultError} onUnlock={unlock} onSetup={setup} onReset={reset} />
        </div>
      </div>
    );
  }

  const activeStockData = activeStock || PRESET_STOCKS[symbol] || currentStock;
  const auditResult = auditPeerRecommendation({
    symbol,
    recommenderName,
    sourceChannel,
    recommendedReason,
    userAttitude,
    stock: activeStockData,
  });

  const handleSaveToHistory = () => {
    setHistoryRecords((prev) => [auditResult, ...prev.filter((r) => r.id !== auditResult.id)]);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleRemoveHistory = (id: string) => {
    setHistoryRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleCopyCard = () => {
    const text = `【Zane Invest 他人荐股验真报告】
- 推荐标的: ${activeStockData.name} (${activeStockData.symbol}) | 现价: ${activeStockData.currency === 'USD' ? '$' : '¥'}${activeStockData.currentPrice}
- 推荐人/渠道: ${recommenderName} (${sourceChannel === 'friend' ? '朋友引荐' : sourceChannel === 'kol' ? 'KOL大V' : '社群传闻'})
- 推荐看好逻辑: “${recommendedReason}”

🔍 验真结论: 【${auditResult.verdictTitle}】
- 综合客观分: ${auditResult.verdictScore} / 100
- 关键诊断: ${auditResult.verdictExplanation}

⚠️ 识别到的暗雷与风险:
${auditResult.redFlags.length > 0 ? auditResult.redFlags.map((r, i) => `${i + 1}. ${r}`).join('\n') : '暂未发现重大财务或估值暗雷'}

💡 事实对照:
${auditResult.alignmentChecks.map((c) => `• [${c.dimension}] ${c.claim} -> 实况: ${c.fact} (${c.isPass ? '真实' : '存在水分'})`).join('\n')}

---
验真系统: Zane Invest WORKBENCH (客观中立·数据驱动)`;

    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* 标题头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E3E7E1] dark:border-[#2A383A] bg-[#F6F7F5] dark:bg-[#141A1B]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#3E6F73]/15 text-[#3E6F73] dark:text-[#76B4B9]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                  他人荐股客观验真机 (Peer Recommendation Validator)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3E6F73]/10 text-[#3E6F73] dark:text-[#76B4B9] font-mono font-bold">
                  照妖镜 · 防接盘
                </span>
              </div>
              <p className="text-xs text-[#576F73] dark:text-[#9BB2B4]">
                别人吹的牛靠不靠谱？一秒还原估值真实水位、真金白银现金流与主力派发意图
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Tab 切换 */}
            <div className="flex bg-[#E3E7E1] dark:bg-[#253235] p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  activeTab === 'audit'
                    ? 'bg-white dark:bg-[#1C2426] text-[#1F3437] dark:text-white shadow-xs'
                    : 'text-[#576F73] dark:text-[#9BB2B4] hover:text-[#1F3437]'
                }`}
              >
                实时验真
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1 rounded-md font-medium flex items-center space-x-1 transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-[#1C2426] text-[#1F3437] dark:text-white shadow-xs'
                    : 'text-[#576F73] dark:text-[#9BB2B4] hover:text-[#1F3437]'
                }`}
              >
                <History className="w-3 h-3" />
                <span>荐股红黑榜 ({historyRecords.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#576F73] hover:text-[#1F3437] dark:text-[#9BB2B4] dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 主体区 */}
        {activeTab === 'audit' ? (
          <div className="p-6 overflow-y-auto space-y-6 text-[#1F3437] dark:text-[#E5EBEA]">
            
            {/* 1. 录入/选择信息 */}
            <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-4 space-y-3.5">
              <div className="text-xs font-bold text-[#1F3437] dark:text-white flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <MessageSquareQuote className="w-4 h-4 text-[#3E6F73]" />
                  <span>录入他人推荐信息与逻辑</span>
                </div>
                <button
                  onClick={handleSaveToHistory}
                  className="flex items-center space-x-1 text-[11px] text-[#3E6F73] hover:text-[#284B4E] dark:text-[#76B4B9] font-semibold cursor-pointer"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>{savedToast ? '已保存至红黑榜！' : '保存到历史红黑榜'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1">推荐标的（代码/名称）</label>
                  <div className="flex items-center space-x-1.5">
                    <input
                      list="peer-symbol-suggestions"
                      value={symbol}
                      onChange={(e) => {
                        const v = e.target.value.trim().toUpperCase();
                        setSymbol(v);
                        if (v) onSelectStock(v);
                      }}
                      placeholder="输入任意代码，如 601318 / 600519"
                      className="w-full bg-white dark:bg-[#1C2426] border border-[#CBD5E1] dark:border-[#2A383A] rounded-lg px-2.5 py-1.5 text-xs text-[#1F3437] dark:text-[#E5EBEA] font-semibold focus:outline-none focus:ring-1 focus:ring-[#3E6F73]"
                    />
                    <datalist id="peer-symbol-suggestions">
                      {(Object.values(PRESET_STOCKS) as StockData[]).map((s) => (
                        <option key={s.symbol} value={s.symbol}>
                          {s.name} - {s.sector}
                        </option>
                      ))}
                    </datalist>
                    {stockLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3E6F73] shrink-0" />}
                  </div>
                  {activeStockData && (
                    <div className="mt-1 text-[10px] text-[#576F73] dark:text-[#9BB2B4] font-mono">
                      {activeStockData.name} · 现价 {activeStockData.currency === 'USD' ? '$' : '¥'}{activeStockData.currentPrice}
                      {activeStockData.isRealtime === true ? (
                        <span className="text-[#4A7C6F]">（实时行情）</span>
                      ) : (
                        <span className="text-[#A84A3E]">（演示数据）</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1">谁推荐的 / 渠道</label>
                  <input
                    type="text"
                    value={recommenderName}
                    onChange={(e) => setRecommenderName(e.target.value)}
                    placeholder="如: 老张 / 某雪球大V / 同事"
                    className="w-full bg-white dark:bg-[#1C2426] border border-[#CBD5E1] dark:border-[#2A383A] rounded-lg px-2.5 py-1.5 text-xs text-[#1F3437] dark:text-[#E5EBEA] focus:outline-none focus:ring-1 focus:ring-[#3E6F73]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1">推荐渠道属性</label>
                  <select
                    value={sourceChannel}
                    onChange={(e) => setSourceChannel(e.target.value as any)}
                    className="w-full bg-white dark:bg-[#1C2426] border border-[#CBD5E1] dark:border-[#2A383A] rounded-lg px-2.5 py-1.5 text-xs text-[#1F3437] dark:text-[#E5EBEA] focus:outline-none focus:ring-1 focus:ring-[#3E6F73]"
                  >
                    <option value="friend">朋友/同事私下推荐</option>
                    <option value="kol">社交平台 KOL / 财经博主</option>
                    <option value="community">股票交流群传闻</option>
                    <option value="broker">券商客户经理推介</option>
                    <option value="relative">亲友“内幕传闻”</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1">对方推荐看好的核心理由</label>
                <textarea
                  value={recommendedReason}
                  onChange={(e) => setRecommendedReason(e.target.value)}
                  rows={2}
                  placeholder="把对方吹的核心逻辑或内幕传闻填在这里..."
                  className="w-full bg-white dark:bg-[#1C2426] border border-[#CBD5E1] dark:border-[#2A383A] rounded-lg p-2.5 text-xs text-[#1F3437] dark:text-[#E5EBEA] focus:outline-none focus:ring-1 focus:ring-[#3E6F73] resize-none"
                />
              </div>
            </div>

            {/* 2. 验真客观综合结论看板 */}
            <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
              auditResult.auditVerdict === 'resonance_buy'
                ? 'bg-[#4A7C6F]/10 border-[#4A7C6F]/40'
                : auditResult.auditVerdict === 'trap_distribution'
                ? 'bg-[#A84A3E]/10 border-[#A84A3E]/40'
                : 'bg-amber-500/10 border-amber-500/40'
            }`}>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-3xl font-black font-mono tabular-nums">
                    {auditResult.verdictScore}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-[#576F73] dark:text-[#9BB2B4]">验真可信度</div>
                </div>
                <div className="h-10 w-px bg-black/10 dark:bg-white/10" />
                <div>
                  <div className="text-xs text-[#576F73] dark:text-[#9BB2B4] font-medium">系统客观验真评定</div>
                  <div className={`text-base font-serif font-black flex items-center space-x-2 ${
                    auditResult.auditVerdict === 'resonance_buy'
                      ? 'text-[#376156] dark:text-[#4A7C6F]'
                      : auditResult.auditVerdict === 'trap_distribution'
                      ? 'text-[#8E3B30] dark:text-[#C55A4D]'
                      : 'text-amber-800 dark:text-amber-300'
                  }`}>
                    <span>{auditResult.verdictTitle}</span>
                    {auditResult.auditVerdict === 'resonance_buy' && <CheckCircle2 className="w-4 h-4" />}
                    {auditResult.auditVerdict === 'trap_distribution' && <ShieldAlert className="w-4 h-4" />}
                    {auditResult.auditVerdict === 'wait_pullback' && <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mt-0.5 max-w-lg leading-relaxed">
                    {auditResult.verdictExplanation}
                  </p>
                </div>
              </div>

              <div className="text-right text-xs shrink-0">
                <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">当前股价水位</div>
                <div className="font-mono font-bold text-[#1F3437] dark:text-white text-base">
                  {activeStockData.currency === 'USD' ? '$' : '¥'}{activeStockData.currentPrice}
                </div>
                <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4]">
                  PE分位: <span className="font-mono font-bold">{activeStockData.valuation.historicalPePercentile}%</span>
                  {activeStockData.isRealtime !== true && (
                    <span className="ml-1 text-[9px] px-1 py-0.5 rounded border border-[#A84A3E]/40 bg-[#A84A3E]/10 text-[#A84A3E] font-semibold" title="实时行情源暂不可用，当前为演示数据">演示</span>
                  )}
                </div>
              </div>
            </div>

            {/* 3. 识破的暗雷与潜在坑点 */}
            {auditResult.redFlags.length > 0 && (
              <div className="p-4 rounded-xl bg-[#A84A3E]/5 border border-[#A84A3E]/30 space-y-2">
                <div className="text-xs font-bold text-[#A84A3E] flex items-center space-x-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#A84A3E]" />
                  <span>穿透发现的潜在暗雷（对方大概率未告知你或故意忽略）</span>
                </div>
                <div className="space-y-1.5">
                  {auditResult.redFlags.map((flag, idx) => (
                    <div key={idx} className="text-xs text-[#A84A3E] flex items-start space-x-2">
                      <span className="font-mono font-bold">⚠️</span>
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. 事实与对方吹点对齐清单 */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-serif font-bold text-[#1F3437] dark:text-white flex items-center justify-between">
                <span>核心维度事实核实清单（对方吹词 vs 财务实况）</span>
                <span className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">数据来源于审计后定期财务报表</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {auditResult.alignmentChecks.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border ${
                      item.isPass
                        ? 'bg-white dark:bg-[#1C2426] border-[#E3E7E1] dark:border-[#2A383A]'
                        : 'bg-amber-500/5 border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#1F3437] dark:text-white flex items-center space-x-1.5">
                        {item.isPass ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#4A7C6F]" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        )}
                        <span>{item.dimension}</span>
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                        item.isPass ? 'bg-[#4A7C6F]/10 text-[#4A7C6F]' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      }`}>
                        {item.isPass ? '真实可信' : '存在虚高水分'}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] space-y-1">
                      <div>
                        对方说法: <span className="italic text-[#1F3437] dark:text-white">“{item.claim}”</span>
                      </div>
                      <div>
                        真实实况: <strong className="text-[#1F3437] dark:text-white">{item.fact}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          /* 历史红黑榜 Tab */
          <div className="p-6 overflow-y-auto space-y-4 text-[#1F3437] dark:text-[#E5EBEA]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-serif font-bold text-[#1F3437] dark:text-white flex items-center space-x-1.5">
                  <Award className="w-4 h-4 text-[#3E6F73]" />
                  <span>推荐人胜率追踪与红黑榜账本</span>
                </h4>
                <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">
                  记录朋友和大V每次推票的历史表现，看清谁是神仙推手、谁是反向指标
                </p>
              </div>
              <button
                onClick={() => setActiveTab('audit')}
                className="text-xs text-[#3E6F73] dark:text-[#76B4B9] font-bold hover:underline cursor-pointer"
              >
                + 验真新股票
              </button>
            </div>

            {historyRecords.length === 0 ? (
              <div className="text-center py-12 text-[#576F73] dark:text-[#9BB2B4] text-xs">
                暂无历史记录，在“实时验真”中点击“保存到历史红黑榜”即可建档追踪。
              </div>
            ) : (
              <div className="space-y-3">
                {historyRecords.map((item) => {
                  const s = PRESET_STOCKS[item.symbol];
                  const currentP = priceMap[item.symbol] || (s ? s.currentPrice : item.recommendedPrice);
                  const returnRate = item.recommendedPrice > 0
                    ? Number((((currentP - item.recommendedPrice) / item.recommendedPrice) * 100).toFixed(1))
                    : 0;

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-[#E3E7E1] dark:border-[#2A383A] bg-[#F6F7F5] dark:bg-[#141A1B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-[#1F3437] dark:text-white">
                            {item.stockName} ({item.symbol})
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#3E6F73]/10 text-[#3E6F73] dark:text-[#76B4B9] font-medium">
                            {item.recommenderName}
                          </span>
                          <span className="text-[10px] text-[#576F73] dark:text-[#9BB2B4]">
                            {item.recommendedDate}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] line-clamp-1">
                          推荐理由: “{item.recommendedReason}”
                        </p>
                        <div className="text-[11px] font-medium">
                          验真结论: <strong className={item.auditVerdict === 'resonance_buy' ? 'text-[#4A7C6F]' : item.auditVerdict === 'trap_distribution' ? 'text-[#A84A3E]' : 'text-amber-600'}>{item.verdictTitle}</strong> (得分: {item.verdictScore})
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4]">推后表现追踪</div>
                          <div className={`text-sm font-mono font-black ${returnRate >= 0 ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'}`}>
                            {returnRate >= 0 ? '+' : ''}{returnRate}%
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSymbol(item.symbol);
                            setActiveTab('audit');
                            onSelectStock(item.symbol);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1C2426] border border-[#CBD5E1] dark:border-[#2A383A] text-xs font-semibold hover:text-[#3E6F73] cursor-pointer"
                        >
                          重新验真
                        </button>

                        <button
                          onClick={() => handleRemoveHistory(item.id)}
                          className="text-[#576F73] hover:text-[#A84A3E] text-xs cursor-pointer"
                          title="删除"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 底部操作区 */}
        <div className="px-6 py-3.5 border-t border-[#E3E7E1] dark:border-[#2A383A] bg-[#F6F7F5] dark:bg-[#141A1B] flex items-center justify-between">
          <div className="text-xs text-[#576F73] dark:text-[#9BB2B4]">
            {copiedToast && <span className="text-[#4A7C6F] font-bold">✅ 验真卡片已复制到剪贴板，可直接发至微信交流！</span>}
            {savedToast && <span className="text-[#3E6F73] font-bold">✅ 已成功归档至推荐人红黑榜！</span>}
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleCopyCard}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#1C2426] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] border border-[#E3E7E1] dark:border-[#2A383A] text-xs font-semibold text-[#1F3437] dark:text-[#E5EBEA] cursor-pointer transition-all shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5 text-[#3E6F73]" />
              <span>复制验真卡片</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#1F3437] hover:bg-[#274246] text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
            >
              关闭
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
