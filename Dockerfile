# ========== 东盟智贸 ASEAN-Go 多阶段构建 ==========

# ---- 构建阶段 ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app
# 云端构建使用官方源（项目 .npmrc 默认淘宝镜像，海外构建可能偏慢）
RUN npm config set registry https://registry.npmjs.org/
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:server \
  && MIAODA_APP_TYPE=3 npm run build:client

# ---- 运行阶段 ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN npm config set registry https://registry.npmjs.org/
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server/main.js"]
