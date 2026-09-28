import { StockData, FinancialYear, FundamentalScan } from '../types/stock';

const TUSHARE_API = (process.env.TUSHARE_API_URL || 'http://api.tushare.pro').replace(/\/+$/, '');
const EASTMONEY_API = 'https://datacenter.eastmoney.com/securities/api/data/v1/get';

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function valid(n: number): boolean {
  return Number.isFinite(n);
}

function toTushareCode(symbol: string): string | null {
  const s = symbol.trim().toUpperCase();
  if (/^\d{6}$/.test(s)) {
    const suffix = /^(60|68)/.test(s) ? 'SH' : /^(00|30)/.test(s) ? 'SZ' : /^(8|4)/.test(s) ? 'BJ' : 'SH';
    return `${s}.${suffix}`;
  }
  if (/^\d{1,5}$/.test(s)) {
    return `${s.padStart(5, '0')}.HK`;
  }
  return null;
}

function toEastmoneySecuCode(symbol: string): string | null {
  const s = symbol.trim().toUpperCase();
  if (/^\d{6}$/.test(s)) {
    const suffix = /^(60|68)/.test(s) ? 'SH' : /^(00|30)/.test(s) ? 'SZ' : /^(8|4)/.test(s) ? 'BJ' : 'SH';
    return `${s}.${suffix}`;
  }
  return null;
}

interface EastmoneyFinanceRow {
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

interface EastmoneyBalanceRow {
  REPORT_DATE?: string;
  ACCOUNTS_RECE?: number | null;
  TOTAL_ASSETS?: number | null;
  TOTAL_CURRENT_ASSETS?: number | null;
  TOTAL_CURRENT_LIAB?: number | null;
  FIXED_ASSET?: number | null;
  TOTAL_LIABILITIES?: number | null;
  TOTAL_PARENT_EQUITY?: number | null;
  SURPLUS_RESERVE?: number | null;
  UNASSIGN_RPOFIT?: number | null;
}

interface BalanceFields {
  receivables: number;
  totalAssets: number;
  currentAssets: number;
  currentLiabilities: number;
  fixedAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  retainedEarnings: number;
}

// 拉取东财资产负债表（年报），按 reportDate(YYYYMMDD) 索引，单位为亿元
async function fetchEastmoneyBalanceSheet(secuCode: string): Promise<Map<string, BalanceFields>> {
  const query = new URLSearchParams({
    reportName: 'RPT_F10_FINANCE_GBALANCE',
    columns: 'ALL',
    filter: `(SECUCODE="${secuCode}")`,
    pageNumber: '1',
    pageSize: '60',
    sortTypes: '-1',
    sortColumns: 'REPORT_DATE',
    source: 'HSF10',
    client: 'PC',
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(`${EASTMONEY_API}?${query.toString()}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    });
    if (!response.ok) return new Map();
    const json = await response.json();
    const rows: EastmoneyBalanceRow[] = json?.result?.data;
    if (!Array.isArray(rows) || rows.length === 0) return new Map();

    const map = new Map<string, BalanceFields>();
    for (const r of rows) {
      const reportDate = String(r.REPORT_DATE || '').slice(0, 10).replace(/-/g, '');
      // 仅取年报（12-31），与利润表年度口径对齐
      if (!/^\d{4}1231$/.test(reportDate)) continue;
      const totalAssets = Number(r.TOTAL_ASSETS) || 0;
      if (totalAssets <= 0) continue;
      map.set(reportDate, {
        receivables: round2((Number(r.ACCOUNTS_RECE) || 0) / 1e8),
        totalAssets: round2(totalAssets / 1e8),
        currentAssets: round2((Number(r.TOTAL_CURRENT_ASSETS) || 0) / 1e8),
        currentLiabilities: round2((Number(r.TOTAL_CURRENT_LIAB) || 0) / 1e8),
        fixedAssets: round2((Number(r.FIXED_ASSET) || 0) / 1e8),
        totalLiabilities: round2((Number(r.TOTAL_LIABILITIES) || 0) / 1e8),
        totalEquity: round2((Number(r.TOTAL_PARENT_EQUITY) || 0) / 1e8),
        retainedEarnings: round2(((Number(r.SURPLUS_RESERVE) || 0) + (Number(r.UNASSIGN_RPOFIT) || 0)) / 1e8),
      });
    }
    return map;
  } catch {
    return new Map();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchEastmoneyFinancialYears(secuCode: string): Promise<FinancialYear[] | null> {
  const query = new URLSearchParams({
    reportName: 'RPT_F10_FINANCE_MAINFINADATA',
    columns: 'ALL',
    filter: `(SECUCODE="${secuCode}")`,
    pageNumber: '1',
    pageSize: '60',
    sortTypes: '-1',
    sortColumns: 'REPORT_DATE',
    source: 'HSF10',
    client: 'PC',
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(`${EASTMONEY_API}?${query.toString()}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/json',
      },
    });
    if (!response.ok) return null;
    const json = await response.json();
    const rows: EastmoneyFinanceRow[] = json?.result?.data;
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const annualRows = rows
      .filter((r) => r.REPORT_TYPE === '年报' || String(r.REPORT_DATE || '').includes('12-31'))
      .sort((a, b) => (String(a.REPORT_DATE) < String(b.REPORT_DATE) ? -1 : 1))
      .slice(-6);

    const years: FinancialYear[] = [];
    for (const row of annualRows) {
      const reportDate = String(row.REPORT_DATE || '').slice(0, 10).replace(/-/g, '');
      const revenue = Number(row.TOTALOPERATEREVE) || 0;
      const netProfit = Number(row.PARENTNETPROFIT) || 0;
      const grossMargin = Number(row.XSMLL) || 0;
      const netMargin = Number(row.XSJLL) || 0;
      const roe = Number(row.ROEJQ) || 0;
      const debtToAsset = Number(row.ZCFZL) || 0;
      const freeCashFlow = Number(row.NETCASH_OPERATE_PK) || 0;

      if (revenue <= 0 || !reportDate) continue;

      years.push({
        year: reportDate.slice(0, 4),
        reportDate,
        revenue: round2(revenue / 1e8),
        netProfit: round2(netProfit / 1e8),
        grossMargin: round1(grossMargin),
        netMargin: round1(netMargin),
        roe: round1(roe),
        debtToAsset: round1(debtToAsset),
        freeCashFlow: round2(freeCashFlow / 1e8),
      });
    }

    if (years.length < 2) return null;

    // 合并真实资产负债表科目（用于 Beneish M-Score / Altman Z-Score 真值化）
    const balanceMap = await fetchEastmoneyBalanceSheet(secuCode);
    if (balanceMap.size > 0) {
      for (const y of years) {
        const b = y.reportDate ? balanceMap.get(y.reportDate) : undefined;
        if (b) {
          y.receivables = b.receivables;
          y.totalAssets = b.totalAssets;
          y.currentAssets = b.currentAssets;
          y.currentLiabilities = b.currentLiabilities;
          y.fixedAssets = b.fixedAssets;
          y.totalLiabilities = b.totalLiabilities;
          y.totalEquity = b.totalEquity;
          y.retainedEarnings = b.retainedEarnings;
        }
      }
    }

    return years;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function callTushare(
  apiName: string,
  params: Record<string, unknown>,
  fields: string
): Promise<Record<string, unknown>[]> {
  const token = process.env.TUSHARE_TOKEN;
  if (!token) {
    throw new Error('TUSHARE_TOKEN is not configured');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(TUSHARE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ api_name: apiName, token, params, fields }),
    });
    const json = await response.json();
    if (json.code !== 0) {
      throw new Error(`Tushare ${apiName} error: ${json.msg || 'unknown'}`);
    }
    if (!json.data || !Array.isArray(json.data.items)) {
      return [];
    }
    const columns: string[] = json.data.fields;
    return json.data.items.map((row: unknown[]) => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFinancialYears(tsCode: string): Promise<FinancialYear[] | null> {
  const [income, balance, cash] = await Promise.all([
    callTushare('income', { ts_code: tsCode }, 'ts_code,end_date,total_revenue,revenue,oper_cost,n_income,n_income_attr_p'),
    callTushare('balancesheet', { ts_code: tsCode }, 'ts_code,end_date,total_assets,total_liab,total_hldr_eqy_exc_min_int,accounts_receiv,total_cur_assets,total_cur_liab,fix_assets,retained_earnings'),
    callTushare('cashflow', { ts_code: tsCode }, 'ts_code,end_date,n_cashflow_act'),
  ]);

  const annualIncome = income
    .filter((r) => String(r.end_date).endsWith('1231'))
    .sort((a, b) => (String(a.end_date) < String(b.end_date) ? -1 : 1))
    .slice(-6);

  const balanceByDate = new Map(balance.map((r) => [String(r.end_date), r]));
  const cashByDate = new Map(cash.map((r) => [String(r.end_date), r]));

  const years: FinancialYear[] = [];
  for (const inc of annualIncome) {
    const bal = balanceByDate.get(String(inc.end_date));
    if (!bal) continue;

    const revenue = Number(inc.revenue) || Number(inc.total_revenue) || 0;
    const operCost = Number(inc.oper_cost) || 0;
    const netIncome = Number(inc.n_income_attr_p) || Number(inc.n_income) || 0;
    const totalAssets = Number(bal.total_assets) || 0;
    const totalLiab = Number(bal.total_liab) || 0;
    const equity = Number(bal.total_hldr_eqy_exc_min_int) || 0;
    const freeCashFlow = Number(cashByDate.get(String(inc.end_date))?.n_cashflow_act) || 0;

    if (revenue <= 0 || totalAssets <= 0) continue;

    years.push({
      year: String(inc.end_date).slice(0, 4),
      reportDate: String(inc.end_date),
      revenue: round2(revenue / 1e8),
      netProfit: round2(netIncome / 1e8),
      grossMargin: operCost > 0 ? round1(((revenue - operCost) / revenue) * 100) : 0,
      netMargin: round1((netIncome / revenue) * 100),
      roe: equity > 0 ? round1((netIncome / equity) * 100) : 0,
      debtToAsset: round1((totalLiab / totalAssets) * 100),
      freeCashFlow: round2(freeCashFlow / 1e8),
      receivables: round2((Number(bal.accounts_receiv) || 0) / 1e8),
      totalAssets: round2(totalAssets / 1e8),
      currentAssets: round2((Number(bal.total_cur_assets) || 0) / 1e8),
      currentLiabilities: round2((Number(bal.total_cur_liab) || 0) / 1e8),
      fixedAssets: round2((Number(bal.fix_assets) || 0) / 1e8),
      totalLiabilities: round2(totalLiab / 1e8),
      totalEquity: round2(equity / 1e8),
      retainedEarnings: round2((Number(bal.retained_earnings) || 0) / 1e8),
    });
  }

  return years.length >= 2 ? years : null;
}

function buildFundamentalScan(base: StockData, years: FinancialYear[]): FundamentalScan {
  const latest = years[years.length - 1];
  const prev = years.length >= 2 ? years[years.length - 2] : null;

  const grossMarginValue = latest.grossMargin > 0 ? latest.grossMargin : base.fundamentals.grossMarginValue;
  const netMarginValue = valid(latest.netMargin) ? latest.netMargin : base.fundamentals.netMarginValue;
  const debtRatioValue = valid(latest.debtToAsset) ? latest.debtToAsset : base.fundamentals.debtRatioValue;
  const roeValue = latest.roe > 0 ? latest.roe : base.fundamentals.roeValue;
  const revenueGrowthValue =
    prev && prev.revenue > 0 ? round1(((latest.revenue - prev.revenue) / prev.revenue) * 100) : base.fundamentals.revenueGrowthValue;
  const cashFlowValue = latest.freeCashFlow;

  const passes = [
    grossMarginValue >= 30,
    netMarginValue >= 10,
    debtRatioValue <= 60,
    roeValue >= 15,
    revenueGrowthValue >= 5,
    cashFlowValue > 0,
  ].filter(Boolean).length;
  const score = Math.round((passes / 6) * 100);
  let grade: FundamentalScan['grade'] = 'C';
  if (score >= 90) grade = 'A+';
  else if (score >= 75) grade = 'A';
  else if (score >= 60) grade = 'B';
  else if (score >= 40) grade = 'C';
  else grade = 'D';

  return {
    grossMarginPass: grossMarginValue >= 30,
    grossMarginValue: round1(grossMarginValue),
    netMarginPass: netMarginValue >= 10,
    netMarginValue: round1(netMarginValue),
    debtRatioPass: debtRatioValue <= 60,
    debtRatioValue: round1(debtRatioValue),
    roePass: roeValue >= 15,
    roeValue: round1(roeValue),
    revenueGrowthPass: revenueGrowthValue >= 5,
    revenueGrowthValue: round1(revenueGrowthValue),
    cashFlowPass: cashFlowValue > 0,
    cashFlowValue: round2(cashFlowValue),
    overallScore: score,
    grade,
  };
}

export async function enrichWithFinancials(stock: StockData): Promise<StockData> {
  if (process.env.TUSHARE_TOKEN) {
    const tsCode = toTushareCode(stock.symbol);
    if (!tsCode) {
      return stock;
    }

    try {
      const years = await fetchFinancialYears(tsCode);
      if (!years || years.length < 2) {
        return stock;
      }
      return {
        ...stock,
        fundamentals: buildFundamentalScan(stock, years),
        financialHistory: years,
        financialSource: 'tushare',
      };
    } catch (error: any) {
      console.warn('enrichWithFinancials(Tushare) failed, trying Eastmoney:', error?.message || error);
    }
  }

  const eastmoneyCode = toEastmoneySecuCode(stock.symbol);
  if (!eastmoneyCode) {
    return stock;
  }

  try {
    const years = await fetchEastmoneyFinancialYears(eastmoneyCode);
    if (!years || years.length < 2) {
      return stock;
    }
    return {
      ...stock,
      fundamentals: buildFundamentalScan(stock, years),
      financialHistory: years,
      financialSource: 'eastmoney',
    };
  } catch (error: any) {
    console.warn('enrichWithFinancials(Eastmoney) failed, using bundled financials:', error?.message || error);
    return stock;
  }
}
