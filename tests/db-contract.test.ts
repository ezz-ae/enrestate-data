import { Prisma, PrismaClient } from "@prisma/client"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { REQUIRED_FUNCTIONS, REQUIRED_RELATIONS } from "@/lib/db-contract"

const hasDatabaseUrl = Boolean(
  process.env.DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.NEON_DATABASE_URL ||
    process.env.NEON_DATABASE_URL_UNPOOLED,
)

const describeDb = hasDatabaseUrl ? describe : describe.skip

describeDb("database contract", () => {
  const prisma = new PrismaClient()

  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it("exposes required views and tables", async () => {
    const names = REQUIRED_RELATIONS.map((relation) => relation.name)
    const rows = await prisma.$queryRaw<{ table_name: string; table_type: string }[]>(Prisma.sql`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (${Prisma.join(names)})
    `)

    const found = new Map(rows.map((row) => [row.table_name, row.table_type]))
    for (const relation of REQUIRED_RELATIONS) {
      expect(found.get(relation.name)).toBe(relation.type)
    }
  })

  it("exposes required columns on core relations", async () => {
    for (const relation of REQUIRED_RELATIONS) {
      const columns = await prisma.$queryRaw<{ column_name: string }[]>(Prisma.sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ${relation.name}
      `)
      const columnSet = new Set(columns.map((column) => column.column_name))
      for (const required of relation.requiredColumns) {
        expect(columnSet.has(required)).toBe(true)
      }
    }
  })

  it("exposes required functions", async () => {
    const rows = await prisma.$queryRaw<{ proname: string }[]>(Prisma.sql`
      SELECT proname
      FROM pg_proc
      JOIN pg_namespace n ON n.oid = pg_proc.pronamespace
      WHERE n.nspname = 'public'
        AND proname IN (${Prisma.join([...REQUIRED_FUNCTIONS])})
    `)
    const found = new Set(rows.map((row) => row.proname))
    for (const fn of REQUIRED_FUNCTIONS) {
      expect(found.has(fn)).toBe(true)
    }
  })
})
