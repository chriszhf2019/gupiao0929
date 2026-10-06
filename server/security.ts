import express from "express";

export function productionAccessProblem(): string | null {
  if (process.env.NODE_ENV !== "production") return null;
  const token = process.env.ACCESS_TOKEN?.trim() ?? "";
  if (!token) return "生产模式未设置 ACCESS_TOKEN，服务拒绝启动，避免接口对外敞开。";
  if (token.length < 8) return "ACCESS_TOKEN 至少 8 位。";
  return null;
}

export function requireApiAccess(req: express.Request, res: express.Response, next: express.NextFunction) {
  const problem = productionAccessProblem();
  if (problem) {
    return res.status(503).json({ success: false, error: problem });
  }
  const expected = process.env.ACCESS_TOKEN?.trim();
  if (!expected) {
    return next();
  }
  const provided =
    req.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || req.get("x-api-key")?.trim();
  if (provided !== expected) {
    return res.status(401).json({ success: false, error: "未授权访问：缺少或无效的访问令牌" });
  }
  return next();
}
// 内存滑动窗口限流：保护 AI 接口不被刷量，控制调用成本
const rateLimitStore = new Map<string, number[]>();
let rateLimitLastCleanup = 0;

// 定期清理过期 IP 桶，避免内存无限增长（单机自部署的轻量替代方案；多实例需换 Redis）
function pruneRateLimitStore(now: number) {
  if (now - rateLimitLastCleanup < 60_000) return;
  rateLimitLastCleanup = now;
  for (const [key, arr] of rateLimitStore) {
    const kept = arr.filter((t) => now - t < 60_000);
    if (kept.length === 0) rateLimitStore.delete(key);
    else rateLimitStore.set(key, kept);
  }
}

export function rateLimit(options: { windowMs?: number; max?: number; message?: string } = {}) {
  const windowMs = options.windowMs ?? 60_000;
  const max = options.max ?? 20;
  const message = options.message ?? "请求过于频繁，请稍后再试";
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const now = Date.now();
    pruneRateLimitStore(now);
    const key = `${req.ip || req.socket.remoteAddress || "unknown"}`;
    const bucket = (rateLimitStore.get(key) || []).filter((t) => now - t < windowMs);
    if (bucket.length >= max) {
      return res.status(429).json({ success: false, error: message });
    }
    bucket.push(now);
    rateLimitStore.set(key, bucket);
    return next();
  };
}

