import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { MarketService } from './market.service';
import type {
  MarketReport,
  PaginationResult,
  CreateMarketReportRequest,
} from '@shared/api.interface';

@Controller('api/market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('reports')
  async getReports(
    @Query('page', ParseIntPipe) page = 1,
    @Query('pageSize', ParseIntPipe) pageSize = 10,
  ): Promise<PaginationResult<MarketReport>> {
    return this.marketService.getReports({ page, pageSize });
  }

  @Get('reports/:id')
  async getReport(@Param('id') id: string): Promise<MarketReport> {
    const report = await this.marketService.getReport(id);
    if (!report) throw new NotFoundException('报告不存在');
    return report;
  }

  @Post('reports')
  async createReport(@Body() dto: CreateMarketReportRequest): Promise<MarketReport> {
    return this.marketService.createReport(dto);
  }
}
