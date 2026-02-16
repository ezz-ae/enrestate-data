import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const AGENT_BUILDER_PATHS = ["/apps/agent-builder", "/api/agent-builder"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAgentBuilderRoute = AGENT_BUILDER_PATHS.some((path) => pathname.startsWith(path))

  if (isAgentBuilderRoute) {
    const enabled = process.env.NEXT_PUBLIC_ENABLE_AGENT_BUILDER === "true"
    if (process.env.NODE_ENV === "production" && !enabled) {
      return new NextResponse("Not Found", { status: 404 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/apps/agent-builder/:path*", "/api/agent-builder/:path*"],
}
