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
import { AgentsService } from './agents.service';
import type {
  AgentTask,
  AgentStep,
  PaginationResult,
  CreateAgentTaskRequest,
} from '@shared/api.interface';

@Controller('api/agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get('tasks')
  async getTasks(
    @Query('page', ParseIntPipe) page = 1,
    @Query('pageSize', ParseIntPipe) pageSize = 10,
  ): Promise<PaginationResult<AgentTask>> {
    return this.agentsService.getTasks({ page, pageSize });
  }

  @Get('tasks/:id')
  async getTask(@Param('id') id: string): Promise<AgentTask> {
    const task = await this.agentsService.getTask(id);
    if (!task) throw new NotFoundException('任务不存在');
    return task;
  }

  @Get('tasks/:id/steps')
  async getTaskSteps(@Param('id') id: string): Promise<AgentStep[]> {
    return this.agentsService.getTaskSteps(id);
  }

  @Post('tasks')
  async createTask(@Body() dto: CreateAgentTaskRequest): Promise<AgentTask> {
    if (!dto.userPrompt || dto.userPrompt.trim().length === 0) {
      throw new BadRequestException('请输入任务描述');
    }
    return this.agentsService.createTask(dto);
  }

  @Post('tasks/:id/steps/:stepKey/rerun')
  async rerunStep(
    @Param('id') id: string,
    @Param('stepKey') stepKey: string,
  ): Promise<AgentStep> {
    const step = await this.agentsService.rerunStep(id, stepKey);
    if (!step) throw new NotFoundException('步骤不存在');
    return step;
  }
}
