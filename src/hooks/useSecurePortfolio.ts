import { useCallback, useEffect, useState } from 'react';
import { InvestmentAccount, InvestmentTransaction } from '../types/portfolio';
import {
  SEED_ACCOUNT,
  SEED_TRANSACTIONS,
} from '../services/portfolioService';
import {
  decryptValue,
  encryptValue,
  isWebCryptoAvailable,
  readSecureEnvelope,
  removeSecureEnvelope,
  writeSecureEnvelope,
} from '../services/secureStorage';

export type SecureStatus = 'loading' | 'new' | 'locked' | 'ready';

interface SecurePortfolioData {
  accounts: InvestmentAccount[];
  transactions: InvestmentTransaction[];
}

const STORAGE_KEY = 'zane_portfolio_secure_v1';

async function persist(next: SecurePortfolioData, passphrase: string | null): Promise<void> {
  if (!passphrase || !isWebCryptoAvailable()) return;
  try {
    const envelope = await encryptValue(next, passphrase);
    await writeSecureEnvelope(STORAGE_KEY, envelope);
  } catch (error) {
    console.warn('加密保存组合数据失败:', error);
  }
}

export function useSecurePortfolio() {
  const [data, setData] = useState<SecurePortfolioData>({
    accounts: [SEED_ACCOUNT],
    transactions: SEED_TRANSACTIONS,
  });
  const [status, setStatus] = useState<SecureStatus>('loading');
  const [passphrase, setPassphrase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const envelope = readSecureEnvelope(STORAGE_KEY);
    if (envelope) {
      setStatus('locked');
      return;
    }

    // 兼容上一版未加密的本地数据，首次升级时迁移到新存储。
    try {
      const legacyAccounts = window.localStorage.getItem('zane_accounts_v1');
      const legacyTransactions = window.localStorage.getItem('zane_transactions_v1');
      if (legacyAccounts || legacyTransactions) {
        setData({
          accounts: legacyAccounts ? JSON.parse(legacyAccounts) : [SEED_ACCOUNT],
          transactions: legacyTransactions ? JSON.parse(legacyTransactions) : SEED_TRANSACTIONS,
        });
      }
    } catch {
      // 迁移失败时继续使用内置示例数据。
    }
    setStatus('new');
  }, []);

  const unlock = useCallback(async (pass: string) => {
    setError(null);
    const envelope = readSecureEnvelope(STORAGE_KEY);
    if (!envelope) {
      setError('没有找到已加密的数据');
      return false;
    }
    try {
      const decrypted = await decryptValue<SecurePortfolioData>(envelope, pass);
      setData(decrypted);
      setPassphrase(pass);
      setStatus('ready');
      return true;
    } catch {
      setError('密码不正确或数据已损坏');
      return false;
    }
  }, []);

  const setup = useCallback(async (pass: string) => {
    if (!pass.trim()) {
      setError('密码不能为空');
      return false;
    }
    setPassphrase(pass);
    await persist(data, pass);
    setStatus('ready');
    setError(null);
    return true;
  }, [data]);

  const update = useCallback((updater: (prev: SecurePortfolioData) => SecurePortfolioData) => {
    setData((prev) => {
      const next = updater(prev);
      void persist(next, passphrase);
      return next;
    });
  }, [passphrase]);

  const setAccounts = useCallback((next: InvestmentAccount[]) => {
    update((prev) => ({ ...prev, accounts: next }));
  }, [update]);

  const setTransactions = useCallback((next: InvestmentTransaction[]) => {
    update((prev) => ({ ...prev, transactions: next }));
  }, [update]);

  const reset = useCallback(() => {
    removeSecureEnvelope(STORAGE_KEY);
    setData({ accounts: [SEED_ACCOUNT], transactions: SEED_TRANSACTIONS });
    setPassphrase(null);
    setStatus('new');
    setError(null);
  }, []);

  return {
    status,
    error,
    accounts: data.accounts,
    transactions: data.transactions,
    unlock,
    setup,
    setAccounts,
    setTransactions,
    reset,
  };
}
