import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export const DEFAULT_STATEMENT_TIMEOUT_MS = 3000

export async function withStatementTimeout<T>(
  runner: (tx: Prisma.TransactionClient) => Promise<T>,
  ms: number = DEFAULT_STATEMENT_TIMEOUT_MS,
) {
  const safeMs = Number.isFinite(ms) ? Math.max(0, Math.floor(ms)) : DEFAULT_STATEMENT_TIMEOUT_MS
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL statement_timeout = ${safeMs}`)
    return runner(tx)
  })
}
