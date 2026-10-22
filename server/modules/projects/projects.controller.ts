import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import type {
  Project,
  PaginationResult,
  CreateProjectRequest,
} from '@shared/api.interface';

@Controller('api/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async getProjects(
    @Query('page', ParseIntPipe) page = 1,
    @Query('pageSize', ParseIntPipe) pageSize = 12,
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
  ): Promise<PaginationResult<Project>> {
    return this.projectsService.getProjects({ page, pageSize, keyword, status });
  }

  @Get(':id')
  async getProject(@Param('id') id: string): Promise<Project> {
    const project = await this.projectsService.getProject(id);
    if (!project) throw new NotFoundException('项目不存在');
    return project;
  }

  @Post()
  async createProject(@Body() dto: CreateProjectRequest): Promise<Project> {
    return this.projectsService.createProject(dto);
  }

  @Patch(':id')
  async updateProject(
    @Param('id') id: string,
    @Body() dto: Partial<CreateProjectRequest> & { status?: string },
  ): Promise<Project> {
    return this.projectsService.updateProject(id, dto);
  }

  @Delete(':id')
  async deleteProject(@Param('id') id: string): Promise<{ success: true }> {
    await this.projectsService.deleteProject(id);
    return { success: true };
  }
}
