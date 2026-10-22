/**
 * 数据库自动初始化（外部部署用）
 *
 * 妙搭平台内部会自动提供并初始化数据库；导出到外部 PostgreSQL 后，
 * 需要自行创建平台自定义类型（user_profile / file_attachment）与全部业务表。
 * 本模块在应用启动前执行一次，所有语句均为幂等（IF NOT EXISTS），可安全重复执行。
 */
import postgres from 'postgres';
import { Logger } from '@nestjs/common';

const DDL = `
-- ========== 平台自定义复合类型 ==========
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_profile') THEN
    CREATE TYPE user_profile AS (user_id text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'file_attachment') THEN
    CREATE TYPE file_attachment AS (bucket_id text, file_path text);
  END IF;
END
$$;

-- ========== 1. projects ==========
CREATE TABLE IF NOT EXISTS projects (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         varchar(255) NOT NULL,
  description  text,
  platform     varchar(50),
  country      varchar(50),
  status       varchar(50) NOT NULL DEFAULT 'active',
  owner        user_profile,
  _created_at  timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by  user_profile DEFAULT (CASE WHEN current_setting('app.user_id', true) = '' THEN NULL END)::user_profile,
  _updated_at  timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by  user_profile DEFAULT (CASE WHEN current_setting('app.user_id', true) = '' THEN NULL END)::user_profile
);

-- ========== 2. agent_tasks ==========
CREATE TABLE IF NOT EXISTS agent_tasks (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         uuid,
  user_prompt        text NOT NULL,
  title              varchar(512),
  status             varchar(50) NOT NULL DEFAULT 'planning',
  plan               jsonb,
  summary            text,
  total_duration_ms  integer,
  _created_at        timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by        user_profile DEFAULT (CASE WHEN current_setting('app.user_id', true) = '' THEN NULL END)::user_profile,
  _updated_at        timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by        user_profile DEFAULT (CASE WHEN current_setting('app.user_id', true) = '' THEN NULL END)::user_profile,
  CONSTRAINT agent_tasks_project_id_fkey FOREIGN KEY (project_id)
    REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_project_id ON agent_tasks(project_id);

-- ========== 3. agent_steps ==========
CREATE TABLE IF NOT EXISTS agent_steps (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       uuid,
  step_key      varchar(100) NOT NULL,
  agent_name    varchar(100) NOT NULL,
  description   text,
  status        varchar(50) NOT NULL DEFAULT 'pending',
  input_data    jsonb,
  output_data   jsonb,
  started_at    timestamptz(3),
  completed_at  timestamptz(3),
  duration_ms   integer,
  _created_at   timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by   user_profile DEFAULT (CASE WHEN current_setting('app.user_id', true) = '' THEN NULL END)::user_profile,
  _updated_at   timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by   user_profile DEFAULT (CASE WHEN current_setting('app.user_id', true) = '' THEN NULL END)::user_profile,
  CONSTRAINT agent_steps_task_id_fkey FOREIGN KEY (task_id)
    REFERENCES agent_tasks(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_agent_steps_task_id ON agent_steps(task_id);

-- ========== 4. conversations ==========
CREATE TABLE IF NOT EXISTS conversations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid,
  title        varchar(512) NOT NULL,
  module_type  varchar(50) NOT NULL,
  language_pair varchar(50),
  status       varchar(50) NOT NULL DEFAULT 'active',
  meta         jsonb,
  _created_at  timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by  user_profile DEFAULT (CASE WHEN current_setting('app.user_id', true) = '' THEN NULL END)::user_profile,
  _updated_at  timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by  user_profile DEFAULT (CASE WHEN current_setting('app.user_id', true) = '' THEN NULL END)::user_profile,
  CONSTRAINT conversations_project_id_fkey FOREIGN KEY (project_id)
    REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_conversations_module_type ON conversations(module_type);

-- ========== 5. messages ==========
CREATE TABLE IF NOT EXISTS messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid,
  role            varchar(50) NOT NULL,
  content         text NOT NULL,
  language        varchar(50),
  translation     text,
  intent          varchar(100),
  confidence      numeric,
  suggestions     jsonb,
  meta            jsonb,
  _created_at     timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by     user_profile DEFAULT (CASE WHEN current_setting('app.user_id', true) = '' THEN NULL END)::user_profile,
  _updated_at     timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by     user_profile DEFAULT (CASE WHEN current_setting('app.user_id', true) = '' THEN NULL END)::user_profile,
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id)
    REFERENCES conversations(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(_created_at);

-- ========== 6. market_reports ==========
CREATE TABLE IF NOT EXISTS market_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid,
  country         varchar(50) NOT NULL,
  category        varchar(255) NOT NULL,
  trend_data      jsonb,
  price_range     jsonb,
  competitors     jsonb,
  exchange_rate   numeric,
  tariff_info     jsonb,
  logistics_cost  jsonb,
  recommendations text,
  status          varchar(50) NOT NULL DEFAULT 'completed',
  _created_at     timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by     user_profile DEFAULT (CASE WHEN current_setting('app.user_id', true) = '' THEN NULL END)::user_profile,
  _updated_at     timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by     user_profile DEFAULT (CASE WHEN current_setting('app.user_id', true) = '' THEN NULL END)::user_profile,
  CONSTRAINT market_reports_project_id_fkey FOREIGN KEY (project_id)
    REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_market_reports_project_id ON market_reports(project_id);

-- ========== 7. knowledge_items ==========
CREATE TABLE IF NOT EXISTS knowledge_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        varchar(512) NOT NULL,
  content      text NOT NULL,
  category     varchar(100) NOT NULL,
  country      varchar(50),
  item_type    varchar(50),
  tags         varchar(255)[],
  source_url   text,
  source_name  varchar(255),
  status       varchar(50) NOT NULL DEFAULT 'published',
  _created_at  timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by  user_profile DEFAULT (CASE WHEN current_setting('app.user_id', true) = '' THEN NULL END)::user_profile,
  _updated_at  timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by  user_profile DEFAULT (CASE WHEN current_setting('app.user_id', true) = '' THEN NULL END)::user_profile
);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_items(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_country ON knowledge_items(country);

-- ========== 8. compliance_reports ==========
CREATE TABLE IF NOT EXISTS compliance_reports (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid,
  product_name      varchar(512) NOT NULL,
  hs_code           varchar(50),
  target_country    varchar(50) NOT NULL,
  risk_level        varchar(50) NOT NULL DEFAULT 'medium',
  regulations       jsonb,
  certifications    jsonb,
  tariff_info       jsonb,
  origin_preference jsonb,
  sources           jsonb,
  conclusion        text,
  status            varchar(50) NOT NULL DEFAULT 'pending',
  _created_at       timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by       user_profile DEFAULT (CASE WHEN current_setting('app.user_id', true) = '' THEN NULL END)::user_profile,
  _updated_at       timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by       user_profile DEFAULT (CASE WHEN current_setting('app.user_id', true) = '' THEN NULL END)::user_profile,
  CONSTRAINT compliance_reports_project_id_fkey FOREIGN KEY (project_id)
    REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_compliance_project_id ON compliance_reports(project_id);

-- ========== 9. documents ==========
CREATE TABLE IF NOT EXISTS documents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid,
  doc_type          varchar(50) NOT NULL,
  file_name         varchar(512) NOT NULL,
  file_url          text,
  extracted_fields  jsonb,
  confidence        numeric,
  status            varchar(50) NOT NULL DEFAULT 'processing',
  cross_check_result jsonb,
  _created_at       timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by       user_profile DEFAULT (CASE WHEN current_setting('app.user_id', true) = '' THEN NULL END)::user_profile,
  _updated_at       timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by       user_profile DEFAULT (CASE WHEN current_setting('app.user_id', true) = '' THEN NULL END)::user_profile,
  CONSTRAINT documents_project_id_fkey FOREIGN KEY (project_id)
    REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(doc_type);

-- ========== 10. product_localizations ==========
CREATE TABLE IF NOT EXISTS product_localizations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid,
  name_cn           varchar(512) NOT NULL,
  category          varchar(255),
  target_platforms  varchar(255)[],
  target_languages  varchar(50)[],
  localized_titles  jsonb,
  bullet_points     jsonb,
  descriptions      jsonb,
  keywords          jsonb,
  cultural_check    jsonb,
  status            varchar(50) NOT NULL DEFAULT 'draft',
  _created_at       timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by       user_profile DEFAULT (CASE WHEN current_setting('app.user_id', true) = '' THEN NULL END)::user_profile,
  _updated_at       timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by       user_profile DEFAULT (CASE WHEN current_setting('app.user_id', true) = '' THEN NULL END)::user_profile,
  CONSTRAINT product_localizations_project_id_fkey FOREIGN KEY (project_id)
    REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_product_localizations_project_id ON product_localizations(project_id);
`;

export async function initDatabase(databaseUrl: string): Promise<void> {
  const logger = new Logger('DatabaseInit');
  if (!databaseUrl) {
    throw new Error(
      'SUDA_DATABASE_URL 未配置：外部部署需要提供 PostgreSQL 连接串。',
    );
  }
  // 云数据库连接串通常带 sslmode=require；postgres.js 据此自动启用 SSL。
  const sql = postgres(databaseUrl, {
    max: 1,
    connect_timeout: 20,
    idle_timeout: 20,
  });
  try {
    await sql.unsafe(DDL);
    logger.log('数据库初始化完成：自定义类型与全部数据表已就绪。');
  } finally {
    await sql.end({ timeout: 5 });
  }
}
