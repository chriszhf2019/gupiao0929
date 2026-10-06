import { afterEach, describe, expect, it, vi } from 'vitest';
import { productionAccessProblem, requireApiAccess } from '../../../server/security';

const originalNodeEnv = process.env.NODE_ENV;
const originalToken = process.env.ACCESS_TOKEN;

afterEach(() => {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
  if (originalToken === undefined) delete process.env.ACCESS_TOKEN;
  else process.env.ACCESS_TOKEN = originalToken;
  vi.restoreAllMocks();
});

function run(headers: Record<string, string> = {}) {
  const req = {
    get(name: string) {
      return headers[name.toLowerCase()];
    },
  };
  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
  let nextCalled = false;
  requireApiAccess(req as never, res as never, () => {
    nextCalled = true;
  });
  return { res, nextCalled };
}

describe('生产环境访问令牌', () => {
  it('开发模式未设置令牌时放行', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ACCESS_TOKEN;
    expect(productionAccessProblem()).toBeNull();
    expect(run().nextCalled).toBe(true);
  });

  it('生产模式没有令牌时拒绝启动条件，接口返回 503', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ACCESS_TOKEN;
    expect(productionAccessProblem()).toContain('拒绝启动');
    const { res, nextCalled } = run();
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(503);
  });

  it('生产模式令牌过短时拒绝', () => {
    process.env.NODE_ENV = 'production';
    process.env.ACCESS_TOKEN = 'short';
    expect(productionAccessProblem()).toContain('至少 8 位');
  });

  it('生产模式令牌正确才放行', () => {
    process.env.NODE_ENV = 'production';
    process.env.ACCESS_TOKEN = 'correct-token';
    expect(productionAccessProblem()).toBeNull();
    expect(run().nextCalled).toBe(false);
    expect(run().res.statusCode).toBe(401);
    expect(run({ authorization: 'Bearer correct-token' }).nextCalled).toBe(true);
  });
});