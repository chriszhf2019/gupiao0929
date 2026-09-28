import React, { useState, useEffect, lazy, Suspense } from 'react';
import { WorkbenchView } from './types/stock';
import { useStockData } from './hooks/useStockData';
import { Header } from './components/Header';
import { PresetSelector } from './components/PresetSelector';
import { StepNavigation } from './components/StepNavigation';
import { Step1Macro } from './components/Step1Macro';
import { Step3Fundamentals } from './components/Step3Fundamentals';
import { Step4Valuation } from './components/Step4Valuation';
import { Step5Technical } from './components/Step5Technical';
import { AIDeepReportModal } from './components/AIDeepReportModal';
import { AIChatDrawer } from './components/AIChatDrawer';
import { DecisionVerificationModal } from './components/DecisionVerificationModal';
import { PeerRecommendationValidatorModal } from './components/PeerRecommendationValidatorModal';
import { PortfolioHealthCheckModal } from './components/PortfolioHealthCheckModal';
import { SmartRadarModal } from './components/SmartRadarModal';
import { PersonalDecisionLedgerModal } from './components/PersonalDecisionLedgerModal';
import { PortfolioProvider } from './context/PortfolioContext';
import { Sparkles, ArrowRight, RefreshCw, ShieldCheck, Users, Activity, Radio, BookOpenCheck } from 'lucide-react';

// 非首屏大视图按需加载（code splitting），削减首屏 bundle
const MarketDashboardView = lazy(() =>
  import('./components/MarketDashboardView').then((m) => ({ default: m.MarketDashboardView }))
);
const StockScreenerView = lazy(() =>
  import('./components/StockScreenerView').then((m) => ({ default: m.StockScreenerView }))
);
const PortfolioTracker = lazy(() =>
  import('./components/PortfolioTracker').then((m) => ({ default: m.PortfolioTracker }))
);
const InvestmentMemoView = lazy(() =>
  import('./components/InvestmentMemoView').then((m) => ({ default: m.InvestmentMemoView }))
);
const StockTrackingHub = lazy(() =>
  import('./components/StockTrackingHub').then((m) => ({ default: m.StockTrackingHub }))
);
const DeepExplorationView = lazy(() =>
  import('./components/DeepExplorationView').then((m) => ({ default: m.DeepExplorationView }))
);
const IndexFundScreenerView = lazy(() =>
  import('./components/IndexFundScreenerView').then((m) => ({ default: m.IndexFundScreenerView }))
);
const AIStrategyGenerator = lazy(() =>
  import('./components/AIStrategyGenerator').then((m) => ({ default: m.AIStrategyGenerator }))
);

function ViewLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-24 text-xs text-[#576F73] dark:text-[#9BB2B4] space-x-2">
      <RefreshCw className="w-4 h-4 animate-spin" />
      <span>加载模块中...</span>
    </div>
  );
}

export default function App() {
  const [currentView, setCurrentView] = useState<WorkbenchView>('five-step');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('zane_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('zane_theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('theme-dark', 'dark');
    } else {
      document.documentElement.classList.remove('theme-dark', 'dark');
    }
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('theme-dark', 'dark');
    } else {
      document.documentElement.classList.remove('theme-dark', 'dark');
    }
  }, [theme]);

  const {
    currentSymbol,
    stock,
    isLoading: isStockLoading,
    error: stockError,
    macroSlider,
    setMacroSlider,
    selectSymbol,
  } = useStockData('600519');

  const [activeStep, setActiveStep] = useState<number>(1);
  const [isAIDeepScanOpen, setIsAIDeepScanOpen] = useState<boolean>(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState<boolean>(false);
  const [isDecisionVerificationOpen, setIsDecisionVerificationOpen] = useState<boolean>(false);
  const [isPeerValidatorOpen, setIsPeerValidatorOpen] = useState<boolean>(false);
  const [isPortfolioHealthOpen, setIsPortfolioHealthOpen] = useState<boolean>(false);
  const [isSmartRadarOpen, setIsSmartRadarOpen] = useState<boolean>(false);
  const [isDecisionLedgerOpen, setIsDecisionLedgerOpen] = useState<boolean>(false);
  const [isDecisionLedgerNewTrigger, setIsDecisionLedgerNewTrigger] = useState<boolean>(false);
  const [screenerSymbols, setScreenerSymbols] = useState<string[] | null>(null);

  const handleSearchSymbol = (sym: string) => {
    const upper = sym.trim().toUpperCase();
    if (upper) {
      selectSymbol(upper);
      setCurrentView('five-step');
    }
  };

  const handleSelectStockFromWatchlist = (sym: string) => {
    selectSymbol(sym);
    setCurrentView('five-step');
  };

  return (
    <PortfolioProvider>
    <div
      className={`min-h-screen font-sans antialiased selection:bg-[#3E6F73] selection:text-white pb-16 transition-colors duration-200 ${
        theme === 'dark'
          ? 'theme-dark bg-[#141A1B] text-[#E5EBEA]'
          : 'bg-[#F6F7F5] text-[#1F3437]'
      }`}
    >
      {/* Top Header with Zane Invest WORKBENCH branding & Navigation */}
      <Header
        currentStock={stock}
        onSearchSymbol={handleSearchSymbol}
        onOpenAIDeepScan={() => setIsAIDeepScanOpen(true)}
        onToggleAIChat={() => setIsAIChatOpen(!isAIChatOpen)}
        onOpenDecisionVerification={() => setIsDecisionVerificationOpen(true)}
        onOpenPeerValidator={() => setIsPeerValidatorOpen(true)}
        onOpenPortfolioHealth={() => setIsPortfolioHealthOpen(true)}
        onOpenSmartRadar={() => setIsSmartRadarOpen(true)}
        onOpenDecisionLedger={() => {
          setIsDecisionLedgerNewTrigger(false);
          setIsDecisionLedgerOpen(true);
        }}
        currentView={currentView}
        onSelectView={(view) => setCurrentView(view)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Suspense fallback={<ViewLoadingFallback />}>
        {/* View 1: Five-Step Deep Dive */}
        {currentView === 'market' && (
          <MarketDashboardView />
        )}

        {/* View 1: Five-Step Deep Dive */}
        {currentView === 'five-step' && (
          <div className="space-y-6">
            {/* Preset Stocks Quick Selection Bar */}
            <PresetSelector
              currentSymbol={currentSymbol}
              onSelectStock={(sym) => selectSymbol(sym)}
              onCustomSymbolSubmit={handleSearchSymbol}
              onOpenPeerValidator={() => setIsPeerValidatorOpen(true)}
              onOpenPortfolioHealth={() => setIsPortfolioHealthOpen(true)}
            />

            {/* Step Navigation & Summary Card */}
            <StepNavigation
              activeStep={activeStep}
              onSelectStep={(step) => setActiveStep(step)}
              currentStock={stock}
              macroSlider={macroSlider}
            />

            {/* Step Views */}
            <div className="space-y-8">
              {/* Step 1 & 2: Macro & Industry */}
              {(activeStep === 1 || activeStep === 0) && (
                <div id="step-1">
                  <Step1Macro
                    stock={stock}
                    macroSlider={macroSlider}
                    onMacroSliderChange={(val) => setMacroSlider(val)}
                  />
                </div>
              )}

              {/* Step 3: Company Fundamentals */}
              {(activeStep === 3 || activeStep === 0) && (
                <div id="step-3">
                  <Step3Fundamentals stock={stock} />
                </div>
              )}

              {/* Step 4: Valuation Level */}
              {(activeStep === 4 || activeStep === 0) && (
                <div id="step-4">
                  <Step4Valuation stock={stock} />
                </div>
              )}

              {/* Step 5: Technical Timing */}
              {(activeStep === 5 || activeStep === 0) && (
                <div id="step-5">
                  <Step5Technical
                    stock={stock}
                    onOpenDecisionVerification={() => setIsDecisionVerificationOpen(true)}
                    onOpenSmartRadar={() => setIsSmartRadarOpen(true)}
                    onOpenDecisionLedger={() => {
                      setIsDecisionLedgerNewTrigger(true);
                      setIsDecisionLedgerOpen(true);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Step View Actions */}
            <div className="mt-8 text-center flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setActiveStep(activeStep === 0 ? 1 : 0)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-[#1C2426] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] border border-[#E3E7E1] dark:border-[#2A383A] text-xs font-semibold text-[#1F3437] dark:text-[#E5EBEA] transition-all cursor-pointer shadow-xs"
              >
                {activeStep === 0 ? '切换至单步聚焦' : '展开全五步平铺图'}
              </button>

              <button
                onClick={() => setIsDecisionVerificationOpen(true)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#1C2426] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] border border-[#3E6F73]/40 text-xs font-semibold text-[#2B5458] dark:text-[#76B4B9] transition-all cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#3E6F73] dark:text-[#76B4B9]" />
                <span>选股三步门禁核验</span>
              </button>

              <button
                onClick={() => {
                  setIsDecisionLedgerNewTrigger(false);
                  setIsDecisionLedgerOpen(true);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#1C2426] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] border border-[#4A7C6F]/40 text-xs font-semibold text-[#376156] dark:text-[#76B4B9] transition-all cursor-pointer shadow-xs"
              >
                <BookOpenCheck className="w-3.5 h-3.5 text-[#4A7C6F] dark:text-[#76B4B9]" />
                <span>个人决策档案与复盘</span>
              </button>

              <button
                onClick={() => setCurrentView('tracking')}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#1C2426] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] border border-[#4A7C6F]/40 text-xs font-semibold text-[#376156] dark:text-[#76B4B9] transition-all cursor-pointer shadow-xs"
              >
                <span>个股跟踪与买点监控</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setCurrentView('index-fund')}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#1C2426] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] border border-[#76B4B9]/50 text-xs font-semibold text-[#1F3437] dark:text-[#76B4B9] transition-all cursor-pointer shadow-xs"
              >
                <span>指数优选 (四步法)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setCurrentView('deep-exploration')}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#1C2426] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] border border-[#3E6F73]/40 text-xs font-semibold text-[#2B5458] dark:text-[#76B4B9] transition-all cursor-pointer shadow-xs"
              >
                <span>深度爆料与利益闭环</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setCurrentView('memo')}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#1C2426] hover:bg-[#ECEFEA] dark:hover:bg-[#253235] border border-[#E3E7E1] dark:border-[#2A383A] text-xs font-semibold text-[#1F3437] dark:text-[#E5EBEA] transition-all cursor-pointer shadow-xs"
              >
                <span>投研备忘录与导出</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsAIDeepScanOpen(true)}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-[#1F3437] hover:bg-[#274246] text-xs font-bold text-white shadow-sm border border-[#3E6F73]/40 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#76B4B9]" />
                <span>AI 五步综合研判</span>
              </button>
            </div>
          </div>
        )}

        {/* View: Index Fund Screener (指数优选与四步筛选工作台) */}
        {currentView === 'index-fund' && (
          <IndexFundScreenerView />
        )}

        {/* View 2: Tracking Center (跟踪个股中心) */}
        {currentView === 'tracking' && (
          <StockTrackingHub
            currentSymbol={currentSymbol}
            onSelectStock={(sym) => {
              selectSymbol(sym);
            }}
            onNavigateToFiveStep={(sym) => {
              selectSymbol(sym);
              setCurrentView('five-step');
            }}
            onNavigateToDeepExplore={(sym) => {
              selectSymbol(sym);
              setCurrentView('deep-exploration');
            }}
          />
        )}

        {/* View 3: Deep Exploration (深度探索) */}
        {currentView === 'deep-exploration' && (
          <DeepExplorationView
            stock={stock}
            onSelectStock={(sym) => {
              selectSymbol(sym);
            }}
            onNavigateToFiveStep={(sym) => {
              selectSymbol(sym);
              setCurrentView('five-step');
            }}
            onNavigateToTracking={(sym) => {
              selectSymbol(sym);
              setCurrentView('tracking');
            }}
          />
        )}

        {/* View 4: Watchlist & Radar */}
        {currentView === 'watchlist' && (
          <StockScreenerView
            currentSymbol={currentSymbol}
            onSelectStock={handleSelectStockFromWatchlist}
            presetSymbols={screenerSymbols}
            onClearPreset={() => setScreenerSymbols(null)}
          />
        )}

        {/* View: AI 自然语言策略生成器 */}
        {currentView === 'strategy' && (
          <AIStrategyGenerator
            onSelectStock={(sym) => {
              selectSymbol(sym);
              setCurrentView('five-step');
            }}
            onApplyStrategyFilter={(strategy) => {
              setScreenerSymbols(strategy.matchedStocks.map((m) => m.symbol));
              setCurrentView('watchlist');
            }}
          />
        )}

        {/* View 5: Portfolio & Risk Disciplines */}
        {currentView === 'portfolio' && (
          <PortfolioTracker
            onSelectStock={handleSelectStockFromWatchlist}
          />
        )}

        {/* View 6: Investment Memo */}
        {currentView === 'memo' && (
          <InvestmentMemoView
            stock={stock}
            macroSlider={macroSlider}
          />
        )}

        </Suspense>
      </main>

      {/* AI Deep Scan Modal */}
      <AIDeepReportModal
        isOpen={isAIDeepScanOpen}
        onClose={() => setIsAIDeepScanOpen(false)}
        stock={stock}
        macroSlider={macroSlider}
      />

      {/* 选股决策可靠性核验弹窗 (三步门禁闭环) */}
      <DecisionVerificationModal
        isOpen={isDecisionVerificationOpen}
        onClose={() => setIsDecisionVerificationOpen(false)}
        stock={stock}
      />

      {/* 他人荐股验真机弹窗 (照妖镜) */}
      <PeerRecommendationValidatorModal
        isOpen={isPeerValidatorOpen}
        onClose={() => setIsPeerValidatorOpen(false)}
        currentStock={stock}
        onSelectStock={handleSearchSymbol}
      />

      {/* 个人持仓排雷体检器弹窗 (Portfolio Health Detox) */}
      <PortfolioHealthCheckModal
        isOpen={isPortfolioHealthOpen}
        onClose={() => setIsPortfolioHealthOpen(false)}
        onSelectStock={handleSearchSymbol}
      />

      {/* 智能风控买点雷达哨兵弹窗 (Smart Alert Radar) */}
      <SmartRadarModal
        isOpen={isSmartRadarOpen}
        onClose={() => setIsSmartRadarOpen(false)}
        currentStock={stock}
        onSelectStock={handleSearchSymbol}
      />

      {/* 个人投资决策与复盘档案系统 (Decision Ledger & Memo) */}
      <PersonalDecisionLedgerModal
        isOpen={isDecisionLedgerOpen}
        onClose={() => {
          setIsDecisionLedgerOpen(false);
          setIsDecisionLedgerNewTrigger(false);
        }}
        currentStock={stock}
        onSelectStock={handleSearchSymbol}
        initialNewDecision={isDecisionLedgerNewTrigger}
      />

      {/* AI Assistant Floating Chat Drawer */}
      <AIChatDrawer
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        stock={stock}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p className="flex items-center justify-center space-x-2">
          <span className="font-bold text-slate-400">ZANE INVEST WORKBENCH</span>
          <span>·</span>
          <span>机构级智能投研与五步决策工作台</span>
          <span>·</span>
          <span>数据仅供量化与价值投资学习参考，不构成直接投资建议。</span>
        </p>
      </footer>
    </div>
    </PortfolioProvider>
  );
}
