import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import type { DashboardStats, IndustryData } from '@shared/api.interface';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboardStats(): Promise<DashboardStats> {
    return this.analyticsService.getDashboardStats();
  }

  @Get('industry-data')
  async getIndustryData(): Promise<IndustryData> {
    return this.analyticsService.getIndustryData();
  }
}
