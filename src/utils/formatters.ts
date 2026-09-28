/**
 * 格式化与数值转换工具函数库
 * 遵循纯函数、类型安全和防御性编程设计
 */

/**
 * 格式化百分比数值，例如 12.345 -> "+12.35%" 或 "12.35%"
 */
export function formatPercent(
  value: number | undefined | null,
  options: { includeSign?: boolean; precision?: number } = {}
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '--%';
  }
  const { includeSign = false, precision = 2 } = options;
  const fixed = value.toFixed(precision);
  if (includeSign && value > 0) {
    return `+${fixed}%`;
  }
  return `${fixed}%`;
}

/**
 * 格式化金额数值（带货币符号或单位）
 */
export function formatCurrency(
  value: number | undefined | null,
  currency: string = 'CNY',
  precision: number = 2
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '--';
  }
  const symbol = currency === 'CNY' ? '¥' : currency === 'USD' ? '$' : currency;
  return `${symbol}${value.toFixed(precision)}`;
}

/**
 * 格式化大数值（如以亿元、万亿为单位显示）
 */
export function formatLargeNumber(
  value: number | undefined | null,
  precision: number = 2
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '--';
  }
  if (Math.abs(value) >= 10000) {
    return `${(value / 10000).toFixed(precision)} 万亿`;
  }
  return `${value.toFixed(precision)} 亿`;
}

/**
 * 格式化估值倍数（如 23.4x）
 */
export function formatMultiple(
  value: number | undefined | null,
  precision: number = 1
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '--x';
  }
  return `${value.toFixed(precision)}x`;
}

/**
 * 格式化日期字符串
 */
export function formatDate(
  dateInput: string | Date | undefined | null,
  formatStyle: 'date' | 'dateTime' = 'date'
): string {
  if (!dateInput) return '--';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);
    
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    if (formatStyle === 'date') {
      return `${y}-${m}-${day}`;
    }
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${h}:${min}`;
  } catch {
    return String(dateInput);
  }
}
