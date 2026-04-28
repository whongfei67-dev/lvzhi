#!/bin/sh
# 健康检查脚本 - 检查 Next.js 服务是否响应
if wget -q --spider http://127.0.0.1:3000; then
    exit 0
else
    exit 1
fi