import { describe, it, expect } from 'vitest';
import { symbolCurrency, toCny } from '../fx';

describe('fx 汇率折算', () => {
  it('根据代码格式推断币种', () => {
    expect(symbolCurrency('600519')).toBe('CNY');
    expect(symbolCurrency('000001')).toBe('CNY');
    expect(symbolCurrency('00700')).toBe('HKD');
    expect(symbolCurrency('NVDA')).toBe('USD');
    expect(symbolCurrency('')).toBe('CNY');
  });

  it('按静态汇率折算为人民币', () => {
    expect(toCny(100, 'CNY')).toBe(100);
    expect(toCny(100, 'HKD')).toBe(92);
    expect(toCny(100, 'USD')).toBe(720);
    expect(toCny(0, 'USD')).toBe(0);
    expect(toCny(50, 'XXX')).toBe(50); // 未知币种按 1:1 兜底
    expect(toCny(50, null)).toBe(50);
  });
});
