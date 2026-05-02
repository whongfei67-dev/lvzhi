#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/lvzhi}"
ENV_FILE="${ENV_FILE:-$APP_DIR/deploy/.env}"
FREE_GB_MIN="${FREE_GB_MIN:-8}"

if [[ ! -d "$APP_DIR" ]]; then
  echo "APP_DIR not found: $APP_DIR"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  exit 1
fi

cd "$APP_DIR"

if [[ -f "$ENV_FILE" ]]; then
  env_free="$(grep -E '^FREE_GB_MIN=' "$ENV_FILE" | tail -n 1 | cut -d'=' -f2 || true)"
  if [[ -n "$env_free" ]]; then
    FREE_GB_MIN="$env_free"
  fi
fi

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git fetch --all --prune
  git checkout main
  git pull --ff-only origin main
fi

"$APP_DIR/deploy/disk-preflight.sh" --min-free-gb "$FREE_GB_MIN"

docker compose --env-file "$ENV_FILE" pull web api admin nginx
docker compose --env-file "$ENV_FILE" up -d web api admin nginx
docker compose --env-file "$ENV_FILE" ps

echo "ECS update completed without local rebuild."
