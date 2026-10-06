import { PersonalInvestmentDecision, PeerRecommendationRecord, SmartRadarAlertRule, TrackedStockItem } from '../types/stock';
import { InvestmentAccount, InvestmentTransaction } from '../types/portfolio';
import { DEFAULT_INVESTMENT_DECISIONS } from '../data/defaultDecisions';
import { DEFAULT_TRACKED_STOCKS } from '../data/trackingData';
import { SEED_ACCOUNT, SEED_TRANSACTIONS } from './portfolioService';

export const VAULT_STORAGE_KEY = 'zane_portfolio_secure_v1';

export const LEGACY_VAULT_KEYS = {
  accounts: 'zane_accounts_v1',
  transactions: 'zane_transactions_v1',
  decisions: 'zane_personal_investment_decisions_v2',
  trackedStocks: 'zane_invest_tracked_stocks_v1',
  radarRules: 'zane_smart_radar_rules_v1',
  peerHistory: 'zane_peer_recommendations_history_v1',
} as const;

export const DEFAULT_RADAR_RULES: SmartRadarAlertRule[] = [
  {
    id: 'rule_default_1',
    symbol: '600519',
    stockName: '贵州茅台',
    triggerType: 'safety_margin_reached',
    title: '安全边际深度建仓线',
    conditionDescription: '现价接近或低于内在价值折价 20% (¥1420.00)',
    targetPrice: 1420.0,
    currentStatus: 'monitoring',
  },
  {
    id: 'rule_default_2',
    symbol: '300750',
    stockName: '宁德时代',
    triggerType: 'ma20_pullback_stable',
    title: '20日均线回踩企稳信号',
    conditionDescription: '股价回踩 MA20 支撑线且成交量缩窄',
    targetPrice: 192.0,
    currentStatus: 'monitoring',
  },
];

export const DEFAULT_PEER_HISTORY: PeerRecommendationRecord[] = [
  {
    id: 'mock_hist_1',
    recommenderName: '雪球大V @成长猎手',
    sourceChannel: 'kol',
    symbol: '300750',
    stockName: '宁德时代',
    recommendedPrice: 245.0,
    recommendedDate: '2026-08-10',
    recommendedReason: '储能出海暴增，三季度利润超预期',
    userAttitude: 'neutral',
    auditVerdict: 'wait_pullback',
    verdictTitle: '逻辑部分成立 · 建议耐心等回调企稳',
    verdictScore: 65,
    verdictExplanation: '基本面扎实，但前期已有一定涨幅，追高盈亏比一般。',
    redFlags: ['处于阶段性阻力位附近'],
    alignmentChecks: [],
  },
  {
    id: 'mock_hist_2',
    recommenderName: '老李 (大学同学)',
    sourceChannel: 'friend',
    symbol: '002594',
    stockName: '比亚迪',
    recommendedPrice: 260.0,
    recommendedDate: '2026-07-15',
    recommendedReason: '高端仰望销量大增，智驾算法全量推送',
    userAttitude: 'interested',
    auditVerdict: 'resonance_buy',
    verdictTitle: '高胜率共振 · 对方逻辑与内在价值吻合',
    verdictScore: 88,
    verdictExplanation: '护城河极宽，现金流强劲，与内在价值共振。',
    redFlags: [],
    alignmentChecks: [],
  },
];

export interface SecureVault {
  accounts: InvestmentAccount[];
  transactions: InvestmentTransaction[];
  decisions: PersonalInvestmentDecision[];
  trackedStocks: TrackedStockItem[];
  radarRules: SmartRadarAlertRule[];
  peerHistory: PeerRecommendationRecord[];
}

export function emptyVault(): SecureVault {
  return {
    accounts: [SEED_ACCOUNT],
    transactions: SEED_TRANSACTIONS,
    decisions: DEFAULT_INVESTMENT_DECISIONS,
    trackedStocks: DEFAULT_TRACKED_STOCKS,
    radarRules: DEFAULT_RADAR_RULES,
    peerHistory: DEFAULT_PEER_HISTORY,
  };
}

function readArray<T>(key: string): T[] | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as T[] : undefined;
  } catch {
    return undefined;
  }
}

export function readLegacyVault(): Partial<SecureVault> {
  return {
    accounts: readArray<InvestmentAccount>(LEGACY_VAULT_KEYS.accounts),
    transactions: readArray<InvestmentTransaction>(LEGACY_VAULT_KEYS.transactions),
    decisions: readArray<PersonalInvestmentDecision>(LEGACY_VAULT_KEYS.decisions),
    trackedStocks: readArray<TrackedStockItem>(LEGACY_VAULT_KEYS.trackedStocks),
    radarRules: readArray<SmartRadarAlertRule>(LEGACY_VAULT_KEYS.radarRules),
    peerHistory: readArray<PeerRecommendationRecord>(LEGACY_VAULT_KEYS.peerHistory),
  };
}

export function legacyVaultPresent(legacy: Partial<SecureVault>): boolean {
  return Object.values(legacy).some((value) => Array.isArray(value));
}

export function writeLegacyVault(vault: SecureVault): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LEGACY_VAULT_KEYS.accounts, JSON.stringify(vault.accounts));
  window.localStorage.setItem(LEGACY_VAULT_KEYS.transactions, JSON.stringify(vault.transactions));
  window.localStorage.setItem(LEGACY_VAULT_KEYS.decisions, JSON.stringify(vault.decisions));
  window.localStorage.setItem(LEGACY_VAULT_KEYS.trackedStocks, JSON.stringify(vault.trackedStocks));
  window.localStorage.setItem(LEGACY_VAULT_KEYS.radarRules, JSON.stringify(vault.radarRules));
  window.localStorage.setItem(LEGACY_VAULT_KEYS.peerHistory, JSON.stringify(vault.peerHistory));
}

export function clearLegacyVault(): void {
  if (typeof window === 'undefined') return;
  Object.values(LEGACY_VAULT_KEYS).forEach((key) => window.localStorage.removeItem(key));
}

function pickList<T>(stored: T[] | undefined, legacy: T[] | undefined, fallback: T[]): T[] {
  if (Array.isArray(stored)) return stored;
  if (Array.isArray(legacy)) return legacy;
  return fallback;
}

/** 旧信封只有账户流水。缺字段时用明文遗留，再没有才用示例。 */
export function mergeVault(stored: Partial<SecureVault> | null, legacy: Partial<SecureVault>): SecureVault {
  const base = emptyVault();
  return {
    accounts: pickList(stored?.accounts, legacy.accounts, base.accounts),
    transactions: pickList(stored?.transactions, legacy.transactions, base.transactions),
    decisions: pickList(stored?.decisions, legacy.decisions, base.decisions),
    trackedStocks: pickList(stored?.trackedStocks, legacy.trackedStocks, base.trackedStocks),
    radarRules: pickList(stored?.radarRules, legacy.radarRules, base.radarRules),
    peerHistory: pickList(stored?.peerHistory, legacy.peerHistory, base.peerHistory),
  };
}
