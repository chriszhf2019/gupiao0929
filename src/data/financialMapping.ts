import { FinancialYear } from '../types/stock';

export interface EastmoneyMainRow {
  REPORT_DATE?: string;
  REPORT_TYPE?: string;
  TOTALOPERATEREVE?: number | null;
  PARENTNETPROFIT?: number | null;
  XSMLL?: number | null;
  XSJLL?: number | null;
  ROEJQ?: number | null;
  ZCFZL?: number | null;
  NETCASH_OPERATE_PK?: number | null;
}

const CAPEX_KEYS = ['CONSTRUCT_LONG_ASSET', 'CONSTRUCT_LONG_ASSET_PK', 'c_pay_acq_const_fiolta'];

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** 购建长期资产支付的现金，取绝对值（元）。没有该科目时返回 null。 */
export function readCashOutflowYuan(row: Record<string, unknown> | null | undefined): number | null {
  if (!row) return null;
  for (const key of CAPEX_KEYS) {
    const n = Number(row[key]);
    if (Number.isFinite(n) && n !== 0) return Math.abs(n);
  }
  return null;
}

/**
 * freeCashFlow 继续表示经营现金流。只有拿到资本开支时才填写自由现金流（经营现金流 − 资本开支）。
 */
export function applyOwnerFreeCashFlow(year: FinancialYear, capexYuan: number | null): FinancialYear {
  const operating = round2(year.operatingCashFlow ?? year.freeCashFlow);
  const next: FinancialYear = { ...year, operatingCashFlow: operating, freeCashFlow: operating };
  if (capexYuan == null || !Number.isFinite(capexYuan)) return next;
  const capitalExpenditure = round2(Math.abs(capexYuan) / 1e8);
  return {
    ...next,
    capitalExpenditure,
    freeCashFlowToEquity: round2(operating - capitalExpenditure),
  };
}

export function mapEastmoneyAnnualRow(row: EastmoneyMainRow): FinancialYear | null {
  const reportDate = String(row.REPORT_DATE || '').slice(0, 10).replace(/-/g, '');
  const revenue = Number(row.TOTALOPERATEREVE) || 0;
  if (revenue <= 0 || !reportDate) return null;
  const operating = round2((Number(row.NETCASH_OPERATE_PK) || 0) / 1e8);
  return {
    year: reportDate.slice(0, 4),
    reportDate,
    revenue: round2(revenue / 1e8),
    netProfit: round2((Number(row.PARENTNETPROFIT) || 0) / 1e8),
    grossMargin: round1(Number(row.XSMLL) || 0),
    netMargin: round1(Number(row.XSJLL) || 0),
    roe: round1(Number(row.ROEJQ) || 0),
    debtToAsset: round1(Number(row.ZCFZL) || 0),
    freeCashFlow: operating,
    operatingCashFlow: operating,
  };
}

export function mapTushareAnnualRow(
  inc: Record<string, unknown>,
  bal: Record<string, unknown>,
  cash: Record<string, unknown> | undefined
): FinancialYear | null {
  const revenue = Number(inc.revenue) || Number(inc.total_revenue) || 0;
  const totalAssets = Number(bal.total_assets) || 0;
  if (revenue <= 0 || totalAssets <= 0) return null;
  const operCost = Number(inc.oper_cost) || 0;
  const netIncome = Number(inc.n_income_attr_p) || Number(inc.n_income) || 0;
  const totalLiab = Number(bal.total_liab) || 0;
  const equity = Number(bal.total_hldr_eqy_exc_min_int) || 0;
  const operating = round2((Number(cash?.n_cashflow_act) || 0) / 1e8);
  const endDate = String(inc.end_date);
  const year: FinancialYear = {
    year: endDate.slice(0, 4),
    reportDate: endDate,
    revenue: round2(revenue / 1e8),
    netProfit: round2(netIncome / 1e8),
    grossMargin: operCost > 0 ? round1(((revenue - operCost) / revenue) * 100) : 0,
    netMargin: round1((netIncome / revenue) * 100),
    roe: equity > 0 ? round1((netIncome / equity) * 100) : 0,
    debtToAsset: round1((totalLiab / totalAssets) * 100),
    freeCashFlow: operating,
    operatingCashFlow: operating,
    receivables: round2((Number(bal.accounts_receiv) || 0) / 1e8),
    totalAssets: round2(totalAssets / 1e8),
    currentAssets: round2((Number(bal.total_cur_assets) || 0) / 1e8),
    currentLiabilities: round2((Number(bal.total_cur_liab) || 0) / 1e8),
    fixedAssets: round2((Number(bal.fix_assets) || 0) / 1e8),
    totalLiabilities: round2(totalLiab / 1e8),
    totalEquity: round2(equity / 1e8),
    retainedEarnings: round2((Number(bal.retained_earnings) || 0) / 1e8),
  };
  return applyOwnerFreeCashFlow(year, readCashOutflowYuan(cash));
}
