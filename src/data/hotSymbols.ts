export interface HotSymbol {
  symbol: string;
  name: string;
  category: HotSymbolCategory;
  reason: string;
}

export type HotSymbolCategory = '长期复利' | '前沿科技' | '政策受益' | '高股息' | '出海全球';

// 重点标杆标的研判池：按四类标准精选——长期可投入、前沿技术驱动、政策受益，
// 以及高股息防御与出海全球作为补充。点击后会通过后端拉取真实行情与财报。
export const HOT_SYMBOLS: HotSymbol[] = [
  // 长期可投入：品牌护城河、稳定现金流与复利能力
  { symbol: '600519', name: '贵州茅台', category: '长期复利', reason: '品牌护城河与高现金流' },
  { symbol: '000858', name: '五粮液', category: '长期复利', reason: '高端消费与稳定分红' },
  { symbol: '600036', name: '招商银行', category: '长期复利', reason: '零售银行龙头' },
  { symbol: '601318', name: '中国平安', category: '长期复利', reason: '综合金融与高股息' },

  // 前沿技术驱动：AI、算力、半导体与国产软件
  { symbol: '00700', name: '腾讯控股', category: '前沿科技', reason: '平台生态+AI+游戏现金流' },
  { symbol: '688041', name: '海光信息', category: '前沿科技', reason: '国产CPU/DCU算力' },
  { symbol: '300308', name: '中际旭创', category: '前沿科技', reason: '800G光模块AI算力' },
  { symbol: '002230', name: '科大讯飞', category: '前沿科技', reason: '大模型与AI应用' },

  // 政策受益：自主可控、新能源、创新药等战略方向
  { symbol: '688981', name: '中芯国际', category: '政策受益', reason: '先进制程国产替代' },
  { symbol: '300750', name: '宁德时代', category: '政策受益', reason: '新能源与储能政策' },
  { symbol: '300274', name: '阳光电源', category: '政策受益', reason: '储能与光伏出海' },
  { symbol: '600276', name: '恒瑞医药', category: '政策受益', reason: '创新药龙头' },

  // 高股息防御：稳定分红与低波动压舱石
  { symbol: '600900', name: '长江电力', category: '高股息', reason: '水电现金奶牛' },
  { symbol: '601088', name: '中国神华', category: '高股息', reason: '煤电一体化高分红' },
  { symbol: '600941', name: '中国移动', category: '高股息', reason: '运营商+算力网络' },

  // 出海全球：全球化制造与全球份额扩张
  { symbol: '002594', name: '比亚迪', category: '出海全球', reason: '新能源车全球化' },
  { symbol: '000333', name: '美的集团', category: '出海全球', reason: '全球化家电+机器人' },
  { symbol: '600690', name: '海尔智家', category: '出海全球', reason: '全球高端家电品牌' },
];
