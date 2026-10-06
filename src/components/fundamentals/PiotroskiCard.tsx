import React from 'react';
import { StockData } from '../../types/stock';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { calculatePiotroski } from '../../utils/piotroski';

export const PiotroskiCard: React.FC<{ stock: StockData }> = ({ stock }) => {
  const fscore = calculatePiotroski(stock);
  const passCount = fscore.items.filter((i) => i.pass).length;

  const scoreColor =
    fscore.dataQuality !== 'real' ? 'text-[#7A9194]'
      : fscore.rating === '优质' ? 'text-[#4A7C6F]'
      : fscore.rating === '良好' ? 'text-[#3E6F73]'
      : fscore.rating === '中性' ? 'text-[#B0803C]'
      : 'text-[#A84A3E]';

  return (
    <div className="mb-8 p-5 rounded-2xl bg-white dark:bg-[#1C2426] border border-[#CBD5E1] dark:border-[#2A383A] shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3E7E1] dark:border-[#2A383A] pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-[#4A7C6F]/15 text-[#4A7C6F] dark:text-[#76B4B9]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA] flex items-center space-x-2">
              <span>Piotroski F-Score 财务质量评分</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#4A7C6F]/10 text-[#4A7C6F] font-mono font-bold">
                皮氏九因子·改善信号
              </span>
            </h4>
            <p className="text-xs text-[#576F73] dark:text-[#9BB2B4]">
              识别"便宜且基本面正在改善"的标的，与 Beneish 排雷、Altman 破产模型互补
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="text-right">
            <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">F-Score</div>
            <div className={`text-2xl font-black font-mono tabular-nums ${scoreColor}`}>
              {fscore.dataQuality === 'real' ? `${fscore.score}` : '--'}
              <span className="text-xs font-normal text-[#7A9194] font-sans">/{fscore.maxScore}</span>
            </div>
          </div>
          <div className="h-8 w-[1px] bg-[#E3E7E1] dark:bg-[#2A383A]" />
          <div>
            <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">评级</div>
            <div className={`text-xs font-bold mt-0.5 ${scoreColor}`}>
              {fscore.dataQuality === 'real' ? fscore.ratingZh : '数据不足'}
            </div>
          </div>
        </div>
      </div>

      {fscore.dataQuality === 'insufficient' ? (
        <div className="py-4 text-center text-xs text-[#576F73] dark:text-[#9BB2B4] border border-dashed border-[#E3E7E1] dark:border-[#2A383A] rounded-xl">
          {fscore.note}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {fscore.items.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-2 p-2.5 rounded-lg border text-[11px] leading-snug ${
                item.pass
                  ? 'bg-[#4A7C6F]/5 border-[#4A7C6F]/25'
                  : 'bg-[#F6F7F5] dark:bg-[#141A1B] border-[#E3E7E1] dark:border-[#2A383A] opacity-70'
              }`}
            >
              {item.pass ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4A7C6F] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-[#A84A3E] shrink-0 mt-0.5" />
              )}
              <span className="text-[#1F3437] dark:text-[#E5EBEA]">{item.criterion}</span>
            </div>
          ))}
        </div>
      )}

      {fscore.dataQuality === 'real' && (
        <div className="text-[11px] text-[#576F73] dark:text-[#9BB2B4]">
          通过 {passCount}/{fscore.items.length} 项 · {fscore.note}
        </div>
      )}
    </div>
  );
};
