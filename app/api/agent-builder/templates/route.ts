import { NextResponse } from "next/server"
import { listTemplates } from "@/agent-builder/lib/store"

export async function GET() {
  return NextResponse.json({ templates: listTemplates() })
}
