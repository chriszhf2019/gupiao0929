import { describe, expect, it } from 'vitest';
import { singleflight } from '../singleflight';

describe('singleflight', () => {
  it('同一 key 的并发调用只执行一次', async () => {
    const bucket = new Map<string, Promise<number>>();
    let calls = 0;
    const task = () => {
      calls += 1;
      return new Promise<number>((resolve) => {
        setTimeout(() => resolve(7), 15);
      });
    };

    const [a, b] = await Promise.all([
      singleflight(bucket, 'k', task),
      singleflight(bucket, 'k', task),
    ]);

    expect(a).toBe(7);
    expect(b).toBe(7);
    expect(calls).toBe(1);
    expect(bucket.size).toBe(0);
  });

  it('完成后再次调用会重新执行', async () => {
    const bucket = new Map<string, Promise<number>>();
    let calls = 0;
    const task = () => {
      calls += 1;
      return Promise.resolve(calls);
    };

    expect(await singleflight(bucket, 'k', task)).toBe(1);
    expect(await singleflight(bucket, 'k', task)).toBe(2);
  });
});
