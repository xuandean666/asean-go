import { Controller, Get, Render, Req } from '@nestjs/common';
import type { Request } from 'express';
import { BRAND } from '../../common/constants/brand';

@Controller()
export class ViewController {

  @Get(['/', '*'])
  @Render('index')
  async render(@Req() req: Request) {
    const platformData = req.__platform_data__ ?? {};

    // 外部独立部署：平台 API 不可用，使用固定品牌信息覆盖。
    platformData.appName = BRAND.appName;
    platformData.appDescription = BRAND.appDescription;
    platformData.appAvatar = BRAND.appAvatar;

    return {
      // 供前端读取平台信息
      __platform__: JSON.stringify(platformData),
      // 页面 hbs 占位符（覆盖平台中间件注入的兜底值）
      appId: '',
      userId: '',
      tenantId: '',
      userName: '',
      csrfToken: req.csrfToken ?? '',
      environment: 'online',
      basename: '',
      appName: BRAND.appName,
      appAvatar: BRAND.appAvatar,
      appDescription: BRAND.appDescription,
    };
  }
}
