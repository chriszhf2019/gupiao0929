/**
 * 深度调查与四步通用框架领域服务层
 * 封装行业反常现象、利益闭环、实锤数据、情绪引爆等研报获取
 */

import { InvestigativeReport, StockData } from '../types/stock';
import { request } from './apiClient';
import {
  PRESET_INVESTIGATIVE_CASES,
  getInvestigativeReportForTarget,
} from '../data/investigativeData';

export interface GenerateReportParams {
  targetName: string;
  targetSymbol?: string;
  industry?: string;
  customPrompt?: string;
  stockContext?: StockData;
}

interface InvestigativeApiResponse {
  success: boolean;
  report?: InvestigativeReport;
  error?: string;
}

export const investigativeService = {
  /**
   * 生成或检索深度调查报告
   * 优先调用 AI 深度穿透接口，失败时秒级降级至本地合成引擎
   */
  async generateReport(params: GenerateReportParams): Promise<InvestigativeReport> {
    const { targetName, targetSymbol, industry, customPrompt, stockContext } = params;
    const finalTarget = targetName.trim() || stockContext?.name || '未知标的';

    try {
      const response = await request<InvestigativeApiResponse>('/api/investigative-deep-dive', {
        method: 'POST',
        body: JSON.stringify({
          targetName: finalTarget,
          targetSymbol: targetSymbol || (stockContext?.name === finalTarget ? stockContext?.symbol : undefined),
          industry: industry || stockContext?.sector,
          customPrompt: customPrompt?.trim() || undefined,
          symbol: targetSymbol || stockContext?.symbol,
        }),
        timeoutMs: 30000, // 生成深度研报给予 30 秒超时
      });

      if (response && response.success && response.report) {
        return response.report;
      }
      return getInvestigativeReportForTarget(finalTarget, stockContext);
    } catch (error) {
      console.warn('调用深度调查报告服务失败，切换至本地研报合成引擎:', error);
      return getInvestigativeReportForTarget(finalTarget, stockContext);
    }
  },

  /**
   * 获取预置的精选标杆案例
   */
  getPresetCases(): Record<string, InvestigativeReport> {
    return PRESET_INVESTIGATIVE_CASES;
  },

  /**
   * 根据特定标识或代码直接获取预置报告
   */
  getReportDirect(key: string, stockContext?: StockData): InvestigativeReport {
    return getInvestigativeReportForTarget(key, stockContext);
  },
};
