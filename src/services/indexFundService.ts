import { IndexFundItem, CostSimulationResult, AssetAllocationRecommendation } from '../types/indexFund';
import { PRESET_INDEX_FUNDS, calculateShareClassCost, ASSET_ALLOCATION_PROFILES } from '../data/indexFundData';
import { request } from './apiClient';

export interface IndexFundFilterOptions {
  targetIndex?: string;
  minAssets?: number;
  maxTrackingError?: number;
  holdingDays?: number;
  quotaOnly?: boolean;
  investmentAmount?: number;
}

export interface IndexFundApiResponse {
  success: boolean;
  totalCount: number;
  matchedCount: number;
  funds: (IndexFundItem & {
    criteriaCheck: {
      quotaPass: boolean;
      sizePass: boolean;
      trackingPass: boolean;
    };
    costSimulation: CostSimulationResult;
  })[];
  allFunds: IndexFundItem[];
}

export async function getIndexFunds(options: IndexFundFilterOptions = {}): Promise<IndexFundApiResponse> {
  const {
    targetIndex = 'all',
    minAssets = 1.0,
    maxTrackingError = 2.0,
    holdingDays = 365,
    quotaOnly = true,
    investmentAmount = 50000,
  } = options;

  // 基金池已随前端打包，筛选和费用测算直接在本地完成，拖动滑块不再打接口。
  let list = [...PRESET_INDEX_FUNDS];
  if (targetIndex !== 'all') {
    list = list.filter((f) => f.targetIndex.toLowerCase() === targetIndex.toLowerCase());
  }

  const processed = list.map((fund) => {
    const quotaPass = fund.quotaStatus !== 'suspended';
    const sizePass = fund.fundSize >= minAssets;
    const trackingPass = fund.trackingError <= maxTrackingError;
    const costSim = calculateShareClassCost(fund, investmentAmount, holdingDays);

    return {
      ...fund,
      screenPass: quotaPass && sizePass && trackingPass,
      criteriaCheck: {
        quotaPass,
        sizePass,
        trackingPass,
      },
      costSimulation: costSim,
    };
  });

  let filtered = processed;
  if (quotaOnly) {
    filtered = filtered.filter((f) => f.criteriaCheck.quotaPass);
  }
  filtered = filtered.filter((f) => f.fundSize >= minAssets && f.trackingError <= maxTrackingError);
  filtered.sort((a, b) => a.totalExpenseRatio - b.totalExpenseRatio);

  return {
    success: true,
    totalCount: PRESET_INDEX_FUNDS.length,
    matchedCount: filtered.length,
    funds: filtered,
    allFunds: processed,
  };
}

export interface FundRealInfo {
  code: string;
  name: string;
  subscriptionFeeRate: number; // 折后申购费率 %
  sourceRate: number; // 原申购费率 %
}

export async function getFundRealInfo(code: string): Promise<FundRealInfo | null> {
  try {
    const response = await request<{ success: boolean; fund?: FundRealInfo; error?: string }>(
      `/api/fund/${code}`,
      { timeoutMs: 10000 }
    );
    if (response?.success && response.fund) return response.fund;
    return null;
  } catch (err) {
    console.warn('基金实时信息获取失败:', err);
    return null;
  }
}

export async function getCostComparison(
  fund: IndexFundItem,
  amount: number,
  holdingDays: number
): Promise<CostSimulationResult> {
  try {
    const response = await request<{ success: boolean; result: CostSimulationResult }>(
      '/api/index-funds/calculate-cost',
      {
        method: 'POST',
        body: JSON.stringify({ fundCode: fund.code, holdingDays, amount }),
      }
    );
    return response.result;
  } catch (err) {
    return calculateShareClassCost(fund, amount, holdingDays);
  }
}

export async function getAssetAllocationProfiles(): Promise<AssetAllocationRecommendation[]> {
  try {
    const response = await request<{ success: boolean; profiles: AssetAllocationRecommendation[] }>(
      '/api/index-funds/asset-allocation'
    );
    return response.profiles;
  } catch (err) {
    return ASSET_ALLOCATION_PROFILES;
  }
}

export interface AIDiagnosisResult {
  executiveSummary: string;
  keyTakeaways: string[];
  crossoverAnalysis: string;
}

export async function getAIDiagnosis(
  targetIndex: string,
  holdingYears: number,
  riskPreference: string
): Promise<AIDiagnosisResult> {
  try {
    const response = await request<{ success: boolean; diagnosis: AIDiagnosisResult }>(
      '/api/index-funds/ai-diagnosis',
      {
        method: 'POST',
        body: JSON.stringify({ targetIndex, holdingYears, riskPreference }),
      }
    );
    return response.diagnosis;
  } catch (err) {
    return {
      executiveSummary: `针对【${targetIndex}】与【持有 ${holdingYears} 年】投资策略：四步优选法（额度优先、跟踪误差≤2%、费率最优、规模≥1亿）能过滤90%的流动性折价和高摩擦成本，有效捕获核心指数长期Beta收益。`,
      keyTakeaways: [
        '优先选择额度充足或单日限额适中可定投的标的，避开因额度暂停造成的建仓中断',
        '严格把控跟踪误差≤2.0%，确保费后表现紧跟标的指数',
        holdingYears >= 1
          ? '持有超1年，强烈建议选择 A 类份额，单次申购费买断，免去长期每年销售服务费'
          : '持有期小于1年，建议选择 C 类份额，0申购费且满7天免赎回费',
        '场内ETF购买前务必查看实时折溢价率，若溢价超过1.5%~2.0%应转为场外净值申购',
      ],
      crossoverAnalysis: `A/C份额盈亏平衡点约在 180~270 天，持有时长 ${holdingYears} 年完全超过平衡点，A类更划算。`,
    };
  }
}
