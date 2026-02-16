import { NextResponse } from "next/server"
import { buildTruthChecks } from "@/lib/market-score/service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const truthChecks = await buildTruthChecks()
    return NextResponse.json(truthChecks)
  } catch (error) {
    console.error("Market score truth checks error:", error)
    return NextResponse.json({ error: "Failed to load truth checks." }, { status: 500 })
  }
}
