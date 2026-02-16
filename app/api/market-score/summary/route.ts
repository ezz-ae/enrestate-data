import { NextResponse } from "next/server"
import { parseMarketScoreFilters } from "@/lib/market-score/filters"
import { getMarketScoreSummary } from "@/lib/market-score/service"
import { filtersSchema, routingSchema } from "@/lib/market-score/validators"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const { filters, routing, overrideFlags } = parseMarketScoreFilters(searchParams)
    filtersSchema.parse(filters)
    routingSchema.parse(routing)
    const summary = await getMarketScoreSummary(filters, routing, overrideFlags)
    return NextResponse.json(summary)
  } catch (error) {
    console.error("Market score summary error:", error)
    return NextResponse.json({ error: "Failed to load market score summary." }, { status: 500 })
  }
}
