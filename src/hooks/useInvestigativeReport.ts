import { useState, useEffect, useCallback } from 'react';
import { InvestigativeReport, WhistleblowerSubmission, StockData } from '../types/stock';
import { investigativeService } from '../services/investigativeService';
import { SAMPLE_WHISTLEBLOWER_LEAKS } from '../data/investigativeData';
import { useLocalStorage } from './useLocalStorage';

export type InvestigativeStage = 'pipeline' | 'radar' | 'dissection' | 'generation' | 'amplification';
export type MediaChannel = 'wechat' | 'video' | 'social';

export function useInvestigativeReport(stock: StockData) {
  const [report, setReport] = useState<InvestigativeReport>(() =>
    investigativeService.getReportDirect(stock.symbol, stock)
  );
  const [activeStage, setActiveStage] = useState<InvestigativeStage>('pipeline');
  const [channelTab, setChannelTab] = useState<MediaChannel>('wechat');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 吹哨人线索状态（使用本地持久化）
  const [leaks, setLeaks] = useLocalStorage<WhistleblowerSubmission[]>(
    'zane_invest_whistleblower_leaks',
    SAMPLE_WHISTLEBLOWER_LEAKS
  );

  // 随着外部传入的标的自动联动
  useEffect(() => {
    setReport(investigativeService.getReportDirect(stock.symbol, stock));
  }, [stock.symbol]);

  // 执行调查报告生成（支持自定义提示词或标的）
  const runInvestigation = useCallback(
    async (targetName?: string, customPrompt?: string) => {
      const finalTarget = targetName || report.targetName || stock.name;
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextReport = await investigativeService.generateReport({
          targetName: finalTarget,
          targetSymbol: finalTarget === stock.name ? stock.symbol : undefined,
          industry: stock.sector,
          customPrompt,
          stockContext: stock,
        });
        setReport(nextReport);
      } catch (err: any) {
        setErrorMessage(err.message || '生成调查报告遇到异常');
      } finally {
        setIsLoading(false);
      }
    },
    [report.targetName, stock]
  );

  // 快捷切换预置标杆案例
  const loadPresetCase = useCallback(
    (caseKey: string) => {
      const nextReport = investigativeService.getReportDirect(caseKey, stock);
      setReport(nextReport);
    },
    [stock]
  );

  // 提交吹哨人线索
  const submitWhistleblowerLeak = useCallback(
    (company: string, category: string, snippet: string): WhistleblowerSubmission => {
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const newLeak: WhistleblowerSubmission = {
        id: `leak-${Date.now()}`,
        companyName: company,
        category,
        evidenceSnippet: `【新提交线索脱敏摘要】: ${snippet}`,
        timestamp: dateStr,
        credibility: 'pending',
      };
      setLeaks((prev) => [newLeak, ...prev]);
      return newLeak;
    },
    [setLeaks]
  );

  return {
    report,
    activeStage,
    setActiveStage,
    channelTab,
    setChannelTab,
    isLoading,
    errorMessage,
    leaks,
    runInvestigation,
    loadPresetCase,
    submitWhistleblowerLeak,
  };
}
