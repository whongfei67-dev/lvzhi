# ============================================
# 律植 - 多阶段构建 Dockerfile
# 支持：Web (Next.js) + API (Fastify)
# ============================================

# ---- 阶段 1: Builder ----
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@10.16.1 --activate

# 设置 npm 镜像源（解决网络问题）
RUN npm config set registry https://registry.npmmirror.com

# 复制依赖文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/

# 复制 .env 文件到构建阶段（供 Next.js 构建期使用）
# 注意：需要在 COPY . . 之后执行
RUN cat /app/deploy/.env > .env.build 2>/dev/null || echo "# No env file" > .env.build

# 安装依赖（仅生产依赖）
RUN pnpm install --frozen-lockfile --prod=false

# 复制源代码
COPY . .

# 清理旧的构建产物，确保使用最新的构建配置
RUN rm -rf apps/api/dist

# Next.js 构建期默认不注入外部 BaaS 变量，避免意外依赖
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-/api}

# 复制构建脚本
COPY deploy/build-web.sh /tmp/build-web.sh
RUN chmod +x /tmp/build-web.sh

# 在构建脚本中执行 web 构建（脚本会从 .env.build 读取配置）
RUN /bin/sh /tmp/build-web.sh

# 构建 API 服务
RUN rm -rf apps/api/dist && pnpm --filter api build


# ---- 阶段 2: Web Runtime ----
FROM node:20-alpine AS web-runner

WORKDIR /app

ENV NODE_ENV=production

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    apk add --no-cache wget

# 复制 Next.js 构建产物（非 standalone 模式）
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@10.16.1 --activate

# 设置 npm 镜像源（解决网络问题）
RUN npm config set registry https://registry.npmmirror.com

# 安装生产依赖
RUN pnpm install --prod

# 修改文件所有权
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "start"]


# ---- 阶段 3: API Runtime ----
FROM node:20-alpine AS api-runner

WORKDIR /app

ENV NODE_ENV=production

# 创建非 root 用户；健康检查需要 wget
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 api && \
    apk add --no-cache wget

# 在 monorepo 根目录用 lockfile 安装 api 的生产依赖（api-runner 内仅有 package.json 时无 lockfile 会失败）
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/types/src ./packages/types/src
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# 修改文件所有权
RUN chown -R api:nodejs /app

RUN corepack enable && corepack prepare pnpm@10.16.1 --activate
RUN pnpm install --prod --filter api...

USER api

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]


# ---- 阶段 4: Nginx ----
FROM nginx:alpine AS nginx

# docker-compose healthcheck 使用 wget；官方 nginx:alpine 镜像不含 wget
RUN apk add --no-cache wget

# 复制自定义 nginx 配置
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# 证书目录由运行时 volume 挂载；镜像内仅占位目录
RUN mkdir -p /etc/nginx/ssl

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]


# ---- 阶段 5: All-in-One (开发/测试用) ----
FROM node:20-alpine AS all-in-one

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@10.16.1 --activate

# 复制依赖文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建
RUN pnpm --filter web build
RUN pnpm --filter api build

# 启动命令
# Web: pnpm --filter web start
# API: pnpm --filter api start

EXPOSE 3000 3001

CMD ["sh", "-c", "pnpm --filter api start & pnpm --filter web start"]
