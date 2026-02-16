import { Prisma } from "@prisma/client"
import type { MarketScoreFilters, OverrideFlags, RoutingParams } from "@/lib/market-score/types"
import { buildExclusionSql } from "@/lib/inventory-policy"

const SAFE_BANDS_ORDER = ["Institutional Safe", "Capital Safe", "Opportunistic", "Speculative"]

export function getSafetyBandOrder(band: string) {
  const index = SAFE_BANDS_ORDER.indexOf(band)
  return index === -1 ? SAFE_BANDS_ORDER.length : index
}

function toSqlList(values: string[]) {
  return Prisma.join(values.map((value) => Prisma.sql`${value}`))
}

export function buildFilterSql(filters: MarketScoreFilters, options?: { includePriceTier?: boolean }): Prisma.Sql | null {
  const clauses: Prisma.Sql[] = []

  if (filters.cities.length > 0) {
    clauses.push(Prisma.sql`city IN (${toSqlList(filters.cities)})`)
  }
  if (filters.areas.length > 0) {
    clauses.push(Prisma.sql`area IN (${toSqlList(filters.areas)})`)
  }
  if (filters.statusBands.length > 0) {
    clauses.push(Prisma.sql`status_band IN (${toSqlList(filters.statusBands)})`)
  }
  if (options?.includePriceTier && filters.priceTiers.length > 0) {
    clauses.push(Prisma.sql`price_tier IN (${toSqlList(filters.priceTiers)})`)
  }
  if (filters.safetyBands.length > 0) {
    clauses.push(Prisma.sql`safety_band IN (${toSqlList(filters.safetyBands)})`)
  }

  const exclusionSql = buildExclusionSql()
  if (exclusionSql) clauses.push(exclusionSql)

  if (clauses.length === 0) return null
  return Prisma.sql`${Prisma.join(clauses, " AND ")}`
}

function buildOverrideUnion(
  selectSql: Prisma.Sql,
  overrideFlags: OverrideFlags,
): Prisma.Sql | null {
  const overrideClauses: Prisma.Sql[] = []
  if (overrideFlags.allow2030Plus) {
    overrideClauses.push(
      Prisma.sql`status_band::text IN (${Prisma.join([
        Prisma.sql`Handover2030Plus`,
        Prisma.sql`2030+`,
      ])})`,
    )
  }
  if (overrideFlags.allowSpeculative) {
    overrideClauses.push(Prisma.sql`safety_band = 'Speculative'`)
  }
  if (overrideClauses.length === 0) return null

  const whereSql = Prisma.sql`${Prisma.join(overrideClauses, " OR ")}`

  return Prisma.sql`SELECT ${selectSql} FROM agent_inventory_view_v1 WHERE ${whereSql}`
}

export function buildInventorySourceSql(
  columns: Prisma.Sql,
  routing: RoutingParams,
  overrideFlags: OverrideFlags,
): Prisma.Sql {
  if (routing.riskProfile && routing.horizon) {
    if (routing.ranked) {
      return Prisma.sql`SELECT ${columns} FROM agent_ranked_for_investor_v1(${routing.riskProfile}, ${routing.horizon}, ${routing.budgetAed}, ${routing.preferredArea}, ${routing.bedsPref}, ${routing.intent})`
    }
    const baseSql = Prisma.sql`SELECT ${columns} FROM agent_inventory_for_investor_v1(${routing.riskProfile}, ${routing.horizon})`
    const overrideSql = buildOverrideUnion(columns, overrideFlags)
    if (overrideSql) {
      return Prisma.sql`${baseSql} UNION ${overrideSql}`
    }
    return baseSql
  }

  return Prisma.sql`SELECT ${columns} FROM agent_inventory_view_v1`
}

export function buildSummaryBaseSql(
  routing: RoutingParams,
  overrideFlags: OverrideFlags,
  includePriceTier: boolean,
): Prisma.Sql {
  const columns = Prisma.join(
    [
      Prisma.sql`name`,
      Prisma.sql`developer`,
      Prisma.sql`city`,
      Prisma.sql`area`,
      Prisma.sql`status_band`,
      ...(includePriceTier ? [Prisma.sql`price_tier`] : []),
      Prisma.sql`safety_band`,
      Prisma.sql`classification`,
      Prisma.sql`score_0_100`,
    ],
    ", ",
  )
  return buildInventorySourceSql(columns, routing, overrideFlags)
}

export function buildInventoryColumns(options?: { includeRank?: boolean }): Prisma.Sql {
  const includeRank = options?.includeRank ?? false
  return Prisma.join(
    [
      Prisma.sql`asset_id::text AS asset_id`,
      Prisma.sql`name`,
      Prisma.sql`developer`,
      Prisma.sql`city`,
      Prisma.sql`area`,
      Prisma.sql`status_band`,
      Prisma.sql`price_aed`,
      Prisma.sql`beds`,
      Prisma.sql`score_0_100`,
      includeRank ? Prisma.sql`match_score` : Prisma.sql`NULL::double precision AS match_score`,
      includeRank ? Prisma.sql`final_rank` : Prisma.sql`NULL::double precision AS final_rank`,
      Prisma.sql`safety_band`,
      Prisma.sql`classification`,
      Prisma.sql`roi_band`,
      Prisma.sql`liquidity_band`,
      Prisma.sql`timeline_risk_band`,
      Prisma.sql`drivers`,
      Prisma.sql`reason_codes`,
      Prisma.sql`risk_flags`,
    ],
    ", ",
  )
}

export function buildDistinctOptionsQuery(
  baseSql: Prisma.Sql,
  column: string,
  filters?: Prisma.Sql | null,
): Prisma.Sql {
  const whereClause = filters ? Prisma.sql`WHERE ${filters}` : Prisma.empty
  return Prisma.sql`
    SELECT DISTINCT ${Prisma.raw(column)} AS value
    FROM (${baseSql}) AS inventory
    ${whereClause}
    ORDER BY value ASC
  `
}

export function buildCountQuery(baseSql: Prisma.Sql, filters?: Prisma.Sql | null): Prisma.Sql {
  const whereClause = filters ? Prisma.sql`WHERE ${filters}` : Prisma.empty
  return Prisma.sql`
    SELECT COUNT(*)::int AS count
    FROM (${baseSql}) AS inventory
    ${whereClause}
  `
}

export function buildAverageQuery(baseSql: Prisma.Sql, filters?: Prisma.Sql | null): Prisma.Sql {
  const whereClause = filters ? Prisma.sql`WHERE ${filters}` : Prisma.empty
  return Prisma.sql`
    SELECT COALESCE(AVG(score_0_100), 0)::float AS avg_score
    FROM (${baseSql}) AS inventory
    ${whereClause}
  `
}

export function buildDistributionQuery(
  baseSql: Prisma.Sql,
  column: string,
  filters?: Prisma.Sql | null,
): Prisma.Sql {
  const whereClause = filters ? Prisma.sql`WHERE ${filters}` : Prisma.empty
  return Prisma.sql`
    SELECT ${Prisma.raw(column)} AS label, COUNT(*)::int AS count
    FROM (${baseSql}) AS inventory
    ${whereClause}
    GROUP BY ${Prisma.raw(column)}
    ORDER BY COUNT(*) DESC
  `
}

export function buildAverageByQuery(
  baseSql: Prisma.Sql,
  column: string,
  filters?: Prisma.Sql | null,
): Prisma.Sql {
  const whereClause = filters ? Prisma.sql`WHERE ${filters}` : Prisma.empty
  return Prisma.sql`
    SELECT ${Prisma.raw(column)} AS label, COALESCE(AVG(score_0_100), 0)::float AS avg_score
    FROM (${baseSql}) AS inventory
    ${whereClause}
    GROUP BY ${Prisma.raw(column)}
    ORDER BY ${Prisma.raw(column)} ASC
  `
}

export function buildInventoryQuery(
  baseSql: Prisma.Sql,
  filters: Prisma.Sql | null,
  limit: number,
  offset: number,
): Prisma.Sql {
  const whereClause = filters ? Prisma.sql`WHERE ${filters}` : Prisma.empty
  return Prisma.sql`
    SELECT *
    FROM (${baseSql}) AS inventory
    ${whereClause}
    ORDER BY score_0_100 DESC NULLS LAST
    LIMIT ${limit} OFFSET ${offset}
  `
}

export function buildOverrideInsertQuery(
  userId: string,
  riskProfile: string | null,
  horizon: string | null,
  overrideFlags: OverrideFlags,
  reason: string,
  selectedAssetId: string | null,
): Prisma.Sql {
  const flagsJson = JSON.stringify(overrideFlags)
  return Prisma.sql`
    INSERT INTO investor_override_audit
      (user_id, risk_profile, horizon, override_flags, reason, selected_asset_id, created_at)
    VALUES
      (${userId}, ${riskProfile}, ${horizon}, ${flagsJson}::jsonb, ${reason}, ${selectedAssetId}, NOW())
  `
}
