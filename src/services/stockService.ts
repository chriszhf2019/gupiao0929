/**
 * 股票数据领域服务层
 * 封装股票基础信息、五步走指标获取与兜底策略
 */

import { StockData } from '../types/stock';
import { request } from './apiClient';
import { PRESET_STOCKS, generateStockFallback } from '../data/presetStocks';
import { singleflight } from '../utils/singleflight';

export interface StockApiResponse {
  success: boolean;
  stock?: StockData;
  error?: string;
}

export interface QuoteSnapshot {
  symbol: string;
  name: string;
  currentPrice: number;
  changePercent: number;
  currency: string;
  isFallback?: boolean;
}

const STOCK_CLIENT_TTL_MS = 20_000;
const stockCache = new Map<string, { at: number; stock: StockData }>();
const stockInflight = new Map<string, Promise<StockData>>();

export const stockService = {
  /**
   * 根据股票代码获取详情数据（优先请求后端API，异常时使用预置数据/本地算法兜底）
   */
  getStockBySymbol(symbol: string): Promise<StockData> {
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!cleanSymbol) {
      return Promise.reject(new Error('股票代码不能为空'));
    }

    const hit = stockCache.get(cleanSymbol);
    if (hit && Date.now() - hit.at < STOCK_CLIENT_TTL_MS) {
      return Promise.resolve(hit.stock);
    }

    return singleflight(stockInflight, cleanSymbol, async () => {
      try {
        const response = await request<StockApiResponse>(`/api/stock/${cleanSymbol}`, {
          timeoutMs: 12000,
        });
        const data = response?.success && response.stock
          ? response.stock
          : PRESET_STOCKS[cleanSymbol] || generateStockFallback(cleanSymbol);
        stockCache.set(cleanSymbol, { at: Date.now(), stock: data });
        return data;
      } catch {
        if (PRESET_STOCKS[cleanSymbol]) {
          return PRESET_STOCKS[cleanSymbol];
        }
        return generateStockFallback(cleanSymbol);
      }
    });
  },

  /** 批量现价，供组合盯盘和哨兵比价，避免为每只股票拉完整财报。 */
  async getQuotes(symbols: string[]): Promise<QuoteSnapshot[]> {
    const unique = [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))].slice(0, 40);
    if (unique.length === 0) return [];
    try {
      const response = await request<{ success: boolean; quotes?: QuoteSnapshot[] }>(
        `/api/quotes?symbols=${encodeURIComponent(unique.join(','))}`,
        { timeoutMs: 8000 }
      );
      return response?.quotes || [];
    } catch {
      return [];
    }
  },

  /**
   * 获取所有预置标的代码列表与元数据
   */
  getPresetStocks(): Record<string, StockData> {
    return PRESET_STOCKS;
  },
};
