type RateLimitConfig = {
  limit: number
  windowMs: number
}

type RateLimitEntry = {
  count: number
  resetAt: number
}

const STORE_KEY = "__entrestate_rate_limit_store__"

const store: Map<string, RateLimitEntry> =
  (globalThis as typeof globalThis & { [STORE_KEY]?: Map<string, RateLimitEntry> })[STORE_KEY] ??
  new Map<string, RateLimitEntry>()

if (!(globalThis as typeof globalThis & { [STORE_KEY]?: Map<string, RateLimitEntry> })[STORE_KEY]) {
  ;(globalThis as typeof globalThis & { [STORE_KEY]?: Map<string, RateLimitEntry> })[STORE_KEY] = store
}

export function getRequestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const [first] = forwarded.split(",").map((part) => part.trim())
    if (first) return first
  }
  return request.headers.get("x-real-ip") ?? "unknown"
}

export function buildRateLimitKey(request: Request, scope: string): string {
  return `${scope}:${getRequestIp(request)}`
}

export function rateLimit(key: string, config: RateLimitConfig) {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + config.windowMs
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: Math.max(0, config.limit - 1), resetAt }
  }

  const nextCount = existing.count + 1
  existing.count = nextCount
  store.set(key, existing)

  const allowed = nextCount <= config.limit
  return {
    allowed,
    remaining: Math.max(0, config.limit - nextCount),
    resetAt: existing.resetAt,
  }
}
