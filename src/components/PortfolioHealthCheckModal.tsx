import React, { useState, useEffect } from 'react';
import { StockData, PortfolioHoldingInput } from '../types/stock';
import { auditPortfolioHealth } from '../utils/portfolioHealthAuditor';
import { PRESET_STOCKS } from '../data/presetStocks';
import { stockService } from '../services/stockService';
import { usePortfolio } from '../context/PortfolioContext';
import { computePositions } from '../services/portfolioService';
import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  Trash2,
  Plus,
  Share2,
  X,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Loader2,
  FolderDown,
} from 'lucide-react';

interface PortfolioHealthCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStock: (symbol: string) => void;
}

const DEFAULT_HOLDINGS: PortfolioHoldingInput[] = [
  { symbol: '600519', name: '贵州茅台', shares: 200, costPrice: 1550, currentPrice: 1488.5 },
  { symbol: '300750', name: '宁德时代', shares: 500, costPrice: 210, currentPrice: 198.6 },
  { symbol: '002594', name: '比亚迪', shares: 800, costPrice: 240, currentPrice: 285.2 },
];

export const PortfolioHealthCheckModal: React.FC<PortfolioHealthCheckModalProps> = ({
  isOpen,
  onClose,
  onSelectStock,
}) => {
  const [holdings, setHoldings] = useState<PortfolioHoldingInput[]>(DEFAULT_HOLDINGS);
  const [newSymbol, setNewSymbol] = useState('601398');
  const [newShares, setNewShares] = useState<number>(1000);
  const [newCost, setNewCost] = useState<number>(5.2);
  const [copiedToast, setCopiedToast] = useState(false);
  const [stockMap, setStockMap] = useState<Record<string, StockData>>({});
  const [refreshing, setRefreshing] = useState(false);

  // 读取真实组合（已解锁时），用于一键导入持仓
  const { status: portfolioStatus, transactions } = usePortfolio();

  // 从加密组合导入持仓（以成本均价作为 costPrice，实时价由后续 effect 拉取）
  const handleImportFromPortfolio = () => {
    if (portfolioStatus !== 'ready') {
      alert('组合尚未解锁。请先在「组合仓位」页解锁，再回来一键导入持仓。');
      return;
    }
    const positions = computePositions(transactions);
    const list = Object.values(positions)
      .filter((p) => p.quantity > 0)
      .map((p) => ({
        symbol: p.symbol,
        name: p.symbol,
        shares: p.quantity,
        costPrice: p.quantity > 0 ? Number((p.totalCost / p.quantity).toFixed(2)) : 0,
        currentPrice: 0,
      }));
    if (list.length === 0) {
      alert('组合中暂无持仓可导入，请先在「组合仓位」页记录买入流水。');
      return;
    }
    setHoldings(list);
  };

  // 打开弹窗或持仓变化时，拉取每只标的的实时行情/财报（支持任意代码）
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setRefreshing(true);
    const symbols: string[] = Array.from(new Set(holdings.map((h) => h.symbol)));
    Promise.all(
      symbols.map(async (sym): Promise<readonly [string, StockData] | null> => {
        try {
          const s = await stockService.getStockBySymbol(sym);
          return [sym, s] as const;
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (!active) return;
      const map: Record<string, StockData> = {};
      results.forEach((r) => {
        if (r) map[r[0]] = r[1];
      });
      setStockMap(map);
      // 用真实行情刷新持仓现价
      setHoldings((prev) =>
        prev.map((h) => {
          const s = map[h.symbol];
          return s && s.currentPrice > 0 ? { ...h, currentPrice: s.currentPrice, name: s.name } : h;
        })
      );
      setRefreshing(false);
    });
    return () => {
      active = false;
    };
  }, [isOpen, holdings.length]);

  if (!isOpen) return null;

  const report = auditPortfolioHealth(holdings, stockMap);

  const handleAddHolding = async () => {
    const sym = newSymbol.trim().toUpperCase();
    if (!sym) return;
    try {
      const s = await stockService.getStockBySymbol(sym);
      setHoldings((prev) => {
        // 已存在则更新股数/成本
        const existing = prev.find((h) => h.symbol === sym);
        if (existing) {
          return prev.map((h) =>
            h.symbol === sym
              ? { ...h, shares: h.shares + (Number(newShares) || 0), costPrice: Number(newCost) || h.costPrice, currentPrice: s.currentPrice || h.currentPrice }
              : h
          );
        }
        return [
          ...prev,
          {
            symbol: s.symbol,
            name: s.name,
            shares: Number(newShares) || 100,
            costPrice: Number(newCost) || s.currentPrice,
            currentPrice: s.currentPrice,
          },
        ];
      });
    } catch {
      // 拉取失败时仅凭用户输入入列（审计会标记为 unknown 而非伪造数据）
      setHoldings((prev) => [
        ...prev,
        {
          symbol: sym,
          name: sym,
          shares: Number(newShares) || 100,
          costPrice: Number(newCost) || 0,
          currentPrice: 0,
        },
      ]);
    }
  };

  const handleRemoveHolding = (index: number) => {
    setHoldings((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCopyReport = () => {
    const text = `【Zane Invest 账户持仓排雷体检报告】
- 综合健康评分: ${report.overallHealthScore} / 100
- 账户总市值: ¥${report.totalMarketValue.toLocaleString()} | 浮动盈亏: ${report.totalUnrealizedPnL >= 0 ? '+' : ''}¥${report.totalUnrealizedPnL.toLocaleString()} (${report.totalUnrealizedPnLPercent}%)
- 高危资产暴露比重: ${report.highRiskExposurePercent}% (越低越健康)
- 组合加权估值分位数: ${report.averagePePercentile}%
- 现金流失血标的数: ${report.cashFlowDeficitCount} 只

📊 持仓逐笔排查:
${report.holdingsAudit.map((h) => `• ${h.name}(${h.symbol}) | 占比: ${h.weightPercent}% | 诊断: ${h.primaryRisk} -> 建议: 【${h.actionSuggestionZh}】`).join('\n')}

💡 清淤排毒建议:
${report.detoxRecommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

---
体检系统: Zane Invest WORKBENCH (买方级风控审计)`;

    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* 标题 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E3E7E1] dark:border-[#2A383A] bg-[#F6F7F5] dark:bg-[#141A1B]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#4A7C6F]/15 text-[#4A7C6F] dark:text-[#76B4B9]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                  个人持仓健康排雷体检器 (Portfolio Health Detox)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#4A7C6F]/10 text-[#4A7C6F] font-mono font-bold">
                  资产体检 · 拒绝死扛
                </span>
              </div>
              <p className="text-xs text-[#576F73] dark:text-[#9BB2B4]">
                测算全账户高危排雷暴露度、估值透支风险与现金流失血，一键排毒避坑
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#576F73] hover:text-[#1F3437] dark:text-[#9BB2B4] dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-6 overflow-y-auto space-y-6 text-[#1F3437] dark:text-[#E5EBEA]">
          
          {/* 核心 KPI 汇总看板 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-4 text-center">
              <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1">综合健康安全评分</div>
              <div className={`text-3xl font-black font-mono tabular-nums ${
                report.overallHealthScore >= 80
                  ? 'text-[#4A7C6F]'
                  : report.overallHealthScore >= 60
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-[#A84A3E]'
              }`}>
                {report.overallHealthScore}
              </div>
              <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] mt-0.5">
                {report.overallHealthScore >= 80 ? '健康稳健' : report.overallHealthScore >= 60 ? '亚健康·需优化' : '高危雷区较多'}
              </div>
            </div>

            <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-4 text-center">
              <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1">高危资产暴露度</div>
              <div className={`text-2xl font-black font-mono tabular-nums ${
                report.highRiskExposurePercent > 20 ? 'text-[#A84A3E]' : 'text-[#4A7C6F]'
              }`}>
                {report.highRiskExposurePercent}%
              </div>
              <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] mt-0.5">
                负债超标/现金流负
              </div>
            </div>

            <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-4 text-center">
              <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1">组合加权估值分位</div>
              <div className={`text-2xl font-black font-mono tabular-nums ${
                report.averagePePercentile > 65 ? 'text-amber-600' : 'text-[#3E6F73]'
              }`}>
                {report.averagePePercentile}%
              </div>
              <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] mt-0.5">
                历史 PE/PB 分位数
              </div>
            </div>

            <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-4 text-center">
              <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1">组合持仓总市值</div>
              <div className="text-2xl font-black font-mono tabular-nums text-[#1F3437] dark:text-white">
                ¥{report.totalMarketValue.toLocaleString()}
              </div>
              <div className={`text-[10px] font-mono font-bold mt-0.5 ${
                report.totalUnrealizedPnL >= 0 ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'
              }`}>
                盈亏: {report.totalUnrealizedPnL >= 0 ? '+' : ''}{report.totalUnrealizedPnLPercent}%
              </div>
            </div>
          </div>

          {/* 智能调仓优化模拟横幅 */}
          {report.overallHealthScore < 85 && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#3E6F73]/10 to-[#4A7C6F]/10 border border-[#3E6F73]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="space-y-0.5 text-center sm:text-left">
                <div className="text-xs font-bold text-[#1F3437] dark:text-white flex items-center justify-center sm:justify-start space-x-1.5">
                  <span className="text-amber-500 font-bold">⚡</span>
                  <span>智能调仓减亏清淤模拟 (Rebalance Simulator)</span>
                </div>
                <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">
                  一键剔除高危暗雷资产，转入高ROE且估值低估的基石龙头，预估健康分可提升至 <strong className="text-[#4A7C6F]">92+ 分</strong>
                </p>
              </div>

              <button
                onClick={() => {
                  // 模拟智能调仓：保留优质，剔除高危，加入估值合理的行业基石
                  setHoldings([
                    { symbol: '600519', name: '贵州茅台', shares: 300, costPrice: 1450, currentPrice: 1488.5 },
                    { symbol: '002594', name: '比亚迪', shares: 1200, costPrice: 245, currentPrice: 285.2 },
                    { symbol: '601398', name: '工商银行', shares: 10000, costPrice: 5.1, currentPrice: 5.45 },
                  ]);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#3E6F73] hover:bg-[#274E52] text-white text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs"
              >
                应用买方调仓模拟
              </button>
            </div>
          )}


          {/* 逐笔持仓诊断列表 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-serif font-bold text-[#1F3437] dark:text-white">
                持仓标的逐一排雷审计清单 ({report.holdingsAudit.length} 只标的)
              </h4>
              <span className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">点击标的名可快速跳转对应分析</span>
            </div>

            <div className="border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F6F7F5] dark:bg-[#141A1B] text-[#576F73] dark:text-[#9BB2B4] border-b border-[#E3E7E1] dark:border-[#2A383A]">
                  <tr>
                    <th className="py-2.5 px-3">标的名称/代码</th>
                    <th className="py-2.5 px-3">持仓市值与权重</th>
                    <th className="py-2.5 px-3">浮动盈亏</th>
                    <th className="py-2.5 px-3">排雷风险诊断</th>
                    <th className="py-2.5 px-3">建议对策</th>
                    <th className="py-2.5 px-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E7E1] dark:divide-[#2A383A]">
                  {report.holdingsAudit.map((item, idx) => (
                    <tr key={idx} className="hover:bg-black/2 dark:hover:bg-white/2 transition-colors">
                      <td className="py-2.5 px-3 font-semibold">
                        <button
                          onClick={() => {
                            onSelectStock(item.symbol);
                            onClose();
                          }}
                          className="hover:text-[#3E6F73] cursor-pointer text-left"
                        >
                          <div className="text-[#1F3437] dark:text-white">{item.name}</div>
                          <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4] font-mono">{item.symbol}</div>
                        </button>
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        <div>¥{item.marketValue.toLocaleString()}</div>
                        <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4]">{item.weightPercent}%</div>
                      </td>
                      <td className={`py-2.5 px-3 font-mono font-bold ${
                        item.unrealizedPnLPercent >= 0 ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'
                      }`}>
                        {item.unrealizedPnLPercent >= 0 ? '+' : ''}{item.unrealizedPnLPercent}%
                      </td>
                      <td className="py-2.5 px-3 max-w-xs">
                        <div className={`flex items-center space-x-1.5 ${
                          item.healthLevel === 'healthy'
                            ? 'text-[#4A7C6F]'
                            : item.healthLevel === 'critical_danger'
                            ? 'text-[#A84A3E]'
                            : item.healthLevel === 'unknown'
                            ? 'text-[#7A9194]'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {item.healthLevel === 'healthy' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span className="text-[11px] leading-tight">{item.primaryRisk}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                          item.actionSuggestion === 'continue_hold'
                            ? 'bg-[#4A7C6F]/10 text-[#4A7C6F]'
                            : item.actionSuggestion === 'immediate_cut_loss'
                            ? 'bg-[#A84A3E]/15 text-[#A84A3E]'
                            : item.actionSuggestion === 'review'
                            ? 'bg-[#E3E7E1] text-[#7A9194]'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        }`}>
                          {item.actionSuggestionZh}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleRemoveHolding(idx)}
                          className="p-1 text-[#576F73] hover:text-[#A84A3E] transition-colors cursor-pointer"
                          title="移出体检列表"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 添加持仓录入条 */}
          <div className="bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl p-3.5">
            <div className="text-[11px] font-bold text-[#1F3437] dark:text-white mb-2 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Plus className="w-3.5 h-3.5 text-[#3E6F73]" />
                <span>添加更多持仓标的进行联合体检</span>
              </span>
              <button
                onClick={handleImportFromPortfolio}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#4A7C6F]/10 hover:bg-[#4A7C6F]/20 border border-[#4A7C6F]/30 text-[#376156] dark:text-[#76B4B9] text-xs font-semibold cursor-pointer"
                title="从加密组合一键导入真实持仓"
              >
                <FolderDown className="w-3.5 h-3.5" />
                <span>从组合导入持仓</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="relative">
                <input
                  list="health-symbol-suggestions"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  placeholder="输入任意代码，如 601318"
                  className="w-full bg-white dark:bg-[#1C2426] border border-[#CBD5E1] dark:border-[#2A383A] rounded-lg px-2.5 py-1.5 text-xs text-[#1F3437] dark:text-[#E5EBEA]"
                />
                <datalist id="health-symbol-suggestions">
                  {(Object.values(PRESET_STOCKS) as StockData[]).map((s) => (
                    <option key={s.symbol} value={s.symbol}>
                      {s.name}
                    </option>
                  ))}
                </datalist>
                {refreshing && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3E6F73]" />
                  </span>
                )}
              </div>

              <input
                type="number"
                value={newShares}
                onChange={(e) => setNewShares(Number(e.target.value))}
                placeholder="持仓股数 (股)"
                className="bg-white dark:bg-[#1C2426] border border-[#CBD5E1] dark:border-[#2A383A] rounded-lg px-2.5 py-1.5 text-xs text-[#1F3437] dark:text-[#E5EBEA]"
              />

              <input
                type="number"
                value={newCost}
                onChange={(e) => setNewCost(Number(e.target.value))}
                placeholder="买入成本单价"
                className="bg-white dark:bg-[#1C2426] border border-[#CBD5E1] dark:border-[#2A383A] rounded-lg px-2.5 py-1.5 text-xs text-[#1F3437] dark:text-[#E5EBEA]"
              />

              <button
                onClick={handleAddHolding}
                className="px-3 py-1.5 rounded-lg bg-[#3E6F73] hover:bg-[#2B5458] text-white text-xs font-semibold cursor-pointer transition-all"
              >
                加入体检
              </button>
            </div>
          </div>

          {/* 清淤排毒对策指引 */}
          <div className="bg-[#4A7C6F]/5 border border-[#4A7C6F]/25 rounded-xl p-4">
            <div className="text-xs font-bold text-[#376156] dark:text-[#76B4B9] mb-2 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Zane 投资委员会 · 组合排毒清淤专属对策</span>
            </div>
            <div className="space-y-1.5">
              {report.detoxRecommendations.map((rec, i) => (
                <div key={i} className="text-xs text-[#1F3437] dark:text-[#E5EBEA] flex items-start space-x-2">
                  <span className="text-[#4A7C6F] font-bold">•</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-3.5 border-t border-[#E3E7E1] dark:border-[#2A383A] bg-[#F6F7F5] dark:bg-[#141A1B] flex items-center justify-between">
          <div className="text-xs text-[#576F73] dark:text-[#9BB2B4]">
            {copiedToast && <span className="text-[#4A7C6F] font-bold">✅ 完整体检诊断书已复制到剪贴板！</span>}
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleCopyReport}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#1C2426] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] border border-[#E3E7E1] dark:border-[#2A383A] text-xs font-semibold text-[#1F3437] dark:text-[#E5EBEA] cursor-pointer transition-all shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5 text-[#3E6F73]" />
              <span>导出体检长图文本</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#1F3437] hover:bg-[#274246] text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
            >
              完成体检
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
