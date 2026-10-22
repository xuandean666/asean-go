import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CustomerServiceService } from './customer-service.service';
import type {
  Conversation,
  Message,
  SendMessageRequest,
  PaginationResult,
} from '@shared/api.interface';

@Controller('api/customer-service')
export class CustomerServiceController {
  constructor(private readonly customerServiceService: CustomerServiceService) {}

  @Get('conversations')
  async getConversations(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('projectId') projectId?: string,
    @Query('language') language?: string,
  ): Promise<PaginationResult<Conversation>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.customerServiceService.getConversations(pageNum, pageSizeNum, projectId, language);
  }

  @Get('conversations/:id')
  async getConversation(@Param('id') id: string): Promise<Conversation> {
    return this.customerServiceService.getConversation(id);
  }

  @Get('conversations/:id/messages')
  async getMessages(@Param('id') id: string): Promise<Message[]> {
    return this.customerServiceService.getMessages(id);
  }

  @Post('conversations')
  async createConversation(
    @Body() body: { title: string; projectId?: string; languagePair: string; meta?: Record<string, unknown> },
  ): Promise<Conversation> {
    return this.customerServiceService.createConversation(body);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() body: SendMessageRequest,
  ): Promise<Message> {
    return this.customerServiceService.sendMessage(id, body);
  }
}
