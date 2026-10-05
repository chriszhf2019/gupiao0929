/**
 * 合并同一 key 上尚未完成的异步任务，避免并发请求打到同一行情/财报源。
 */
export function singleflight<T>(
  bucket: Map<string, Promise<T>>,
  key: string,
  task: () => Promise<T>
): Promise<T> {
  const existing = bucket.get(key);
  if (existing) return existing;

  const promise = task().finally(() => {
    if (bucket.get(key) === promise) bucket.delete(key);
  });
  bucket.set(key, promise);
  return promise;
}
