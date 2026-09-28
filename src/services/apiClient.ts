/**
 * 统一 HTTP API 客户端
 * 提供统一的超时控制、错误拦截、状态码校验与数据解析
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export class ApiError extends Error {
  statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

const DEFAULT_TIMEOUT_MS = 15000;

function getAccessToken(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const stored = window.localStorage.getItem('zane_access_token');
  if (stored) {
    return stored;
  }
  return import.meta.env.VITE_ACCESS_TOKEN;
}

export async function request<T>(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;
  const accessToken = getAccessToken();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(fetchOptions.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorBody = await response.json();
        if (errorBody && errorBody.error) {
          errorMessage = errorBody.error;
        }
      } catch {
        // Ignored if response is not JSON
      }
      throw new ApiError(errorMessage, response.status);
    }

    const json = await response.json();
    return json as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new ApiError(`请求超时（超 ${timeoutMs / 1000} 秒），请检查网络后重试`);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || '网络连接异常，请稍后重试');
  }
}
