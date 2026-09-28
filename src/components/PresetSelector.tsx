import React from 'react';
import { PRESET_STOCKS } from '../data/presetStocks';
import { HOT_SYMBOLS, HotSymbolCategory } from '../data/hotSymbols';
import { request } from '../services/apiClient';
import { Flame, Star, PlusCircle, Users, Activity } from 'lucide-react';

interface PresetSelectorProps {
  currentSymbol: string;
  onSelectStock: (symbol: string) => void;
  onCustomSymbolSubmit: (symbol: string) => void;
  onOpenPeerValidator?: () => void;
  onOpenPortfolioHealth?: () => void;
}

interface QuickQuote {
  symbol: string;
  name: string;
  currentPrice: number;
  changePercent: number;
  currency: string;
  isFallback?: boolean;
}

const CATEGORY_STYLES: Record<HotSymbolCategory, string> = {
  长期复利: 'bg-[#3E6F73]/10 text-[#2B5458] dark:text-[#76B4B9] border-[#3E6F73]/25',
  前沿科技: 'bg-[#5B6BB3]/10 text-[#46538C] dark:text-[#A8B4E8] border-[#5B6BB3]/25',
  政策受益: 'bg-[#4A7C6F]/10 text-[#376156] dark:text-[#86B6A5] border-[#4A7C6F]/25',
  高股息: 'bg-[#B0803C]/10 text-[#8A6226] dark:text-[#D9B77C] border-[#B0803C]/25',
  出海全球: 'bg-[#3E7B86]/10 text-[#2C5E67] dark:text-[#8FC0C8] border-[#3E7B86]/25',
};

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  currentSymbol,
  onSelectStock,
  onCustomSymbolSubmit,
  onOpenPeerValidator,
  onOpenPortfolioHealth,
}) => {
  const [customInput, setCustomInput] = React.useState('');
  const [quotes, setQuotes] = React.useState<Record<string, QuickQuote>>({});

  React.useEffect(() => {
    let active = true;
    request<{ success: boolean; quotes?: QuickQuote[] }>('/api/quick-quotes')
      .then((res) => {
        if (!active || !res?.quotes) return;
        const map: Record<string, QuickQuote> = {};
        res.quotes.forEach((q) => {
          map[q.symbol] = q;
        });
        setQuotes(map);
      })
      .catch(() => {
        // 快捷池报价失败时静默降级为内置样例价格。
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      onCustomSymbolSubmit(customInput.trim());
      setCustomInput('');
    }
  };

  return (
    <div className="bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-4 shadow-xs mb-6 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
        <div className="flex items-center space-x-2">
          <Flame className="w-4 h-4 text-[#3E6F73]" />
          <h2 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
            重点标杆标的研判池
          </h2>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#576F73] dark:text-[#9BB2B4]">
            <span>精选标准：</span>
            {(['长期复利', '前沿科技', '政策受益', '高股息', '出海全球'] as HotSymbolCategory[]).map((c) => (
              <span key={c} className={`px-1.5 py-0.5 rounded border ${CATEGORY_STYLES[c]}`}>{c}</span>
            ))}
          </div>
        </div>

        {/* 快捷工具与自定义输入 */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenPeerValidator && (
            <button
              onClick={onOpenPeerValidator}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-[#3E6F73]/10 hover:bg-[#3E6F73]/20 border border-[#3E6F73]/30 text-[#3E6F73] dark:text-[#76B4B9] rounded-xl font-semibold transition-all cursor-pointer"
              title="有人给你推荐了股票？马上验真排雷"
            >
              <Users className="w-3.5 h-3.5" />
              <span>他人荐股验真</span>
            </button>
          )}

          {onOpenPortfolioHealth && (
            <button
              onClick={onOpenPortfolioHealth}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-[#4A7C6F]/10 hover:bg-[#4A7C6F]/20 border border-[#4A7C6F]/30 text-[#4A7C6F] dark:text-[#76B4B9] rounded-xl font-semibold transition-all cursor-pointer"
              title="全账户持仓排雷体检"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>持仓排雷体检</span>
            </button>
          )}

          <form onSubmit={handleCustomSubmit} className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="输入代码 (如 300750, 002594)"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#F6F7F5] dark:bg-[#141A1B] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl text-[#1F3437] dark:text-[#E5EBEA] placeholder-[#7A9194] focus:outline-none focus:border-[#3E6F73] w-40 sm:w-48"
            />
            <button
              type="submit"
              className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-[#1F3437] hover:bg-[#2A4549] text-white rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>载入</span>
            </button>
          </form>
        </div>
      </div>

      {/* 预置标的卡片网格 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {HOT_SYMBOLS.map((st) => {
          const preset = PRESET_STOCKS[st.symbol];
          const quote = quotes[st.symbol];
          const displayName = quote?.name || preset?.name || st.name;
          const displayPrice = quote?.currentPrice ?? preset?.currentPrice ?? 0;
          const displayChange = quote?.changePercent ?? preset?.changePercent ?? 0;
          const displayCurrency = quote?.currency || preset?.currency || 'CNY';
          const isSelected = st.symbol === currentSymbol;
          const isUp = displayChange >= 0;
          const isDemo = !quote || quote.isFallback === true;

          return (
            <button
              key={st.symbol}
              onClick={() => onSelectStock(st.symbol)}
              title={`${st.name} · ${st.category}：${st.reason}`}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#1F3437]/6 dark:bg-[#3E6F73]/20 border-[#3E6F73] shadow-xs'
                  : 'bg-[#F6F7F5]/70 dark:bg-[#141A1B]/60 hover:bg-[#ECEFEA] dark:hover:bg-[#1E282A] border-[#E3E7E1] dark:border-[#2A383A]'
              }`}
            >
              <div>
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`text-xs font-serif font-bold ${
                      isSelected ? 'text-[#1F3437] dark:text-[#76B4B9]' : 'text-[#1F3437] dark:text-[#E5EBEA]'
                    }`}
                  >
                    {displayName}
                  </span>
                  {isSelected && <Star className="w-3 h-3 text-[#3E6F73] fill-[#3E6F73]" />}
                </div>
                <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4] font-mono mt-0.5">
                  {st.symbol}
                </div>
                <span className={`inline-block mt-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${CATEGORY_STYLES[st.category]}`}>
                  {st.category}
                </span>
              </div>

              <div className="text-right">
                <div className="text-xs font-mono font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                  {displayCurrency === 'USD' ? '$' : '¥'}{displayPrice.toFixed(2)}
                </div>
                <div
                  className={`text-[11px] font-mono font-semibold ${
                    isUp ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'
                  }`}
                >
                  {isUp ? '+' : ''}{displayChange.toFixed(2)}%
                </div>
                {isDemo && (
                  <div
                    className="text-[9px] mt-1 px-1 py-0.5 rounded border border-[#A84A3E]/30 bg-[#A84A3E]/8 text-[#A84A3E] font-semibold"
                    title="实时行情暂不可用，当前为内置演示数据，非真实行情"
                  >
                    演示数据
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
