import { describe, expect, it } from 'vitest';
import { parseTencentQuoteBody, quoteFromTencentFields } from '../realtimeQuote';

describe('腾讯批量行情解析', () => {
  it('解析 v_xxx 报文', () => {
    const text = 'v_sh600519="1~贵州茅台~600519~1688.5";\nv_sz000858="51~五 粮 液~000858~128.2";';
    const map = parseTencentQuoteBody(text);
    expect(map.get('sh600519')?.[1]).toBe('贵州茅台');
    expect(map.get('sz000858')?.[3]).toBe('128.2');
  });

  it('从字段数组还原价格与涨跌幅', () => {
    const fields = new Array(40).fill('0');
    fields[1] = '贵州茅台';
    fields[3] = '1688.55';
    fields[32] = '1.26';
    const quote = quoteFromTencentFields('600519', fields);
    expect(quote).toMatchObject({
      symbol: '600519',
      name: '贵州茅台',
      currentPrice: 1688.55,
      changePercent: 1.26,
      currency: 'CNY',
      isFallback: false,
    });
  });

  it('价格无效时返回空', () => {
    const fields = new Array(40).fill('0');
    fields[3] = '0';
    expect(quoteFromTencentFields('600519', fields)).toBeNull();
    expect(quoteFromTencentFields('600519', ['1', '贵州茅台'])).toBeNull();
  });
});
