#!/usr/bin/env bash
set -euo pipefail

AGGRESSIVE=false
VACUUM_LOGS=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --aggressive)
      AGGRESSIVE=true
      shift
      ;;
    --vacuum-logs)
      VACUUM_LOGS=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--aggressive] [--vacuum-logs]"
      exit 1
      ;;
  esac
done

echo "[cleanup] Before:"
df -h
docker system df || true

docker builder prune -af || true
docker image prune -af || true

if [[ "$AGGRESSIVE" == true ]]; then
  docker system prune -af --volumes || true
fi

if [[ "$VACUUM_LOGS" == true ]] && command -v journalctl >/dev/null 2>&1; then
  journalctl --vacuum-time=3d || true
fi

echo "[cleanup] After:"
df -h
docker system df || true
