import { normalizeListing } from './symbolCode';

/**
 * 汇率折算工具
 * 说明：当前为静态近似汇率快照（非实时），用于把跨币种组合的总资产统一折算为人民币。
 * 若需精确，可接入实时外汇行情源（如新浪/东财外汇接口）。
 */

export type CurrencyCode = 'CNY' | 'HKD' | 'USD';

// 1 单位外币兑人民币的近似汇率（静态快照）
export const FX_RATES_TO_CNY: Record<CurrencyCode, number> = {
  CNY: 1,
  HKD: 0.92,
  USD: 7.2,
};

export const FX_SNAPSHOT_DATE = '2026-08-31';
export const FX_NOTE = `总额已折算为人民币（静态汇率快照 ${FX_SNAPSHOT_DATE}：USD ${FX_RATES_TO_CNY.USD} / HKD ${FX_RATES_TO_CNY.HKD}，非实时，仅供参考）`;

/**
 * 根据股票代码格式推断计价货币：6 位 = 人民币，1~5 位数字 = 港币，字母 = 美元
 */
export function symbolCurrency(symbol: string): CurrencyCode {
  return normalizeListing(symbol)?.currency ?? 'CNY';
}

/**
 * 将金额折算为人民币
 */
export function toCny(amount: number, currency?: string | null): number {
  const code = (currency || 'CNY').toUpperCase() as CurrencyCode;
  const rate = FX_RATES_TO_CNY[code];
  return (amount || 0) * (rate ?? 1);
}
