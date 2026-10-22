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
import { ComplianceService } from './compliance.service';
import type {
  ComplianceReport,
  PaginationResult,
  CreateComplianceRequest,
} from '@shared/api.interface';

@Controller('api/compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('reports')
  async getReports(
    @Query('page', ParseIntPipe) page = 1,
    @Query('pageSize', ParseIntPipe) pageSize = 10,
  ): Promise<PaginationResult<ComplianceReport>> {
    return this.complianceService.getReports({ page, pageSize });
  }

  @Get('reports/:id')
  async getReport(@Param('id') id: string): Promise<ComplianceReport> {
    const report = await this.complianceService.getReport(id);
    if (!report) throw new NotFoundException('报告不存在');
    return report;
  }

  @Post('reports')
  async createReport(@Body() dto: CreateComplianceRequest): Promise<ComplianceReport> {
    return this.complianceService.createReport(dto);
  }
}
