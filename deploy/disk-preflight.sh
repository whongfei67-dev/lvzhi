#!/usr/bin/env bash
set -euo pipefail

MIN_FREE_GB=8
QUIET=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --min-free-gb)
      MIN_FREE_GB="${2:-8}"
      shift 2
      ;;
    --quiet)
      QUIET=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--min-free-gb <number>] [--quiet]"
      exit 1
      ;;
  esac
done

if ! command -v df >/dev/null 2>&1; then
  echo "df command not found"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker command not found"
  exit 1
fi

available_kb="$(df -Pk / | awk 'NR==2 {print $4}')"
if [[ -z "${available_kb}" ]]; then
  echo "Unable to read disk availability"
  exit 1
fi

available_gb="$((available_kb / 1024 / 1024))"

if [[ "$QUIET" != true ]]; then
  echo "[preflight] Disk free on /: ${available_gb}GB (threshold: ${MIN_FREE_GB}GB)"
  docker system df || true
fi

if (( available_gb < MIN_FREE_GB )); then
  echo "[preflight] ERROR: free disk ${available_gb}GB < ${MIN_FREE_GB}GB"
  echo "[preflight] Run: ./deploy/docker-cleanup.sh --aggressive"
  exit 2
fi

echo "[preflight] OK"
