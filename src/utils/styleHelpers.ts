/**
 * UI 样式与色彩状态映射辅助工具
 * 严格遵循鉴源色彩规范：
 * - 主色：深青灰 #1F3437
 * - 辅助色：石青 #3E6F73
 * - 上涨：低饱和苔绿 #4A7C6F
 * - 下跌：低饱和赭红 #A84A3E
 * - 背景：浅米灰 #F6F7F5；卡片白底；暗色深炭灰 #141A1B
 * 核心原则：不使用高饱和红绿，减少股民视觉刺激，重点区分【事实数据】【AI 分析结论】【不确定性风险】
 */

export const THEME_COLORS = {
  primary: '#1F3437', // 深青灰
  secondary: '#3E6F73', // 石青
  gain: '#4A7C6F', // 低饱和苔绿
  loss: '#A84A3E', // 低饱和赭红
  bgLight: '#F6F7F5', // 浅米灰
  cardLight: '#FFFFFF', // 白底
  bgDark: '#141A1B', // 深炭灰
  cardDark: '#1C2426', // 深炭灰卡片
  borderLight: '#E3E7E1',
  borderDark: '#2A383A',
};

/**
 * 涨跌文本颜色（根据指定：上涨为低饱和苔绿 #4A7C6F，下跌为低饱和赭红 #A84A3E）
 */
export function getPriceChangeColor(
  changePercent: number | undefined | null,
  options: { defaultColor?: string } = {}
): string {
  if (changePercent === undefined || changePercent === null || isNaN(changePercent)) {
    return options.defaultColor || 'text-slate-500 dark:text-slate-400';
  }
  if (changePercent > 0) return 'text-[#4A7C6F]';
  if (changePercent < 0) return 'text-[#A84A3E]';
  return 'text-slate-500 dark:text-slate-400';
}

/**
 * 涨跌幅徽章背景及边框样式
 */
export function getPriceChangeBadgeStyle(
  changePercent: number | undefined | null
): string {
  if (changePercent === undefined || changePercent === null || isNaN(changePercent)) {
    return 'bg-[#1F3437]/5 dark:bg-[#1F3437]/20 text-slate-500 border-slate-300 dark:border-slate-700';
  }
  if (changePercent > 0) {
    return 'bg-[#4A7C6F]/10 text-[#4A7C6F] border-[#4A7C6F]/30 font-medium';
  }
  if (changePercent < 0) {
    return 'bg-[#A84A3E]/10 text-[#A84A3E] border-[#A84A3E]/30 font-medium';
  }
  return 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700';
}

/**
 * 估值状态徽章样式（柔和低刺激）
 */
export function getValuationBadgeStyle(statusZh: string | undefined): string {
  switch (statusZh) {
    case '极度低估':
      return 'bg-[#4A7C6F]/15 text-[#376156] dark:text-[#67A394] border-[#4A7C6F]/40';
    case '合理偏低':
      return 'bg-[#3E6F73]/15 text-[#2B5458] dark:text-[#5B9DA2] border-[#3E6F73]/40';
    case '估值合理':
      return 'bg-[#1F3437]/10 text-[#1F3437] dark:text-[#A6C0C3] border-[#1F3437]/30';
    case '估值偏高':
      return 'bg-[#B07238]/15 text-[#865121] dark:text-[#DE9E62] border-[#B07238]/40';
    case '严重高估':
      return 'bg-[#A84A3E]/15 text-[#7D3228] dark:text-[#D1766B] border-[#A84A3E]/40';
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
  }
}

/**
 * 基本面评级色彩 (A+, A, B, C, D)
 */
export function getGradeColor(grade: string | undefined): string {
  switch (grade) {
    case 'A+':
      return 'text-[#4A7C6F] bg-[#4A7C6F]/10 border-[#4A7C6F]/30';
    case 'A':
      return 'text-[#3E6F73] bg-[#3E6F73]/10 border-[#3E6F73]/30';
    case 'B':
      return 'text-[#1F3437] dark:text-[#A6C0C3] bg-[#1F3437]/10 border-[#1F3437]/30';
    case 'C':
      return 'text-[#B07238] bg-[#B07238]/10 border-[#B07238]/30';
    case 'D':
      return 'text-[#A84A3E] bg-[#A84A3E]/10 border-[#A84A3E]/30';
    default:
      return 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
  }
}

/**
 * 核心三层语义标识样式：
 * 1. 【事实数据】Fact Data：审计财报、交易所披露、终端上险
 * 2. 【AI 分析结论】AI Insights：多因子综合推演、行业空间折现
 * 3. 【不确定性风险】Uncertainty & Risk：商誉隐患、质押暴雷、财务反常
 */
export type SemanticDataTier = 'fact' | 'ai' | 'risk';

export function getSemanticTierConfig(tier: SemanticDataTier): {
  label: string;
  badgeClass: string;
  dotClass: string;
  cardBorderClass: string;
} {
  switch (tier) {
    case 'fact':
      return {
        label: '事实数据',
        badgeClass: 'bg-[#1F3437]/8 text-[#1F3437] dark:bg-[#1F3437]/30 dark:text-[#B1CDD0] border border-[#1F3437]/20 dark:border-[#3E6F73]/40',
        dotClass: 'bg-[#1F3437] dark:bg-[#5B9DA2]',
        cardBorderClass: 'border-[#1F3437]/20 dark:border-[#2A383A]',
      };
    case 'ai':
      return {
        label: 'AI 研判结论',
        badgeClass: 'bg-[#3E6F73]/10 text-[#2C575B] dark:bg-[#3E6F73]/25 dark:text-[#7BC5CA] border border-[#3E6F73]/30 dark:border-[#3E6F73]/50',
        dotClass: 'bg-[#3E6F73]',
        cardBorderClass: 'border-[#3E6F73]/30 dark:border-[#3E6F73]/50',
      };
    case 'risk':
      return {
        label: '不确定性风险',
        badgeClass: 'bg-[#A84A3E]/10 text-[#8C3A2F] dark:bg-[#A84A3E]/25 dark:text-[#E2897E] border border-[#A84A3E]/30 dark:border-[#A84A3E]/50',
        dotClass: 'bg-[#A84A3E]',
        cardBorderClass: 'border-[#A84A3E]/30 dark:border-[#A84A3E]/50',
      };
  }
}
