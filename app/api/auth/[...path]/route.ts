import { NextResponse } from "next/server"
import { getAuth } from "@/lib/auth/server"

type AuthParams = { params: Promise<{ path: string[] }> }

const auth = getAuth()
const handler = auth?.handler()

const missingAuth = async (_request: Request, context: AuthParams) => {
  const params = await context.params
  const path = params?.path?.[0]
  if (path === "get-session") {
    return NextResponse.json({ data: null }, { status: 200 })
  }
  return NextResponse.json({ error: "Neon Auth is not configured." }, { status: 501 })
}

export const GET = handler?.GET ?? (async (request: Request, context: AuthParams) => missingAuth(request, context))
export const POST = handler?.POST ?? (async (request: Request, context: AuthParams) => missingAuth(request, context))
export const PUT = handler?.PUT ?? (async (request: Request, context: AuthParams) => missingAuth(request, context))
export const DELETE = handler?.DELETE ?? (async (request: Request, context: AuthParams) => missingAuth(request, context))
export const PATCH = handler?.PATCH ?? (async (request: Request, context: AuthParams) => missingAuth(request, context))
