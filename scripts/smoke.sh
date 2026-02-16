#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-}"
BYPASS_HEADER="${BYPASS_HEADER:-x-vercel-protection-bypass}"
BYPASS_TOKEN="${BYPASS_TOKEN:-}"
REQUIRED_MARKET_FIELDS="${REQUIRED_MARKET_FIELDS:-id,name}"
ERROR_LEAK_PATTERN="${ERROR_LEAK_PATTERN:-prisma|sql|stack|postgres}"

if [ -z "$BASE_URL" ]; then
  echo "BASE_URL is required (include https://)" >&2
  exit 2
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required" >&2
  exit 2
fi

BASE_URL="${BASE_URL%/}"

TOTAL=0
PASS=0
FAIL=0

summary() {
  echo "Summary: base_url=$BASE_URL total=$TOTAL pass=$PASS fail=$FAIL"
}
trap summary EXIT

RESP_BODY_FILE=""
RESP_HEADERS_FILE=""
RESP_STATUS=""

cleanup_resp() {
  if [ -n "${RESP_BODY_FILE:-}" ]; then rm -f "$RESP_BODY_FILE"; fi
  if [ -n "${RESP_HEADERS_FILE:-}" ]; then rm -f "$RESP_HEADERS_FILE"; fi
}

request() {
  local url="$1"
  local method="${2:-GET}"
  local data="${3:-}"

  RESP_BODY_FILE=$(mktemp)
  RESP_HEADERS_FILE=$(mktemp)

  local args=(-sS -D "$RESP_HEADERS_FILE" -o "$RESP_BODY_FILE" -w "%{http_code}" -H "Accept: application/json")
  if [ -n "$BYPASS_TOKEN" ]; then
    args+=(-H "$BYPASS_HEADER: $BYPASS_TOKEN")
  fi
  if [ -n "$data" ]; then
    args+=(-H "Content-Type: application/json" --data "$data")
  fi

  RESP_STATUS=$(curl "${args[@]}" -X "$method" "$url")
}

request_id() {
  local id=""
  id=$(jq -r '.requestId // empty' "$RESP_BODY_FILE" 2>/dev/null || true)
  if [ -z "$id" ]; then
    id=$(awk 'BEGIN{IGNORECASE=1} $1=="x-request-id:"{print $2}' "$RESP_HEADERS_FILE" | tr -d '\r' | head -n1)
  fi
  echo "$id"
}

fail() {
  local msg="$1"
  FAIL=$((FAIL + 1))
  local id
  id=$(request_id)
  if [ -n "$id" ]; then
    echo "requestId=$id" >&2
  fi
  echo "FAIL: $msg" >&2
  if [ -f "$RESP_BODY_FILE" ]; then
    cat "$RESP_BODY_FILE" >&2
  fi
  cleanup_resp
  exit 1
}

pass() {
  local msg="$1"
  PASS=$((PASS + 1))
  echo "PASS: $msg"
  cleanup_resp
}

auth_guard() {
  if [ "$RESP_STATUS" -eq 401 ] || [ "$RESP_STATUS" -eq 403 ]; then
    echo "Blocked by auth (status $RESP_STATUS). Provide BYPASS_HEADER/BYPASS_TOKEN or use Preview/Staging." >&2
    cleanup_resp
    exit 10
  fi
}

assert_status_in() {
  local expected="$1"
  local ok=0
  for code in $expected; do
    if [ "$RESP_STATUS" -eq "$code" ]; then
      ok=1
      break
    fi
  done
  if [ "$ok" -ne 1 ]; then
    fail "unexpected status $RESP_STATUS (expected $expected)"
  fi
}

assert_json() {
  jq -e . "$RESP_BODY_FILE" >/dev/null 2>&1 || fail "invalid JSON"
}

assert_error_shape_no_leak() {
  jq -e '.error and .requestId' "$RESP_BODY_FILE" >/dev/null 2>&1 || fail "missing error or requestId"
  local err_text
  err_text=$(jq -r '.error // ""' "$RESP_BODY_FILE")
  if echo "$err_text" | grep -E -i "$ERROR_LEAK_PATTERN" >/dev/null 2>&1; then
    fail "error leak detected ($ERROR_LEAK_PATTERN)"
  fi
}

assert_markets_response() {
  jq -e '(.markets // .data // .) | type == "array"' "$RESP_BODY_FILE" >/dev/null 2>&1 || fail "markets is not an array"
  local count
  count=$(jq -r '(.markets // .data // .) | length' "$RESP_BODY_FILE")
  if [ "$count" -gt 3 ]; then
    fail "markets length $count exceeds limit"
  fi

  IFS=',' read -r -a fields <<< "$REQUIRED_MARKET_FIELDS"
  for f in "${fields[@]}"; do
    f=$(echo "$f" | xargs)
    if [ -n "$f" ]; then
      jq -e "(.markets // .data // .) | all(.[]; has(\"$f\"))" "$RESP_BODY_FILE" >/dev/null 2>&1 \
        || fail "market items missing field: $f"
    fi
  done
}

assert_market_score_summary() {
  local total
  total=$(jq -r '(.totalAssets // .summary.totalAssets // 0) | tonumber' "$RESP_BODY_FILE" 2>/dev/null || echo 0)
  if [ "$total" -le 0 ]; then
    fail "totalAssets must be > 0"
  fi
  jq -e '(.distributions // .summary.distributions) != null' "$RESP_BODY_FILE" >/dev/null 2>&1 \
    || fail "missing distributions"
}

assert_chat_response() {
  jq -e '.matches and (.matches|type=="array") and .cards and (.cards|type=="array")' "$RESP_BODY_FILE" >/dev/null 2>&1 \
    || fail "missing matches/cards"
}

if [ -z "${CHAT_PAYLOAD:-}" ]; then
  CHAT_PAYLOAD=$(jq -nc --arg q "smoke test" '{q:$q, features:["markets"], limit:3}')
fi

if [ -z "${CHAT_PAYLOAD_OVERSIZED:-}" ]; then
  big=$(printf 'a%.0s' {1..5000})
  CHAT_PAYLOAD_OVERSIZED=$(jq -nc --arg q "$big" '{q:$q, features:["markets"], limit:3}')
fi

TOTAL=$((TOTAL + 1))
request "$BASE_URL/api/markets?limit=3"
auth_guard
assert_status_in "200"
assert_json
assert_markets_response
pass "markets limit=3"

TOTAL=$((TOTAL + 1))
request "$BASE_URL/api/markets?limit=99999"
auth_guard
assert_status_in "400 422"
assert_json
assert_error_shape_no_leak
pass "markets limit too large"

TOTAL=$((TOTAL + 1))
request "$BASE_URL/api/market-score/summary"
auth_guard
assert_status_in "200"
assert_json
assert_market_score_summary
pass "market score summary"

TOTAL=$((TOTAL + 1))
request "$BASE_URL/api/chat" "POST" "$CHAT_PAYLOAD"
auth_guard
assert_status_in "200"
assert_json
assert_chat_response
pass "chat normal"

TOTAL=$((TOTAL + 1))
request "$BASE_URL/api/chat" "POST" "$CHAT_PAYLOAD_OVERSIZED"
auth_guard
assert_status_in "400 422"
assert_json
assert_error_shape_no_leak
pass "chat oversized"
