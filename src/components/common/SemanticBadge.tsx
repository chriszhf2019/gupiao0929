import React from 'react';
import { SemanticDataTier, getSemanticTierConfig } from '../../utils/styleHelpers';
import { Database, Sparkles, AlertTriangle } from 'lucide-react';

interface SemanticBadgeProps {
  tier: SemanticDataTier;
  subText?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const SemanticBadge: React.FC<SemanticBadgeProps> = ({
  tier,
  subText,
  size = 'sm',
  className = '',
}) => {
  const config = getSemanticTierConfig(tier);

  const getIcon = () => {
    switch (tier) {
      case 'fact':
        return <Database className={size === 'sm' ? 'w-3 h-3 text-[#1F3437] dark:text-[#88B3B7]' : 'w-3.5 h-3.5 text-[#1F3437] dark:text-[#88B3B7]'} />;
      case 'ai':
        return <Sparkles className={size === 'sm' ? 'w-3 h-3 text-[#3E6F73] dark:text-[#76B4B9]' : 'w-3.5 h-3.5 text-[#3E6F73] dark:text-[#76B4B9]'} />;
      case 'risk':
        return <AlertTriangle className={size === 'sm' ? 'w-3 h-3 text-[#A84A3E] dark:text-[#DE867A]' : 'w-3.5 h-3.5 text-[#A84A3E] dark:text-[#DE867A]'} />;
    }
  };

  return (
    <span
      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md font-sans tracking-tight transition-colors ${
        size === 'sm' ? 'text-[11px]' : 'text-xs'
      } ${config.badgeClass} ${className}`}
      title={
        tier === 'fact'
          ? '经审计财务报告、交易所公开披露、权威上牌等客观事实'
          : tier === 'ai'
          ? '基于多因子算法、概率空间折现与模型推演结论'
          : '审计疑点、未决诉讼、关联交易或商誉减值隐患'
      }
    >
      {getIcon()}
      <span className="font-semibold">{config.label}</span>
      {subText && (
        <span className="opacity-70 text-[10px] pl-0.5">· {subText}</span>
      )}
    </span>
  );
};
