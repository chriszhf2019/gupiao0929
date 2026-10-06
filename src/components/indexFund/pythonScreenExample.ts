export const pythonScriptExample = `# -*- coding: utf-8 -*-
"""
机构级指数基金四步筛选法量化脚本
1. 额度优先 (QDII额度检测)
2. 跟踪误差 <= 2.0%
3. 规模 >= 1.0 亿元 (剔除迷你基金清盘风险)
4. 持有成本最小化 (管理费+托管费+销售服务费升序)
5. A/C类份额自动匹配推荐
"""

import pandas as pd
# 可选真实数据源: akshare (国内QDII与ETF) 或 yfinance (美股原生ETF)
# import akshare as ak

def screen_index_funds(
    index_name: str = 'Nasdaq 100',
    holding_days: int = 365,
    min_assets_yi: float = 1.0,
    max_tracking_error: float = 2.0,
    quota_only: bool = True
) -> pd.DataFrame:
    """
    根据四步优选法执行指数基金筛选
    """
    # 模拟从 akshare 获取的底层基金宽表 (实际可通过 ak.fund_etf_spot_em() 获取)
    sample_funds = [
        {"code": "000834", "name": "大成纳斯达克100ETF联接A", "index": "Nasdaq 100", "size": 148.6, "te": 0.82, "fee_hold": 0.65, "sub_fee": 0.12, "sales_fee": 0.0, "quota": "限额1000元"},
        {"code": "006479", "name": "广发纳斯达克100ETF联接C", "index": "Nasdaq 100", "size": 92.4, "te": 0.84, "fee_hold": 0.90, "sub_fee": 0.0, "sales_fee": 0.25, "quota": "限额1000元"},
        {"code": "513100", "name": "国泰纳斯达克100ETF(场内)", "index": "Nasdaq 100", "size": 125.8, "te": 0.65, "fee_hold": 0.65, "sub_fee": 0.03, "sales_fee": 0.0, "quota": "开放交易"},
        {"code": "161130", "name": "易方达纳斯达克100LOF", "index": "Nasdaq 100", "size": 68.3, "te": 1.15, "fee_hold": 0.80, "sub_fee": 0.12, "sales_fee": 0.0, "quota": "暂停申购"},
{"code": "161125", "name": "易方达标普500指数A", "index": "S&P 500", "size": 110.5, "te": 0.62, "fee_hold": 0.65, "sub_fee": 0.12, "sales_fee": 0.0, "quota": "限额500元"},
        {"code": "050025", "name": "博时标普500ETF联接A", "index": "S&P 500", "size": 142.1, "te": 0.68, "fee_hold": 0.80, "sub_fee": 0.12, "sales_fee": 0.0, "quota": "限额2000元"},
    ]
    df = pd.DataFrame(sample_funds)
    
    # 步骤 1: 指数匹配
    df = df[df['index'] == index_name]
    
    # 步骤 2: 额度优先 (剔除暂停申购标的)
    if quota_only:
        df = df[df['quota'] != '暂停申购']
        
    # 步骤 3: 跟踪误差 <= 2.0%
    df = df[df['te'] <= max_tracking_error]
    
    # 步骤 4: 基金规模 >= 1.0 亿元
    df = df[df['size'] >= min_assets_yi]
    
    # 步骤 5: 推荐 A/C 类份额
    # 盈亏平衡临界点: 申购费率 / 销售服务费率 * 365天
    def recommend_share_class(row):
        if '场内' in row['name']:
            return '场内ETF'
        # 持有期天数 >= 180天 或 1年推荐 A类
        return 'A类份额' if holding_days >= 180 else 'C类份额'
        
    df['推荐份额'] = df.apply(recommend_share_class, axis=1)
    
    # 规则: 按持有成本升序排序
    return df.sort_values('fee_hold', ascending=True)

# 执行筛选测试: 筛选纳指100，预计持有1年(365天)
if __name__ == '__main__':
    result = screen_index_funds('Nasdaq 100', holding_days=365)
    print("=== 纳指100 四步筛选法优选结果 ===")
    print(result[['code', 'name', 'size', 'te', 'fee_hold', 'quota', '推荐份额']])
`;
