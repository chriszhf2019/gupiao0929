import React, { useState } from 'react';
import { TransactionType } from '../../types/portfolio';
import { createTransaction } from '../../services/portfolioService';
import { FileText, Sparkles, AlertCircle, Check, ArrowRight, X, Layers, HelpCircle } from 'lucide-react';

interface ParsedTx {
  symbol: string;
  name?: string;
  type: TransactionType;
  date: string;
  price: number;
  quantity: number;
  fee: number;
  note: string;
  rawLine: string;
}

interface SmartLedgerImportModalProps {
  accountId: string;
  accountName: string;
  onClose: () => void;
  onImport: (transactions: any[]) => void;
}

function parseBrokerText(text: string): ParsedTx[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const results: ParsedTx[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const line of lines) {
    // 忽略表头常见关键字
    if (/证券代码|股票代码|发生日期|成交日期|业务名称|操作|成交价格|成交数量|委托|结存/i.test(line) && line.length < 50) {
      continue;
    }

    // 匹配 6 位 A 股代码、5 位港股代码或 1-5 位美股代码
    const codeMatch = line.match(/\b(60\d{4}|68\d{4}|00\d{4}|30\d{4}|8\d{5}|4\d{5}|[A-Z]{1,5})\b/);
    const code = codeMatch ? codeMatch[1].toUpperCase() : '';

    // 判断交易类型
    let type: TransactionType = 'BUY';
    if (/卖出|卖|减持|赎回|SELL/i.test(line)) {
      type = 'SELL';
    } else if (/买入|买|增持|申购|BUY/i.test(line)) {
      type = 'BUY';
    } else if (/红利|分红|派息|DIVIDEND/i.test(line)) {
      type = 'DIVIDEND';
    }

    // 匹配日期 (YYYY-MM-DD 或 YYYY/MM/DD 或 YYYYMMDD)
    const dateMatch = line.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/) || line.match(/(\d{4})(\d{2})(\d{2})/);
    let dateStr = today;
    if (dateMatch) {
      const y = dateMatch[1];
      const m = dateMatch[2].padStart(2, '0');
      const d = dateMatch[3].padStart(2, '0');
      dateStr = `${y}-${m}-${d}`;
    }

    // 提取数字（价格、数量、手续费）
    // 过滤掉代码和日期后提取浮点数
    let sanitized = line;
    if (code) sanitized = sanitized.replace(code, '');
    if (dateMatch) sanitized = sanitized.replace(dateMatch[0], '');

    const numbers = (sanitized.match(/-?\d+(?:\.\d+)?/g) || []).map(Number).filter((n) => !isNaN(n) && n > 0);

    let price = 0;
    let quantity = 0;
    let fee = 0;

    if (numbers.length >= 2) {
      // 经验推断：股数通常较大 (>=100 或整数)，价格通常有小数位或小于股数
      if (numbers[0] >= 100 && numbers[1] < numbers[0]) {
        quantity = Math.round(numbers[0]);
        price = numbers[1];
      } else if (numbers[1] >= 100 && numbers[0] < numbers[1]) {
        price = numbers[0];
        quantity = Math.round(numbers[1]);
      } else {
        price = numbers[0];
        quantity = Math.round(numbers[1]);
      }

      if (numbers.length >= 3) {
        // 第三项通常为手续费或佣金
        const candidateFee = numbers[2];
        if (candidateFee < price * quantity * 0.05) {
          fee = candidateFee;
        }
      }
    } else if (numbers.length === 1) {
      price = numbers[0];
      quantity = 100;
    }

    if (code && price > 0) {
      results.push({
        symbol: code,
        type,
        date: dateStr,
        price,
        quantity: Math.max(1, quantity),
        fee,
        note: `智能导入: ${type === 'BUY' ? '买入' : '卖出'} ${code}`,
        rawLine: line,
      });
    }
  }

  return results;
}

export const SmartLedgerImportModal: React.FC<SmartLedgerImportModalProps> = ({
  accountId,
  accountName,
  onClose,
  onImport,
}) => {
  const [rawText, setRawText] = useState('');
  const [parsedList, setParsedList] = useState<ParsedTx[]>([]);
  const [hasParsed, setHasParsed] = useState(false);

  const handleParse = () => {
    if (!rawText.trim()) return;
    const list = parseBrokerText(rawText);
    setParsedList(list);
    setHasParsed(true);
  };

  const handleApply = () => {
    if (parsedList.length === 0) return;
    const txs = parsedList.map((p) =>
      createTransaction({
        accountId,
        type: p.type,
        symbol: p.symbol,
        date: p.date,
        price: p.price,
        quantity: p.quantity,
        fee: p.fee,
        note: p.note,
      })
    );
    onImport(txs);
    onClose();
  };

  const handleRemove = (index: number) => {
    setParsedList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSample = () => {
    const sample = `2026-03-15 600519 贵州茅台 证券买入 成交价格 1420.50 成交数量 200 佣金 5.00
2026-03-20 300750 宁德时代 证券买入 238.60 500 5.00
2026-03-28 600036 招商银行 证券买入 38.20 1000 5.00
2026-04-02 600519 贵州茅台 证券卖出 1510.00 100 5.00`;
    setRawText(sample);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1C2426] rounded-2xl border border-[#E3E7E1] dark:border-[#2A383A] p-6 shadow-2xl space-y-5 my-8 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E3E7E1] dark:border-[#2A383A] pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#3E6F73]/10 text-[#3E6F73] dark:text-[#76B4B9] border border-[#3E6F73]/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
                券商交割单/持仓文本智能解析导入
              </h3>
              <p className="text-xs text-[#576F73] dark:text-[#9BB2B4]">
                导入至账户：<span className="font-bold text-[#1F3437] dark:text-[#E5EBEA]">{accountName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7A9194] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-[#3E6F73]" />
              <span>粘贴同花顺/东方财富/券商交割单明细或持仓文本</span>
            </label>
            <button
              type="button"
              onClick={handleSample}
              className="text-xs text-[#3E6F73] dark:text-[#76B4B9] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>填入示范数据</span>
            </button>
          </div>

          <textarea
            rows={5}
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              setHasParsed(false);
            }}
            placeholder="支持从同花顺、东方财富、华泰涨乐财富通、招商证券、中信证券等App复制交割单或持仓明细文本直接粘贴...&#10;示例格式：2026-03-15 600519 证券买入 价格 1420.50 数量 200"
            className="w-full p-3 text-xs font-mono rounded-xl border border-[#E3E7E1] dark:border-[#2A383A] bg-[#F6F7F5] dark:bg-[#141A1B] text-[#1F3437] dark:text-[#E5EBEA] focus:outline-none focus:border-[#3E6F73] placeholder-[#7A9194]"
          />

          <button
            type="button"
            onClick={handleParse}
            disabled={!rawText.trim()}
            className="w-full py-2.5 rounded-xl bg-[#3E6F73] hover:bg-[#2F585C] disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>智能解析交割明细</span>
          </button>
        </div>

        {/* Parsed Results */}
        {hasParsed && (
          <div className="space-y-3 pt-3 border-t border-[#E3E7E1] dark:border-[#2A383A]">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-[#3E6F73]" />
                <span>解析识别结果：共识别出 {parsedList.length} 笔流水</span>
              </div>
              <span className="text-[11px] text-[#7A9194]">核对无误后点击下方确认导入</span>
            </div>

            {parsedList.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#A84A3E]/10 border border-[#A84A3E]/20 text-xs text-[#A84A3E] flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>未能从粘贴文本中识别到有效的股票代码与价格，请检查格式或参考示范数据。</span>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto rounded-xl border border-[#E3E7E1] dark:border-[#2A383A]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F6F7F5] dark:bg-[#141A1B] text-[#7A9194] text-[10px] uppercase font-mono sticky top-0">
                    <tr>
                      <th className="p-2.5">日期</th>
                      <th className="p-2.5">类型</th>
                      <th className="p-2.5">代码</th>
                      <th className="p-2.5 text-right">价格</th>
                      <th className="p-2.5 text-right">数量</th>
                      <th className="p-2.5 text-right">总额</th>
                      <th className="p-2.5 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3E7E1]/60 dark:divide-[#2A383A]/60 font-mono">
                    {parsedList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#F6F7F5]/80 dark:hover:bg-[#141A1B]/60">
                        <td className="p-2 text-[#576F73] dark:text-[#9BB2B4]">{item.date}</td>
                        <td className="p-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.type === 'BUY'
                                ? 'bg-[#4A7C6F]/15 text-[#4A7C6F]'
                                : 'bg-[#A84A3E]/15 text-[#A84A3E]'
                            }`}
                          >
                            {item.type === 'BUY' ? '买入' : '卖出'}
                          </span>
                        </td>
                        <td className="p-2 font-bold text-[#1F3437] dark:text-[#E5EBEA]">{item.symbol}</td>
                        <td className="p-2 text-right text-[#1F3437] dark:text-[#E5EBEA]">{item.price.toFixed(2)}</td>
                        <td className="p-2 text-right text-[#1F3437] dark:text-[#E5EBEA]">{item.quantity}</td>
                        <td className="p-2 text-right font-bold text-[#3E6F73] dark:text-[#76B4B9]">
                          {(item.price * item.quantity).toLocaleString()}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemove(idx)}
                            className="text-[#A84A3E] hover:underline text-[10px] cursor-pointer"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Action Footer */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#E3E7E1] dark:border-[#2A383A]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#576F73] dark:text-[#9BB2B4] hover:bg-[#F6F7F5] dark:hover:bg-[#141A1B] cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={parsedList.length === 0}
            className="px-5 py-2 rounded-xl bg-[#1F3437] hover:bg-[#274246] disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>确认导入 {parsedList.length > 0 ? `(${parsedList.length}笔)` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
