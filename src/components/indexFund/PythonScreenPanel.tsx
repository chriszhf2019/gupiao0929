import React from 'react';
import { Check, Copy } from 'lucide-react';
import { pythonScriptExample } from './pythonScreenExample';

export function PythonScreenPanel({ copied, onCopy }: { copied: boolean; onCopy: () => void }) {
  const hasCopiedCode = copied;
  const copyCodeToClipboard = onCopy;
  return (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E3E7E1] dark:border-[#2A383A]">
            <div>
              <h3 className="text-base font-bold font-serif text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-2">
                <span>四步筛选法 Python 量化程序脚本</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-600/10 text-emerald-600 font-mono">
                  Python 3.9+ 兼容
                </span>
              </h3>
              <p className="text-xs text-[#576F73] dark:text-[#9BB2B4] mt-0.5">
                可直接嵌入本地定时任务或 Jupyter Notebook，自动对接 akshare 或 yfinance 数据接口拉取基金清洗数据。
              </p>
            </div>

            <button
              onClick={copyCodeToClipboard}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#1F3437] text-white hover:bg-[#284347] text-xs font-semibold cursor-pointer shadow-xs transition-all"
            >
              {hasCopiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>已复制代码</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>一键复制代码</span>
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <pre className="p-4 rounded-xl bg-[#141A1B] text-[#E5EBEA] text-xs font-mono overflow-x-auto leading-relaxed border border-[#2A383A]">
              <code>{pythonScriptExample}</code>
            </pre>
          </div>
        </div>
  );
}
