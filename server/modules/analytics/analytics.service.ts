import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { count } from 'drizzle-orm';
import type { DashboardStats, IndustryData } from '@shared/api.interface';
import {
  conversations,
  documents,
  complianceReports,
  agentTasks,
  knowledgeItems,
  projects,
} from '../../database/schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getDashboardStats(): Promise<DashboardStats> {
    const [
      [{ totalConversations }],
      [{ totalDocuments }],
      [{ totalComplianceReports }],
      [{ totalAgentTasks }],
      [{ totalKnowledgeItems }],
      [{ totalProjects }],
    ] = await Promise.all([
      this.db.select({ totalConversations: count() }).from(conversations),
      this.db.select({ totalDocuments: count() }).from(documents),
      this.db.select({ totalComplianceReports: count() }).from(complianceReports),
      this.db.select({ totalAgentTasks: count() }).from(agentTasks),
      this.db.select({ totalKnowledgeItems: count() }).from(knowledgeItems),
      this.db.select({ totalProjects: count() }).from(projects),
    ]);

    return {
      totalConversations: Number(totalConversations),
      avgResponseTimeMs: 2800,
      responseRate: 0.98,
      intentAccuracy: 0.92,
      documentsProcessed: Number(totalDocuments),
      documentAccuracy: 0.935,
      complianceReports: Number(totalComplianceReports),
      sourceCoverage: 1.0,
      activeProjects: Number(totalProjects),
      supportedLanguages: 5,
      agentTasks: Number(totalAgentTasks),
      knowledgeItems: Number(totalKnowledgeItems),
    };
  }

  getIndustryData(): IndustryData {
    return {
      tradeVolume: '突破 1 万亿美元',
      crossBorderGMV: '2.75 万亿元',
      seaGMV: '1576 亿美元',
      seaGrowthRate: 22.8,
      population: '6.8 亿',
      youthRatio: 70,
      topPlatforms: 'Shopee / TikTok Shop / Lazada',
      guangxiTrade: '4292.2 亿元',
      guangxiGrowth: 8,
      railFreight: '突破 1 万列',
    };
  }
}
