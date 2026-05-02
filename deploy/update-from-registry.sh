#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/lvzhi}"
ENV_FILE="${ENV_FILE:-$APP_DIR/deploy/.env}"
TAG="${1:-}"
FREE_GB_MIN="${FREE_GB_MIN:-8}"
AUTO_CLEANUP_ON_PREFLIGHT_FAIL="${AUTO_CLEANUP_ON_PREFLIGHT_FAIL:-true}"

if [[ -z "$TAG" ]]; then
  echo "Usage: $0 <image-tag>"
  exit 1
fi

if [[ ! -d "$APP_DIR" ]]; then
  echo "APP_DIR not found: $APP_DIR"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  echo "Create it from deploy/.env.template first."
  exit 1
fi

env_free="$(grep -E '^FREE_GB_MIN=' "$ENV_FILE" | tail -n 1 | cut -d'=' -f2 || true)"
if [[ -n "$env_free" ]]; then
  FREE_GB_MIN="$env_free"
fi

cd "$APP_DIR"

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git fetch --all --prune
  git checkout main
  git pull --ff-only origin main
fi

current_tag="$(grep -E '^IMAGE_TAG=' "$ENV_FILE" | tail -n 1 | cut -d'=' -f2 || true)"
if [[ -n "$current_tag" ]]; then
  mkdir -p "$APP_DIR/deploy/.history"
  echo "$current_tag" > "$APP_DIR/deploy/.history/previous_tag"
fi

if grep -q '^IMAGE_TAG=' "$ENV_FILE"; then
  sed -i.bak "s/^IMAGE_TAG=.*/IMAGE_TAG=$TAG/" "$ENV_FILE"
else
  echo "IMAGE_TAG=$TAG" >> "$ENV_FILE"
fi

if [[ -f "$APP_DIR/deploy/disk-preflight.sh" ]]; then
  if ! bash "$APP_DIR/deploy/disk-preflight.sh" --min-free-gb "$FREE_GB_MIN" --quiet; then
    if [[ "$AUTO_CLEANUP_ON_PREFLIGHT_FAIL" == "true" ]] && [[ -f "$APP_DIR/deploy/docker-cleanup.sh" ]]; then
      echo "[deploy] preflight failed, running one automatic cleanup pass..."
      bash "$APP_DIR/deploy/docker-cleanup.sh" --aggressive --vacuum-logs || true
      bash "$APP_DIR/deploy/disk-preflight.sh" --min-free-gb "$FREE_GB_MIN" --quiet
    else
      echo "[deploy] preflight failed and auto-cleanup disabled or script missing."
      exit 2
    fi
  fi
fi

pull_ok=false
for i in 1 2 3 4 5 6 7 8; do
  if docker compose --env-file "$ENV_FILE" pull web api admin nginx; then
    pull_ok=true
    break
  fi
  echo "[deploy] pull attempt ${i}/8 failed, retrying..."
  sleep $((i * 5))
done

if [[ "$pull_ok" != true ]]; then
  echo "[deploy] pull failed after retries"
  exit 18
fi

docker compose --env-file "$ENV_FILE" up -d web api admin nginx
docker compose --env-file "$ENV_FILE" ps

echo "Deploy finished with IMAGE_TAG=$TAG"
