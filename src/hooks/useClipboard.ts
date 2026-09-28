import { useState, useCallback } from 'react';

/**
 * 剪贴板复制状态管理 Hook
 * 提供防重复触发、自动超时重置的复制反馈
 */
export function useClipboard(timeout = 2000) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = useCallback(
    async (key: string, text: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => {
          setCopiedKey((current) => (current === key ? null : current));
        }, timeout);
        return true;
      } catch (err) {
        console.warn('复制到剪贴板失败:', err);
        return false;
      }
    },
    [timeout]
  );

  const isCopied = useCallback((key: string) => copiedKey === key, [copiedKey]);

  return { copiedKey, copy, isCopied };
}
