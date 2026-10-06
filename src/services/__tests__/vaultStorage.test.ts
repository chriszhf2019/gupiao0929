import { describe, expect, it } from 'vitest';
import { mergeVault } from '../vaultStorage';

describe('mergeVault', () => {
  it('旧信封缺决策字段时采用明文遗留', () => {
    const merged = mergeVault(
      { accounts: [], transactions: [] },
      { decisions: [{ id: 'd1' } as never] }
    );
    expect(merged.accounts).toEqual([]);
    expect(merged.decisions).toEqual([{ id: 'd1' }]);
    expect(merged.trackedStocks.length).toBeGreaterThan(0);
  });

  it('新信封里的空数组不被示例数据覆盖', () => {
    const merged = mergeVault(
      { accounts: [], transactions: [], decisions: [], trackedStocks: [], radarRules: [], peerHistory: [] },
      { decisions: [{ id: 'legacy' } as never] }
    );
    expect(merged.decisions).toEqual([]);
    expect(merged.accounts).toEqual([]);
  });
});
