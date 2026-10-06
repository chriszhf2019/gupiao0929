import { useCallback, useEffect, useState } from 'react';
import { createTrackedStockFromStockData } from '../data/trackingData';
import { usePortfolio } from '../context/PortfolioContext';
import { stockService } from '../services/stockService';
import { applyStrategyToTracked, outlookFromStock } from '../utils/strategyPipeline';

export function useStrategyTracking(onOpen?: (symbol: string) => void) {
  const { status, error: vaultError, unlock, setup, reset, setTrackedStocks, trackedStocks } = usePortfolio();
  const [pending, setPending] = useState<{ symbol: string; strategyName: string } | null>(null);
  const [busySymbol, setBusySymbol] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const commit = useCallback(async (symbol: string, strategyName: string) => {
    setBusySymbol(symbol);
    setError(null);
    try {
      const stock = await stockService.getStockBySymbol(symbol);
      const outlook = outlookFromStock(stock);
      const drafted = createTrackedStockFromStockData(stock, 'observe');
      const next = applyStrategyToTracked(drafted, outlook, strategyName);
      setTrackedStocks((prev) => [next, ...prev.filter((item) => item.symbol !== next.symbol)]);
      onOpen?.(next.symbol);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '纳入跟踪失败');
      return false;
    } finally {
      setBusySymbol(null);
    }
  }, [onOpen, setTrackedStocks]);

  useEffect(() => {
    if (status !== 'ready' || !pending) return;
    const job = pending;
    setPending(null);
    void commit(job.symbol, job.strategyName);
  }, [status, pending, commit]);

  const track = (symbol: string, strategyName: string) => {
    if (status !== 'ready') {
      setPending({ symbol, strategyName });
      return;
    }
    void commit(symbol, strategyName);
  };

  return {
    track,
    pending,
    clearPending: () => setPending(null),
    busySymbol,
    error,
    trackedSymbols: new Set(trackedStocks.map((item) => item.symbol)),
    vault: { status, error: vaultError, unlock, setup, reset },
  };
}
