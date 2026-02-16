import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { buildExclusionSql } from "@/lib/inventory-policy"
import { buildRateLimitKey, rateLimit } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ChatResponse = {
  content: string
  dataCards?: Array<{
    type: "stat" | "area" | "project"
    title: string
    value: string
    subtitle?: string
    trend?: "up" | "down" | "flat"
    trendValue?: string
  }>
  suggestions?: string[]
}

const CITY_KEYWORDS = [
  "dubai",
  "abu dhabi",
  "sharjah",
  "ajman",
  "ras al khaimah",
  "fujairah",
  "umm al quwain",
]

const DEFAULT_SUGGESTIONS = [
  "Studios under AED 800K in Business Bay",
  "Compare Dubai Marina vs JBR",
  "Best areas for 1-2 year delivery",
  "Projects in Abu Dhabi under AED 2M",
]

function normalizeValue(value: unknown): unknown {
  if (typeof value === "bigint") {
    const asNumber = Number(value)
    return Number.isSafeInteger(asNumber) ? asNumber : value.toString()
  }
  if (value instanceof Date) return value.toISOString()
  if (value && typeof value === "object" && "toNumber" in value) {
    try {
      return (value as { toNumber: () => number }).toNumber()
    } catch {
      return value
    }
  }
  if (Array.isArray(value)) return value.map((item) => normalizeValue(item))
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [key, normalizeValue(val)]),
    )
  }
  return value
}

function parseBudget(message: string): number | null {
  const normalized = message.toLowerCase()
  const keywordMatch = normalized.match(
    /(?:under|below|max|budget|<=)\s*(?:aed)?\s*([\d,.]+)\s*([km]|m|million)?/,
  )
  const aedPrefixMatch = normalized.match(/aed\s*([\d,.]+)\s*([km]|m|million)?/)
  const aedSuffixMatch = normalized.match(/([\d,.]+)\s*([km]|m|million)?\s*aed/)
  const match = keywordMatch ?? aedPrefixMatch ?? aedSuffixMatch
  if (!match) return null

  const value = Number.parseFloat(match[1].replace(/,/g, ""))
  if (Number.isNaN(value)) return null

  const unit = match[2]
  if (unit === "k") return Math.round(value * 1_000)
  if (unit === "m" || unit === "million") return Math.round(value * 1_000_000)
  return Math.round(value)
}

function parseBeds(message: string): { value: string | number | null; label?: string; isStudio?: boolean } {
  const normalized = message.toLowerCase()
  if (normalized.includes("studio")) return { value: 0, label: "Studio", isStudio: true }

  const match = normalized.match(/(\d+)\s*(br|bed|beds)/)
  if (!match) return { value: null }

  const value = Number.parseInt(match[1], 10)
  if (Number.isNaN(value)) return { value: null }
  return { value, label: `${value}BR` }
}

function parseCity(message: string, contextCity?: string | null) {
  if (contextCity) return contextCity
  const normalized = message.toLowerCase()
  const found = CITY_KEYWORDS.find((city) => normalized.includes(city))
  return found ? found.replace(/\b\w/g, (c) => c.toUpperCase()) : null
}

function parseAreaCandidates(message: string, contextArea?: string | null): string[] {
  if (contextArea) return [contextArea]
  const normalized = message.toLowerCase().replace(/[^\w\s]/g, " ")
  const candidates: string[] = []

  const compareMatch = normalized.match(/compare\s+(.+)/)
  const base = compareMatch ? compareMatch[1] : normalized
  const compareParts = base.split(/\s+vs\s+|\s+versus\s+/).map((part) => part.trim())
  if (compareParts.length > 1) {
    candidates.push(...compareParts)
  }

  const inMatch = normalized.match(/\bin\s+([a-z\s]+)$/i)
  if (inMatch?.[1]) {
    candidates.push(inMatch[1])
  }

  const cleaned = candidates
    .map((value) =>
      value
        .replace(
          /\b(compare|vs|versus|area|areas|best|projects|for|delivery|under|aed|budget|with|in|of)\b/g,
          "",
        )
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((value) => value.length > 2)

  return Array.from(new Set(cleaned))
}

function parseStatusBands(message: string): string[] {
  const normalized = message.toLowerCase()
  if (/(ready|completed)/.test(normalized)) return ["Completed", "Handover2025"]
  if (/(6[-\s]?12|6\s?months|12\s?months)/.test(normalized)) return ["Handover2025"]
  if (/(1[-\s]?2\s?year|1[-\s]?2\s?yr|1\s?to\s?2\s?years?)/.test(normalized)) {
    return ["Handover2025", "Handover2026"]
  }
  if (/(2[-\s]?4\s?year|2[-\s]?4\s?yr|2\s?to\s?4\s?years?)/.test(normalized)) {
    return ["Handover2027", "Handover2028_29"]
  }
  if (/(4\s?year|4\s?yr|\blong\b|4\+|\b5\s?year)/.test(normalized)) {
    return ["Handover2028_29", "Handover2030Plus"]
  }
  return []
}

function summarizeResults(
  rows: any[],
  city: string | null,
  options?: { fallbackNote?: string },
): ChatResponse {
  if (rows.length === 0) {
    return {
      content: "No matches found for that request. Try narrowing the area or adjusting the budget.",
      suggestions: DEFAULT_SUGGESTIONS,
    }
  }

  const prices = rows.map((row) => row.price_aed).filter((value) => typeof value === "number") as number[]
  const avgPrice = prices.length ? Math.round(prices.reduce((sum, val) => sum + val, 0) / prices.length) : null

  const areaCounts = rows.reduce<Record<string, number>>((acc, row) => {
    const key = row.area || row.city || "Unknown"
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  const topArea = Object.entries(areaCounts).sort((a, b) => b[1] - a[1])[0]

  const topMatch = rows[0]
  const dataCards: ChatResponse["dataCards"] = []
  dataCards.push({ type: "stat", title: "Matches", value: `${rows.length}`, subtitle: "Top matched results" })
  if (avgPrice) {
    dataCards.push({ type: "stat", title: "Typical price", value: `AED ${avgPrice.toLocaleString()}`, subtitle: "Across matches" })
  }
  if (topArea) {
    dataCards.push({ type: "area", title: topArea[0], value: `${topArea[1]} matches`, subtitle: "Most common area" })
  }
  if (topMatch?.name) {
    dataCards.push({
      type: "project",
      title: topMatch.name,
      value: topMatch.price_aed ? `AED ${Math.round(topMatch.price_aed).toLocaleString()}` : "Price on request",
      subtitle: `${topMatch.area || topMatch.city || "UAE"} · ${topMatch.developer || ""}`.trim(),
    })
  }

  const fallbackNote = options?.fallbackNote ? `${options.fallbackNote} ` : ""

  return {
    content: `${fallbackNote}Found ${rows.length} matches${city ? ` in ${city}` : ""}. Top match: ${topMatch?.name || "a leading project"} in ${topMatch?.area || topMatch?.city || "UAE"}.`,
    dataCards,
    suggestions: DEFAULT_SUGGESTIONS,
  }
}

export async function POST(request: Request) {
  try {
    const { allowed, resetAt } = rateLimit(buildRateLimitKey(request, "chat"), {
      limit: 30,
      windowMs: 60_000,
    })
    if (!allowed) {
      const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      )
    }

    const body = await request.json()
    const { message, context } = body as { message?: string; context?: { city?: string; area?: string } }

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const budgetMax = parseBudget(message)
    const bedsInfo = parseBeds(message)
    const city = parseCity(message, context?.city)
    const areaCandidates = parseAreaCandidates(message, context?.area)
    const area = context?.area || (areaCandidates.length === 1 ? areaCandidates[0] : null)
    const statusBands = parseStatusBands(message).map((band) => String(band))
    const queryTerm = message.trim()

    const baseClauses: Prisma.Sql[] = []
    const wordCount = queryTerm.split(/\s+/).filter(Boolean).length
    const skipTextSearch =
      areaCandidates.length > 0 ||
      /\b(best|areas?|delivery|compare|vs|versus)\b/i.test(queryTerm)
    const useTextSearch = !skipTextSearch && wordCount <= 6 && queryTerm.length <= 40

    if (useTextSearch && queryTerm.length > 2) {
      const like = `%${queryTerm}%`
      baseClauses.push(
        Prisma.sql`(name ILIKE ${like} OR developer ILIKE ${like} OR area ILIKE ${like} OR city ILIKE ${like})`,
      )
    }
    if (city) baseClauses.push(Prisma.sql`city ILIKE ${`%${city}%`}`)
    if (areaCandidates.length > 0) {
      const areaClauses = areaCandidates.map(
        (candidate) =>
          Prisma.sql`(area ILIKE ${`%${candidate}%`} OR city ILIKE ${`%${candidate}%`} OR name ILIKE ${`%${candidate}%`} OR developer ILIKE ${`%${candidate}%`})`,
      )
      baseClauses.push(Prisma.sql`${Prisma.join(areaClauses, " OR ")}`)
    }
    if (budgetMax) baseClauses.push(Prisma.sql`price_aed <= ${budgetMax}`)

    let bedsClause: Prisma.Sql | null = null
    if (bedsInfo.value !== null) {
      if (bedsInfo.isStudio) {
        bedsClause = Prisma.sql`
          (
            beds::text ILIKE ${"%Studio%"}
            OR NULLIF(REGEXP_REPLACE(beds::text, '[^0-9.]', '', 'g'), '')::double precision = 0
            OR name ILIKE ${"%Studio%"}
          )
        `
      } else if (typeof bedsInfo.value === "number") {
        const bedsText = String(bedsInfo.value)
        bedsClause = Prisma.sql`
          (
            NULLIF(REGEXP_REPLACE(beds::text, '[^0-9.]', '', 'g'), '')::double precision = ${bedsInfo.value}
            OR beds::text ILIKE ${`%${bedsText}%`}
          )
        `
      } else {
        bedsClause = Prisma.sql`beds::text ILIKE ${`%${bedsInfo.value}%`}`
      }
    }
    if (statusBands.length > 0) {
      const statusBandSql = statusBands.map((band) => Prisma.sql`${band}::text`)
      baseClauses.push(Prisma.sql`status_band::text IN (${Prisma.join(statusBandSql)})`)
    }

    const exclusionSql = buildExclusionSql()
    if (exclusionSql) baseClauses.push(exclusionSql)

    const fullClauses = bedsClause ? [...baseClauses, bedsClause] : baseClauses
    const whereClause = fullClauses.length
      ? Prisma.sql`WHERE ${Prisma.join(fullClauses, " AND ")}`
      : Prisma.empty

    let rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        asset_id::text AS asset_id,
        name,
        developer,
        city,
        area,
        status_band,
        price_aed::double precision AS price_aed,
        beds,
        score_0_100::double precision AS score_0_100,
        safety_band,
        classification
      FROM agent_inventory_view_v1
      ${whereClause}
      ORDER BY score_0_100 DESC NULLS LAST
      LIMIT 8
    `)

    let fallbackUsed = false
    if (rows.length === 0 && bedsClause) {
      const fallbackWhere = baseClauses.length
        ? Prisma.sql`WHERE ${Prisma.join(baseClauses, " AND ")}`
        : Prisma.empty
      rows = await prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT
          asset_id::text AS asset_id,
          name,
          developer,
          city,
          area,
          status_band,
          price_aed::double precision AS price_aed,
          beds,
          score_0_100::double precision AS score_0_100,
          safety_band,
          classification
        FROM agent_inventory_view_v1
        ${fallbackWhere}
        ORDER BY score_0_100 DESC NULLS LAST
        LIMIT 8
      `)
      fallbackUsed = rows.length > 0
    }

    const normalizedRows = rows.map((row) => normalizeValue(row)) as typeof rows
    const response = summarizeResults(normalizedRows, city, {
      fallbackNote: fallbackUsed
        ? "No studio matches at that budget. Showing the closest options."
        : undefined,
    })

    return NextResponse.json({
      ...response,
      filters: {
        city,
        area,
        budget_max: budgetMax,
        beds: bedsInfo.label || bedsInfo.value,
      },
      results: normalizedRows,
    })
  } catch (error) {
    console.error("Chat query error:", error)
    return NextResponse.json({ error: "Unable to run that query." }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    content: "Ask about pricing, delivery timing, or area comparisons to begin.",
    suggestions: DEFAULT_SUGGESTIONS,
  })
}
