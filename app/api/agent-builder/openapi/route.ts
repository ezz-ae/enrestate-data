import { NextResponse } from "next/server"
import { agentBuilderOpenApi } from "@/agent-builder/lib/openapi"

export async function GET() {
  return NextResponse.json(agentBuilderOpenApi)
}
