#!/usr/bin/env bash
# 外部云端部署构建脚本（Render / 任意 Linux 环境）
# 注意：render.yaml 中显式指定了 buildCommand，会覆盖 Render 默认的 npm install，
# 因此这里必须先自行安装依赖。
set -euo pipefail

echo "==> [1/3] 安装依赖 (npm ci，使用官方源)"
npm ci --registry=https://registry.npmjs.org/

echo "==> [2/3] 构建后端 NestJS (SWC)"
npm run build:server

echo "==> [3/3] 构建前端 Vite (fullstack 模式)"
MIAODA_APP_TYPE=3 npm run build:client

echo "==> 构建完成，dist/ 已就绪。"
