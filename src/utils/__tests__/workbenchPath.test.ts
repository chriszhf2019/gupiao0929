import { describe, expect, it } from 'vitest';
import { buildWorkbenchPath, parseWorkbenchPath } from '../workbenchPath';

describe('workbench path', () => {
  it('空路径进入五步法', () => {
    expect(parseWorkbenchPath('/')).toEqual({ view: 'five-step', symbol: null });
  });

  it('五步法路径带代码', () => {
    expect(parseWorkbenchPath('/five-step/600519')).toEqual({ view: 'five-step', symbol: '600519' });
    expect(buildWorkbenchPath('five-step', '600519')).toBe('/five-step/600519');
  });

  it('不带标的的工作台忽略第二段', () => {
    expect(parseWorkbenchPath('/portfolio/600519')).toEqual({ view: 'portfolio', symbol: null });
    expect(buildWorkbenchPath('market', '600519')).toBe('/market');
  });

  it('未知路径回到五步法', () => {
    expect(parseWorkbenchPath('/unknown')).toEqual({ view: 'five-step', symbol: null });
  });
});
