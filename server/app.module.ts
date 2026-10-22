import { APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { PlatformModule } from '@lark-apaas/fullstack-nestjs-core';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ViewModule } from './modules/view/view.module';
import { LocalizationModule } from './modules/localization/localization.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { MarketModule } from './modules/market/market.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { CustomerServiceModule } from './modules/customer-service/customer-service.module';
import { AgentsModule } from './modules/agents/agents.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { ProjectsModule } from './modules/projects/projects.module';

@Module({
  imports: [
    // 平台 Module，提供平台能力
    PlatformModule.forRoot(),
    // ====== @route-section: business-modules START ======
    // Place all business modules here.Do NOT add fallback modules here.
    AnalyticsModule,
    LocalizationModule,
    DocumentsModule,
    MarketModule,
    ComplianceModule,
    CustomerServiceModule,
    AgentsModule,
    KnowledgeModule,
    ProjectsModule,
    // ====== @route-section: business-modules END ======

    // ⚠️ @route-order: last
    // ViewModule is the fallback route module, must be registered last.
    ViewModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
