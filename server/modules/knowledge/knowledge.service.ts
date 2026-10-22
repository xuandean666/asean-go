import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { knowledgeItems } from '@server/database/schema';
import { eq, desc, count, and, ilike, or, like, sql } from 'drizzle-orm';
import type {
  KnowledgeItem,
  KnowledgeSearchRequest,
  KnowledgeSearchResult,
  PaginationResult,
} from '@shared/api.interface';

type ItemListParams = {
  page: number;
  pageSize: number;
  category?: string;
  country?: string;
  itemType?: string;
  keyword?: string;
};

// 预置知识库条目，首次启动时保证有数据可搜
const SEED_ITEMS: Array<{
  title: string;
  content: string;
  category: string;
  country?: string;
  itemType?: string;
  tags?: string[];
  sourceName?: string;
}> = [
  {
    title: '越南食品接触材料进口合规要求',
    content: '越南工贸部（MoIT）规定，所有食品接触材料（包括硅胶厨具、塑料餐具、不锈钢厨具等）进口越南前必须取得安全检测报告。检测项目包括：总迁移量、重金属（铅、镉、铬、镍）、甲醛、芳香胺等。检测须在越南认可的实验室（如 Vinacontrol、QUACERT）或出口国具备 CNAS/CMA 资质的实验室完成，报告需附带越南语翻译件。\n\n进口申报时需向海关提交：1）商业发票；2）装箱单；3）提单；4）产品安全检测报告；5）原产地证书（如适用 RCEP/CAFTA 优惠税率）。标签必须使用越南语标注产品名称、材质、产地、使用温度范围、制造商信息及联系方式。\n\nHS 编码建议：39241000（塑料制餐具及厨具）、73239300（不锈钢制厨房用具）。最惠国关税税率：15%；RCEP 协定税率：5%（需提供 RCEP 原产地证书）；CAFTA 协定税率：0-5%（需提供 Form E）。',
    category: '政策法规',
    country: 'vietnam',
    itemType: 'regulation',
    tags: ['食品接触', '合规', '检测', '关税', '硅胶'],
    sourceName: '越南工贸部 MoIT',
  },
  {
    title: '泰国化妆品备案注册流程指南',
    content: '泰国食品药品监督管理局（Thai FDA）负责化妆品的注册与监管。所有在泰国市场销售的化妆品必须完成产品备案（Notification），分为以下类别：\n\n1. 普通化妆品（一般护肤、彩妆、洗护等）：实行备案制，提交材料后 30 个工作日内完成，费用约 5,000-15,000 泰铢/产品。\n\n2. 特殊用途化妆品（防晒、染发、美白、除臭等功效宣称产品）：需按特殊化妆品申报，审核周期约 60-90 天，需提供功效评估报告。\n\n备案所需材料：\n- 产品配方（完整成分及百分比）\n- 产品标签设计稿（泰语）\n- 生产企业 GMP 证书\n- 产品安全评估报告（CPSR）\n- 自由销售证明（CFS）\n- 泰国境内责任人授权书\n\n注意：自 2024 年起，泰国 FDA 要求所有化妆品必须通过电子系统 e-Cosmetic 在线申报，不再接受纸质材料。产品备案号需标注在产品外包装上。',
    category: '认证注册',
    country: 'thailand',
    itemType: 'certification',
    tags: ['化妆品', '备案', 'FDA', '泰国'],
    sourceName: '泰国食品药品监督管理局 Thai FDA',
  },
  {
    title: '印尼电子电器 SNI 认证要求',
    content: '印度尼西亚国家标准局（BSN）对电子电器产品实施 SNI 强制认证制度。未获得 SNI 标志的产品不得在印尼市场销售。\n\n强制认证产品范围包括：\n- 家用电器：冰箱、洗衣机、空调、电风扇、电饭锅等\n- 信息技术设备：手机、充电器、笔记本电脑、电源适配器等\n- 照明设备：LED 灯泡、灯管、灯具等\n- 电线电缆、插头插座\n\n认证流程：\n1. 选择印尼本地认证机构（LPK）作为合作伙伴\n2. 提交产品技术文件和样品\n3. 工厂审核（初次认证必须）\n4. 型式试验（在印尼认可的实验室进行）\n5. 颁发 SNI 证书和标志使用许可\n6. 年度监督审核和续期\n\n认证周期通常为 2-4 个月，证书有效期 3 年。注意：2025 年起，印尼对手机充电器、移动电源等产品实施新的能效标准，未达标产品禁止进口。',
    category: '认证注册',
    country: 'indonesia',
    itemType: 'certification',
    tags: ['SNI', '电子电器', '认证', '印尼'],
    sourceName: '印尼国家标准局 BSN',
  },
  {
    title: '马来西亚 SIRIM 认证与进口许可',
    content: '马来西亚 SIRIM QAS International 是国家认可的认证机构，负责产品的强制性和自愿性认证。\n\n强制性认证产品（需 ST 标志）：\n- 电气产品：插头、插座、开关、保险丝、电线电缆\n- 建筑材料：水泥、钢材、玻璃\n- 个人防护装备：头盔、安全鞋\n- 燃气器具\n\n认证方式：\n1. 型式认证（Type Certification）：适合大批量、型号固定的产品\n2. 批次认证（Batch Certification）：适合小批量、试销产品\n3. 自愿性产品认证：提升产品竞争力\n\n进口清关要求：\n- 所有受控物品进口前需申请批准函（Approval Letter）\n- 由 SIRIM 或马来西亚能源委员会（ST）签发\n- 无批准函的货物将被海关扣留\n\n建议：首次进入马来西亚市场的电子配件产品，先确认是否在强制认证目录内，避免货物到港后无法清关。',
    category: '认证注册',
    country: 'malaysia',
    itemType: 'certification',
    tags: ['SIRIM', '认证', '马来西亚', '电器'],
    sourceName: '马来西亚 SIRIM QAS',
  },
  {
    title: '菲律宾产品进口关税与清关流程',
    content: '菲律宾海关（Bureau of Customs）负责进口货物的监管与征税。进口清关基本流程：\n\n1. 申报：货物到港前 3 天通过电子系统 e2m 申报\n2. 单证审核：海关审核商业发票、装箱单、提单、原产地证等\n3. 查验：按风险等级抽查（绿色通道 / 黄色通道 / 红色通道）\n4. 缴税：通过银行或电子支付缴纳关税及其他税费\n5. 放行：缴税后海关签发放行通知\n\n主要税费：\n- 最惠国关税（MFN Duty）：0-30%，依产品类别而定\n- 增值税（VAT）：12%（基于 CIF 价 + 关税 + 其他税）\n- 特别关税：部分奢侈品、烟酒等\n\n菲律宾是 RCEP 和 CAFTA 成员国，符合原产地规则的中国产品可享受优惠关税待遇。需注意的是，菲律宾海关对低申报（undervaluation）稽查严格，建议如实申报货值并保留完整的交易凭证。',
    category: '关税税率',
    country: 'philippines',
    itemType: 'tariff',
    tags: ['关税', '清关', '菲律宾', '进口流程'],
    sourceName: '菲律宾海关 BOC',
  },
  {
    title: 'Shopee 越南站入驻与运营指南',
    content: 'Shopee 是越南市场份额最大的电商平台，占据约 60% 的市场份额。中国卖家入驻 Shopee 越南站的流程和要点如下：\n\n入驻条件：\n- 中国大陆或香港注册的企业营业执照\n- 有跨境电商运营经验（其他平台流水证明）\n- 产品符合越南进口规定\n- 企业法人身份证\n\n入驻流程：\n1. 在线提交申请（Shopee 跨境卖家官网）\n2. 招商经理审核（1-3 个工作日）\n3. 店铺注册与设置\n4. 上架产品（首店需上架 50+ SKU）\n5. 上线运营\n\n运营要点：\n- 语言：越南语客服是标配，可使用平台翻译工具辅助\n- 物流：使用 Shopee 官方物流 SLS，从中国仓发往越南\n- 回款：每周一次，支持绑定国内对公账户\n- 佣金：6% 交易佣金 + 2% 支付手续费\n- 大促节点：1.1、4.4、6.6、7.7、8.8、9.9、10.10、11.11、12.12\n\n注意：越南站对侵权和虚假宣传处罚严厉，产品上架前务必做好知识产权排查。',
    category: '平台规则',
    country: 'vietnam',
    itemType: 'platform',
    tags: ['Shopee', '越南', '入驻', '运营', '跨境电商'],
    sourceName: 'Shopee 跨境卖家大学',
  },
  {
    title: 'TikTok Shop 泰国站运营实操手册',
    content: 'TikTok Shop 在泰国发展迅猛，已成为泰国第二大电商平台，特别适合美妆、服饰、家居等视觉化品类。\n\n入驻要求：\n- 企业营业执照\n- 跨境电商运营经验\n- 泰国本地退换货地址（可使用第三方服务商）\n- 品牌方授权（品牌店需提供）\n\n店铺类型：\n1. 跨境店（Cross-border）：从中国发货，适合新手试错\n2. 本地店（Local）：需泰国公司主体，回款更便利\n3. 品牌店（Mall）：品牌官方旗舰店，流量倾斜\n\n核心运营策略：\n- 达人带货：与中腰部达人（10k-100k 粉丝）合作性价比最高\n- 短视频种草：每天 2-3 条产品展示短视频，挂小黄车\n- 直播带货：黄金时段 20:00-23:00，每晚 2-3 小时直播\n- 广告投放：TopView + 信息流广告组合投放\n\n佣金费率：普通类目 5%，美妆 6%，3C 数码 4%。回款周期 T+7。\n\n注意：泰国对食品、保健品、化妆品在直播中的宣称有严格限制，禁止医疗效果宣称。',
    category: '平台规则',
    country: 'thailand',
    itemType: 'platform',
    tags: ['TikTok Shop', '泰国', '直播', '达人', '运营'],
    sourceName: 'TikTok Shop 商家帮助中心',
  },
  {
    title: '东南亚跨境物流模式全解析',
    content: '中国到东南亚跨境电商主流物流模式对比与选择建议：\n\n一、直邮模式\n- 代表：Shopee SLS、Lazada LGS、各种专线小包\n- 时效：5-10 天\n- 成本：¥20-50/kg\n- 适合：测款、低单量、轻小件\n- 优点：操作简单，无需备货海外\n- 缺点：时效不稳定，旺季延误严重\n\n二、海外仓模式\n- 代表：Shopee 海外仓、Lazada 海外仓、第三方海外仓\n- 时效：1-3 天（本地配送）\n- 成本：¥10-25/kg（含头程 + 仓储 + 尾程）\n- 适合：爆款、大件、高复购品\n- 优点：时效快、客户体验好、可参加平台活动\n- 缺点：库存压力大、滞销风险高\n\n三、空运 + 本地派送\n- 代表：各大货代空运专线\n- 时效：3-7 天\n- 成本：¥30-60/kg\n- 适合：高值小件、紧急补货\n- 优点：时效最快\n- 缺点：成本最高\n\n四、海运整柜/散货\n- 时效：20-35 天\n- 成本：¥5-15/kg\n- 适合：大批量备货、低值重货\n- 优点：单位成本最低\n- 缺点：时效最慢，需精准预测销量\n\n选择建议：新品先用直邮测款，日均出 5 单以上转海外仓，大促前 2 个月海运补货。',
    category: '物流仓储',
    itemType: 'guide',
    tags: ['物流', '海外仓', '空运', '海运', '跨境电商'],
    sourceName: '东盟跨境物流行业报告',
  },
  {
    title: 'RCEP 原产地规则与关税优惠详解',
    content: '《区域全面经济伙伴关系协定》（RCEP）于 2022 年 1 月 1 日正式生效，涵盖东盟十国及中、日、韩、澳、新共 15 个成员国。\n\n核心关税优惠：\n- 零关税产品比例：最终达到 90% 以上\n- 降税模式：立即零关税、10 年内降为零、20 年内降为零\n- 中国对东盟：大部分工业品 10 年内降为零关税\n\n原产地规则核心：\n1. 区域价值成分（RVC）≥40%：产品在 RCEP 区域内的增值部分占比不低于 40%\n2. 税则归类改变（CTC）：产品经过加工后 HS 编码发生改变\n3. 特定加工工序：部分产品需满足特定加工要求\n\n原产地累积规则：\nRCEP 最核心的优势是"累积规则"——产品生产中使用的任何 RCEP 成员国的原材料，都可以算作区域价值成分。这比双边自贸协定更容易满足原产地标准。\n\n办理流程：\n1. 产品进行原产地预裁定（可选，但建议）\n2. 货物出口前申请原产地证书\n3. 出口时随附原产地证书\n4. 进口国海关凭证书享受优惠税率\n\n注意：原产地证的申领需确保产品确实符合原产地标准，虚假申报将面临处罚。',
    category: '关税税率',
    itemType: 'regulation',
    tags: ['RCEP', '原产地', '关税优惠', '自贸区'],
    sourceName: '中国自由贸易区服务网',
  },
  {
    title: '东南亚各国电商消费习惯与偏好',
    content: '深入了解东南亚各国消费者的购物习惯，是跨境电商成功的关键。以下是主要市场的特点：\n\n【印度尼西亚】\n- 人口 2.7 亿，东南亚最大市场\n- 主力消费人群 18-35 岁，偏好社交媒体购物\n- 价格敏感，喜欢促销和折扣\n- 支付方式：货到付款（COD）占比仍高，电子钱包增长快\n- 热门品类：美妆护肤、时尚服饰、3C 配件、母婴用品\n\n【泰国】\n- 人均 GDP 在东南亚前列，消费能力较强\n- 消费者注重品牌和品质，愿意为好产品付费\n- 社交媒体影响大，Instagram 和 LINE 是重要渠道\n- 热门品类：美妆、健康保健、家居用品、食品\n- 对日本和韩国品牌认可度高\n\n【越南】\n- 增长最快的东南亚电商市场，年增速 30%+\n- 消费者年轻，价格敏感但品质意识在提升\n- Facebook 和 TikTok 是主要种草渠道\n- 热门品类：3C 数码、家居生活、美妆个护、母婴\n- 中国品牌接受度高，性价比是核心卖点\n\n【马来西亚】\n- 人均收入较高，英语普及率高\n- 消费者对跨境购物接受度高\n- 三大族群（马来、华人、印度）偏好不同\n- 热门品类：时尚、美妆、母婴、保健品\n\n【菲律宾】\n- 社交媒体使用时长全球第一\n- 年轻化程度高，消费观念超前\n- COD 仍是主流支付方式\n- 热门品类：时尚服饰、美妆、3C 配件、小家电',
    category: '市场概况',
    itemType: 'research',
    tags: ['消费习惯', '市场分析', '东南亚', '电商'],
    sourceName: 'eMarketer 东南亚电商报告',
  },
  {
    title: '越南语商品本地化文案写作指南',
    content: '越南市场是中国跨境卖家的重要目标市场，做好越南语本地化直接影响转化率。以下是实用指南：\n\n一、标题优化公式\n- 公式：[核心产品词] + [核心卖点/规格] + [信任背书/促销]\n- 示例：Bộ nồi lẩu inox 3 đáy 28cm - Chính hãng, bền bỉ\n（不锈钢三层底火锅 28cm - 正品保证，持久耐用）\n\n二、五点描述要点\n1. 第一点：产品核心功能和最大亮点（最关键，决定是否继续看）\n2. 第二点：材质和品质保证\n3. 第三点：适用场景和使用方法\n4. 第四点：规格参数和包装清单\n5. 第五点：售后保障和服务承诺\n\n三、文化适配注意事项\n- 越南消费者喜欢"日本品质"、"韩国设计"胜过"德国制造"\n- 颜色偏好：红色代表喜庆，绿色代表新生，黄色是皇室色慎用\n- 避免使用中国地图形状、政治敏感图案\n- 数字 4 因为发音近似"死"，部分消费者忌讳\n\n四、营销话术建议\n- 多用"giảm giá"（降价）、"khuyến mãi"（促销）吸引点击\n- 强调"chính hãng"（正品）、"bảo hành"（保修）增加信任\n- 使用"giao hàng miễn phí"（包邮）提升转化\n- 适当加入表情符号增加亲和力，但不要过多\n\n五、违禁词清单\n- 医疗效果宣称："chữa bệnh"（治病）、"thuốc"（药）等\n- 绝对化用语："tốt nhất"（最好）、"hoàn hảo"（完美）等\n- 与竞争对手贬低比较的表述',
    category: '营销 FAQ',
    country: 'vietnam',
    itemType: 'guide',
    tags: ['越南语', '本地化', '文案', '跨境电商'],
    sourceName: 'ASEAN-Go 本地化内容规范',
  },
  {
    title: 'Lazada 平台入驻政策与费用明细',
    content: 'Lazada 是东南亚老牌电商平台，覆盖印尼、马来西亚、菲律宾、新加坡、泰国、越南六国，阿里巴巴集团旗下，整体客单价略高于 Shopee。\n\n入驻条件：\n- 企业营业执照（中国大陆/香港均可）\n- 商标注册证或受理通知书（品牌店需提供）\n- 跨境电商运营经验\n- 完整的产品供应链\n\n费用结构：\n- 佣金：根据类目 1%-5%（电子 1%，美妆 4%，时尚 5%）\n- 支付手续费：约 2%\n- 运费：使用 Lazada 官方物流 LGS，按重量计费\n- 提现手续费：约 1%\n\n店铺类型：\n1. 跨境店（Cross-border）：从中国发货，入驻门槛低\n2. 本地店（Local）：需当地公司主体，流量扶持更多\n3. LazMall：品牌官方旗舰店，有专属标识和流量\n\n运营特点：\n- 平台调性偏品牌化，适合有品质的产品\n- 搜索流量占比高，SEO 优化很重要\n- 大促活动：生日大促（3月）、9.9、11.11、12.12\n- 客服响应时间要求 24 小时内\n\n适合品类：\n- 品牌 3C 数码\n- 中高端美妆个护\n- 家居小家电\n- 母婴用品',
    category: '平台规则',
    itemType: 'platform',
    tags: ['Lazada', '入驻', '费用', '跨境电商', '东南亚'],
    sourceName: 'Lazada 跨境卖家大学',
  },
];

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);
  private seedPromise: Promise<void> | null = null;

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  private async ensureSeed(): Promise<void> {
    if (this.seedPromise) return this.seedPromise;
    this.seedPromise = this.doSeed();
    return this.seedPromise;
  }

  private async doSeed(): Promise<void> {
    try {
      const result = await this.db
        .select({ count: count() })
        .from(knowledgeItems)
        .where(eq(knowledgeItems.status, 'published'));
      const total = Number(result[0]?.count ?? 0);
      if (total > 0) return;

      this.logger.log('知识库为空，开始写入预置条目...');
      const values = SEED_ITEMS.map((item) => ({
        title: item.title,
        content: item.content,
        category: item.category,
        country: item.country,
        itemType: item.itemType,
        tags: item.tags ?? [],
        sourceName: item.sourceName,
        sourceUrl: '',
        status: 'published',
      }));
      await this.db.insert(knowledgeItems).values(values);
      this.logger.log(`预置 ${values.length} 条知识库条目完成`);
    } catch (error) {
      this.logger.error('知识库预置数据失败', error);
      // 不抛出，不影响正常查询
    }
  }

  async getItems(params: ItemListParams): Promise<PaginationResult<KnowledgeItem>> {
    await this.ensureSeed();
    const page = Math.max(1, params.page);
    const pageSize = Math.min(50, Math.max(1, params.pageSize));
    const offset = (page - 1) * pageSize;

    const conditions = [eq(knowledgeItems.status, 'published')];
    if (params.category) conditions.push(eq(knowledgeItems.category, params.category));
    if (params.country) conditions.push(eq(knowledgeItems.country, params.country));
    if (params.itemType) conditions.push(eq(knowledgeItems.itemType, params.itemType));
    if (params.keyword) {
      const kw = `%${params.keyword}%`;
      conditions.push(
        or(
          ilike(knowledgeItems.title, kw),
          ilike(knowledgeItems.content, kw),
        ),
      );
    }

    const where = and(...conditions);

    const [rows, totalRows] = await Promise.all([
      this.db
        .select()
        .from(knowledgeItems)
        .where(where)
        .orderBy(desc(knowledgeItems.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(knowledgeItems).where(where),
    ]);

    const total = Number(totalRows[0]?.count ?? 0);
    const items: KnowledgeItem[] = rows.map((row) => this.mapRow(row));
    return { items, total, page, pageSize };
  }

  async getItem(id: string): Promise<KnowledgeItem | null> {
    const rows = await this.db
      .select()
      .from(knowledgeItems)
      .where(and(eq(knowledgeItems.id, id), eq(knowledgeItems.status, 'published')));
    if (rows.length === 0) return null;
    return this.mapRow(rows[0]);
  }

  async search(dto: KnowledgeSearchRequest): Promise<KnowledgeSearchResult> {
    await this.ensureSeed();
    const query = dto.query.trim();

    // 简单关键词检索：按 query 分词后匹配 title 和 content
    const tokens = this.tokenize(query);
    const conditions = [eq(knowledgeItems.status, 'published')];
    if (dto.country) conditions.push(eq(knowledgeItems.country, dto.country));
    if (dto.category) conditions.push(eq(knowledgeItems.category, dto.category));
    if (dto.itemType) conditions.push(eq(knowledgeItems.itemType, dto.itemType));

    let baseQuery = this.db.select().from(knowledgeItems).where(and(...conditions));

    // 如果有关键词，追加 ILIKE 并按相关性排序
    let rows: typeof knowledgeItems.$inferSelect[];
    if (tokens.length > 0) {
      // 关键词模糊匹配条件
      const keywordCondition = or(
        ...tokens.map((tok) => ilike(knowledgeItems.title, `%${tok}%`)),
        ...tokens.map((tok) => ilike(knowledgeItems.content, `%${tok}%`)),
      );

      const filteredConditions = [...conditions, keywordCondition];
      const results = await this.db
        .select({
          item: knowledgeItems,
          relevance: sql<number>`
            (
              (CASE WHEN ${knowledgeItems.title} ILIKE '%' || ${query} || '%' THEN 2 ELSE 0 END) +
              (CASE WHEN ${knowledgeItems.content} ILIKE '%' || ${query} || '%' THEN 1 ELSE 0 END) +
              ${sql.join(
                tokens.map(
                  (tok) =>
                    sql`CASE WHEN ${knowledgeItems.title} ILIKE '%' || ${tok} || '%' THEN 1.5 ELSE 0 END`,
                ),
                sql` + `,
              )} +
              ${sql.join(
                tokens.map(
                  (tok) =>
                    sql`CASE WHEN ${knowledgeItems.content} ILIKE '%' || ${tok} || '%' THEN 0.5 ELSE 0 END`,
                ),
                sql` + `,
              )}
            ) / (${tokens.length * 2 + 3}::float)
          `.as('relevance'),
        })
        .from(knowledgeItems)
        .where(and(...filteredConditions))
        .orderBy(sql`relevance DESC`)
        .limit(8);

      rows = results.map((r) => r.item);

      // 如果结果太少，放宽到部分匹配
      if (rows.length < 3) {
        const broadConditions = [...conditions];
        // 只对 content 做一次模糊 match（第一个关键词）
        broadConditions.push(ilike(knowledgeItems.content, `%${tokens[0]}%`));
        const extras = await this.db
          .select()
          .from(knowledgeItems)
          .where(and(...broadConditions))
          .orderBy(desc(knowledgeItems.createdAt))
          .limit(5);
        const existingIds = new Set(rows.map((r) => String(r.id)));
        for (const ex of extras) {
          if (!existingIds.has(String(ex.id))) rows.push(ex);
        }
      }

      // 重新计算相对分数用于展示（归一化到 0-1）
      const itemsWithRelevance = this.computeRelevance(
        rows.map((r) => this.mapRow(r)),
        query,
        tokens,
      );

      const avgRelevance =
        itemsWithRelevance.length > 0
          ? itemsWithRelevance.reduce((s, it) => s + it.relevance, 0) / itemsWithRelevance.length
          : 0;
      const hasReliableAnswer = itemsWithRelevance.length > 0 && avgRelevance >= 0.25;

      const sources = itemsWithRelevance.slice(0, 5).map((it) => ({
        itemId: it.id,
        title: it.title,
        snippet: this.extractSnippet(it.content, query, tokens),
        relevance: it.relevance,
      }));

      const answer = this.generateAnswer(query, itemsWithRelevance, hasReliableAnswer);

      return {
        answer,
        sources,
        hasReliableAnswer,
      };
    }

    // 无有效关键词，返回空结果 + 警告
    rows = await baseQuery.orderBy(desc(knowledgeItems.createdAt)).limit(5);
    const items = rows.map((r) => this.mapRow(r));
    return {
      answer: '抱歉，未检索到与您问题相关的可靠知识库条目。建议您：\n1. 尝试使用更简短的关键词重新搜索\n2. 切换不同的分类或国家筛选条件\n3. 联系客服获取人工帮助',
      sources: items.map((it) => ({
        itemId: it.id,
        title: it.title,
        snippet: it.content.slice(0, 120) + '...',
        relevance: 0.1,
      })),
      hasReliableAnswer: false,
    };
  }

  async createItem(
    dto: Omit<KnowledgeItem, 'id' | 'createdAt' | 'status'>,
  ): Promise<KnowledgeItem> {
    const [row] = await this.db
      .insert(knowledgeItems)
      .values({
        title: dto.title,
        content: dto.content,
        category: dto.category,
        country: dto.country,
        itemType: dto.itemType,
        tags: dto.tags ?? [],
        sourceUrl: dto.sourceUrl,
        sourceName: dto.sourceName,
        status: 'published',
      })
      .returning();
    return this.mapRow(row);
  }

  private tokenize(query: string): string[] {
    // 简单分词：去除空白和标点，按 2-4 字滑窗 + 中文词分隔
    const cleaned = query.replace(/[\s\p{P}]/gu, '');
    if (cleaned.length === 0) return [];

    const tokens: string[] = [];
    // 按常见词边界切分（简单启发式）
    if (cleaned.length <= 4) {
      tokens.push(cleaned);
    } else {
      // 2-gram + 3-gram 混合
      for (let i = 0; i < cleaned.length - 1; i += 1) {
        tokens.push(cleaned.slice(i, i + 2));
      }
      for (let i = 0; i < cleaned.length - 2; i += 1) {
        tokens.push(cleaned.slice(i, i + 3));
      }
      tokens.push(cleaned.slice(0, 4));
      tokens.push(cleaned.slice(-4));
    }

    // 去重
    return Array.from(new Set(tokens));
  }

  private computeRelevance(
    items: KnowledgeItem[],
    query: string,
    tokens: string[],
  ): Array<KnowledgeItem & { relevance: number }> {
    return items.map((item) => {
      let score = 0;
      const title = item.title.toLowerCase();
      const content = item.content.toLowerCase();
      const q = query.toLowerCase();

      // 完整匹配标题：最高分
      if (title.includes(q)) score += 3;
      // 完整匹配内容
      if (content.includes(q)) score += 1.5;

      // token 匹配
      for (const tok of tokens) {
        if (title.includes(tok.toLowerCase())) score += 1;
        if (content.includes(tok.toLowerCase())) score += 0.3;
      }

      // 归一化到 0-1
      const maxScore = 3 + 1.5 + tokens.length * 1.3;
      const relevance = Math.min(1, score / maxScore);
      return { ...item, relevance: Math.round(relevance * 100) / 100 };
    });
  }

  private extractSnippet(content: string, query: string, tokens: string[]): string {
    // 找 query 或第一个 token 在内容中的位置，截取前后文
    const lowerContent = content.toLowerCase();
    let pos = lowerContent.indexOf(query.toLowerCase());
    if (pos === -1 && tokens.length > 0) {
      // 找第一个命中的 token
      for (const tok of tokens) {
        pos = lowerContent.indexOf(tok.toLowerCase());
        if (pos !== -1) break;
      }
    }
    if (pos === -1) {
      // 没有命中，取开头
      return content.slice(0, 150) + (content.length > 150 ? '...' : '');
    }
    const start = Math.max(0, pos - 40);
    const end = Math.min(content.length, pos + 110);
    const snippet = content.slice(start, end);
    return (start > 0 ? '...' : '') + snippet + (end < content.length ? '...' : '');
  }

  private generateAnswer(
    query: string,
    items: Array<KnowledgeItem & { relevance: number }>,
    hasReliableAnswer: boolean,
  ): string {
    if (!hasReliableAnswer || items.length === 0) {
      return `未检索到与「${query}」相关的可靠知识库依据。以下是可能相关的部分信息，仅供参考，请结合权威渠道核实后再做决策。

【提示】建议您尝试：
• 使用更具体的关键词（如加上国家名或产品类别）
• 减少关键词数量，扩大搜索范围
• 切换分类筛选器浏览相关条目`;
    }

    // 基于 top 3 条目生成综合回答
    const topItems = items.slice(0, 3);
    const summaryBits: string[] = [];

    summaryBits.push(`根据知识库中 ${items.length} 条相关条目，就「${query}」为您整理如下：\n`);

    for (let i = 0; i < topItems.length; i += 1) {
      const item = topItems[i];
      // 提取内容的前 180 字作为摘要
      const firstPara = item.content.split('\n\n')[0] || item.content.slice(0, 180);
      const trimmed = firstPara.length > 220 ? firstPara.slice(0, 220) + '...' : firstPara;
      summaryBits.push(`${i + 1}. ${item.title}`);
      summaryBits.push(`   ${trimmed}`);
      summaryBits.push('');
    }

    summaryBits.push(
      `以上内容均来源于知识库，每条回答均有可追溯的来源依据。您可以点击下方溯源引用查看完整原文。`,
    );
    summaryBits.push(
      `⚠️ 本回答基于知识库资料生成，具体政策请以官方最新发布为准，重要决策建议咨询专业机构。`,
    );

    return summaryBits.join('\n');
  }

  private mapRow(row: typeof knowledgeItems.$inferSelect): KnowledgeItem {
    return {
      id: String(row.id),
      title: row.title,
      content: row.content,
      category: row.category,
      country: row.country ?? undefined,
      itemType: row.itemType ?? undefined,
      tags: (row.tags as string[] | null) ?? undefined,
      sourceUrl: row.sourceUrl ?? undefined,
      sourceName: row.sourceName ?? undefined,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
