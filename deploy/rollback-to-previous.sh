#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/lvzhi}"
ENV_FILE="${ENV_FILE:-$APP_DIR/deploy/.env}"
TAG_FILE="${TAG_FILE:-$APP_DIR/deploy/.history/previous_tag}"

if [[ ! -f "$TAG_FILE" ]]; then
  echo "No previous tag found at $TAG_FILE"
  exit 1
fi

previous_tag="$(cat "$TAG_FILE")"
if [[ -z "$previous_tag" ]]; then
  echo "Previous tag is empty"
  exit 1
fi

"$APP_DIR/deploy/update-from-registry.sh" "$previous_tag"
echo "Rollback finished to IMAGE_TAG=$previous_tag"
