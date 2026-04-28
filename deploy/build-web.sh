#!/bin/sh
# 设置 npm 镜像源（解决国内下载慢的问题）
export PNPM_HOME=/tmp/pnpm
export PATH=$PNPM_HOME:$PATH
corepack enable && corepack prepare pnpm@10.16.1 --activate
pnpm config set registry https://mirrors.cloud.tencent.com/npm/

# 从 .env.build 读取前端 API 配置（如果 ENV 未设置）
if [ -f .env.build ]; then
    if [ -z "$NEXT_PUBLIC_API_URL" ]; then
        value=$(grep "^NEXT_PUBLIC_API_URL=" .env.build | head -1 | cut -d"=" -f2)
        [ -n "$value" ] && export NEXT_PUBLIC_API_URL="$value"
    fi
fi

[ -z "$NEXT_PUBLIC_API_URL" ] && export NEXT_PUBLIC_API_URL="/api"
pnpm --filter web build
