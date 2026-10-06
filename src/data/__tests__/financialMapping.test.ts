import { describe, it, expect } from 'vitest';
import { applyOwnerFreeCashFlow, mapEastmoneyAnnualRow, mapTushareAnnualRow, readCashOutflowYuan } from '../financialMapping';

describe('财报字段映射', () => {
  it('东财年报行把经营现金流记在 freeCashFlow，单位换成亿元', () => {
    const year = mapEastmoneyAnnualRow({
      REPORT_DATE: '2024-12-31',
      REPORT_TYPE: '年报',
      TOTALOPERATEREVE: 100e8,
      PARENTNETPROFIT: 20e8,
      XSMLL: 40.2,
      XSJLL: 20,
      ROEJQ: 15,
      ZCFZL: 30,
      NETCASH_OPERATE_PK: 18e8,
    });
    expect(year).toMatchObject({
      year: '2024',
      reportDate: '20241231',
      revenue: 100,
      netProfit: 20,
      freeCashFlow: 18,
      operatingCashFlow: 18,
    });
    expect(year?.freeCashFlowToEquity).toBeUndefined();
  });

  it('有资本开支时自由现金流等于经营现金流减资本开支', () => {
    const base = mapEastmoneyAnnualRow({
      REPORT_DATE: '2024-12-31',
      TOTALOPERATEREVE: 100e8,
      NETCASH_OPERATE_PK: 18e8,
    });
    const withCapex = applyOwnerFreeCashFlow(base!, 4e8);
    expect(withCapex.capitalExpenditure).toBe(4);
    expect(withCapex.freeCashFlowToEquity).toBe(14);
    expect(withCapex.freeCashFlow).toBe(18);
  });

  it('Tushare 现金流量表同时映射经营现金流和购建长期资产', () => {
    const year = mapTushareAnnualRow(
      { end_date: '20231231', revenue: 50e8, oper_cost: 30e8, n_income_attr_p: 8e8 },
      { total_assets: 80e8, total_liab: 20e8, total_hldr_eqy_exc_min_int: 60e8 },
      { n_cashflow_act: 9e8, c_pay_acq_const_fiolta: 2e8 }
    );
    expect(year?.freeCashFlow).toBe(9);
    expect(year?.freeCashFlowToEquity).toBe(7);
    expect(readCashOutflowYuan({ CONSTRUCT_LONG_ASSET: -3e8 })).toBe(3e8);
    expect(readCashOutflowYuan({})).toBeNull();
  });

  it('营收不为正的行不生成年度记录', () => {
    expect(mapEastmoneyAnnualRow({ REPORT_DATE: '2024-12-31', TOTALOPERATEREVE: 0 })).toBeNull();
  });
});
