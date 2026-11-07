#!/usr/bin/env bash
# Local smoke: build, unit tests and a live dev-server check. No database required.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== typecheck + unit tests =="
npm run typecheck
npm test

echo "== production build =="
npm run build

echo "== dev server =="
PORT="${SMOKE_PORT:-5199}"
npm run dev -- --host 127.0.0.1 --port "$PORT" --strictPort > /tmp/hadi-smoke-dev.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:$PORT/" > /dev/null 2>&1; then break; fi
  sleep 0.5
done

curl -fsS "http://127.0.0.1:$PORT/" | grep -q '<div id="root"></div>'
curl -fsS -o /dev/null -w "main.tsx -> %{http_code}\n" "http://127.0.0.1:$PORT/src/main.tsx"

SMOKE_UI_URL="http://127.0.0.1:$PORT" node scripts/smoke-flow.mjs
echo "✓ local smoke passed"
