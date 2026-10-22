import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { conversations, messages } from '@server/database/schema';
import { eq, and, desc, asc, count } from 'drizzle-orm';
import type { Conversation, Message, SendMessageRequest, PaginationResult } from '@shared/api.interface';

type AseanLanguage = 'vi' | 'th' | 'id' | 'ms' | 'fil';

const LANGUAGE_NAMES: Record<AseanLanguage, string> = {
  vi: '越南语',
  th: '泰语',
  id: '印尼语',
  ms: '马来语',
  fil: '菲律宾语',
};

const AI_REPLY_TEMPLATES: Record<AseanLanguage, { greeting: string; thanks: string; price: string; shipping: string }> = {
  vi: {
    greeting: 'Xin chào! Cảm ơn bạn đã liên hệ với chúng tôi. Chúng tôi rất vui được hỗ trợ bạn hôm nay.',
    thanks: 'Cảm ơn bạn rất nhiều vì sự quan tâm của bạn. Chúng tôi rất trân trọng sự tin tưởng của bạn vào sản phẩm của chúng tôi.',
    price: 'Giá sản phẩm này là 25 USD. Nếu bạn đặt từ 10 chiếc trở lên, chúng tôi có thể giảm giá thêm 10%. Bạn nghĩ sao?',
    shipping: 'Thời gian vận chuyển thường là 7-10 ngày làm việc. Chúng tôi hỗ trợ vận chuyển miễn phí cho đơn hàng từ 50 USD trở lên.',
  },
  th: {
    greeting: 'สวัสดีค่ะ! ขอบคุณที่ติดต่อเราค่ะ เรายินดีมากที่ได้ช่วยเหลือคุณวันนี้ค่ะ',
    thanks: 'ขอบคุณมากที่ให้ความสนใจค่ะ เราประทับใจความไว้วางใจของคุณในผลิตภัณฑ์ของเราค่ะ',
    price: 'ราคาสินค้านี้คือ 25 ดอลลาร์ค่ะ หากสั่งมากกว่า 10 ชิ้น เราสามารถลดราคาเพิ่มอีก 10% ได้ค่ะ คุณคิดอย่างไรคะ?',
    shipping: 'ระยะเวลาจัดส่งโดยทั่วไปคือ 7-10 วันทำการค่ะ เรามีบริการจัดส่งฟรีสำหรับคำสั่งซื้อที่เกิน 50 ดอลลาร์ค่ะ',
  },
  id: {
    greeting: 'Halo! Terima kasih telah menghubungi kami. Kami senang dapat membantu Anda hari ini.',
    thanks: 'Terima kasih banyak atas ketertarikan Anda. Kami sangat menghargai kepercayaan Anda pada produk kami.',
    price: 'Harga produk ini adalah 25 USD. Jika Anda memesan 10 buah atau lebih, kami bisa memberikan diskon 10% tambahan. Bagaimana menurut Anda?',
    shipping: 'Waktu pengiriman biasanya 7-10 hari kerja. Kami menawarkan pengiriman gratis untuk pesanan di atas 50 USD.',
  },
  ms: {
    greeting: 'Hai! Terima kasih telah menghubungi kami. Kami gembira dapat membantu anda hari ini.',
    thanks: 'Terima kasih banyak atas minat anda. Kami sangat menghargai kepercayaan anda terhadap produk kami.',
    price: 'Harga produk ini ialah 25 USD. Jika anda pesan 10 unit atau lebih, kami boleh beri diskon 10% tambahan. Bagaimana menurut anda?',
    shipping: 'Tempoh penghantaran biasanya 7-10 hari bekerja. Kami menawarkan penghantaran percuma untuk pesanan melebihi 50 USD.',
  },
  fil: {
    greeting: 'Kumusta! Maraming salamat sa pakikipag-ugnayan sa amin. Masaya kaming matulungan ka ngayong araw.',
    thanks: 'Maraming salamat sa iyong interes. Lubos naming pinapahalagahan ang iyong tiwala sa aming produkto.',
    price: 'Ang presyo ng produktong ito ay 25 USD. Kung mag-order ka ng 10 pataas, maaari kaming magbigay ng karagdagang 10% na diskwento. Ano sa tingin mo?',
    shipping: 'Ang oras ng pagpapadala ay karaniwang 7-10 araw ng trabaho. Nag-aalok kami ng libreng pagpapadala para sa mga order na higit sa 50 USD.',
  },
};

const CULTURAL_TIPS: Record<AseanLanguage, string[]> = {
  vi: [
    '越南客户非常重视礼貌和尊重，沟通中多用敬语和友好的措辞。',
    '越南人在商务谈判中偏好先建立关系，再谈具体业务，不要急于切入价格。',
  ],
  th: [
    '泰国客户注重礼貌和微笑，沟通中应保持温和友善的语气。',
    '泰国商务文化重视层级关系，对年长或职位高的人需特别尊重。',
  ],
  id: [
    '印尼客户重视建立个人关系，沟通初期应多寒暄，不要直奔主题。',
    '印尼人习惯用委婉的方式表达拒绝，需要留意对方的暗示。',
  ],
  ms: [
    '马来客户重视礼貌和尊重，沟通中使用敬语是良好商务礼仪。',
    '马来西亚商务文化偏集体决策，谈判周期可能较长，需要耐心跟进。',
  ],
  fil: [
    '菲律宾客户偏好轻松友好的沟通氛围，可以适当加入幽默和寒暄。',
    '菲律宾人非常重视家庭和人际关系，建立信任是长期合作的基础。',
  ],
};

const INTENTS = ['售前咨询', '售后问题', '价格谈判', '物流查询', '差评安抚', '产品咨询'] as const;

const BARGAINING_STRATEGY =
  '议价策略：先确认对方真实需求和数量 → 给出批量优惠阶梯（10件9折、50件8折）→ 强调产品质量和售后服务 → 如需让步，捆绑增值服务（延长质保、包邮）而非直接降价。';

function detectIntent(content: string): { intent: string; confidence: number } {
  const text = content.toLowerCase();
  if (/价格|giá|ราคา|harga|presyo|discount|折扣|便宜/.test(text)) {
    return { intent: '价格谈判', confidence: 0.92 };
  }
  if (/物流|发货|配送|vận chuyển|จัดส่ง|pengiriman|penghantaran|pagpapadala|shipping/.test(text)) {
    return { intent: '物流查询', confidence: 0.88 };
  }
  if (/质量|售后|问题|退货|换货|chất lượng|คุณภาพ|kualitas|kualiti|kalidad|refund|return/.test(text)) {
    return { intent: '售后问题', confidence: 0.9 };
  }
  if (/差评|投诉|不满|不好|phàn nàn|ร้องเรียน|keluhan|aduan|reklamo|complaint|bad review/.test(text)) {
    return { intent: '差评安抚', confidence: 0.91 };
  }
  if (/你好|xin chào|สวัสดี|halo|hai|kumusta|hello|hi/.test(text)) {
    return { intent: '售前咨询', confidence: 0.85 };
  }
  return { intent: '产品咨询', confidence: 0.78 };
}

function generateTranslation(content: string, language: string): string {
  const lang = language as AseanLanguage;
  const langName = LANGUAGE_NAMES[lang] || '当地语言';
  return `【${langName}翻译】${content}（自动翻译结果，仅供参考）`;
}

function generateReplies(
  content: string,
  language: AseanLanguage,
  scene?: string,
  persona?: string,
): string[] {
  const templates = AI_REPLY_TEMPLATES[language] ?? AI_REPLY_TEMPLATES.vi;
  const intent = detectIntent(content).intent;
  const replies: string[] = [];

  if (scene === 'bargain' || intent === '价格谈判') {
    replies.push(templates.price);
    replies.push(
      'Chúng tôi có thể cung cấp mẫu miễn phí, bạn chỉ cần trả phí vận chuyển. Bạn muốn thử trước không?' as string,
    );
    replies.push(templates.shipping);
  } else if (scene === 'aftersales' || intent === '售后问题') {
    replies.push(templates.thanks);
    replies.push(templates.shipping);
    replies.push(templates.greeting);
  } else if (scene === 'pre-sales' || intent === '售前咨询') {
    replies.push(templates.greeting);
    replies.push(templates.price);
    replies.push(templates.shipping);
  } else {
    replies.push(templates.greeting);
    replies.push(templates.thanks);
    replies.push(templates.price);
  }

  if (persona === '销售') {
    replies[0] = `${templates.greeting} ${templates.price}`;
  }

  return replies.slice(0, 3);
}

@Injectable()
export class CustomerServiceService {
  private readonly logger = new Logger(CustomerServiceService.name);

  private seeded = false;

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  private async ensureSeedData(): Promise<void> {
    if (this.seeded) return;
    try {
      const [{ cnt }] = await this.db
        .select({ cnt: count() })
        .from(conversations)
        .where(eq(conversations.moduleType, 'customer-service'));
      if (Number(cnt) > 0) {
        this.seeded = true;
        return;
      }
      await this.seedMockData();
      this.seeded = true;
    } catch (error) {
      this.logger.warn('seed data check failed', error);
    }
  }

  private async seedMockData(): Promise<void> {
    const mockConversations = [
      {
        title: '越南客户 - 无线耳机询价',
        languagePair: 'vi-zh' as const,
        customerName: 'Nguyễn Văn A',
        channel: 'Shopee',
        intent: '价格谈判',
        customerMsg: 'Xin chào! Tôi muốn hỏi giá sản phẩm tai nghe không dây này. Nếu tôi mua 50 chiếc thì giá bao nhiêu? Và thời gian vận chuyển đến Hà Nội là bao lâu?',
      },
      {
        title: '泰国客户 - 物流查询',
        languagePair: 'th-zh' as const,
        customerName: 'สมศักดิ์ มั่นคง',
        channel: 'Lazada',
        intent: '物流查询',
        customerMsg: 'สวัสดีค่ะ ฉันสั่งซื้อมาเมื่อ 3 วันก่อน แต่ยังไม่ได้รับหมายเลขติดตามเลยค่ะ รบกวนเช็คให้หน่อยนะคะ',
      },
      {
        title: '印尼客户 - 售后问题',
        languagePair: 'id-zh' as const,
        customerName: 'Budi Santoso',
        channel: 'TikTok Shop',
        intent: '售后问题',
        customerMsg: 'Halo, barang yang saya terima kemarin ada kerusakan di bagian kiri. Bisa minta ganti baru tidak? Saya sudah kirim foto lewat chat.',
      },
      {
        title: '马来客户 - 产品咨询',
        languagePair: 'ms-zh' as const,
        customerName: 'Ahmad bin Osman',
        channel: 'Shopee',
        intent: '售前咨询',
        customerMsg: 'Hai, saya ingin tanya tentang produk ini. Ada warranty tak? Berapa lama tempoh penghantaran ke Kuala Lumpur?',
      },
      {
        title: '菲律宾客户 - 差评安抚',
        languagePair: 'fil-zh' as const,
        customerName: 'Maria Santos',
        channel: 'TikTok Shop',
        intent: '差评安抚',
        customerMsg: 'Nakakapanghinayang lang na 2 linggo bago dumating. Sira pa yung packaging. Hindi na ako uulit!',
      },
    ];

    for (const mock of mockConversations) {
      const [conv] = await this.db
        .insert(conversations)
        .values({
          title: mock.title,
          moduleType: 'customer-service',
          languagePair: mock.languagePair,
          status: 'active',
          meta: {
            customerName: mock.customerName,
            intent: mock.intent,
            channel: mock.channel,
          },
        })
        .returning({ id: conversations.id });

      const lang = mock.languagePair.split('-')[0] as AseanLanguage;
      const intentResult = detectIntent(mock.customerMsg);
      const replies = generateReplies(mock.customerMsg, lang);
      const culturalTips = CULTURAL_TIPS[lang] || CULTURAL_TEMPLATES.generic;
      const isBargain = intentResult.intent === '价格谈判';

      await this.db.insert(messages).values([
        {
          conversationId: conv.id,
          role: 'customer',
          content: mock.customerMsg,
          language: lang,
          translation: generateTranslation(mock.customerMsg, lang),
          intent: intentResult.intent,
          confidence: String(intentResult.confidence),
          meta: { source: 'customer' },
        },
        {
          conversationId: conv.id,
          role: 'assistant',
          content: replies[0],
          language: lang,
          translation: `【中文翻译】${mock.customerName} 您好！感谢您的咨询。关于您的问题，我们很乐意为您提供帮助。`,
          intent: intentResult.intent,
          confidence: '0.95',
          suggestions: {
            replies,
            culturalTips,
            bargainingStrategy: isBargain ? BARGAINING_STRATEGY : undefined,
          },
          meta: { responseTimeMs: 320, source: 'ai-assistant' },
        },
      ]);
    }

    this.logger.log(`已预置 ${mockConversations.length} 条客服会话 mock 数据`);
  }

  async getConversations(
    page: number,
    pageSize: number,
    projectId?: string,
    languageFilter?: string,
  ): Promise<PaginationResult<Conversation>> {
    await this.ensureSeedData();

    const offset = (page - 1) * pageSize;
    const conditions = [eq(conversations.moduleType, 'customer-service')];

    if (projectId) {
      conditions.push(eq(conversations.projectId, projectId));
    }

    const where = conditions.length > 1 ? and(...conditions) : conditions[0];

    const [totalResult, items] = await Promise.all([
      this.db.select({ count: count() }).from(conversations).where(where),
      this.db
        .select()
        .from(conversations)
        .where(where)
        .orderBy(desc(conversations.updatedAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);

    let filteredItems = items;
    if (languageFilter) {
      filteredItems = items.filter((c) => c.languagePair?.startsWith(languageFilter));
    }

    return {
      items: filteredItems.map((item) => this.mapConversation(item)),
      total: languageFilter ? filteredItems.length : total,
      page,
      pageSize,
    };
  }

  async getConversation(id: string): Promise<Conversation> {
    const results = await this.db.select().from(conversations).where(eq(conversations.id, id));
    if (results.length === 0) {
      throw new NotFoundException('会话不存在');
    }
    return this.mapConversation(results[0]);
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const results = await this.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    return results.map((item) => this.mapMessage(item));
  }

  async createConversation(data: {
    title: string;
    projectId?: string;
    languagePair: string;
    meta?: { customerName?: string; intent?: string; channel?: string };
  }): Promise<Conversation> {
    const results = await this.db
      .insert(conversations)
      .values({
        title: data.title,
        projectId: data.projectId,
        moduleType: 'customer-service',
        languagePair: data.languagePair,
        status: 'active',
        meta: data.meta ?? null,
      })
      .returning();

    return this.mapConversation(results[0]);
  }

  async sendMessage(conversationId: string, data: SendMessageRequest): Promise<Message> {
    const language = (data.language || 'vi') as AseanLanguage;
    const targetLanguage = (data.targetLanguage || 'zh') as string;
    const intentResult = detectIntent(data.content);

    // Save user message
    await this.db.insert(messages).values({
      conversationId,
      role: 'customer',
      content: data.content,
      language,
      translation: generateTranslation(data.content, language),
      intent: intentResult.intent,
      confidence: String(intentResult.confidence),
      meta: { source: 'customer' },
    });

    // Generate AI reply
    const replies = generateReplies(data.content, language, data.scene, data.persona);
    const culturalTips = CULTURAL_TIPS[language] || CULTURAL_TEMPLATES.generic;
    const isBargain =
      data.scene === 'bargain' || intentResult.intent === '价格谈判';

    const aiContent = replies[0];
    const aiTranslation = `【中文翻译】${this.mockTranslateToZh(aiContent, language)}`;

    const [aiResult] = await this.db
      .insert(messages)
      .values({
        conversationId,
        role: 'assistant',
        content: aiContent,
        language,
        translation: aiTranslation,
        intent: intentResult.intent,
        confidence: '0.95',
        suggestions: {
          replies,
          culturalTips,
          bargainingStrategy: isBargain ? BARGAINING_STRATEGY : undefined,
        },
        meta: { responseTimeMs: 320, source: 'ai-assistant' },
      })
      .returning();

    // Update conversation updatedAt
    await this.db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    return this.mapMessage(aiResult);
  }

  private mapConversation(row: typeof conversations.$inferSelect): Conversation {
    return {
      id: row.id,
      projectId: row.projectId ?? undefined,
      title: row.title,
      moduleType: row.moduleType,
      languagePair: row.languagePair ?? undefined,
      status: row.status,
      meta: (row.meta as Conversation['meta']) ?? undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapMessage(row: typeof messages.$inferSelect): Message {
    return {
      id: row.id,
      conversationId: row.conversationId ?? '',
      role: row.role as Message['role'],
      content: row.content,
      language: row.language ?? undefined,
      translation: row.translation ?? undefined,
      intent: row.intent ?? undefined,
      confidence: row.confidence !== null ? Number(row.confidence) : undefined,
      suggestions: (row.suggestions as Message['suggestions']) ?? undefined,
      meta: (row.meta as Message['meta']) ?? undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private mockTranslateToZh(content: string, language: AseanLanguage): string {
    const langName = LANGUAGE_NAMES[language] || '当地语言';
    // Simple mock: return content as-is with a note
    return `（${langName}翻译的中文内容）${content.slice(0, 30)}...`;
  }
}

const CULTURAL_TEMPLATES = {
  generic: ['注意当地商务文化差异，保持礼貌和专业的沟通态度。'],
};
