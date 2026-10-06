import { useCallback, useEffect, useRef, useState } from 'react';
import { InvestmentAccount, InvestmentTransaction } from '../types/portfolio';
import { PersonalInvestmentDecision, PeerRecommendationRecord, SmartRadarAlertRule, TrackedStockItem } from '../types/stock';
import {
  decryptValue,
  encryptValue,
  isWebCryptoAvailable,
  readSecureEnvelope,
  removeSecureEnvelope,
  writeSecureEnvelope,
} from '../services/secureStorage';
import {
  SecureVault,
  VAULT_STORAGE_KEY,
  clearLegacyVault,
  emptyVault,
  legacyVaultPresent,
  mergeVault,
  readLegacyVault,
  writeLegacyVault,
} from '../services/vaultStorage';

export type SecureStatus = 'loading' | 'new' | 'locked' | 'ready';

async function persist(next: SecureVault, passphrase: string | null): Promise<void> {
  if (!passphrase || !isWebCryptoAvailable()) {
    writeLegacyVault(next);
    return;
  }
  try {
    const envelope = await encryptValue(next, passphrase);
    await writeSecureEnvelope(VAULT_STORAGE_KEY, envelope);
    clearLegacyVault();
  } catch (error) {
    console.warn('加密保存保险库失败:', error);
  }
}

export function useSecurePortfolio() {
  const [data, setData] = useState<SecureVault>(() => emptyVault());
  const [status, setStatus] = useState<SecureStatus>('loading');
  const [passphrase, setPassphrase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const statusRef = useRef(status);
  const passRef = useRef(passphrase);
  statusRef.current = status;
  passRef.current = passphrase;

  useEffect(() => {
    const envelope = readSecureEnvelope(VAULT_STORAGE_KEY);
    if (envelope) {
      setStatus('locked');
      return;
    }
    setData(mergeVault(null, readLegacyVault()));
    setStatus('new');
  }, []);

  const unlock = useCallback(async (pass: string) => {
    setError(null);
    const envelope = readSecureEnvelope(VAULT_STORAGE_KEY);
    if (!envelope) {
      setError('没有找到已加密的数据');
      return false;
    }
    try {
      const decrypted = await decryptValue<Partial<SecureVault>>(envelope, pass);
      const legacy = readLegacyVault();
      const merged = mergeVault(decrypted, legacy);
      const upgraded = legacyVaultPresent(legacy)
        || !Array.isArray(decrypted.decisions)
        || !Array.isArray(decrypted.trackedStocks)
        || !Array.isArray(decrypted.radarRules)
        || !Array.isArray(decrypted.peerHistory);
      if (upgraded) {
        await persist(merged, pass);
      }
      setData(merged);
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

  const update = useCallback((updater: (prev: SecureVault) => SecureVault) => {
    if (statusRef.current === 'locked' || statusRef.current === 'loading') return;
    setData((prev) => {
      const next = updater(prev);
      void persist(next, passRef.current);
      return next;
    });
  }, []);

  const setAccounts = useCallback((next: InvestmentAccount[]) => {
    update((prev) => ({ ...prev, accounts: next }));
  }, [update]);

  const setTransactions = useCallback((next: InvestmentTransaction[]) => {
    update((prev) => ({ ...prev, transactions: next }));
  }, [update]);

  const setDecisions = useCallback((next: PersonalInvestmentDecision[] | ((prev: PersonalInvestmentDecision[]) => PersonalInvestmentDecision[])) => {
    update((prev) => ({ ...prev, decisions: typeof next === 'function' ? next(prev.decisions) : next }));
  }, [update]);

  const setTrackedStocks = useCallback((next: TrackedStockItem[] | ((prev: TrackedStockItem[]) => TrackedStockItem[])) => {
    update((prev) => ({ ...prev, trackedStocks: typeof next === 'function' ? next(prev.trackedStocks) : next }));
  }, [update]);

  const setRadarRules = useCallback((next: SmartRadarAlertRule[] | ((prev: SmartRadarAlertRule[]) => SmartRadarAlertRule[])) => {
    update((prev) => ({ ...prev, radarRules: typeof next === 'function' ? next(prev.radarRules) : next }));
  }, [update]);

  const setPeerHistory = useCallback((next: PeerRecommendationRecord[] | ((prev: PeerRecommendationRecord[]) => PeerRecommendationRecord[])) => {
    update((prev) => ({ ...prev, peerHistory: typeof next === 'function' ? next(prev.peerHistory) : next }));
  }, [update]);

  const reset = useCallback(() => {
    removeSecureEnvelope(VAULT_STORAGE_KEY);
    clearLegacyVault();
    setData(emptyVault());
    setPassphrase(null);
    setStatus('new');
    setError(null);
  }, []);

  return {
    status,
    error,
    accounts: data.accounts,
    transactions: data.transactions,
    decisions: data.decisions,
    trackedStocks: data.trackedStocks,
    radarRules: data.radarRules,
    peerHistory: data.peerHistory,
    unlock,
    setup,
    setAccounts,
    setTransactions,
    setDecisions,
    setTrackedStocks,
    setRadarRules,
    setPeerHistory,
    reset,
  };
}
