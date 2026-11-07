#!/usr/bin/env bash
# Production-like start: build once, serve the static UI and start the OAuth broker.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ] && [ -f .env.example ]; then
  echo "· .env not found — copying .env.example (fill in real secrets before exposing this publicly)"
  cp .env.example .env
fi

npm run build

PORT="${UI_PORT:-4173}"
HOST="${UI_HOST:-127.0.0.1}"
cleanup() { kill "${BROKER_PID:-}" 2>/dev/null || true; }
trap cleanup EXIT INT TERM

if [ -n "${GOOGLE_OAUTH_SKIP:-}" ] || [ "${SKIP_BROKER:-0}" = "1" ]; then
  echo "· broker skipped (SKIP_BROKER=1)"
else
  npm run oauth &
  BROKER_PID=$!
fi

echo "→ UI on http://$HOST:$PORT"
exec npx vite preview --host "$HOST" --port "$PORT" --strictPort
