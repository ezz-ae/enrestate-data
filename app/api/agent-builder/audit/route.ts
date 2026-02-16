import { NextResponse } from "next/server"
import { getRequestContext } from "@/agent-builder/lib/request-context"
import { listAuditEvents } from "@/agent-builder/lib/audit-log"

export async function GET(request: Request) {
  const { teamId } = getRequestContext(request)
  return NextResponse.json({ events: listAuditEvents(teamId) })
}
