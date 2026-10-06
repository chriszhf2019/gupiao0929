import { describe, it, expect } from 'vitest';
import { normalizeListing } from '../symbolCode';

describe('normalizeListing', () => {
  it('把 A 股、带前缀和带后缀的写法收成同一代码', () => {
    const plain = normalizeListing('600519');
    const prefixed = normalizeListing('sh600519');
    const dotted = normalizeListing('600519.SH');
    expect(plain).toMatchObject({ market: 'A-Share', code: '600519', currency: 'CNY', exchange: 'SH', tencentSymbol: 'sh600519', tushareCode: '600519.SH' });
    expect(prefixed?.tencentSymbol).toBe(plain?.tencentSymbol);
    expect(dotted?.eastmoneySecuCode).toBe('600519.SH');
    expect(normalizeListing('000001')?.exchange).toBe('SZ');
    expect(normalizeListing('830001')?.exchange).toBe('BJ');
  });

  it('识别港股和美股', () => {
    expect(normalizeListing('700')).toMatchObject({ market: 'HK-Share', code: '00700', currency: 'HKD', tushareCode: '00700.HK', tencentSymbol: 'hk00700' });
    expect(normalizeListing('00700.HK')?.code).toBe('00700');
    expect(normalizeListing('NVDA')).toMatchObject({ market: 'US-Share', currency: 'USD', tencentSymbol: 'usNVDA', tushareCode: null });
    expect(normalizeListing('')).toBeNull();
  });
});
