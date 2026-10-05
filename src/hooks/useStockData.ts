import { useState, useEffect, useCallback, useRef } from 'react';
import { StockData } from '../types/stock';
import { stockService } from '../services/stockService';
import { PRESET_STOCKS } from '../data/presetStocks';

const stockMemory = new Map<string, StockData>();

function knownStock(symbol: string): StockData | undefined {
  return stockMemory.get(symbol) || PRESET_STOCKS[symbol];
}

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

export function useStockData(initialSymbol: string = '600519'): UseStockDataReturn {
  const [currentSymbol, setCurrentSymbol] = useState<string>(initialSymbol);
  const [stock, setStock] = useState<StockData>(() => PRESET_STOCKS[initialSymbol] || Object.values(PRESET_STOCKS)[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [macroSlider, setMacroSlider] = useState<number>(() => stock.macro.macroPolicyHeat || 5);
  const requestSeq = useRef(0);

  const applyKnown = useCallback((symbolToFetch: string) => {
    const known = knownStock(symbolToFetch);
    if (!known) return;
    setStock(known);
    if (typeof known.macro?.macroPolicyHeat === 'number') {
      setMacroSlider(known.macro.macroPolicyHeat);
    }
  }, []);

  const loadStock = useCallback(async (symbolToFetch: string) => {
    const seq = ++requestSeq.current;
    applyKnown(symbolToFetch);
    setIsLoading(true);
    setError(null);
    try {
      const data = await stockService.getStockBySymbol(symbolToFetch);
      if (seq !== requestSeq.current) return;
      stockMemory.set(symbolToFetch, data);
      setStock(data);
      if (data.macro && typeof data.macro.macroPolicyHeat === 'number') {
        setMacroSlider(data.macro.macroPolicyHeat);
      }
    } catch (err: any) {
      if (seq !== requestSeq.current) return;
      setError(err.message || '加载标的数据失败');
    } finally {
      if (seq === requestSeq.current) setIsLoading(false);
    }
  }, [applyKnown]);

  useEffect(() => {
    loadStock(currentSymbol);
  }, [currentSymbol, loadStock]);

  const selectSymbol = useCallback((sym: string) => {
    const clean = sym.trim().toUpperCase();
    if (clean && clean !== currentSymbol) {
      applyKnown(clean);
      setCurrentSymbol(clean);
    }
  }, [currentSymbol, applyKnown]);

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
