import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export const DEFAULT_STATEMENT_TIMEOUT_MS = 3000
const MIN_STATEMENT_TIMEOUT_MS = 100
const MAX_STATEMENT_TIMEOUT_MS = 30000

export async function withStatementTimeout<T>(
  runner: (tx: Prisma.TransactionClient) => Promise<T>,
  ms: number = DEFAULT_STATEMENT_TIMEOUT_MS,
) {
  const safeMs = Number.isFinite(ms) ? Math.round(ms) : DEFAULT_STATEMENT_TIMEOUT_MS
  const boundedMs = Math.min(MAX_STATEMENT_TIMEOUT_MS, Math.max(MIN_STATEMENT_TIMEOUT_MS, safeMs))
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL statement_timeout = ${boundedMs}`)
    return runner(tx)
  })
}
