import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DocumentFields, DocumentRecord } from '@shared/api.interface';
import { DocumentsService } from './documents.service';

@Controller('api/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  async getDocuments(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('docType') docType?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 10;
    return this.documentsService.getDocuments({
      page: pageNum,
      pageSize: pageSizeNum,
      docType,
      status,
    });
  }

  @Get(':id')
  async getDocument(@Param('id') id: string): Promise<DocumentRecord> {
    const doc = await this.documentsService.getDocument(id);
    if (!doc) throw new NotFoundException('单证不存在');
    return doc;
  }

  @Post('upload')
  async uploadDocument(
    @Body()
    body: { fileName: string; docType: string; projectId?: string },
  ) {
    if (!body.fileName || !body.docType) {
      throw new BadRequestException('文件名和单证类型必填');
    }
    return this.documentsService.uploadDocument(body);
  }

  @Post('cross-check')
  async crossCheck(@Body('docIds') docIds: string[]) {
    if (!docIds || docIds.length < 2) {
      throw new BadRequestException('请至少选择 2 张单据进行核对');
    }
    return this.documentsService.crossCheck(docIds);
  }

  @Patch(':id')
  async updateDocument(
    @Param('id') id: string,
    @Body('extractedFields') extractedFields: Partial<DocumentFields>,
  ) {
    if (!extractedFields) {
      throw new BadRequestException('未提供待更新字段');
    }
    const result = await this.documentsService.updateDocument(id, {
      extractedFields,
    });
    if (!result) throw new NotFoundException('单证不存在');
    return result;
  }
}
