import React, { useState } from 'react';
import { X, Send, ShieldCheck, AlertTriangle } from 'lucide-react';

interface WhistleblowerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (company: string, category: string, snippet: string) => void;
  defaultCompany?: string;
}

export const WhistleblowerModal: React.FC<WhistleblowerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultCompany = '',
}) => {
  const [company, setCompany] = useState(defaultCompany);
  const [category, setCategory] = useState('虚假商业落地 / 关联交易');
  const [snippet, setSnippet] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !snippet.trim()) return;

    onSubmit(company.trim(), category, snippet.trim());
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSnippet('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">匿名供应链/前员工吹哨人报料通道</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">线索已加密存储并在沙箱中排队核验</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              我们已抹除所有上传设备指纹与IP标识，核验合规后将用于更新穿透数据库。
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">涉及标的名称 / 股票代码</label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="例如：赛力斯 / 汇川技术 / 某拟IPO企业"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">线索类别</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="虚假商业落地 / 关联交易">虚假商业落地 / 关联交易做大流水</option>
                <option value="渠道压库 / 真实上险倒挂">渠道压库 / 真实上险倒挂与垫资爆雷</option>
                <option value="研发资本化注水 / 虚构费用">研发资本化注水 / 虚构会议与CSO洗钱</option>
                <option value="地方税收洼地开票套保">地方税收洼地开票套保与财政返税黑产</option>
                <option value="大股东体外兜底质押">大股东体外兜底质押与暗中减持</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">线索描述与佐证细节</label>
              <textarea
                required
                rows={4}
                value={snippet}
                onChange={(e) => setSnippet(e.target.value)}
                placeholder="请脱敏描述关键合同金额、真实开票比率、非正常库存仓库地址或内部会议要求等客观事实..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              ></textarea>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>所有提交均经 SHA-256 哈希加密脱敏，不保留任何可追溯至个人的网络指纹。</span>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>加密提交核验</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
