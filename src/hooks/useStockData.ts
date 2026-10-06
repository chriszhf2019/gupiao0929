import { useState, useEffect, useCallback } from 'react';
import { stockService } from '../services/stockService';
import { PRESET_STOCKS } from '../data/presetStocks';
import { calculateFundamentalScan } from '../utils/stockCalculator';
import { StockData } from '../types/stock';

export interface UseStockDataReturn {
  currentSymbol: string;
  stock: StockData;
  isLoading: boolean;
  error: string | null;
  macroSlider: number;
  setMacroSlider: (val: number) => void;
  selectSymbol: (sym: string) => void;
  reload: () => Promise<void>;
}

function withFreshScan(stock: StockData): StockData {
  return { ...stock, fundamentals: calculateFundamentalScan(stock) };
}

export function useStockData(initialSymbol: string = '600519'): UseStockDataReturn {
  const [currentSymbol, setCurrentSymbol] = useState<string>(initialSymbol);
  const [stock, setStock] = useState<StockData>(() => withFreshScan(PRESET_STOCKS[initialSymbol] || Object.values(PRESET_STOCKS)[0]));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [macroSlider, setMacroSlider] = useState<number>(() => stock.macro.macroPolicyHeat || 5);

  const loadStock = useCallback(async (symbolToFetch: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await stockService.getStockBySymbol(symbolToFetch);
      setStock(withFreshScan(data));
      if (data.macro && typeof data.macro.macroPolicyHeat === 'number') {
        setMacroSlider(data.macro.macroPolicyHeat);
      }
    } catch (err: any) {
      setError(err.message || '加载标的数据失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStock(currentSymbol);
  }, [currentSymbol, loadStock]);

  const selectSymbol = useCallback((sym: string) => {
    const clean = sym.trim().toUpperCase();
    if (clean && clean !== currentSymbol) {
      setCurrentSymbol(clean);
    }
  }, [currentSymbol]);

  const reload = useCallback(async () => {
    await loadStock(currentSymbol);
  }, [currentSymbol, loadStock]);

  return {
    currentSymbol,
    stock,
    isLoading,
    error,
    macroSlider,
    setMacroSlider,
    selectSymbol,
    reload,
  };
}
