import React, { useState } from 'react';

const STORAGE_KEY = 'zane_access_token';

export function readAccessToken(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(STORAGE_KEY) || import.meta.env.VITE_ACCESS_TOKEN || '';
}

export function AccessTokenGate({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState(readAccessToken);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!import.meta.env.PROD || token) {
    return <>{children}</>;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = draft.trim();
    if (next.length < 8) {
      setError('访问令牌至少 8 位，与服务器的 ACCESS_TOKEN 相同。');
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, next);
    setToken(next);
  };

  return (
    <div className="min-h-screen bg-[#F6F7F5] text-[#1F3437] flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border border-[#E3E7E1] rounded-2xl p-6 space-y-3">
        <h1 className="text-lg font-serif font-bold">输入访问令牌</h1>
        <p className="text-xs text-[#576F73] leading-relaxed">
          生产环境的接口需要令牌。令牌只保存在这台浏览器里，不会写进页面源代码。它必须和服务器上的 ACCESS_TOKEN 一致。
        </p>
        <input
          type="password"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          autoFocus
          className="w-full px-3 py-2.5 rounded-xl border border-[#E3E7E1] text-sm"
        />
        {error && <p className="text-xs text-[#A84A3E]">{error}</p>}
        <button type="submit" className="w-full py-2.5 rounded-xl bg-[#1F3437] text-white text-xs font-semibold">
          进入工作台
        </button>
      </form>
    </div>
  );
}
