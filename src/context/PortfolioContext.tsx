import React, { createContext, useContext } from 'react';
import { useSecurePortfolio } from '../hooks/useSecurePortfolio';

type PortfolioValue = ReturnType<typeof useSecurePortfolio>;

const PortfolioContext = createContext<PortfolioValue | null>(null);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const value = useSecurePortfolio();
  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio(): PortfolioValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) {
    throw new Error('usePortfolio must be used within PortfolioProvider');
  }
  return ctx;
}
