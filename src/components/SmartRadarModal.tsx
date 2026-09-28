import React, { useState, useEffect, useRef } from 'react';
import { StockData, SmartRadarAlertRule } from '../types/stock';
import { PRESET_STOCKS } from '../data/presetStocks';
import { stockService } from '../services/stockService';
import {
  Bell,
  BellRing,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Plus,
  Trash2,
  X,
  Radio,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface SmartRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStock: StockData;
  onSelectStock: (symbol: string) => void;
}

const RADAR_STORAGE_KEY = 'zane_smart_radar_rules_v1';

export const SmartRadarModal: React.FC<SmartRadarModalProps> = ({
  isOpen,
  onClose,
  currentStock,
  onSelectStock,
}) => {
  const [rules, setRules] = useState<SmartRadarAlertRule[]>(() => {
    try {
      const saved = localStorage.getItem(RADAR_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // 默认内置两条实战监控规则样例（状态为监控中，由轮询引擎实时比价触发）
    return [
      {
        id: 'rule_default_1',
        symbol: '600519',
        stockName: '贵州茅台',
        triggerType: 'safety_margin_reached',
        title: '安全边际深度建仓线',
        conditionDescription: '现价接近或低于内在价值折价 20% (¥1420.00)',
        targetPrice: 1420.0,
        currentStatus: 'monitoring',
      },
      {
        id: 'rule_default_2',
        symbol: '300750',
        stockName: '宁德时代',
        triggerType: 'ma20_pullback_stable',
        title: '20日均线回踩企稳信号',
        conditionDescription: '股价回踩 MA20 支撑线且成交量缩窄',
        targetPrice: 192.0,
        currentStatus: 'monitoring',
      },
    ];
  });

  const [selectedType, setSelectedType] = useState<SmartRadarAlertRule['triggerType']>('safety_margin_reached');
  const [customPrice, setCustomPrice] = useState<number>(
    Number((currentStock.currentPrice * 0.92).toFixed(2))
  );
  const [priceMap, setPriceMap] = useState<Record<string, number>>({});
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);

  // 引用最新 rules，供轮询引擎读取，避免闭包过期导致重复触发
  const rulesRef = useRef(rules);
  useEffect(() => {
    rulesRef.current = rules;
  }, [rules]);

  useEffect(() => {
    try {
      localStorage.setItem(RADAR_STORAGE_KEY, JSON.stringify(rules));
    } catch {
      // ignore
    }
  }, [rules]);

  // ★ 真实预警引擎：每 30 秒拉取实时价并与目标价比对，命中即置为 triggered 并推送浏览器通知
  useEffect(() => {
    if (rulesRef.current.length === 0) return;
    let active = true;

    const fireNotification = (rule: SmartRadarAlertRule, price: number) => {
      if (typeof window === 'undefined' || typeof Notification === 'undefined') return;
      if (Notification.permission === 'granted') {
        try {
          new Notification(`盯盘哨兵触发：${rule.stockName}`, {
            body: `${rule.title}：现价 ${price} 已达触发价 ${rule.targetPrice}`,
          });
        } catch {
          // 通知失败不阻塞主流程
        }
      }
    };

    const check = async () => {
      if (!active || rulesRef.current.length === 0) return;
      setChecking(true);
      const monitorSymbols: string[] = Array.from(new Set(rulesRef.current.map((r) => r.symbol)));
      const prices: Record<string, number> = {};
      for (const sym of monitorSymbols) {
        try {
          const s = await stockService.getStockBySymbol(sym);
          prices[sym] = s.currentPrice;
        } catch {
          // 单只拉取失败跳过
        }
      }
      if (!active) return;
      setPriceMap((prev) => ({ ...prev, ...prices }));
      setLastCheck(new Date());
      setRules((prev) => {
        let changed = false;
        const next = prev.map((r) => {
          if (r.currentStatus !== 'monitoring') return r;
          // 事件型规则（质押/减持）无法自动比价，保持监控状态
          if (r.triggerType === 'pledge_or_reduction_warning') return r;
          const price = prices[r.symbol];
          if (!price || !r.targetPrice) return r;
          if (price <= r.targetPrice) {
            changed = true;
            fireNotification(r, price);
            const now = new Date();
            const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            return { ...r, currentStatus: 'triggered', triggeredAt: `今日 ${timeStr} 触发` };
          }
          return r;
        });
        return changed ? next : prev;
      });
      setChecking(false);
    };

    check();
    const timer = setInterval(check, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  if (!isOpen) return null;

  const handleAddRule = () => {
    let title = '安全边际买入触发线';
    let condition = `股价回落至深度价值买点 ¥${customPrice}`;

    if (selectedType === 'ma20_pullback_stable') {
      title = '20日线关键支撑回踩';
      condition = `股价回踩支撑位 ¥${customPrice} 且缩量不破`;
    } else if (selectedType === 'stop_loss_breached') {
      title = '硬核止损警戒线';
      condition = `跌破关键防守位 ¥${customPrice}，触发离场风控`;
    } else if (selectedType === 'pledge_or_reduction_warning') {
      title = '大股东质押/减持排雷哨兵';
      condition = '监控董监高大额减持或高比例股权质押风险披露';
    }

    const newRule: SmartRadarAlertRule = {
      id: `rule_${Date.now()}`,
      symbol: currentStock.symbol,
      stockName: currentStock.name,
      triggerType: selectedType,
      title,
      conditionDescription: condition,
      targetPrice: customPrice,
      currentStatus: 'monitoring',
    };

    // 请求浏览器通知权限，便于价格命中时实时推送
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try {
        Notification.requestPermission();
      } catch {
        // 忽略权限请求失败
      }
    }

    setRules((prev) => [newRule, ...prev]);
  };

  const handleRemoveRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const activeTriggersCount = rules.filter((r) => r.currentStatus === 'triggered').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* 标题 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E3E7E1] dark:border-[#2A383A] bg-[#F6F7F5] dark:bg-[#141A1B]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#3E6F73]/15 text-[#3E6F73] dark:text-[#76B4B9]">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                  智能风控与买点雷达盯盘哨兵 (Smart Alert Radar)
                </h3>
                {activeTriggersCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#A84A3E]/15 text-[#A84A3E] font-mono font-bold animate-pulse">
                    {activeTriggersCount} 条信号已触发
                  </span>
                )}
              </div>
              <p className="text-xs text-[#576F73] dark:text-[#9BB2B4]">
                锁定安全边际买入价、止损线与机构资金暗流，杜绝追涨杀跌与踏空
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

        {/* 主体区 */}
        <div className="p-6 overflow-y-auto space-y-6 text-[#1F3437] dark:text-[#E5EBEA]">
          
          {/* 1. 为当前标的设置哨兵监控 */}
          <div className="p-4 rounded-xl border border-[#3E6F73]/25 bg-[#3E6F73]/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1F3437] dark:text-white flex items-center space-x-1.5">
                <BellRing className="w-4 h-4 text-[#3E6F73]" />
                <span>为当前股票设置盯盘预警: {currentStock.name} ({currentStock.symbol})</span>
              </span>
              <span className="text-xs font-mono font-bold text-[#3E6F73]">
                现价: {currentStock.currency === 'USD' ? '$' : '¥'}{currentStock.currentPrice}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1">哨兵监控策略类型</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="w-full bg-white dark:bg-[#1C2426] border border-[#CBD5E1] dark:border-[#2A383A] rounded-lg px-2.5 py-1.5 text-xs text-[#1F3437] dark:text-[#E5EBEA] focus:outline-none focus:ring-1 focus:ring-[#3E6F73]"
                >
                  <option value="safety_margin_reached">🎯 安全边际打折建仓线</option>
                  <option value="ma20_pullback_stable">📈 20日均线回踩企稳信号</option>
                  <option value="stop_loss_breached">🛑 硬核破位止损报警线</option>
                  <option value="pledge_or_reduction_warning">⚠️ 大股东质押/减持排雷</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#576F73] dark:text-[#9BB2B4] mb-1">预警触发目标价 (元)</label>
                <input
                  type="number"
                  step="0.1"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(Number(e.target.value))}
                  className="w-full bg-white dark:bg-[#1C2426] border border-[#CBD5E1] dark:border-[#2A383A] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#1F3437] dark:text-[#E5EBEA] focus:outline-none focus:ring-1 focus:ring-[#3E6F73]"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleAddRule}
                  className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-[#3E6F73] hover:bg-[#2B5458] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>加入哨兵雷达</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. 正在监控中的哨兵规则列表 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-serif font-bold text-[#1F3437] dark:text-white flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-[#3E6F73]" />
                <span>哨兵规则池 ({rules.length} 条有效监控)</span>
              </h4>
              <span className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] flex items-center space-x-1">
                {checking && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>
                  实时比价轮询中
                  {lastCheck ? ` · 上次检查 ${lastCheck.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : ''}
                </span>
              </span>
            </div>

            {rules.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-[#CBD5E1] dark:border-[#2A383A] rounded-xl text-xs text-[#576F73] dark:text-[#9BB2B4]">
                暂无监控规则，可在上方为当前股票快速创建买点哨兵。
              </div>
            ) : (
              <div className="space-y-2.5">
                {rules.map((rule) => {
                  const s = PRESET_STOCKS[rule.symbol];
                  const currentPrice = priceMap[rule.symbol] || (s ? s.currentPrice : (rule.targetPrice || 100));
                  const isTriggered = rule.currentStatus === 'triggered';
                  const isRealPrice = priceMap[rule.symbol] !== undefined && priceMap[rule.symbol] > 0;

                  return (
                    <div
                      key={rule.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                        isTriggered
                          ? 'bg-[#A84A3E]/5 border-[#A84A3E]/35 dark:border-[#A84A3E]/40'
                          : 'bg-white dark:bg-[#1C2426] border-[#E3E7E1] dark:border-[#2A383A]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-[#1F3437] dark:text-white">
                            {rule.stockName} ({rule.symbol})
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#3E6F73]/10 text-[#3E6F73] dark:text-[#76B4B9]">
                            {rule.title}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                            isTriggered
                              ? 'bg-[#A84A3E]/15 text-[#A84A3E] animate-pulse'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {isTriggered ? (rule.triggeredAt || '已触发信号') : '哨兵监控中'}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">
                          {rule.conditionDescription}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        {rule.targetPrice && (
                          <div className="text-right">
                            <div className="text-[10px] text-[#576F73] dark:text-[#9BB2B4]">现价 / 触发目标</div>
                            <div className="text-xs font-mono font-bold text-[#1F3437] dark:text-white">
                              ¥{currentPrice} / ¥{rule.targetPrice}
                            </div>
                            <div className={`text-[9px] mt-0.5 ${isRealPrice ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'}`}>
                              {isRealPrice ? '实时价' : '演示价（行情暂不可用）'}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            onSelectStock(rule.symbol);
                            onClose();
                          }}
                          className="px-2.5 py-1 text-xs rounded-lg border border-[#CBD5E1] dark:border-[#2A383A] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] text-[#1F3437] dark:text-[#E5EBEA] font-semibold cursor-pointer"
                        >
                          前往分析
                        </button>

                        <button
                          onClick={() => handleRemoveRule(rule.id)}
                          className="text-[#576F73] hover:text-[#A84A3E] cursor-pointer p-1"
                          title="移除监控"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* 底部关闭 */}
        <div className="px-6 py-3.5 border-t border-[#E3E7E1] dark:border-[#2A383A] bg-[#F6F7F5] dark:bg-[#141A1B] flex items-center justify-between">
          <div className="text-xs text-[#576F73] dark:text-[#9BB2B4]">
            每 30 秒轮询比对实时价，命中触发价后置为"已触发"并推送浏览器通知（需保持本应用页面打开）
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1F3437] hover:bg-[#274246] text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
          >
            关闭
          </button>
        </div>

      </div>
    </div>
  );
};
