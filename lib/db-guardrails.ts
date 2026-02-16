import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export const DEFAULT_STATEMENT_TIMEOUT_MS = 3000

export async function withStatementTimeout<T>(
  runner: (tx: Prisma.TransactionClient) => Promise<T>,
  ms: number = DEFAULT_STATEMENT_TIMEOUT_MS,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SET LOCAL statement_timeout = ${ms}`
    return runner(tx)
  })
}
