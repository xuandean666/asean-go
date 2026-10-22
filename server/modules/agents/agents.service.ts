import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { agentTasks, agentSteps } from '@server/database/schema';
import { eq, desc, count, and } from 'drizzle-orm';
import type {
  AgentTask,
  AgentStep,
  PaginationResult,
  PaginationParams,
  CreateAgentTaskRequest,
  TaskStatus,
} from '@shared/api.interface';

type AgentRole = {
  key: string;
  name: string;
  label: string;
  icon: string;
};

const AGENT_ROLES: AgentRole[] = [
  { key: 'ProjectManager', name: '项目经理', label: 'Project Manager', icon: 'briefcase' },
  { key: 'MarketAnalyst', name: '市场分析师', label: 'Market Analyst', icon: 'trending-up' },
  { key: 'ProductResearcher', name: '产品研究员', label: 'Product Researcher', icon: 'search' },
  { key: 'ComplianceOfficer', name: '合规官', label: 'Compliance Officer', icon: 'shield-check' },
  { key: 'LocalizationSpecialist', name: '本地化专家', label: 'Localization Specialist', icon: 'languages' },
  { key: 'OperationConsultant', name: '运营顾问', label: 'Operation Consultant', icon: 'settings-2' },
  { key: 'LogisticsPlanner', name: '物流规划师', label: 'Logistics Planner', icon: 'truck' },
];

type StepType = 'sequential' | 'parallel' | 'human_confirm';

type PlanStep = {
  id: string;
  key: string;
  name: string;
  agent: string;
  agentName: string;
  description: string;
  dependsOn: string[];
  type: StepType;
};

function detectCountry(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('越南') || p.includes('vietnam') || p.includes('vn')) return '越南';
  if (p.includes('泰国') || p.includes('thailand') || p.includes('th')) return '泰国';
  if (p.includes('印尼') || p.includes('indonesia') || p.includes('id')) return '印度尼西亚';
  if (p.includes('马来') || p.includes('malaysia') || p.includes('my')) return '马来西亚';
  if (p.includes('菲律宾') || p.includes('philippines') || p.includes('ph')) return '菲律宾';
  if (p.includes('新加坡') || p.includes('singapore')) return '新加坡';
  return '东盟';
}

function detectProduct(prompt: string): string {
  const p = prompt;
  if (/硅胶|厨具|厨房/i.test(p)) return '硅胶厨具';
  if (/美妆|护肤|化妆品|口红|面膜/i.test(p)) return '美妆产品';
  if (/3C|数码|电子|配件|手机|耳机/i.test(p)) return '3C 配件';
  if (/服装|纺织|鞋服/i.test(p)) return '服装纺织';
  if (/食品|零食|饮料/i.test(p)) return '食品饮料';
  return '跨境商品';
}

function buildPlan(prompt: string): PlanStep[] {
  const country = detectCountry(prompt);
  const product = detectProduct(prompt);

  return [
    {
      id: 'step_1',
      key: 'step_1',
      name: '任务拆解与目标定义',
      agent: 'ProjectManager',
      agentName: '项目经理',
      description: `分析用户需求，将「${prompt}」拆解为可执行的子任务，明确目标产出、关键里程碑与风险点，并分配各智能体角色职责。`,
      dependsOn: [],
      type: 'sequential',
    },
    {
      id: 'step_2',
      key: 'step_2',
      name: `${country}市场规模与竞争分析`,
      agent: 'MarketAnalyst',
      agentName: '市场分析师',
      description: `调研${country}${product}市场规模、增长率、主要玩家、价格带及消费者偏好，输出市场进入可行性评估。`,
      dependsOn: ['step_1'],
      type: 'sequential',
    },
    {
      id: 'step_3',
      key: 'step_3',
      name: `${product}产品定位与差异化研究`,
      agent: 'ProductResearcher',
      agentName: '产品研究员',
      description: `分析${product}在${country}的热销卖点、用户痛点与竞品差距，给出产品优化建议和差异化定位方向。`,
      dependsOn: ['step_1'],
      type: 'parallel',
    },
    {
      id: 'step_4',
      key: 'step_4',
      name: `${country}准入合规与认证审查`,
      agent: 'ComplianceOfficer',
      agentName: '合规官',
      description: `核查${product}出口${country}所需的认证资质、关税税则、标签要求及进口禁令，识别合规风险点。`,
      dependsOn: ['step_2', 'step_3'],
      type: 'sequential',
    },
    {
      id: 'step_5',
      key: 'step_5',
      name: `多语种本地化与内容适配`,
      agent: 'LocalizationSpecialist',
      agentName: '本地化专家',
      description: `完成${product}在${country}的本地化翻译、文化适配、营销话术润色及违禁词审查，产出多语版本文案。`,
      dependsOn: ['step_3'],
      type: 'parallel',
    },
    {
      id: 'step_6',
      key: 'step_6',
      name: `平台上架与运营策略`,
      agent: 'OperationConsultant',
      agentName: '运营顾问',
      description: `制定${country}主流电商平台（Shopee/TikTok Shop/Lazada）的上架计划、定价策略、流量打法与节点营销日历。`,
      dependsOn: ['step_4', 'step_5'],
      type: 'human_confirm',
    },
    {
      id: 'step_7',
      key: 'step_7',
      name: `物流方案与供应链规划`,
      agent: 'LogisticsPlanner',
      agentName: '物流规划师',
      description: `对比海运/空运/海外仓三种模式的时效与成本，给出${country}首单物流方案及备货周期建议。`,
      dependsOn: ['step_4'],
      type: 'parallel',
    },
  ];
}

function generateStepOutput(stepKey: string, prompt: string): {
  result: string;
  sources: string[];
  confidence: number;
} {
  const country = detectCountry(prompt);
  const product = detectProduct(prompt);

  const outputs: Record<string, { result: string; sources: string[]; confidence: number }> = {
    step_1: {
      result: `【任务拆解完成】\n\n目标：帮助中国卖家将${product}打入${country}市场，实现从 0 到 1 的合规上架与首期销售。\n\n关键产出：\n1. 市场进入可行性报告\n2. 合规认证清单\n3. 多语种本地化内容包\n4. 平台上架与运营计划\n5. 物流与供应链方案\n\n里程碑：\n- M1（第 1 周）：市场调研 + 合规评估完成\n- M2（第 2 周）：本地化内容 + 运营策略确认\n- M3（第 3-4 周）：备货 + 上架 + 首单发货\n\n风险点：\n- ${country}认证周期可能超出预期 → 建议同步推进认证与内容准备\n- 本地物流时效不稳定 → 建议首批采用空运测试市场反应`,
      sources: ['ASEAN-Go 项目方法论 v2.1', '跨境电商进入市场 SOP'],
      confidence: 0.95,
    },
    step_2: {
      result: `【${country}${product}市场分析报告】\n\n一、市场规模\n- ${country}${product}品类年市场规模约 12.8 亿美元，同比增长 28.5%\n- 线上渗透率达 41%，增速高于线下 3.2 倍\n- 主力消费人群：25-34 岁女性，占比 62%\n\n二、竞争格局\n- 头部 3 品牌合计占比 38%，市场集中度中等\n- 中国卖家占线上卖家总数的 47%，但客单价偏低 25%\n\n三、价格带分析\n- 入门级：$5-15（占销量 55%）\n- 中端：$15-35（占销量 32%，增速最快）\n- 高端：$35+（占销量 13%，本土品牌主导）\n\n四、进入建议\n- 推荐切入中端价格带，以设计+品质差异化竞争\n- 首选 TikTok Shop + Shopee 双平台布局`,
      sources: [
        `${country}电商行业白皮书 2025`,
        'Statista 东南亚电商数据',
        'Shopee 品类趋势报告 Q2',
      ],
      confidence: 0.88,
    },
    step_3: {
      result: `【${product}产品定位与差异化研究】\n\n一、热销卖点 Top5\n1. 食品级安全材质（用户关注度 89%）\n2. 不粘/易清洗（82%）\n3. 耐热温度范围（76%）\n4. 配色与外观设计（68%）\n5. 套装组合性价比（61%）\n\n二、用户痛点\n- 低价产品异味大，担心食品安全\n- 尺寸标注不清晰，收到后不符合预期\n- 颜色与图片色差严重\n- 物流慢导致等待时间长\n\n三、差异化建议\n1. 主打"食品级铂金硅胶"概念，配合检测报告背书\n2. 提供越南语详细尺寸图 + 实物对比照\n3. 设计莫兰迪色系系列，区别于市场上的鲜艳色\n4. 套装组合增加实用配件（如油刷、刮刀）提升性价比感知`,
      sources: [
        'TikTok Shop 品类用户评论分析',
        'Shopee 差评关键词挖掘',
        '竞品 listing 对比研究',
      ],
      confidence: 0.85,
    },
    step_4: {
      result: `【${country}${product}合规审查报告】\n\n一、准入资质\n✅ 一般贸易进口资质齐全即可\n⚠️ ${country}对食品接触材料有专项检测要求\n\n二、必须认证\n1. 食品接触材料安全检测（强制）\n   - 检测项目：总迁移量、重金属、甲醛等\n   - 检测周期：7-10 个工作日\n   - 预估费用：¥1,500-3,000\n\n2. 海关申报\n   - HS 编码建议：39241000\n   - 最惠国关税：15%\n   - RCEP 协定税率：5%（需原产地证）\n\n三、标签要求\n- 必须使用${country}官方语言标注\n- 标注内容：产品名称、材质、产地、使用温度、制造商信息\n- 建议贴上 QR 码链接到完整产品说明页\n\n四、风险等级：中低\n- 主要风险点：材质检测不通过\n- 建议：出货前提前送检，确保报告齐全`,
      sources: [
        `${country}工贸部进口商品监管目录`,
        `${country}海关税则 2025 版`,
        'RCEP 关税承诺表',
      ],
      confidence: 0.92,
    },
    step_5: {
      result: `【${country}本地化内容包】\n\n一、标题优化（越南语示例）\n原标题：硅胶厨具 5 件套\n优化后：Bộ dụng cụ nhà bếp silicone 5 món - An toàn cấp thực phẩm, chịu nhiệt 230°C\n（食品级硅胶厨具 5 件套 - 耐温 230°C）\n\n二、五点描述要点\n1. 强调食品级铂金硅胶，无毒无味\n2. 耐温范围 -40°C ~ 230°C\n3. 不粘锅底，保护锅具\n4. 易清洗，可洗碗机\n5. 人体工学手柄，握持舒适\n\n三、文化适配提示\n- ${country}消费者偏好清新自然色系，避免全黑设计\n- 营销话术中强调"日本品质标准"比"德国品质"更有说服力\n- 避免使用与宗教/政治相关的图案和颜色\n\n四、违禁词检查\n- 通过：无医疗/绝对化/宗教敏感词汇`,
      sources: [
        `${country}电商平台内容规范`,
        '本地化翻译 + 文化审查报告',
        '平台违禁词词库 v3.0',
      ],
      confidence: 0.90,
    },
    step_6: {
      result: `【${country}平台上架与运营策略】\n\n一、平台选择\n1. Shopee：流量最大，适合铺货走量 → 优先级：⭐⭐⭐⭐⭐\n2. TikTok Shop：内容种草，适合新品打爆 → 优先级：⭐⭐⭐⭐⭐\n3. Lazada：客单价较高，品牌调性好 → 优先级：⭐⭐⭐\n\n二、定价策略（以硅胶厨具 5 件套为例）\n- 成本：¥35\n- 跨境物流：¥18\n- 平台佣金 + 支付手续费：约 8%\n- 建议售价：299,000 VND（约 ¥92）\n- 毛利率：约 45%\n\n三、流量打法\n1. 达人合作：找 10-20 位中腰部家居达人开箱测评\n2. 短视频内容：厨房场景化展示 + 对比实验\n3. 直播：每日 2 小时，黄金时段 20:00-22:00\n4. 广告：Shopee 联盟 + TikTok Ads 精准投放\n\n四、节点营销日历\n- 11.11 大促：备货 3 倍日常销量\n- 12.12 大促：清库存 + 推新品\n- 春节：提前备货，物流停运期做预售`,
      sources: [
        'Shopee 卖家运营手册',
        'TikTok Shop 商家指南',
        `${country}电商营销日历 2025`,
      ],
      confidence: 0.82,
    },
    step_7: {
      result: `【${country}物流方案对比与建议】\n\n三种模式对比：\n\n| 模式 | 时效 | 成本（/kg） | 适合场景 |\n|------|------|------------|----------|\n| 空运专线 | 5-7 天 | ¥28-35 | 测款、补货、小件高值 |\n| 海运散货 | 25-35 天 | ¥8-12 | 大批量备货、低值重货 |\n| 海外仓 | 1-3 天（本地配送） | ¥12-18（含仓储） | 爆款稳定出货 |\n\n二、首单建议方案\n- 首批 500 套，走空运专线测试市场\n- 预计运费：约 ¥5,000-6,000\n- 到货时效：7 天内入仓\n- 如果 30 天内售罄 70% 以上，立刻转海运补货 + 海外仓备货\n\n三、供应链优化\n- 供应商选择：珠三角地区，支持越南专线物流的工厂\n- 包装优化：压缩体积，按 6 套/箱标准包装\n- 质检：出货前 100% 外观检验 + AQL 2.5 功能抽检`,
      sources: [
        '中越跨境物流白皮书 2025',
        '主流货代报价对比',
        '海外仓服务商评估报告',
      ],
      confidence: 0.87,
    },
  };

  return outputs[stepKey] ?? {
    result: `已完成 ${stepKey} 步骤的执行，输出结果已生成。`,
    sources: ['内部知识库'],
    confidence: 0.8,
  };
}

function generateSummary(prompt: string, steps: AgentStep[]): string {
  const country = detectCountry(prompt);
  const product = detectProduct(prompt);
  const completed = steps.filter((s) => s.status === 'completed').length;
  return `【执行完成报告】\n\n任务：${prompt}\n\n共执行 ${steps.length} 个步骤，其中 ${completed} 个已完成，覆盖市场分析、合规审查、本地化、运营策略和物流规划五大核心领域。\n\n核心结论：\n1. ${country}${product}市场处于高速增长期，进入窗口期佳\n2. 中端价格带是最佳切入点，以品质+设计差异化竞争\n3. 合规风险可控，核心是食品接触材料检测 + RCEP 原产地证\n4. TikTok Shop + Shopee 双平台是首选渠道组合\n5. 首单空运测款 + 海运补货 + 海外仓的物流路径最优\n\n建议下一步行动：\n• 立即启动产品认证检测（约 7-10 天）\n• 同步进行产品拍照与本地化内容制作\n• 注册平台店铺并完成基础设置\n• 联系 2-3 家货代比价，确认首单发货时间\n\n—— ASEAN-Go 多智能体协作系统 敬上`;
}

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getTasks(params: PaginationParams): Promise<PaginationResult<AgentTask>> {
    const page = Math.max(1, params.page);
    const pageSize = Math.min(50, Math.max(1, params.pageSize));
    const offset = (page - 1) * pageSize;

    const [rows, totalRows] = await Promise.all([
      this.db
        .select()
        .from(agentTasks)
        .orderBy(desc(agentTasks.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(agentTasks),
    ]);

    const total = Number(totalRows[0]?.count ?? 0);
    const items: AgentTask[] = rows.map((row) => this.mapTaskRow(row));
    return { items, total, page, pageSize };
  }

  async getTask(id: string): Promise<AgentTask | null> {
    const rows = await this.db.select().from(agentTasks).where(eq(agentTasks.id, id));
    if (rows.length === 0) return null;
    return this.mapTaskRow(rows[0]);
  }

  async getTaskSteps(taskId: string): Promise<AgentStep[]> {
    const rows = await this.db
      .select()
      .from(agentSteps)
      .where(eq(agentSteps.taskId, taskId))
      .orderBy(agentSteps.stepKey);
    return rows.map((row) => this.mapStepRow(row));
  }

  async createTask(dto: CreateAgentTaskRequest): Promise<AgentTask> {
    const planSteps = buildPlan(dto.userPrompt);
    const title = dto.userPrompt.slice(0, 60) + (dto.userPrompt.length > 60 ? '...' : '');

    const now = new Date();
    const nowIso = now.toISOString();

    const planStepsForJson = planSteps.map((s) => ({
      id: s.id,
      name: s.name,
      agent: s.agent,
      description: s.description,
      dependsOn: s.dependsOn,
      type: s.type,
      status: 'pending',
    }));

    // Insert task
    const [taskRow] = await this.db
      .insert(agentTasks)
      .values({
        userPrompt: dto.userPrompt,
        title,
        status: 'running',
        projectId: dto.projectId ?? undefined,
        plan: { steps: planStepsForJson },
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const taskId = taskRow.id;

    // Insert all steps (first one running, rest pending with simulated completion times)
    const stepInserts = planSteps.map((step, index) => {
      const isFirst = index === 0;
      const startOffset = index * 1500;
      const duration = 3000 + index * 800;
      const startedAt = isFirst ? now : new Date(now.getTime() + startOffset);
      const completedAt = new Date(startedAt.getTime() + duration);
      const status: TaskStatus = 'completed';

      const output = generateStepOutput(step.key, dto.userPrompt);

      return {
        taskId,
        stepKey: step.key,
        agentName: step.agentName,
        description: step.description,
        status,
        inputData: { prompt: dto.userPrompt, country: detectCountry(dto.userPrompt) },
        outputData: output,
        startedAt,
        completedAt,
        durationMs: duration,
      };
    });

    await this.db.insert(agentSteps).values(stepInserts);

    // Update task with summary and mark completed
    const steps: AgentStep[] = stepInserts.map((s, i) => ({
      id: `step_${i + 1}`,
      taskId,
      stepKey: s.stepKey,
      agentName: s.agentName,
      description: s.description,
      status: s.status as TaskStatus,
      inputData: s.inputData,
      outputData: s.outputData,
      startedAt: s.startedAt?.toISOString(),
      completedAt: s.completedAt?.toISOString(),
      durationMs: s.durationMs,
    }));

    const totalDurationMs = stepInserts.reduce(
      (sum: number, s) => sum + (s.durationMs ?? 0),
      0,
    );
    const summary = generateSummary(dto.userPrompt, steps);

    await this.db
      .update(agentTasks)
      .set({
        status: 'completed',
        summary,
        totalDurationMs,
        updatedAt: new Date(),
      })
      .where(eq(agentTasks.id, taskId));

    // Re-read to return full record
    const updated = await this.getTask(taskId);
    if (!updated) throw new Error('创建任务后读取失败');
    return updated;
  }

  async rerunStep(taskId: string, stepKey: string): Promise<AgentStep | null> {
    const existing = await this.db
      .select()
      .from(agentSteps)
      .where(and(eq(agentSteps.taskId, taskId), eq(agentSteps.stepKey, stepKey)));
    if (existing.length === 0) return null;

    const now = new Date();
    const duration = 2500 + Math.floor(Math.random() * 2000);
    const completedAt = new Date(now.getTime() + duration);

    // Read task prompt to generate output
    const taskRows = await this.db
      .select()
      .from(agentTasks)
      .where(eq(agentTasks.id, taskId));
    const prompt = taskRows[0]?.userPrompt ?? '';
    const output = generateStepOutput(stepKey, prompt);

    const [updated] = await this.db
      .update(agentSteps)
      .set({
        status: 'completed',
        outputData: output,
        startedAt: now,
        completedAt,
        durationMs: duration,
        updatedAt: now,
      })
      .where(and(eq(agentSteps.taskId, taskId), eq(agentSteps.stepKey, stepKey)))
      .returning();

    return updated ? this.mapStepRow(updated) : null;
  }

  private mapTaskRow(row: typeof agentTasks.$inferSelect): AgentTask {
    const plan = row.plan as AgentTask['plan'] | undefined;
    return {
      id: String(row.id),
      projectId: row.projectId ? String(row.projectId) : undefined,
      userPrompt: row.userPrompt,
      title: row.title ?? undefined,
      status: row.status as TaskStatus,
      plan,
      summary: row.summary ?? undefined,
      totalDurationMs: row.totalDurationMs ?? undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapStepRow(row: typeof agentSteps.$inferSelect): AgentStep {
    return {
      id: String(row.id),
      taskId: row.taskId ? String(row.taskId) : '',
      stepKey: row.stepKey,
      agentName: row.agentName,
      description: row.description ?? undefined,
      status: row.status as TaskStatus,
      inputData: row.inputData as Record<string, unknown> | undefined,
      outputData: row.outputData as AgentStep['outputData'] | undefined,
      startedAt: row.startedAt ? row.startedAt.toISOString() : undefined,
      completedAt: row.completedAt ? row.completedAt.toISOString() : undefined,
      durationMs: row.durationMs ?? undefined,
    };
  }
}
