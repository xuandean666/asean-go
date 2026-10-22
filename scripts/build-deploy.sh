#!/usr/bin/env bash
# 外部云端部署构建脚本（Render / 任意 Linux 环境）
# 不依赖妙搭平台的 CDN 上传、依赖裁剪等步骤，只构建 server + client。
set -euo pipefail

echo "==> [1/2] 构建后端 NestJS (SWC)"
npm run build:server

echo "==> [2/2] 构建前端 Vite (fullstack 模式)"
export MIAODA_APP_TYPE=3
npm run build:client

echo "==> 构建完成，dist/ 已就绪。"
