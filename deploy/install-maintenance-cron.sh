#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/lvzhi}"
CRON_FILE="/etc/cron.d/lvzhi-maintenance"

cat > "$CRON_FILE" <<EOF
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# 每天凌晨 4 点执行轻量清理，避免构建缓存长期堆积
0 4 * * * root cd $APP_DIR && ./deploy/docker-cleanup.sh >> /var/log/lvzhi-maintenance.log 2>&1
EOF

chmod 644 "$CRON_FILE"
echo "Installed $CRON_FILE"
