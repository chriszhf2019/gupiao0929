export type ListingMarket = 'A-Share' | 'HK-Share' | 'US-Share';
export type ListingCurrency = 'CNY' | 'HKD' | 'USD';
export type AShareExchange = 'SH' | 'SZ' | 'BJ';

export interface NormalizedListing {
  market: ListingMarket;
  code: string;
  currency: ListingCurrency;
  exchange?: AShareExchange;
  tencentSymbol: string;
  tushareCode: string | null;
  eastmoneySecuCode: string | null;
}

/** 回测与行情日 K 的请求长度。约两年交易日，长于一年才计算年化。 */
export const BACKTEST_BAR_COUNT = 640;

export function aShareExchange(code: string): AShareExchange {
  if (/^(60|68)/.test(code)) return 'SH';
  if (/^(00|30)/.test(code)) return 'SZ';
  if (/^(8|4)/.test(code)) return 'BJ';
  return 'SH';
}

function aShareListing(code: string, exchange: AShareExchange): NormalizedListing {
  const prefix = exchange.toLowerCase();
  const dotted = `${code}.${exchange}`;
  return {
    market: 'A-Share',
    code,
    currency: 'CNY',
    exchange,
    tencentSymbol: `${prefix}${code}`,
    tushareCode: dotted,
    eastmoneySecuCode: dotted,
  };
}

function hkListing(rawDigits: string): NormalizedListing {
  const code = rawDigits.padStart(5, '0');
  return {
    market: 'HK-Share',
    code,
    currency: 'HKD',
    tencentSymbol: `hk${code}`,
    tushareCode: `${code}.HK`,
    eastmoneySecuCode: null,
  };
}

function usListing(ticker: string): NormalizedListing {
  return {
    market: 'US-Share',
    code: ticker,
    currency: 'USD',
    tencentSymbol: `us${ticker}`,
    tushareCode: null,
    eastmoneySecuCode: null,
  };
}

/**
 * 把工作台里出现的代码收成同一种结构：6 位 A 股、1–5 位港股、字母美股，
 * 以及 sh/sz/bj/hk/us 前缀和 600519.SH、00700.HK 这种带后缀的写法。
 */
export function normalizeListing(input: string): NormalizedListing | null {
  const raw = String(input || '').trim().replace(/\s+/g, '');
  if (!raw) return null;
  const upper = raw.toUpperCase();
  const lower = raw.toLowerCase();

  const prefixedA = lower.match(/^(sh|sz|bj)(\d{6})$/);
  if (prefixedA) {
    return aShareListing(prefixedA[2], prefixedA[1].toUpperCase() as AShareExchange);
  }
  const prefixedHk = lower.match(/^hk(\d{1,5})$/);
  if (prefixedHk) return hkListing(prefixedHk[1]);
  const prefixedUs = lower.match(/^us([a-z][a-z0-9.]{0,9})$/);
  if (prefixedUs) return usListing(prefixedUs[1].toUpperCase());

  const dottedA = upper.match(/^(\d{6})\.(SH|SZ|BJ)$/);
  if (dottedA) return aShareListing(dottedA[1], dottedA[2] as AShareExchange);
  const dottedHk = upper.match(/^(\d{1,5})\.HK$/);
  if (dottedHk) return hkListing(dottedHk[1]);

  if (/^\d{6}$/.test(upper)) return aShareListing(upper, aShareExchange(upper));
  if (/^\d{1,5}$/.test(upper)) return hkListing(upper);
  if (/^[A-Z][A-Z0-9.]{0,9}$/.test(upper)) return usListing(upper);
  return null;
}
