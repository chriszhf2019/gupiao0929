import React, { useState } from 'react';
import { KeyRound, Lock } from 'lucide-react';
import { SecureStatus } from '../../hooks/useSecurePortfolio';

interface VaultPasswordGateProps {
  status: SecureStatus;
  error: string | null;
  onUnlock: (pass: string) => Promise<boolean>;
  onSetup: (pass: string) => Promise<boolean>;
  onReset: () => void;
}

export function VaultPasswordGate({ status, error, onUnlock, onSetup, onReset }: VaultPasswordGateProps) {
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isNew = status === 'new';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (isNew) {
      if (pass.length < 4) {
        setLocalError('密码至少 4 位');
        return;
      }
      if (pass !== confirm) {
        setLocalError('两次输入的密码不一致');
        return;
      }
    }
    setBusy(true);
    const ok = isNew ? await onSetup(pass) : await onUnlock(pass);
    setBusy(false);
    if (!ok && !error) setLocalError('操作失败，请重试');
  };

  const handleReset = () => {
    if (window.confirm('确定清空本地加密数据吗？持仓、决策档案、跟踪列表、雷达和荐股记录会一并删除。')) {
      onReset();
      setPass('');
      setConfirm('');
      setLocalError(null);
    }
  };

  if (status === 'loading') {
    return <div className="text-center py-16 text-sm text-[#7A9194]">正在读取本地加密数据...</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-white dark:bg-[#1C2426] border border-[#E3E7E1] dark:border-[#2A383A] rounded-2xl p-6">
      <div className="flex items-center space-x-3 mb-5">
        <div className="p-2.5 rounded-xl bg-[#3E6F73]/10 text-[#3E6F73] dark:text-[#76B4B9] border border-[#3E6F73]/20">
          {isNew ? <Lock className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
        </div>
        <div>
          <h3 className="text-sm font-serif font-bold text-[#1F3437] dark:text-[#E5EBEA]">
            {isNew ? '设置本地保险库密码' : '解锁本地保险库'}
          </h3>
          <p className="text-xs text-[#576F73] dark:text-[#9BB2B4]">
            {isNew
              ? '持仓、决策档案、跟踪列表、买点雷达和荐股记录会用这把密码一起加密，只保存在本机。'
              : '请输入之前设置的访问密码。'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="block text-xs text-[#576F73] dark:text-[#9BB2B4] mb-1">访问密码</span>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoFocus
            className="w-full px-3 py-2.5 rounded-xl border border-[#E3E7E1] dark:border-[#2A383A] bg-white dark:bg-[#141A1B] text-sm text-[#1F3437] dark:text-[#E5EBEA] focus:outline-none focus:border-[#3E6F73]"
          />
        </label>

        {isNew && (
          <label className="block">
            <span className="block text-xs text-[#576F73] dark:text-[#9BB2B4] mb-1">确认密码</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E3E7E1] dark:border-[#2A383A] bg-white dark:bg-[#141A1B] text-sm text-[#1F3437] dark:text-[#E5EBEA] focus:outline-none focus:border-[#3E6F73]"
            />
          </label>
        )}

        {(error || localError) && <p className="text-xs text-[#A84A3E]">{error || localError}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 rounded-xl bg-[#1F3437] hover:bg-[#274246] text-white text-xs font-semibold disabled:opacity-60"
        >
          {busy ? '处理中...' : isNew ? '加密并保存' : '解锁'}
        </button>

        {!isNew && (
          <button
            type="button"
            onClick={handleReset}
            className="w-full text-[11px] text-[#7A9194] hover:text-[#A84A3E] py-1"
          >
            忘记密码？清空本地加密数据
          </button>
        )}
      </form>
    </div>
  );
}
