import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  CreateLocalizationRequest,
  ProductLocalization,
} from '@shared/api.interface';
import { LocalizationService } from './localization.service';

@Controller('api/localization')
export class LocalizationController {
  constructor(private readonly localizationService: LocalizationService) {}

  @Get('products')
  async getProducts(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('platform') platform?: string,
    @Query('language') language?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 10;
    return this.localizationService.getProducts({
      page: pageNum,
      pageSize: pageSizeNum,
      platform,
      language,
    });
  }

  @Get('products/:id')
  async getProduct(@Param('id') id: string): Promise<ProductLocalization> {
    const product = await this.localizationService.getProduct(id);
    if (!product) throw new NotFoundException('本地记录不存在');
    return product;
  }

  @Post('products')
  async createProduct(@Body() body: CreateLocalizationRequest) {
    return this.localizationService.createProduct(body);
  }

  @Post('products/:id/regenerate')
  async regenerate(
    @Param('id') id: string,
    @Body('language') language: string,
  ) {
    const result = await this.localizationService.regenerate(id, language);
    if (!result) throw new NotFoundException('本地记录不存在');
    return result;
  }
}
