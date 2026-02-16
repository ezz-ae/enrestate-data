import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const EXCLUDED_KEYWORDS = ["lelwa", "mashroi"]

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

/**
 * GET /api/markets
 *
 * Query params:
 *   city     - filter by emirate (Dubai, Abu Dhabi, etc.)
 *   area     - filter by area name
 *   type     - filter by unit type (Studio, 1BR, 2BR, etc.)
 *   minPrice - min price per sqft
 *   maxPrice - max price per sqft
 *   sort     - sort field (price, yield, volume, change)
 *   limit    - number of results (default 50)
 *   offset   - pagination offset
 *
 * Uses agent_inventory_view_v1 for live inventory results.
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get("city")
    const area = searchParams.get("area")
    const developer = searchParams.get("developer")
    const beds = searchParams.get("beds")
    const statusBand = searchParams.get("status_band")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const sort = searchParams.get("sort") || "score"
    const limit = Number(searchParams.get("limit") || "12")
    const offset = Number(searchParams.get("offset") || "0")

    const clauses: Prisma.Sql[] = []
    if (city) clauses.push(Prisma.sql`city ILIKE ${`%${city}%`}`)
    if (area) clauses.push(Prisma.sql`area ILIKE ${`%${area}%`}`)
    if (developer) clauses.push(Prisma.sql`developer ILIKE ${`%${developer}%`}`)
    if (beds) {
      const normalized = beds.toLowerCase()
      if (normalized.includes("studio")) {
        clauses.push(Prisma.sql`
          (
            beds::text ILIKE ${"%Studio%"}
            OR NULLIF(REGEXP_REPLACE(beds::text, '[^0-9.]', '', 'g'), '')::double precision = 0
          )
        `)
      } else {
        const bedsValue = Number.parseFloat(beds)
        if (!Number.isNaN(bedsValue)) {
          const bedsText = String(bedsValue)
          clauses.push(Prisma.sql`
            (
              NULLIF(REGEXP_REPLACE(beds::text, '[^0-9.]', '', 'g'), '')::double precision = ${bedsValue}
              OR beds::text ILIKE ${`%${bedsText}%`}
            )
          `)
        } else {
          clauses.push(Prisma.sql`beds::text ILIKE ${`%${beds}%`}`)
        }
      }
    }
    if (statusBand) clauses.push(Prisma.sql`status_band::text = ${statusBand}::text`)
    if (minPrice) {
      const parsed = Number.parseFloat(minPrice)
      if (!Number.isNaN(parsed)) {
        clauses.push(Prisma.sql`price_aed >= ${parsed}`)
      }
    }
    if (maxPrice) {
      const parsed = Number.parseFloat(maxPrice)
      if (!Number.isNaN(parsed)) {
        clauses.push(Prisma.sql`price_aed <= ${parsed}`)
      }
    }

    EXCLUDED_KEYWORDS.forEach((keyword) => {
      const pattern = `%${keyword}%`
      clauses.push(Prisma.sql`
        NOT (
          COALESCE(name, '') ILIKE ${pattern}
          OR COALESCE(developer, '') ILIKE ${pattern}
          OR COALESCE(area, '') ILIKE ${pattern}
          OR COALESCE(city, '') ILIKE ${pattern}
        )
      `)
    })

    const whereClause = clauses.length
      ? Prisma.sql`WHERE ${Prisma.join(clauses, " AND ")}`
      : Prisma.empty

    const orderBy =
      sort === "price"
        ? Prisma.sql`ORDER BY price_aed ASC NULLS LAST`
        : sort === "safety"
          ? Prisma.sql`ORDER BY safety_band ASC NULLS LAST`
          : Prisma.sql`ORDER BY score_0_100 DESC NULLS LAST`

    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
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
      ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `)

    const totals = await prisma.$queryRaw<{ count: number | bigint }[]>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM agent_inventory_view_v1
      ${whereClause}
    `)

    const normalizedRows = rows.map((row) => normalizeValue(row))
    const totalCount = normalizeValue(totals[0]?.count ?? 0)

    return NextResponse.json({
      total: totalCount,
      results: normalizedRows,
    })
  } catch (error) {
    console.error("Markets query error:", error)
    return NextResponse.json({ error: "Failed to load market inventory." }, { status: 500 })
  }
}
