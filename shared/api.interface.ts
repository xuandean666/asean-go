// 前后端共享类型定义

// === 通用类型 ===
export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type PaginationResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'awaiting_human';

export type AseanLanguage = 'vi' | 'th' | 'id' | 'ms' | 'fil';
export type LanguagePair = 'vi-zh' | 'th-zh' | 'id-zh' | 'ms-zh' | 'fil-zh';

// === 项目 ===
export interface Project {
  id: string;
  name: string;
  description?: string;
  platform?: string;
  country?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  platform?: string;
  country?: string;
}

// === 客服会话 ===
export interface Conversation {
  id: string;
  projectId?: string;
  title: string;
  moduleType: string;
  languagePair?: string;
  status: string;
  meta?: {
    customerName?: string;
    intent?: string;
    channel?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'customer' | 'assistant' | 'user' | 'system';
  content: string;
  language?: string;
  translation?: string;
  intent?: string;
  confidence?: number;
  suggestions?: {
    replies: string[];
    culturalTips: string[];
    bargainingStrategy?: string;
  };
  meta?: {
    responseTimeMs?: number;
    source?: string;
  };
  createdAt: string;
}

export interface SendMessageRequest {
  conversationId?: string;
  content: string;
  language: string;
  targetLanguage?: string;
  role?: 'customer' | 'user';
  scene?: string;
  persona?: string;
}

// === 商品本地化 ===
export interface LocalizedContent {
  vi?: string;
  th?: string;
  id?: string;
  ms?: string;
  fil?: string;
}

export interface LocalizedContentArray {
  vi?: string[];
  th?: string[];
  id?: string[];
  ms?: string[];
  fil?: string[];
}

export interface ProductLocalization {
  id: string;
  projectId?: string;
  nameCn: string;
  category?: string;
  targetPlatforms?: string[];
  targetLanguages?: string[];
  localizedTitles?: LocalizedContent;
  bulletPoints?: LocalizedContentArray;
  descriptions?: LocalizedContent;
  keywords?: LocalizedContentArray;
  culturalCheck?: {
    hasIssues: boolean;
    warnings: { type: string; description: string; suggestion: string }[];
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocalizationRequest {
  nameCn: string;
  category?: string;
  productDesc?: string;
  targetPlatforms: string[];
  targetLanguages: string[];
  projectId?: string;
}

// === 单证处理 ===
export interface DocumentFields {
  invoiceNo?: string;
  blNo?: string;
  shipper?: string;
  consignee?: string;
  productName?: string;
  hsCode?: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  grossWeight?: number;
  netWeight?: number;
  containerNo?: string;
  originCountry?: string;
  destinationCountry?: string;
  currency?: string;
}

export interface DocumentRecord {
  id: string;
  projectId?: string;
  docType: string;
  fileName: string;
  fileUrl?: string;
  extractedFields?: DocumentFields;
  confidence?: number;
  status: string;
  crossCheckResult?: {
    hasDiscrepancies: boolean;
    discrepancies: { field: string; doc1Value: string; doc2Value: string; severity: string }[];
  };
  createdAt: string;
  updatedAt: string;
}

// === 合规审查 ===
export interface ComplianceReport {
  id: string;
  projectId?: string;
  productName: string;
  hsCode?: string;
  targetCountry: string;
  riskLevel: RiskLevel;
  regulations?: {
    items: { name: string; description: string; status: string; detail: string }[];
  };
  certifications?: {
    required: { name: string; authority: string; description: string; isMandatory: boolean }[];
  };
  tariffInfo?: {
    mfnRate?: number;
    preferentialRate?: number;
    base?: string;
    calculationMethod?: string;
  };
  originPreference?: {
    agreements: { name: string; eligible: boolean; requirement: string; preferentialRate: number }[];
  };
  sources?: {
    items: { title: string; url?: string; excerpt: string }[];
  };
  conclusion?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComplianceRequest {
  productName: string;
  hsCode?: string;
  targetCountry: string;
  productDesc?: string;
  projectId?: string;
}

// === 多智能体任务 ===
export interface AgentTask {
  id: string;
  projectId?: string;
  userPrompt: string;
  title?: string;
  status: TaskStatus;
  plan?: {
    steps: {
      id: string;
      name: string;
      agent: string;
      description: string;
      dependsOn: string[];
      type: string;
      status: string;
    }[];
  };
  summary?: string;
  totalDurationMs?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentStep {
  id: string;
  taskId: string;
  stepKey: string;
  agentName: string;
  description?: string;
  status: TaskStatus;
  inputData?: Record<string, unknown>;
  outputData?: {
    result?: string;
    sources?: string[];
    confidence?: number;
    [key: string]: unknown;
  };
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}

export interface CreateAgentTaskRequest {
  userPrompt: string;
  projectId?: string;
}

// === 知识库 ===
export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  country?: string;
  itemType?: string;
  tags?: string[];
  sourceUrl?: string;
  sourceName?: string;
  status: string;
  createdAt: string;
}

export interface KnowledgeSearchRequest {
  query: string;
  country?: string;
  category?: string;
  itemType?: string;
}

export interface KnowledgeSearchResult {
  answer: string;
  sources: {
    itemId: string;
    title: string;
    snippet: string;
    relevance: number;
  }[];
  hasReliableAnswer: boolean;
}

// === 市场行情 ===
export interface MarketReport {
  id: string;
  projectId?: string;
  country: string;
  category: string;
  trendData?: {
    months: string[];
    values: number[];
    growthRate: number;
  };
  priceRange?: {
    min: number;
    max: number;
    average: number;
    currency: string;
  };
  competitors?: {
    items: { name: string; price: number; share: number; rating: number }[];
  };
  exchangeRate?: number;
  tariffInfo?: {
    rate: number;
    type: string;
    description: string;
  };
  logisticsCost?: {
    sea: number;
    air: number;
    express: number;
    unit: string;
  };
  recommendations?: string;
  status: string;
  createdAt: string;
}

export interface CreateMarketReportRequest {
  country: string;
  category: string;
  projectId?: string;
}

// === 仪表盘统计 ===
export interface DashboardStats {
  totalConversations: number;
  avgResponseTimeMs: number;
  responseRate: number;
  intentAccuracy: number;
  documentsProcessed: number;
  documentAccuracy: number;
  complianceReports: number;
  sourceCoverage: number;
  activeProjects: number;
  supportedLanguages: number;
  agentTasks: number;
  knowledgeItems: number;
}

export interface IndustryData {
  tradeVolume: string;
  crossBorderGMV: string;
  seaGMV: string;
  seaGrowthRate: number;
  population: string;
  youthRatio: number;
  topPlatforms: string;
  guangxiTrade: string;
  guangxiGrowth: number;
  railFreight: string;
}
