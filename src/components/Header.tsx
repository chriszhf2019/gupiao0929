import React from 'react';
import { StockData, WorkbenchView } from '../types/stock';
import {
  TrendingUp,
  Sparkles,
  Search,
  Bot,
  Briefcase,
  FileText,
  Activity,
  Compass,
  Crosshair,
  Sun,
  Moon,
  Database,
  AlertTriangle,
  Layers,
  Scale,
  ShieldCheck,
  Users,
  Radio,
  BookOpenCheck,
  LayoutDashboard,
} from 'lucide-react';
import { SemanticBadge } from './common/SemanticBadge';

interface HeaderProps {
  currentStock: StockData;
  onSearchSymbol: (symbol: string) => void;
  onOpenAIDeepScan: () => void;
  onToggleAIChat: () => void;
  onOpenDecisionVerification?: () => void;
  onOpenPeerValidator?: () => void;
  onOpenPortfolioHealth?: () => void;
  onOpenSmartRadar?: () => void;
  onOpenDecisionLedger?: () => void;
  currentView: WorkbenchView;
  onSelectView: (view: WorkbenchView) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStock,
  onSearchSymbol,
  onOpenAIDeepScan,
  onToggleAIChat,
  onOpenDecisionVerification,
  onOpenPeerValidator,
  onOpenPortfolioHealth,
  onOpenSmartRadar,
  onOpenDecisionLedger,
  currentView,
  onSelectView,
  theme = 'light',
  onToggleTheme,
}) => {
  const [searchInput, setSearchInput] = React.useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchSymbol(searchInput.trim());
      setSearchInput('');
    }
  };

  const isPositive = currentStock.changePercent >= 0;

  return (
    <header className="sticky top-0 z-30 bg-[#F6F7F5]/95 dark:bg-[#141A1B]/95 backdrop-blur-md border-b border-[#E3E7E1] dark:border-[#2A383A] text-[#1F3437] dark:text-[#E5EBEA] shadow-sm transition-colors">
      {/* 顶部主品牌与搜索工具栏 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & 品牌（思源宋体标题 + 深青灰/石青） */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#1F3437] text-white flex items-center justify-center shadow-md border border-[#3E6F73]/30">
              <span className="font-serif font-black text-lg text-[#EAF3F4]">源</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-[#1F3437] dark:text-[#E5EBEA] font-serif flex items-center space-x-2">
                  <span>鉴源智能投研</span>
                  <span className="text-[#3E6F73] font-mono text-sm tracking-normal font-medium">WORKBENCH</span>
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3E6F73]/10 text-[#3E6F73] dark:text-[#76B4B9] border border-[#3E6F73]/30 font-mono font-semibold">
                  金融护眼色谱 · 弱红绿
                </span>
              </div>
              <p className="text-xs text-[#576F73] dark:text-[#9BB2B4]">
                深度穿透决策系统 · 宏观/行业 → 财务排雷 → 估值模型 → 买点时机 → 情绪共鸣
              </p>
            </div>
          </div>

          {/* 搜索栏、标的行情与工具按钮 */}
          <div className="flex items-center space-x-2.5 flex-1 max-w-2xl justify-end">
            {/* 快速搜索框 */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#576F73] dark:text-[#9BB2B4]" />
              <input
                type="text"
                placeholder="搜索标的 / 代码 (如 600519)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-xl text-[#1F3437] dark:text-[#E5EBEA] placeholder-[#7A9194] focus:outline-none focus:border-[#3E6F73] focus:ring-1 focus:ring-[#3E6F73] transition-all"
              />
            </form>

            {/* 当前活跃标的行情胶囊（低饱和红绿） */}
            <div
              onClick={() => onSelectView('five-step')}
              className="hidden lg:flex items-center space-x-2 bg-white dark:bg-[#1C2426] hover:border-[#3E6F73]/50 border border-[#E3E7E1] dark:border-[#2A383A] px-3 py-1.5 rounded-xl text-xs cursor-pointer transition-all shadow-xs"
              title="点击查看个股五步深度研判"
            >
              <span className="font-serif font-bold text-[#1F3437] dark:text-white">{currentStock.name}</span>
              <span className="text-[#576F73] dark:text-[#9BB2B4] font-mono text-[11px]">({currentStock.symbol})</span>
              <span className="font-mono font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                {currentStock.currency === 'USD' ? '$' : '¥'}{currentStock.currentPrice}
              </span>
              <span
                className={`font-mono font-bold ${
                  isPositive ? 'text-[#4A7C6F]' : 'text-[#A84A3E]'
                }`}
              >
                {isPositive ? '+' : ''}{currentStock.changePercent}%
              </span>
              {currentStock.isRealtime !== true && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded border border-[#A84A3E]/40 bg-[#A84A3E]/10 text-[#A84A3E] font-semibold"
                  title="实时行情源暂不可用（或该市场暂不支持实时），当前展示内置演示数据，非真实行情，请勿作为决策依据"
                >
                  演示数据
                </span>
              )}
            </div>

            {/* 主题模式切换开关（浅米灰 / 深炭灰盯盘） */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#1C2426] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] border border-[#E3E7E1] dark:border-[#2A383A] text-xs font-medium text-[#1F3437] dark:text-[#E5EBEA] transition-all cursor-pointer shadow-xs"
                title={theme === 'light' ? '切换至深炭灰后台 (适合长时间盯盘)' : '切换至浅米灰护眼背景'}
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-[#3E6F73]" />
                    <span className="hidden sm:inline text-[11px]">深炭灰</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline text-[11px]">浅米灰</span>
                  </>
                )}
              </button>
            )}

            {/* 他人荐股客观验真 */}
            {onOpenPeerValidator && (
              <button
                onClick={onOpenPeerValidator}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C2426] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] border border-[#CBD5E1] dark:border-[#2A383A] text-[#1F3437] dark:text-[#E5EBEA] text-xs font-semibold transition-all cursor-pointer shadow-xs"
                title="别人推荐的股票靠不靠谱？一秒验真"
              >
                <Users className="w-3.5 h-3.5 text-[#3E6F73] dark:text-[#76B4B9]" />
                <span className="hidden sm:inline">他人荐股验真</span>
              </button>
            )}

            {/* 持仓排雷体检 */}
            {onOpenPortfolioHealth && (
              <button
                onClick={onOpenPortfolioHealth}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C2426] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] border border-[#CBD5E1] dark:border-[#2A383A] text-[#1F3437] dark:text-[#E5EBEA] text-xs font-semibold transition-all cursor-pointer shadow-xs"
                title="全账户持仓排雷健康体检"
              >
                <Activity className="w-3.5 h-3.5 text-[#4A7C6F] dark:text-[#76B4B9]" />
                <span className="hidden sm:inline">持仓排雷体检</span>
              </button>
            )}

            {/* 智能风控哨兵雷达 */}
            {onOpenSmartRadar && (
              <button
                onClick={onOpenSmartRadar}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C2426] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] border border-[#CBD5E1] dark:border-[#2A383A] text-[#1F3437] dark:text-[#E5EBEA] text-xs font-semibold transition-all cursor-pointer shadow-xs"
                title="打开智能买点与风控盯盘哨兵"
              >
                <Radio className="w-3.5 h-3.5 text-[#3E6F73] dark:text-[#76B4B9]" />
                <span className="hidden sm:inline">盯盘哨兵</span>
              </button>
            )}

            {/* 决策三步门禁 */}
            {onOpenDecisionVerification && (
              <button
                onClick={onOpenDecisionVerification}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C2426] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] border border-[#3E6F73]/40 text-[#2B5458] dark:text-[#76B4B9] text-xs font-semibold transition-all cursor-pointer shadow-xs"
                title="打开选股可靠性决策验证 (三步门禁)"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#3E6F73] dark:text-[#76B4B9]" />
                <span className="hidden sm:inline">决策三步门禁</span>
              </button>
            )}

            {/* 个人投资决策与复盘档案 */}
            {onOpenDecisionLedger && (
              <button
                onClick={onOpenDecisionLedger}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C2426] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] border border-[#4A7C6F]/40 text-[#376156] dark:text-[#76B4B9] text-xs font-semibold transition-all cursor-pointer shadow-xs"
                title="个人精准决策立项档案与持仓纪律复盘系统"
              >
                <BookOpenCheck className="w-3.5 h-3.5 text-[#4A7C6F] dark:text-[#76B4B9]" />
                <span className="hidden sm:inline">决策与复盘档案</span>
              </button>
            )}

            {/* AI 深度研报诊断 */}
            <button
              onClick={onOpenAIDeepScan}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#1F3437] hover:bg-[#284347] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer border border-[#3E6F73]/40"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#76B4B9]" />
              <span className="hidden sm:inline">AI 研判诊断</span>
              <span className="sm:hidden">AI 研报</span>
            </button>

            {/* AI 智囊抽屉 */}
            <button
              onClick={onToggleAIChat}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C2426] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] border border-[#E3E7E1] dark:border-[#2A383A] text-[#1F3437] dark:text-[#E5EBEA] text-xs font-medium transition-all cursor-pointer shadow-xs"
              title="咨询鉴源 AI 投资研判助理"
            >
              <Bot className="w-3.5 h-3.5 text-[#3E6F73]" />
              <span className="hidden sm:inline">AI 智囊</span>
            </button>
          </div>

        </div>

        {/* 核心原则三层语义图例条 + 导航标签页 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2.5 pt-2 border-t border-[#E3E7E1] dark:border-[#2A383A] gap-2">
          
          {/* 主工作台导航视图 */}
          <div className="flex items-center space-x-1 overflow-x-auto text-xs pb-1 sm:pb-0">
            <button
              onClick={() => onSelectView('market')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'market'
                  ? 'bg-[#1F3437] text-white shadow-xs'
                  : 'text-[#576F73] dark:text-[#9BB2B4] hover:text-[#1F3437] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#1C2426]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>市场大盘</span>
            </button>

            <button
              onClick={() => onSelectView('five-step')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'five-step'
                  ? 'bg-[#1F3437] text-white shadow-xs'
                  : 'text-[#576F73] dark:text-[#9BB2B4] hover:text-[#1F3437] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#1C2426]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>五步深度研判</span>
            </button>

            <button
              onClick={() => onSelectView('index-fund')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'index-fund'
                  ? 'bg-[#1F3437] text-white shadow-xs'
                  : 'text-[#576F73] dark:text-[#9BB2B4] hover:text-[#1F3437] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#1C2426]'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-[#76B4B9]" />
              <span>指数优选 (四步法)</span>
            </button>

            <button
              onClick={() => onSelectView('tracking')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'tracking'
                  ? 'bg-[#1F3437] text-white shadow-xs'
                  : 'text-[#576F73] dark:text-[#9BB2B4] hover:text-[#1F3437] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#1C2426]'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5 text-[#4A7C6F]" />
              <span>跟踪个股中心</span>
            </button>

            <button
              onClick={() => onSelectView('deep-exploration')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'deep-exploration'
                  ? 'bg-[#1F3437] text-white shadow-xs'
                  : 'text-[#576F73] dark:text-[#9BB2B4] hover:text-[#1F3437] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#1C2426]'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-[#3E6F73]" />
              <span>深度爆料与情景</span>
            </button>

            <button
              onClick={() => onSelectView('watchlist')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'watchlist'
                  ? 'bg-[#1F3437] text-white shadow-xs'
                  : 'text-[#576F73] dark:text-[#9BB2B4] hover:text-[#1F3437] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#1C2426]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>选股雷达</span>
            </button>

            <button
              onClick={() => onSelectView('portfolio')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'portfolio'
                  ? 'bg-[#1F3437] text-white shadow-xs'
                  : 'text-[#576F73] dark:text-[#9BB2B4] hover:text-[#1F3437] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#1C2426]'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>组合仓位</span>
            </button>

            <button
              onClick={() => onSelectView('memo')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'memo'
                  ? 'bg-[#1F3437] text-white shadow-xs'
                  : 'text-[#576F73] dark:text-[#9BB2B4] hover:text-[#1F3437] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#1C2426]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>投研备忘录</span>
            </button>

            <button
              onClick={() => onSelectView('strategy')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                currentView === 'strategy'
                  ? 'bg-[#1F3437] text-white shadow-xs'
                  : 'text-[#576F73] dark:text-[#9BB2B4] hover:text-[#1F3437] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#1C2426]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#76B4B9]" />
              <span>AI 策略生成</span>
            </button>
          </div>

          {/* 重点区分三层属性图例（事实数据 / AI分析结论 / 不确定性风险） */}
          <div className="hidden md:flex items-center space-x-2 text-[11px] text-[#576F73] dark:text-[#9BB2B4] bg-white/70 dark:bg-[#1C2426]/70 px-2.5 py-1 rounded-lg border border-[#E3E7E1] dark:border-[#2A383A]">
            <span className="font-semibold text-[#1F3437] dark:text-[#A6C0C3] text-[10px] uppercase tracking-wider">分层辨识:</span>
            <SemanticBadge tier="fact" />
            <SemanticBadge tier="ai" />
            <SemanticBadge tier="risk" />
          </div>

        </div>

      </div>
    </header>
  );
};
