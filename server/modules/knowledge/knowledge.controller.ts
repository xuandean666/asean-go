import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import type {
  KnowledgeItem,
  KnowledgeSearchRequest,
  KnowledgeSearchResult,
  PaginationResult,
} from '@shared/api.interface';

@Controller('api/knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get('items')
  async getItems(
    @Query('page', ParseIntPipe) page = 1,
    @Query('pageSize', ParseIntPipe) pageSize = 12,
    @Query('category') category?: string,
    @Query('country') country?: string,
    @Query('itemType') itemType?: string,
    @Query('keyword') keyword?: string,
  ): Promise<PaginationResult<KnowledgeItem>> {
    return this.knowledgeService.getItems({
      page,
      pageSize,
      category,
      country,
      itemType,
      keyword,
    });
  }

  @Get('items/:id')
  async getItem(@Param('id') id: string): Promise<KnowledgeItem> {
    const item = await this.knowledgeService.getItem(id);
    if (!item) throw new NotFoundException('条目不存在');
    return item;
  }

  @Post('search')
  async search(@Body() dto: KnowledgeSearchRequest): Promise<KnowledgeSearchResult> {
    if (!dto.query || dto.query.trim().length === 0) {
      throw new BadRequestException('请输入搜索问题');
    }
    return this.knowledgeService.search(dto);
  }

  @Post('items')
  async createItem(@Body() dto: Omit<KnowledgeItem, 'id' | 'createdAt' | 'status'>): Promise<KnowledgeItem> {
    if (!dto.title || !dto.content || !dto.category) {
      throw new BadRequestException('标题、内容和分类为必填项');
    }
    return this.knowledgeService.createItem(dto);
  }
}
