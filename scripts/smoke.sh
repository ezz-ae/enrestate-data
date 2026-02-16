#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

urls=(
  "$BASE_URL/api/markets?limit=3"
  "$BASE_URL/api/market-score/summary"
  "$BASE_URL/api/market-score/healthcheck"
)

echo "Smoke check: ${BASE_URL}"
for url in "${urls[@]}"; do
  code=$(curl -s -o /tmp/entrestate_smoke.json -w "%{http_code}" "$url" || echo "curl_error")
  echo "${url} -> ${code}"
  if [ "$code" = "200" ]; then
    head -c 200 /tmp/entrestate_smoke.json | tr '\n' ' ' | sed 's/\s\+/ /g'
    echo ""
  fi
  echo "---"
done

chat_payload='{"message":"Projects in Abu Dhabi under AED 2M"}'
chat_code=$(curl -s -o /tmp/entrestate_chat.json -w "%{http_code}" -X POST -H 'Content-Type: application/json' -d "$chat_payload" "$BASE_URL/api/chat" || echo "curl_error")
echo "$BASE_URL/api/chat -> ${chat_code}"
if [ "$chat_code" = "200" ]; then
  head -c 200 /tmp/entrestate_chat.json | tr '\n' ' ' | sed 's/\s\+/ /g'
  echo ""
fi
