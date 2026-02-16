#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "Smoke check: ${BASE_URL}"

markets_url="$BASE_URL/api/markets?limit=3"
markets_code=$(curl -s -o /tmp/entrestate_markets.json -w "%{http_code}" "$markets_url" || echo "curl_error")
echo "${markets_url} -> ${markets_code}"
if [ "$markets_code" = "200" ]; then
  node <<'NODE'
const fs = require("fs");
const data = JSON.parse(fs.readFileSync("/tmp/entrestate_markets.json", "utf8"));
if (!Array.isArray(data.results)) throw new Error("markets results missing");
if (data.results.length > 3) throw new Error("markets results exceed limit");
const sample = data.results[0] || {};
["asset_id", "name", "city", "area", "price_aed"].forEach((key) => {
  if (!(key in sample)) throw new Error(`markets missing field: ${key}`);
});
NODE
  head -c 200 /tmp/entrestate_markets.json | tr '\n' ' ' | sed 's/\s\+/ /g'
  echo ""
fi
echo "---"

invalid_markets_url="$BASE_URL/api/markets?limit=99999"
invalid_markets_code=$(curl -s -o /tmp/entrestate_markets_invalid.json -w "%{http_code}" "$invalid_markets_url" || echo "curl_error")
echo "${invalid_markets_url} -> ${invalid_markets_code}"
if [ "$invalid_markets_code" != "400" ] && [ "$invalid_markets_code" != "422" ]; then
  echo "Expected 400/422 for invalid markets limit"
  exit 1
fi
node <<'NODE'
const fs = require("fs");
const data = JSON.parse(fs.readFileSync("/tmp/entrestate_markets_invalid.json", "utf8"));
if (!data.error || !data.requestId) throw new Error("missing error/requestId");
if (/prisma|select|syntax/i.test(data.error)) throw new Error("internal error leaked");
NODE
echo "---"

summary_url="$BASE_URL/api/market-score/summary"
summary_code=$(curl -s -o /tmp/entrestate_summary.json -w "%{http_code}" "$summary_url" || echo "curl_error")
echo "${summary_url} -> ${summary_code}"
if [ "$summary_code" = "200" ]; then
  node <<'NODE'
const fs = require("fs");
const data = JSON.parse(fs.readFileSync("/tmp/entrestate_summary.json", "utf8"));
if (!(data.totalAssets > 0)) throw new Error("summary totalAssets missing");
if (!Array.isArray(data.safetyDistribution) || data.safetyDistribution.length === 0) {
  throw new Error("summary safetyDistribution missing");
}
NODE
  head -c 200 /tmp/entrestate_summary.json | tr '\n' ' ' | sed 's/\s\+/ /g'
  echo ""
fi
echo "---"

health_url="$BASE_URL/api/market-score/healthcheck"
health_code=$(curl -s -o /tmp/entrestate_health.json -w "%{http_code}" "$health_url" || echo "curl_error")
echo "${health_url} -> ${health_code}"
if [ "$health_code" = "200" ]; then
  head -c 200 /tmp/entrestate_health.json | tr '\n' ' ' | sed 's/\s\+/ /g'
  echo ""
fi
echo "---"

chat_payload='{"message":"Projects in Abu Dhabi under AED 2M"}'
chat_code=$(curl -s -o /tmp/entrestate_chat.json -w "%{http_code}" -X POST -H 'Content-Type: application/json' -d "$chat_payload" "$BASE_URL/api/chat" || echo "curl_error")
echo "$BASE_URL/api/chat -> ${chat_code}"
if [ "$chat_code" = "200" ]; then
  node <<'NODE'
const fs = require("fs");
const data = JSON.parse(fs.readFileSync("/tmp/entrestate_chat.json", "utf8"));
if (!data.content) throw new Error("chat content missing");
if (!Array.isArray(data.dataCards)) throw new Error("chat dataCards missing");
NODE
  head -c 200 /tmp/entrestate_chat.json | tr '\n' ' ' | sed 's/\s\+/ /g'
  echo ""
fi
echo "---"

node <<'NODE'
const fs = require("fs");
const payload = { message: "x".repeat(600) };
fs.writeFileSync("/tmp/entrestate_chat_large.json", JSON.stringify(payload));
NODE

chat_large_code=$(curl -s -o /tmp/entrestate_chat_large_response.json -w "%{http_code}" -X POST -H 'Content-Type: application/json' -d @/tmp/entrestate_chat_large.json "$BASE_URL/api/chat" || echo "curl_error")
echo "$BASE_URL/api/chat (oversized) -> ${chat_large_code}"
if [ "$chat_large_code" != "400" ] && [ "$chat_large_code" != "422" ]; then
  echo "Expected 400/422 for oversized chat message"
  exit 1
fi
node <<'NODE'
const fs = require("fs");
const data = JSON.parse(fs.readFileSync("/tmp/entrestate_chat_large_response.json", "utf8"));
if (!data.error || !data.requestId) throw new Error("chat oversized missing error/requestId");
NODE
