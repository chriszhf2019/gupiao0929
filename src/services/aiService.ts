/**
 * AI 智能诊断与研报服务层
 * 统一封装大模型智能投研五步走诊断与投研问答接口
 */

import { StockData, AIAnalysisReport, AIStockStrategy } from '../types/stock';
import { request } from './apiClient';
import { generateLocalReport } from '../utils/stockCalculator';

interface StockAnalysisApiResponse {
  success: boolean;
  report?: AIAnalysisReport;
  error?: string;
}

interface AIChatApiResponse {
  reply?: string;
  error?: string;
}

interface StrategyApiResponse {
  success: boolean;
  strategy?: AIStockStrategy;
  error?: string;
}

export const aiService = {
  /**
   * 生成五步走 AI 综合诊断报告
   */
  async getFiveStepAnalysis(stock: StockData, macroSlider: number): Promise<AIAnalysisReport> {
    try {
      const response = await request<StockAnalysisApiResponse>('/api/stock-analysis', {
        method: 'POST',
        body: JSON.stringify({ symbol: stock.symbol, macroSlider }),
        timeoutMs: 20000,
      });

      if (response && response.success && response.report) {
        return { ...response.report, source: 'ai' };
      }
      return generateLocalReport(stock, macroSlider);
    } catch (error) {
      console.warn('AI 诊断接口调用失败，使用本地量化评分规则引擎兜底:', error);
      return generateLocalReport(stock, macroSlider);
    }
  },

  /**
   * AI 投研助手实时问答（支持携带多轮对话历史）
   */
  async sendChatMessage(
    message: string,
    stockContext: StockData,
    chatHistory?: { role: 'user' | 'assistant'; content: string }[]
  ): Promise<string> {
    try {
      const response = await request<AIChatApiResponse>('/api/ai-chat', {
        method: 'POST',
        body: JSON.stringify({
          message,
          symbol: stockContext.symbol,
          chatHistory: chatHistory || [],
        }),
        timeoutMs: 20000,
      });

      if (response && response.reply) {
        return response.reply;
      }
      return '投研小助手收到，正在查阅最新财报与市场数据...';
    } catch (error: any) {
      console.warn('AI 对话接口异常:', error);
      return `网络通讯暂缓（${error.message || '超时'}），基于已知量化数据：【${stockContext.name}】动态PE为 ${stockContext.valuation.peTTM}倍，基本面评级为 ${stockContext.fundamentals.grade}，建议持续关注关键支撑位 ${stockContext.technical.supportLevel1}。`;
    }
  },

  /**
   * AI 自然语言思路转选股策略
   */
  async generateStrategy(ideaPrompt: string): Promise<AIStockStrategy | null> {
    try {
      const response = await request<StrategyApiResponse>('/api/generate-strategy', {
        method: 'POST',
        body: JSON.stringify({ ideaPrompt }),
        timeoutMs: 25000,
      });

      if (response && response.success && response.strategy) {
        return response.strategy;
      }
      return null;
    } catch (error) {
      console.warn('AI 策略生成失败:', error);
      return null;
    }
  },
};
