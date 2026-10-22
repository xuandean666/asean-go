import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { projects } from '@server/database/schema';
import { eq, desc, count, ilike, and } from 'drizzle-orm';
import type {
  Project,
  PaginationResult,
  PaginationParams,
  CreateProjectRequest,
} from '@shared/api.interface';

interface ListProjectsParams extends PaginationParams {
  keyword?: string;
  status?: string;
}

interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: string;
}

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async getProjects(params: ListProjectsParams): Promise<PaginationResult<Project>> {
    const page = Math.max(1, params.page);
    const pageSize = Math.min(50, Math.max(1, params.pageSize));
    const offset = (page - 1) * pageSize;

    const conditions: ReturnType<typeof eq>[] = [];
    if (params.keyword && params.keyword.trim().length > 0) {
      conditions.push(ilike(projects.name, `%${params.keyword.trim()}%`));
    }
    if (params.status) {
      conditions.push(eq(projects.status, params.status));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, totalRows] = await Promise.all([
      this.db
        .select()
        .from(projects)
        .where(whereClause)
        .orderBy(desc(projects.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(projects).where(whereClause),
    ]);

    const total = Number(totalRows[0]?.count ?? 0);
    const items: Project[] = rows.map((row) => this.mapRow(row));
    return { items, total, page, pageSize };
  }

  async getProject(id: string): Promise<Project | null> {
    const rows = await this.db.select().from(projects).where(eq(projects.id, id));
    if (rows.length === 0) return null;
    return this.mapRow(rows[0]);
  }

  async createProject(dto: CreateProjectRequest): Promise<Project> {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new BadRequestException('项目名称不能为空');
    }

    const inserted = await this.db
      .insert(projects)
      .values({
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        platform: dto.platform || null,
        country: dto.country || null,
        status: 'active',
      })
      .returning();

    return this.mapRow(inserted[0]);
  }

  async updateProject(id: string, dto: UpdateProjectRequest): Promise<Project> {
    const existing = await this.db.select().from(projects).where(eq(projects.id, id));
    if (existing.length === 0) {
      throw new NotFoundException('项目不存在');
    }

    const patch: Record<string, unknown> = {};
    if (dto.name !== undefined) {
      const trimmed = dto.name.trim();
      if (trimmed.length === 0) throw new BadRequestException('项目名称不能为空');
      patch.name = trimmed;
    }
    if (dto.description !== undefined) {
      patch.description = dto.description?.trim() || null;
    }
    if (dto.platform !== undefined) {
      patch.platform = dto.platform || null;
    }
    if (dto.country !== undefined) {
      patch.country = dto.country || null;
    }
    if (dto.status !== undefined) {
      patch.status = dto.status;
    }

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(projects)
      .set(patch)
      .where(eq(projects.id, id))
      .returning();

    return this.mapRow(updated[0]);
  }

  async deleteProject(id: string): Promise<void> {
    const deleted = await this.db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning({ id: projects.id });
    if (deleted.length === 0) {
      throw new NotFoundException('项目不存在');
    }
  }

  private mapRow(row: Record<string, unknown>): Project {
    return {
      id: String(row.id),
      name: String(row.name),
      description: row.description ? String(row.description) : undefined,
      platform: row.platform ? String(row.platform) : undefined,
      country: row.country ? String(row.country) : undefined,
      status: String(row.status),
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
    };
  }
}
