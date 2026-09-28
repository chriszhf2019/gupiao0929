import { StockData, ScenarioDetail, PeerBenchmarkItem, PorterForces, PreMortemItem } from '../types/stock';

export interface StockDeepExplorationData {
  scenarios: {
    bull: ScenarioDetail;
    base: ScenarioDetail;
    bear: ScenarioDetail;
  };
  porterForces: PorterForces;
  peers: PeerBenchmarkItem[];
  preMortem: PreMortemItem[];
}

export const DEEP_EXPLORATION_PRESETS: Record<string, StockDeepExplorationData> = {
  '600519': {
    scenarios: {
      bull: {
        probability: 30,
        cagrGrowth: 16.5,
        targetPe: 32.0,
        targetPrice: 2080.0,
        upsidePercent: 41.6,
        catalystSummary: '直销与i茅台数字化渠道占比突破60%，飞天批价坚挺上行，非标与文创产品高溢价放量，分红比例提升至80%以上。',
      },
      base: {
        probability: 50,
        cagrGrowth: 11.0,
        targetPe: 25.0,
        targetPrice: 1650.0,
        upsidePercent: 12.4,
        catalystSummary: '经营性现金流稳健复合增长，年化10%~12%产能释放，稳健派息率支撑3.5%股息率底线，防御属性凸显。',
      },
      bear: {
        probability: 20,
        cagrGrowth: 4.0,
        targetPe: 18.0,
        targetPrice: 1150.0,
        upsidePercent: -21.7,
        catalystSummary: '商务与高净值消费持续承压，批价持续下探冲击经销商库存体系，估值回撤至历史极值18倍PE。',
      },
    },
    porterForces: {
      supplierPower: { level: 'low', score: 95, desc: '上游高粱小麦原料采购高度标准化且成本占比极低，公司具备绝对定价权' },
      buyerPower: { level: 'low', score: 98, desc: '品牌溢价极致，长期处于卖方供不应求市场，无应收账款，全款预付' },
      threatOfNewEntrants: { level: 'low', score: 99, desc: '受赤水河微生态地理气候与百年酿造工艺双重保护，核心产区不可复制' },
      threatOfSubstitutes: { level: 'low', score: 92, desc: '社交货币属性与中国顶层人际礼品消费心智不可替代，跨品类威胁极低' },
      competitiveRivalry: { level: 'low', score: 90, desc: '高端千元以上价格带垄断近70%份额，与五粮液、国窖形成差异化阶梯' },
      overallMoatRating: 'Wide Moat',
      moatTrend: 'Stable',
      moatSources: ['独家地理微生态自然禀赋', '不可颠覆的顶级社交文化心智品牌', '超90%毛利率定价权'],
    },
    peers: [
      { symbol: '600519', name: '贵州茅台', currentPrice: 1468.5, currency: 'CNY', peTTM: 23.4, pePercentile: 14.5, grossMargin: 91.8, roe: 30.2, revenueGrowth: 15.6, dividendYield: 3.42, isCurrentStock: true },
      { symbol: '000858', name: '五粮液', currentPrice: 138.2, currency: 'CNY', peTTM: 16.8, pePercentile: 18.0, grossMargin: 75.8, roe: 24.5, revenueGrowth: 9.8, dividendYield: 3.95 },
      { symbol: '000568', name: '泸州老窖', currentPrice: 142.5, currency: 'CNY', peTTM: 15.2, pePercentile: 12.0, grossMargin: 88.3, roe: 28.1, revenueGrowth: 12.4, dividendYield: 4.10 },
      { symbol: '600809', name: '山西汾酒', currentPrice: 198.0, currency: 'CNY', peTTM: 19.5, pePercentile: 22.0, grossMargin: 75.3, roe: 32.5, revenueGrowth: 18.2, dividendYield: 2.65 },
    ],
    preMortem: [
      {
        id: 'pm-1',
        riskScenario: '高端白酒社交消费场景永久性收缩',
        triggerEvent: '宏观商务宴请长期低迷，年轻一代消费偏好发生代际转移',
        probability: 'low',
        potentialDrawdown: '-30% ~ -40%',
        earlyWarningSignal: '飞天散瓶批发价跌破2000元，经销商大面积抛售库存',
        mitigationPlan: '将止损线提至$1280，提高分红再投资现金比重，不一次性重仓',
      },
      {
        id: 'pm-2',
        riskScenario: '消费税改革后移至零售端并加征税负',
        triggerEvent: '财政税制改革落地，白酒消费税税率调整导致终端毛利受挤压',
        probability: 'medium',
        potentialDrawdown: '-15% ~ -20%',
        earlyWarningSignal: '国家税务总局出台高档消费品消费税调整草案',
        mitigationPlan: '茅台具备最强提价转嫁能力，逢大幅恐慌错杀反而是中线买点',
      },
      {
        id: 'pm-3',
        riskScenario: '大股东或关联资金占用及治理结构黑天鹅',
        triggerEvent: '地方财政压力下非市场化干预分红与资本开支',
        probability: 'low',
        potentialDrawdown: '-20%',
        earlyWarningSignal: '公司现金理财流向非标项目或现金分红比例意外腰斩',
        mitigationPlan: '定期追踪三季报与年报货币资金存放银行明细与派息承诺执行情况',
      },
    ],
  },
  '300750': {
    scenarios: {
      bull: {
        probability: 35,
        cagrGrowth: 26.0,
        targetPe: 30.0,
        targetPrice: 380.0,
        upsidePercent: 47.1,
        catalystSummary: '全球储能需求爆发（欧洲/中东/新兴市场），麒麟与神行电池全面渗透高端车企，技术授权LRS模式在北美突破。',
      },
      base: {
        probability: 45,
        cagrGrowth: 18.0,
        targetPe: 22.0,
        targetPrice: 295.0,
        upsidePercent: 14.2,
        catalystSummary: '全球动力电池市占率稳固在37%左右，单位Wh净利保持在0.08~0.09元，规模效应与制造溢价持续变现。',
      },
      bear: {
        probability: 20,
        cagrGrowth: 5.0,
        targetPe: 15.0,
        targetPrice: 195.0,
        upsidePercent: -24.5,
        catalystSummary: '海外欧美加征惩罚性关税阻断出口，整车厂二供三供价格战加剧，单位净利被压缩至0.05元/Wh。',
      },
    },
    porterForces: {
      supplierPower: { level: 'low', score: 85, desc: '上游锂矿与正负极材料自供比例提升，通过参股与长协平抑大宗波动' },
      buyerPower: { level: 'medium', score: 70, desc: '下游车企虽扶持二供，但在高端车和超充性能上对宁德依赖度高' },
      threatOfNewEntrants: { level: 'low', score: 92, desc: '百GWh量产良品率、专利壁垒、客户验证周期超3年，护城河深厚' },
      threatOfSubstitutes: { level: 'low', score: 88, desc: '全固态电池商用化仍需3~5年，公司在凝聚态与固态专利储备同样领先' },
      competitiveRivalry: { level: 'medium', score: 78, desc: '国内存在比亚迪、中创新航竞争，海外与LG新能源、松下博弈' },
      overallMoatRating: 'Wide Moat',
      moatTrend: 'Widening',
      moatSources: ['全球极致规模成本优势 (极限制造2.0)', '超高研发投入形成的专利群与技术代差', '跨国Tier 1客户网络认证黏性'],
    },
    peers: [
      { symbol: '300750', name: '宁德时代', currentPrice: 258.4, currency: 'CNY', peTTM: 21.8, pePercentile: 12.2, grossMargin: 28.2, roe: 24.5, revenueGrowth: 22.4, dividendYield: 2.15, isCurrentStock: true },
      { symbol: '002594', name: '比亚迪', currentPrice: 285.6, currency: 'CNY', peTTM: 20.4, pePercentile: 19.5, grossMargin: 20.1, roe: 21.8, revenueGrowth: 28.5, dividendYield: 1.60 },
      { symbol: '002074', name: '国轩高科', currentPrice: 22.4, currency: 'CNY', peTTM: 35.8, pePercentile: 45.0, grossMargin: 16.9, roe: 3.5, revenueGrowth: 15.2, dividendYield: 0.85 },
      { symbol: '300014', name: '亿纬锂能', currentPrice: 46.8, currency: 'CNY', peTTM: 23.5, pePercentile: 25.0, grossMargin: 17.5, roe: 13.2, revenueGrowth: 14.8, dividendYield: 1.45 },
    ],
    preMortem: [
      {
        id: 'pm-1',
        riskScenario: '地缘关税与IRA法案全面升级封锁出海',
        triggerEvent: '美国与欧盟对含中资电池组件实施无差别溯源制裁',
        probability: 'medium',
        potentialDrawdown: '-25% ~ -35%',
        earlyWarningSignal: '欧洲通过针对电池碳足迹更严苛排他性法案',
        mitigationPlan: '追踪匈牙利工厂投产进度及与福特、Stellantis的技术授权分成比例',
      },
      {
        id: 'pm-2',
        riskScenario: '固态电池颠覆性技术突然被竞品率先低成本商用',
        triggerEvent: '海外某实验室或初创企业在固态电解质离子电导率与界面阻抗取得突破',
        probability: 'low',
        potentialDrawdown: '-30%',
        earlyWarningSignal: '车企宣布2027年前全面切换非锂电路线',
        mitigationPlan: '关注宁德时代年度研发费用率（需持续>7%）及硫化物固态专利公开量',
      },
      {
        id: 'pm-3',
        riskScenario: '整车厂内卷白热化倒逼动力电池价格无底线压价',
        triggerEvent: '国内电车价格战持续3年以上，电池二供竞相降价抢份额',
        probability: 'medium',
        potentialDrawdown: '-20%',
        earlyWarningSignal: '公司动力电池毛利率跌破20%',
        mitigationPlan: '储能业务高毛利出海平抑汽车业务波动，跌破支撑位严格减仓',
      },
    ],
  },
  '00700': {
    scenarios: {
      bull: {
        probability: 30,
        cagrGrowth: 18.0,
        targetPe: 22.0,
        targetPrice: 520.0,
        upsidePercent: 35.8,
        catalystSummary: '混元大模型赋能微信生态商业化超预期，海外游戏常青化营收破新高，千亿回购注销带来EPS高双位数弹性。',
      },
      base: {
        probability: 50,
        cagrGrowth: 12.0,
        targetPe: 17.0,
        targetPrice: 430.0,
        upsidePercent: 12.3,
        catalystSummary: '视频号广告与微信电商GMV稳健成长，金融科技复苏，常态化千亿港元回购托底估值底线。',
      },
      bear: {
        probability: 20,
        cagrGrowth: 4.0,
        targetPe: 12.0,
        targetPrice: 305.0,
        upsidePercent: -20.4,
        catalystSummary: '宏观广告大盘需求萎缩，未成年人防沉迷与游戏版号监管趋严，外资持续减持压制港股流动性。',
      },
    },
    porterForces: {
      supplierPower: { level: 'low', score: 92, desc: '内容创作者与开发商高度依赖微信/QQ超级入口流量分发' },
      buyerPower: { level: 'low', score: 95, desc: '13亿+月活微信生态黏性极高，无同等替代通讯与社交基础设施' },
      threatOfNewEntrants: { level: 'low', score: 98, desc: '跨代际社交网络效应固若金汤，后发者几乎无法重构双边人际关系链' },
      threatOfSubstitutes: { level: 'medium', score: 75, desc: '短视频平台（抖音等）对总用户时长构成竞争，但视频号已补齐短板' },
      competitiveRivalry: { level: 'low', score: 85, desc: '国内社交基本无敌手，云服务与游戏海外直接对标全球巨头' },
      overallMoatRating: 'Wide Moat',
      moatTrend: 'Widening',
      moatSources: ['中国最大超级生态网络效应 (微信+QQ)', '全球顶级游戏工作室研发与发行集群', '高利润率轻资产现金牛模式'],
    },
    peers: [
      { symbol: '00700', name: '腾讯控股', currentPrice: 383.0, currency: 'HKD', peTTM: 16.5, pePercentile: 18.5, grossMargin: 52.6, roe: 22.8, revenueGrowth: 10.5, dividendYield: 1.25, isCurrentStock: true },
      { symbol: '09988', name: '阿里巴巴', currentPrice: 84.5, currency: 'HKD', peTTM: 11.2, pePercentile: 15.0, grossMargin: 38.5, roe: 12.0, revenueGrowth: 6.8, dividendYield: 2.30 },
      { symbol: '03690', name: '美团-W', currentPrice: 135.0, currency: 'HKD', peTTM: 20.8, pePercentile: 22.0, grossMargin: 36.2, roe: 18.5, revenueGrowth: 21.0, dividendYield: 0.00 },
      { symbol: '09888', name: '百度集团', currentPrice: 92.0, currency: 'HKD', peTTM: 10.5, pePercentile: 16.0, grossMargin: 49.5, roe: 9.8, revenueGrowth: 3.5, dividendYield: 0.00 },
    ],
    preMortem: [
      {
        id: 'pm-1',
        riskScenario: '短视频AI原生应用彻底分流社交与搜索引擎入口',
        triggerEvent: '多模态个人AI Agent替代传统通讯App交互模式',
        probability: 'low',
        potentialDrawdown: '-25%',
        earlyWarningSignal: '微信每日打开频次和时长出现不可逆滑坡',
        mitigationPlan: '跟踪腾讯在元宝AI及微信原生智能体的深度整合进程',
      },
      {
        id: 'pm-2',
        riskScenario: '港股受地缘政治金融脱钩长期折价',
        triggerEvent: '海外被动基金与主权财富基金减持中资资产',
        probability: 'medium',
        potentialDrawdown: '-20%',
        earlyWarningSignal: '南向资金流入无法抵消外资离场抛压',
        mitigationPlan: '腾讯自身每日10亿港元回购是坚实安全垫，估值接近12倍PE时为历史极值买点',
      },
      {
        id: 'pm-3',
        riskScenario: '游戏出海遭遇各国反垄断与数据主权合规制裁',
        triggerEvent: '核心出海爆款被主要西方国家安全审查下架',
        probability: 'low',
        potentialDrawdown: '-15%',
        earlyWarningSignal: '多国国会启动针对游戏内置算法与微交易审查听证会',
        mitigationPlan: '腾讯投资的拳头、Supercell等均为海外独立运营，风险相对分散',
      },
    ],
  },
  'NVDA': {
    scenarios: {
      bull: {
        probability: 40,
        cagrGrowth: 38.0,
        targetPe: 45.0,
        targetPrice: 195.0,
        upsidePercent: 57.5,
        catalystSummary: 'Blackwell与Rubin架构芯片供不应求，主权AI与企业级智能体推理计算爆发，CUDA软件收入占比持续攀升。',
      },
      base: {
        probability: 40,
        cagrGrowth: 25.0,
        targetPe: 32.0,
        targetPrice: 145.0,
        upsidePercent: 17.1,
        catalystSummary: '云厂商（微软/谷歌/亚马逊/Meta）资本开支稳步增长，推理端芯片市占率保持70%以上，毛利率维持在72%~74%。',
      },
      bear: {
        probability: 20,
        cagrGrowth: 8.0,
        targetPe: 22.0,
        targetPrice: 85.0,
        upsidePercent: -31.3,
        catalystSummary: 'AI大模型应用端变现ROI不及预期引发云厂商CAPEX骤停，博通/自研ASIC芯片替代加速，估值遭遇戴维斯双杀。',
      },
    },
    porterForces: {
      supplierPower: { level: 'medium', score: 72, desc: '先进制程与CoWoS先进封装高度依赖台积电产能，供应链有单点瓶颈' },
      buyerPower: { level: 'low', score: 92, desc: '头部四大CSP即使自研ASIC，仍必须采购英伟达旗舰GPU以维持模型竞争力' },
      threatOfNewEntrants: { level: 'low', score: 98, desc: '15年CUDA软件生态积累、数十万算子库与数百万开发者黏性，壁垒极高' },
      threatOfSubstitutes: { level: 'medium', score: 70, desc: '专用推理ASIC芯片成本可能低于通用GPU，但算法迭代期通用GPU仍是首选' },
      competitiveRivalry: { level: 'low', score: 88, desc: 'AMD ROCm生态仍在追赶，英伟达拥有完整全栈网络（NVLink/InfiniBand）' },
      overallMoatRating: 'Wide Moat',
      moatTrend: 'Widening',
      moatSources: ['CUDA 软硬件一体化生态垄断壁垒', 'NVLink 与网络全栈系统级计算架构', '全球超大规模量产研发飞轮'],
    },
    peers: [
      { symbol: 'NVDA', name: '英伟达', currentPrice: 123.8, currency: 'USD', peTTM: 35.2, pePercentile: 32.0, grossMargin: 74.8, roe: 68.2, revenueGrowth: 78.5, dividendYield: 0.08, isCurrentStock: true },
      { symbol: 'AMD', name: '超威半导体', currentPrice: 148.5, currency: 'USD', peTTM: 48.0, pePercentile: 45.0, grossMargin: 51.5, roe: 9.5, revenueGrowth: 18.0, dividendYield: 0.00 },
      { symbol: 'AVGO', name: '博通', currentPrice: 165.0, currency: 'USD', peTTM: 32.5, pePercentile: 38.0, grossMargin: 65.2, roe: 32.0, revenueGrowth: 35.0, dividendYield: 1.45 },
      { symbol: 'QCOM', name: '高通', currentPrice: 168.0, currency: 'USD', peTTM: 19.8, pePercentile: 28.0, grossMargin: 56.0, roe: 38.5, revenueGrowth: 12.0, dividendYield: 2.10 },
    ],
    preMortem: [
      {
        id: 'pm-1',
        riskScenario: 'AI 应用层商业化 ROI 破灭导致巨头削减资本开支',
        triggerEvent: '大模型在企业端变现受阻，微软/Meta宣布削减下财年云服务器采购',
        probability: 'medium',
        potentialDrawdown: '-35% ~ -45%',
        earlyWarningSignal: 'CSP资本开支增速连续两个季度环比负增长',
        mitigationPlan: '密切监控台积电高性能计算HPC代工订单排期与主要CSP资本支出指引',
      },
      {
        id: 'pm-2',
        riskScenario: '台海地缘风险导致先进芯片代工断供',
        triggerEvent: '地缘局势突变波及台积电先进制程代工厂生产',
        probability: 'low',
        potentialDrawdown: '-40%',
        earlyWarningSignal: '国际外交红线事件与供应链警报升级',
        mitigationPlan: '推动台积电美日欧海外工厂及第二代工源（如Intel Foundry）备份',
      },
      {
        id: 'pm-3',
        riskScenario: '云厂商定制 ASIC 芯片在推理侧大幅替代通用 GPU',
        triggerEvent: '谷歌TPU或博通定制芯片在推理成本上比英伟达便宜50%以上',
        probability: 'medium',
        potentialDrawdown: '-25%',
        earlyWarningSignal: '英伟达数据中心收入增速放缓且毛利率下滑至70%以下',
        mitigationPlan: '英伟达向系统级（GB200整机柜）与软件订阅收费延展提升客户黏性',
      },
    ],
  },
};

export function getDeepExplorationForStock(stock: StockData): StockDeepExplorationData {
  if (DEEP_EXPLORATION_PRESETS[stock.symbol]) {
    return DEEP_EXPLORATION_PRESETS[stock.symbol];
  }

  // Dynamic generative fallback for any other stock symbol
  const cur = stock.currentPrice;
  const pe = stock.peTTM || 20;

  return {
    scenarios: {
      bull: {
        probability: 30,
        cagrGrowth: 22.0,
        targetPe: Math.round(pe * 1.35),
        targetPrice: Number((cur * 1.45).toFixed(2)),
        upsidePercent: 45.0,
        catalystSummary: `行业景气加速超预期，核心产品市占率与毛利率双升，受益于政策红利催化与估值中枢上移。`,
      },
      base: {
        probability: 50,
        cagrGrowth: 12.0,
        targetPe: Math.round(pe * 1.05),
        targetPrice: Number((cur * 1.15).toFixed(2)),
        upsidePercent: 15.0,
        catalystSummary: `业绩符合市场一致预期，现金流充沛，稳健派息为股价提供坚实安全边际。`,
      },
      bear: {
        probability: 20,
        cagrGrowth: 2.0,
        targetPe: Math.round(pe * 0.75),
        targetPrice: Number((cur * 0.78).toFixed(2)),
        upsidePercent: -22.0,
        catalystSummary: `行业竞争加剧或宏观周期下行，营收增速回落，估值回踩历史偏低分位。`,
      },
    },
    porterForces: {
      supplierPower: { level: 'low', score: 80, desc: '上游物料与供应链较为分散，议价能力较强' },
      buyerPower: { level: 'medium', score: 75, desc: '下游客户黏性尚可，具备一定溢价能力与品牌壁垒' },
      threatOfNewEntrants: { level: 'low', score: 85, desc: '行业资质、技术壁垒与初始资本开支构筑中高进入门槛' },
      threatOfSubstitutes: { level: 'low', score: 82, desc: '核心产品成熟，短期内无颠覆性替代方案' },
      competitiveRivalry: { level: 'medium', score: 72, desc: '存量市场内存在数家同梯队竞品争夺份额' },
      overallMoatRating: 'Narrow Moat',
      moatTrend: 'Stable',
      moatSources: ['细分赛道龙头品牌效应', '多年技术沉淀与销售渠道覆盖'],
    },
    peers: [
      {
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: stock.currentPrice,
        currency: stock.currency,
        peTTM: stock.peTTM,
        pePercentile: stock.valuation.historicalPePercentile,
        grossMargin: stock.fundamentals.grossMarginValue,
        roe: stock.fundamentals.roeValue,
        revenueGrowth: stock.fundamentals.revenueGrowthValue,
        dividendYield: stock.valuation.dividendYield,
        isCurrentStock: true,
      },
      {
        symbol: 'PEER-1',
        name: `${stock.sector.split('/')[0] || '同业'}参考标的A`,
        currentPrice: Number((stock.currentPrice * 0.85).toFixed(2)),
        currency: stock.currency,
        peTTM: Number((stock.peTTM * 1.1).toFixed(1)),
        pePercentile: 35.0,
        grossMargin: Number((stock.fundamentals.grossMarginValue * 0.9).toFixed(1)),
        roe: Number((stock.fundamentals.roeValue * 0.88).toFixed(1)),
        revenueGrowth: 8.5,
        dividendYield: 2.2,
      },
      {
        symbol: 'PEER-2',
        name: `${stock.sector.split('/')[0] || '同业'}参考标的B`,
        currentPrice: Number((stock.currentPrice * 1.2).toFixed(2)),
        currency: stock.currency,
        peTTM: Number((stock.peTTM * 0.9).toFixed(1)),
        pePercentile: 25.0,
        grossMargin: Number((stock.fundamentals.grossMarginValue * 0.95).toFixed(1)),
        roe: Number((stock.fundamentals.roeValue * 0.92).toFixed(1)),
        revenueGrowth: 11.2,
        dividendYield: 2.8,
      },
    ],
    preMortem: [
      {
        id: 'pm-1',
        riskScenario: '主营业务行业增速发生断崖式降速',
        triggerEvent: '下游终端需求饱和或宏观资本开支整体压缩',
        probability: 'medium',
        potentialDrawdown: '-25% ~ -35%',
        earlyWarningSignal: '应收账款与存货周转天数大幅拉长，连续两季毛利滑坡',
        mitigationPlan: '设定严格防守止损线，若关键支撑位跌破无条件离场减仓',
      },
      {
        id: 'pm-2',
        riskScenario: '行业价格战加剧导致盈利中枢下移',
        triggerEvent: '竞争对手大举扩产并以低价抢占市场份额',
        probability: 'medium',
        potentialDrawdown: '-20%',
        earlyWarningSignal: '核心产品平均单价出厂价出现下调信号',
        mitigationPlan: '重点观察高毛利新业务能否接棒放量，控制单一资产总持仓比例',
      },
    ],
  };
}
