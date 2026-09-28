/**
 * 股票数据领域服务层
 * 封装股票基础信息、五步走指标获取与兜底策略
 */

import { StockData } from '../types/stock';
import { request, ApiError } from './apiClient';
import { PRESET_STOCKS, generateStockFallback } from '../data/presetStocks';

export interface StockApiResponse {
  success: boolean;
  stock?: StockData;
  error?: string;
}

export const stockService = {
  /**
   * 根据股票代码获取详情数据（优先请求后端API，异常时使用预置数据/本地算法兜底）
   */
  async getStockBySymbol(symbol: string): Promise<StockData> {
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!cleanSymbol) {
      throw new Error('股票代码不能为空');
    }

    try {
      const response = await request<StockApiResponse>(`/api/stock/${cleanSymbol}`, {
        timeoutMs: 6000,
      });

      if (response && response.success && response.stock) {
        return response.stock;
      }
      // 找不到时兜底
      return PRESET_STOCKS[cleanSymbol] || generateStockFallback(cleanSymbol);
    } catch (error) {
      // 降级使用本地生成器或预置数据
      if (PRESET_STOCKS[cleanSymbol]) {
        return PRESET_STOCKS[cleanSymbol];
      }
      return generateStockFallback(cleanSymbol);
    }
  },

  /**
   * 获取所有预置标的代码列表与元数据
   */
  getPresetStocks(): Record<string, StockData> {
    return PRESET_STOCKS;
  },
};
