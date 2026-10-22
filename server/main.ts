import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { configureApp } from '@lark-apaas/fullstack-nestjs-core';
import { join } from 'path';
import express from 'express';
import { __express as hbsExpressEngine } from 'hbs';

import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { initDatabase } from './database/init-db';

async function bootstrap() {
  // 外部部署：配置了 PostgreSQL 连接串时，先自动建类型与建表（幂等）。
  // 平台托管环境无此变量、由平台凭证连接，自动跳过。
  const externalDatabaseUrl = process.env.SUDA_DATABASE_URL ?? '';
  if (externalDatabaseUrl) {
    await initDatabase(externalDatabaseUrl);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    abortOnError: process.env.NODE_ENV !== 'development',
  });
  await configureApp(app, {
    disableSwagger: true,
  });

  // 外部独立部署：平台原本把 hashed 产物（/assets/*）交给 CDN，同源中间件会跳过。
  // 这里在控制器路由之前显式静态服务 /assets，确保 JS/CSS 可正常加载。
  const clientDist = join(process.cwd(), 'dist/client');
  app.use(
    '/assets',
    express.static(join(clientDist, 'assets'), {
      maxAge: '365d',
      immutable: true,
      fallthrough: true,
    }),
  );

  const logger = new Logger('Bootstrap');
  // 云平台（Render 等）要求绑定 0.0.0.0，并通过 PORT 注入端口。
  const host = process.env.SERVER_HOST || '0.0.0.0';
  const port = Number(process.env.PORT || process.env.SERVER_PORT || '3000');

  // 注册视图引擎, 渲染 client 目录下的 html 文件
  app.setBaseViewsDir(join(process.cwd(), 'dist/client'));
  app.setViewEngine('html');
  app.engine('html', hbsExpressEngine);

  await app.listen(port, host);
  logger.log(`Server running on ${host}:${port}`);
  logger.log(`API endpoints ready at http://${host}:${port}/api`);
}

bootstrap();
