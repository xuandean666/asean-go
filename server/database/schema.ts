/* eslint-disable */
/** auto generated, do not edit */
import { sql } from 'drizzle-orm';
import { foreignKey, index, integer, jsonb, numeric, pgTable, text, uuid, varchar, customType } from "drizzle-orm/pg-core"

export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number };
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number) {
    if (value == null) return value as any;
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if (value instanceof Date) return value;
    return new Date(value);
  },
});

export const userProfile = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'user_profile';
  },
  toDriver(value: string) {
    return sql`ROW(${value})::user_profile`;
  },
  fromDriver(value: string) {
    const [userId] = value.slice(1, -1).split(',');
    return userId.trim();
  },
});

export type FileAttachment = {
  bucket_id: string;
  file_path: string;
};

export const fileAttachment = customType<{
  data: FileAttachment;
  driverData: string;
}>({
  dataType() {
    return 'file_attachment';
  },
  toDriver(value: FileAttachment) {
    return sql`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
  },
  fromDriver(value: string): FileAttachment {
    const [bucketId, filePath] = value.slice(1, -1).split(',');
    return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
  },
});

export function escapeLiteral(str: string): string {
  return "'" + str.replace(/'/g, "''") + "'";
}

export const userProfileArray = customType<{
  data: string[];
  driverData: string;
}>({
  dataType() {
    return 'user_profile[]';
  },
  toDriver(value: string[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::user_profile[]`;
    }
    const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
    return sql.raw(`ARRAY[${elements}]::user_profile[]`);
  },
  fromDriver(value: string): string[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => m.slice(1, -1).split(',')[0].trim());
  },
});

export const fileAttachmentArray = customType<{
  data: FileAttachment[];
  driverData: string;
}>({
  dataType() {
    return 'file_attachment[]';
  },
  toDriver(value: FileAttachment[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::file_attachment[]`;
    }
    const elements = value.map(f =>
      `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`
    ).join(',');
    return sql.raw(`ARRAY[${elements}]::file_attachment[]`);
  },
  fromDriver(value: string): FileAttachment[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => {
      const [bucketId, filePath] = m.slice(1, -1).split(',');
      return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    });
  },
});

export const marketReports = pgTable("market_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id"),
  country: varchar("country", { length: 50 }).notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  /**
   * @type { months: string[]; values: number[]; growthRate: number }
   */
  trendData: jsonb("trend_data"),
  /**
   * @type { min: number; max: number; average: number; currency: string }
   */
  priceRange: jsonb("price_range"),
  /**
   * @type { items: { name: string; price: number; share: number; rating: number }[] }
   */
  competitors: jsonb("competitors"),
  exchangeRate: numeric("exchange_rate"),
  /**
   * @type { rate: number; type: string; description: string }
   */
  tariffInfo: jsonb("tariff_info"),
  /**
   * @type { sea: number; air: number; express: number; unit: string }
   */
  logisticsCost: jsonb("logistics_cost"),
  recommendations: text("recommendations"),
  status: varchar("status", { length: 50 }).notNull().default('completed'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_market_reports_project_id").on(table.projectId),
  foreignKey({
    columns: [table.projectId],
    foreignColumns: [projects.id],
    name: "market_reports_project_id_fkey",
  }).onDelete("cascade"),
]);

export const knowledgeItems = pgTable("knowledge_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 512 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  country: varchar("country", { length: 50 }),
  itemType: varchar("item_type", { length: 50 }),
  tags: varchar("tags", { length: 255 }).array(),
  sourceUrl: text("source_url"),
  sourceName: varchar("source_name", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default('published'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_knowledge_category").on(table.category),
  index("idx_knowledge_country").on(table.country),
]);

export const agentSteps = pgTable("agent_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id"),
  stepKey: varchar("step_key", { length: 100 }).notNull(),
  agentName: varchar("agent_name", { length: 100 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default('pending'),
  /**
   * @type { [key: string]: unknown }
   */
  inputData: jsonb("input_data"),
  /**
   * @type { result?: string; sources?: string[]; confidence?: number; [key: string]: unknown }
   */
  outputData: jsonb("output_data"),
  startedAt: customTimestamptz("started_at", { precision: 3 }),
  completedAt: customTimestamptz("completed_at", { precision: 3 }),
  durationMs: integer("duration_ms"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_agent_steps_task_id").on(table.taskId),
  foreignKey({
    columns: [table.taskId],
    foreignColumns: [agentTasks.id],
    name: "agent_steps_task_id_fkey",
  }).onDelete("cascade"),
]);

export const agentTasks = pgTable("agent_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id"),
  userPrompt: text("user_prompt").notNull(),
  title: varchar("title", { length: 512 }),
  status: varchar("status", { length: 50 }).notNull().default('planning'),
  /**
   * @type { steps: { id: string; name: string; agent: string; description: string; dependsOn: string[]; type: string; status: string }[] }
   */
  plan: jsonb("plan"),
  summary: text("summary"),
  totalDurationMs: integer("total_duration_ms"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_agent_tasks_project_id").on(table.projectId),
  foreignKey({
    columns: [table.projectId],
    foreignColumns: [projects.id],
    name: "agent_tasks_project_id_fkey",
  }).onDelete("cascade"),
]);

export const complianceReports = pgTable("compliance_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id"),
  productName: varchar("product_name", { length: 512 }).notNull(),
  hsCode: varchar("hs_code", { length: 50 }),
  targetCountry: varchar("target_country", { length: 50 }).notNull(),
  riskLevel: varchar("risk_level", { length: 50 }).notNull().default('medium'),
  /**
   * @type { items: { name: string; description: string; status: string; detail: string }[] }
   */
  regulations: jsonb("regulations"),
  /**
   * @type { required: { name: string; authority: string; description: string; isMandatory: boolean }[] }
   */
  certifications: jsonb("certifications"),
  /**
   * @type { mfnRate?: number; preferentialRate?: number; base?: string; calculationMethod?: string }
   */
  tariffInfo: jsonb("tariff_info"),
  /**
   * @type { agreements: { name: string; eligible: boolean; requirement: string; preferentialRate: number }[] }
   */
  originPreference: jsonb("origin_preference"),
  /**
   * @type { items: { title: string; url?: string; excerpt: string }[] }
   */
  sources: jsonb("sources"),
  conclusion: text("conclusion"),
  status: varchar("status", { length: 50 }).notNull().default('pending'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_compliance_project_id").on(table.projectId),
  foreignKey({
    columns: [table.projectId],
    foreignColumns: [projects.id],
    name: "compliance_reports_project_id_fkey",
  }).onDelete("cascade"),
]);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id"),
  docType: varchar("doc_type", { length: 50 }).notNull(),
  fileName: varchar("file_name", { length: 512 }).notNull(),
  fileUrl: text("file_url"),
  /**
   * @type { shipper?: string; consignee?: string; productName?: string; hsCode?: string; quantity?: number; unitPrice?: number; totalAmount?: number; grossWeight?: number; netWeight?: number; containerNo?: string; invoiceNo?: string; blNo?: string; originCountry?: string; destinationCountry?: string }
   */
  extractedFields: jsonb("extracted_fields"),
  confidence: numeric("confidence"),
  status: varchar("status", { length: 50 }).notNull().default('processing'),
  /**
   * @type { hasDiscrepancies: boolean; discrepancies: { field: string; doc1Value: string; doc2Value: string; severity: string }[] }
   */
  crossCheckResult: jsonb("cross_check_result"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_documents_project_id").on(table.projectId),
  index("idx_documents_type").on(table.docType),
  foreignKey({
    columns: [table.projectId],
    foreignColumns: [projects.id],
    name: "documents_project_id_fkey",
  }).onDelete("cascade"),
]);

export const productLocalizations = pgTable("product_localizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id"),
  nameCn: varchar("name_cn", { length: 512 }).notNull(),
  category: varchar("category", { length: 255 }),
  targetPlatforms: varchar("target_platforms", { length: 255 }).array(),
  targetLanguages: varchar("target_languages", { length: 50 }).array(),
  /**
   * @type { vi?: string; th?: string; id?: string; ms?: string; fil?: string }
   */
  localizedTitles: jsonb("localized_titles"),
  /**
   * @type { vi?: string[]; th?: string[]; id?: string[]; ms?: string[]; fil?: string[] }
   */
  bulletPoints: jsonb("bullet_points"),
  /**
   * @type { vi?: string; th?: string; id?: string; ms?: string; fil?: string }
   */
  descriptions: jsonb("descriptions"),
  /**
   * @type { vi?: string[]; th?: string[]; id?: string[]; ms?: string[]; fil?: string[] }
   */
  keywords: jsonb("keywords"),
  /**
   * @type { hasIssues: boolean; warnings: { type: string; description: string; suggestion: string }[] }
   */
  culturalCheck: jsonb("cultural_check"),
  status: varchar("status", { length: 50 }).notNull().default('draft'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_product_localizations_project_id").on(table.projectId),
  foreignKey({
    columns: [table.projectId],
    foreignColumns: [projects.id],
    name: "product_localizations_project_id_fkey",
  }).onDelete("cascade"),
]);

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id"),
  role: varchar("role", { length: 50 }).notNull(),
  content: text("content").notNull(),
  language: varchar("language", { length: 50 }),
  translation: text("translation"),
  intent: varchar("intent", { length: 100 }),
  confidence: numeric("confidence"),
  /**
   * @type { replies: string[]; culturalTips: string[]; bargainingStrategy?: string }
   */
  suggestions: jsonb("suggestions"),
  /**
   * @type { responseTimeMs?: number; source?: string }
   */
  meta: jsonb("meta"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_messages_conversation_id").on(table.conversationId),
  index("idx_messages_created_at").on(table.createdAt),
  foreignKey({
    columns: [table.conversationId],
    foreignColumns: [conversations.id],
    name: "messages_conversation_id_fkey",
  }).onDelete("cascade"),
]);

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id"),
  title: varchar("title", { length: 512 }).notNull(),
  moduleType: varchar("module_type", { length: 50 }).notNull(),
  languagePair: varchar("language_pair", { length: 50 }),
  status: varchar("status", { length: 50 }).notNull().default('active'),
  /**
   * @type { customerName?: string; intent?: string; channel?: string }
   */
  meta: jsonb("meta"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_conversations_project_id").on(table.projectId),
  index("idx_conversations_module_type").on(table.moduleType),
  foreignKey({
    columns: [table.projectId],
    foreignColumns: [projects.id],
    name: "conversations_project_id_fkey",
  }).onDelete("cascade"),
]);

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  platform: varchar("platform", { length: 50 }),
  country: varchar("country", { length: 50 }),
  status: varchar("status", { length: 50 }).notNull().default('active'),
  owner: userProfile("owner"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

// table aliases
export const agentStepsTable = agentSteps;
export const agentTasksTable = agentTasks;
export const complianceReportsTable = complianceReports;
export const conversationsTable = conversations;
export const documentsTable = documents;
export const knowledgeItemsTable = knowledgeItems;
export const marketReportsTable = marketReports;
export const messagesTable = messages;
export const productLocalizationsTable = productLocalizations;
export const projectsTable = projects;
