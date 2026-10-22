import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { marketReports } from '@server/database/schema';
import { eq, desc, count, and } from 'drizzle-orm';
import type {
  MarketReport,
  PaginationResult,
  PaginationParams,
  CreateMarketReportRequest,
} from '@shared/api.interface';

type CompetitorItem = { name: string; price: number; share: number; rating: number };

const ASEAN_COUNTRIES = [
  'vietnam', 'thailand', 'indonesia', 'malaysia', 'philippines',
  'singapore', 'cambodia', 'laos', 'myanmar', 'brunei',
];

const COUNTRY_LOCALE: Record<string, { name: string; currency: string; currencyCode: string; exchangeRate: number }> = {
  vietnam:     { name: '越南',     currency: 'VND', currencyCode: '越南盾', exchangeRate: 3550 },
  thailand:    { name: '泰国',     currency: 'THB', currencyCode: '泰铢',   exchangeRate: 3.55 },
  indonesia:   { name: '印尼',     currency: 'IDR', currencyCode: '印尼盾', exchangeRate: 16200 },
  malaysia:    { name: '马来西亚', currency: 'MYR', currencyCode: '林吉特', exchangeRate: 4.65 },
  philippines: { name: '菲律宾',   currency: 'PHP', currencyCode: '比索',   exchangeRate: 55.8 },
  singapore:   { name: '新加坡',   currency: 'SGD', currencyCode: '新元',   exchangeRate: 1.35 },
  cambodia:    { name: '柬埔寨',   currency: 'KHR', currencyCode: '瑞尔',   exchangeRate: 4100 },
  laos:        { name: '老挝',     currency: 'LAK', currencyCode: '基普',   exchangeRate: 21500 },
  myanmar:     { name: '缅甸',     currency: 'MMK', currencyCode: '缅元',   exchangeRate: 3200 },
  brunei:      { name: '文莱',     currency: 'BND', currencyCode: '文莱元', exchangeRate: 1.35 },
};

const CATEGORY_BASE: Record<string, { basePrice: number; tariff: number; growth: number; competitors: string[] }> = {
  '3C数码':        { basePrice: 1200, tariff: 0,   growth: 18, competitors: ['Samsung', 'Xiaomi', 'OPPO', 'Vivo', 'Realme'] },
  '家居用品':      { basePrice: 180,  tariff: 5,   growth: 12, competitors: ['IKEA', 'Miniso', 'Nitori', 'Ace Hardware', 'Informa'] },
  '服装鞋帽':      { basePrice: 150,  tariff: 10,  growth: 15, competitors: ['Uniqlo', 'Zara', 'H&M', 'Nike', 'Adidas'] },
  '美妆个护':      { basePrice: 220,  tariff: 15,  growth: 22, competitors: ['Unilever', 'P&G', 'L\'Oreal', 'Wardah', 'Emina'] },
  '食品饮料':      { basePrice: 80,   tariff: 20,  growth: 10, competitors: ['Nestle', 'Indofood', 'Mayora', 'Mead Johnson', 'Dutch Lady'] },
  '玩具母婴':      { basePrice: 250,  tariff: 10,  growth: 20, competitors: ['LEGO', 'Hasbro', 'Fisher-Price', 'Mama & Papas', 'Pigeon'] },
  '运动户外':      { basePrice: 400,  tariff: 10,  growth: 25, competitors: ['Nike', 'Adidas', 'Decathlon', 'Li-Ning', 'Anta'] },
  '汽车配件':      { basePrice: 350,  tariff: 15,  growth: 16, competitors: ['Bosch', 'Denso', '3M', 'Philips', 'TRW'] },
  '工业用品':      { basePrice: 800,  tariff: 10,  growth: 14, competitors: ['Schneider', 'Siemens', 'ABB', '3M', 'Honeywell'] },
  '默认品类':      { basePrice: 300,  tariff: 10,  growth: 15, competitors: ['Brand A', 'Brand B', 'Brand C', 'Brand D', 'Brand E'] },
};

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function generateTrend(category: string, country: string) {
  const seed = hash(category + country);
  const base = 1000 + (seed % 800);
  const months: string[] = [];
  const values: number[] = [];
  const now = new Date();
  const growthBase = CATEGORY_BASE[category]?.growth ?? 15;
  const growthVariation = ((seed % 50) - 20) / 10;
  const monthlyGrowth = (growthBase + growthVariation) / 100;

  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    const factor = 1 + monthlyGrowth * (5 - i);
    const noise = ((seed >> i) % 30) / 100 - 0.1;
    values.push(Math.round(base * factor * (1 + noise)));
  }

  const growthRate = Math.round(((values[5] - values[0]) / values[0]) * 100 * 10) / 10;
  return { months, values, growthRate };
}

function generatePriceRange(category: string, country: string) {
  const seed = hash(category + country);
  const cat = CATEGORY_BASE[category] ?? CATEGORY_BASE['默认品类'];
  const base = cat.basePrice * (1 + ((seed % 40) - 20) / 100);
  const min = Math.round(base * 0.6);
  const max = Math.round(base * 1.8);
  const average = Math.round(base);
  const locale = COUNTRY_LOCALE[country];
  return {
    min: Math.round(min * (locale?.exchangeRate ?? 1)),
    max: Math.round(max * (locale?.exchangeRate ?? 1)),
    average: Math.round(average * (locale?.exchangeRate ?? 1)),
    currency: locale?.currencyCode ?? '当地货币',
  };
}

function generateCompetitors(category: string, country: string) {
  const seed = hash(category + country);
  const cat = CATEGORY_BASE[category] ?? CATEGORY_BASE['默认品类'];
  const items: CompetitorItem[] = cat.competitors.map((name: string, idx: number) => {
    const s = seed + idx * 97;
    const priceFactor = 0.7 + (s % 60) / 100;
    const share = 35 - idx * 5 + (s % 8);
    const rating = 4.8 - idx * 0.15 - ((s % 10) / 100);
    const locale = COUNTRY_LOCALE[country];
    return {
      name,
      price: Math.round(CATEGORY_BASE[category]?.basePrice * priceFactor * (locale?.exchangeRate ?? 1)),
      share: Math.max(5, Math.min(40, share)),
      rating: Math.round(Math.max(3.5, Math.min(5, rating)) * 10) / 10,
    };
  });
  return { items };
}

function generateTariff(category: string, country: string) {
  const cat = CATEGORY_BASE[category] ?? CATEGORY_BASE['默认品类'];
  const base = cat.tariff;
  const seed = hash(category + country);
  const rate = Math.max(0, base + (seed % 10) - 3);
  const types = ['最惠国税率', '协定税率', '普通税率'];
  const typeIdx = seed % 3;
  const descriptions = [
    `依据 ${COUNTRY_LOCALE[country]?.name ?? country} 海关税则，该品类适用最惠国待遇，进口关税税率为 ${rate}%。`,
    `中国-东盟自贸区（CAFTA）框架下，该品类已纳入降税清单，当前协定税率为 ${rate}%。`,
    `该品类属于敏感产品清单，适用普通关税税率 ${rate}%，建议申请原产地证书以享受优惠税率。`,
  ];
  return { rate, type: types[typeIdx], description: descriptions[typeIdx] };
}

function generateLogistics(country: string) {
  const seed = hash(country);
  const distanceFactor = 1 + (seed % 30) / 100;
  return {
    sea: Math.round(350 * distanceFactor),
    air: Math.round(1200 * distanceFactor),
    express: Math.round(2200 * distanceFactor),
    unit: 'USD/立方米',
  };
}

function generateRecommendations(category: string, country: string) {
  const cat = CATEGORY_BASE[category] ?? CATEGORY_BASE['默认品类'];
  const locale = COUNTRY_LOCALE[country] ?? { name: country };
  return `针对${locale.name}${category}市场，建议：
1. 优先通过 Shopee / TikTok Shop 等主流平台切入，利用本地仓提升配送时效；
2. 定价策略参考市场中位价 ${Math.round(cat.basePrice * 1.1)} 元区间，突出性价比优势；
3. 产品需符合 ${locale.name} 当地标准与认证要求，建议提前办理准入资质；
4. 营销重点投放社交媒体与短视频渠道，结合当地 KOL 扩大品牌声量；
5. 物流建议采用海运批量备货 + 空运紧急补货的组合方案，控制综合成本。`;
}

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getReports(params: PaginationParams): Promise<PaginationResult<MarketReport>> {
    const page = Math.max(1, params.page);
    const pageSize = Math.min(50, Math.max(1, params.pageSize));
    const offset = (page - 1) * pageSize;

    const [rows, totalRows] = await Promise.all([
      this.db
        .select()
        .from(marketReports)
        .orderBy(desc(marketReports.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(marketReports),
    ]);

    const total = Number(totalRows[0]?.count ?? 0);
    const items: MarketReport[] = rows.map((row) => this.mapRow(row));
    return { items, total, page, pageSize };
  }

  async getReport(id: string): Promise<MarketReport | null> {
    const rows = await this.db.select().from(marketReports).where(eq(marketReports.id, id));
    if (rows.length === 0) return null;
    return this.mapRow(rows[0]);
  }

  async createReport(dto: CreateMarketReportRequest): Promise<MarketReport> {
    if (!dto.country || !ASEAN_COUNTRIES.includes(dto.country)) {
      throw new BadRequestException('请选择有效的东盟国家');
    }
    if (!dto.category || dto.category.trim().length === 0) {
      throw new BadRequestException('请输入品类名称');
    }

    // Look up existing matching report
    const existing = await this.db
      .select()
      .from(marketReports)
      .where(
        and(
          eq(marketReports.country, dto.country),
          eq(marketReports.category, dto.category),
          eq(marketReports.status, 'completed'),
        ),
      )
      .orderBy(desc(marketReports.createdAt))
      .limit(1);

    if (existing.length > 0) {
      return this.mapRow(existing[0]);
    }

    const trendData = generateTrend(dto.category, dto.country);
    const priceRange = generatePriceRange(dto.category, dto.country);
    const competitors = generateCompetitors(dto.category, dto.country);
    const exchangeRate = COUNTRY_LOCALE[dto.country]?.exchangeRate ?? 1;
    const tariffInfo = generateTariff(dto.category, dto.country);
    const logisticsCost = generateLogistics(dto.country);
    const recommendations = generateRecommendations(dto.category, dto.country);

    const insertValues = {
      country: dto.country,
      category: dto.category,
      trendData,
      priceRange,
      competitors,
      exchangeRate: String(exchangeRate),
      tariffInfo,
      logisticsCost,
      recommendations,
      status: 'completed',
      projectId: dto.projectId ?? null,
    };

    const inserted = await this.db
      .insert(marketReports)
      .values(insertValues)
      .returning();

    return this.mapRow(inserted[0]);
  }

  private mapRow(row: Record<string, unknown>): MarketReport {
    return {
      id: String(row.id),
      projectId: row.projectId ? String(row.projectId) : undefined,
      country: String(row.country),
      category: String(row.category),
      trendData: row.trendData as MarketReport['trendData'],
      priceRange: row.priceRange as MarketReport['priceRange'],
      competitors: row.competitors as MarketReport['competitors'],
      exchangeRate: row.exchangeRate !== undefined ? Number(row.exchangeRate) : undefined,
      tariffInfo: row.tariffInfo as MarketReport['tariffInfo'],
      logisticsCost: row.logisticsCost as MarketReport['logisticsCost'],
      recommendations: row.recommendations ? String(row.recommendations) : undefined,
      status: String(row.status),
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    };
  }
}
