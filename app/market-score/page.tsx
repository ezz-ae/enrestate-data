"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ExplainWithChat } from "@/components/explain-with-chat"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { useIsAdmin } from "@/lib/auth/client"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  Download,
  Filter,
  ShieldCheck,
  SlidersHorizontal,
  Copy,
  Maximize2,
  X,
} from "lucide-react"
import type {
  MarketScoreCharts,
  MarketScoreInventoryResponse,
  MarketScoreSummary,
  OverrideDisclosure,
  SystemHealthcheckRow,
  TruthChecks,
} from "@/lib/market-score/types"

const RISK_PROFILES = ["Conservative", "Balanced", "Aggressive"]
const HORIZON_OPTIONS = ["Ready", "6-12mo", "1-2yr", "2-4yr", "4yr+"]
const INTENT_OPTIONS = [
  { value: "invest", label: "Invest" },
  { value: "live", label: "Live" },
  { value: "rent", label: "Rent" },
]

const formatStatusBand = (value?: string | null) => {
  if (!value) return "—"
  const normalized = value.toLowerCase()
  if (normalized.includes("completed")) return "Completed / ready"
  if (normalized.includes("handover2025") || normalized === "2025") return "2025 delivery"
  if (normalized.includes("handover2026") || normalized === "2026") return "2026 delivery"
  if (normalized.includes("handover2027") || normalized === "2027") return "2027 delivery"
  if (normalized.includes("handover2028_29") || normalized.includes("2028") || normalized.includes("2029")) {
    return "2028-29 delivery"
  }
  if (normalized.includes("handover2030plus") || normalized.includes("2030")) return "2030+ delivery"
  return value
}

function toggleValue(list: string[], value: string) {
  if (list.includes(value)) {
    return list.filter((item) => item !== value)
  }
  return [...list, value]
}

export default function MarketScorePage() {
  const [summary, setSummary] = useState<MarketScoreSummary | null>(null)
  const [charts, setCharts] = useState<MarketScoreCharts | null>(null)
  const [inventory, setInventory] = useState<MarketScoreInventoryResponse | null>(null)
  const [healthcheck, setHealthcheck] = useState<SystemHealthcheckRow | null>(null)
  const [truthChecks, setTruthChecks] = useState<TruthChecks | null>(null)
  const [tableLoading, setTableLoading] = useState(false)
  const [showInventory, setShowInventory] = useState(false)

  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [selectedStatusBands, setSelectedStatusBands] = useState<string[]>([])
  const [selectedPriceTiers, setSelectedPriceTiers] = useState<string[]>([])
  const [selectedSafetyBands, setSelectedSafetyBands] = useState<string[]>([])
  const [riskProfile, setRiskProfile] = useState<string>("")
  const [horizon, setHorizon] = useState<string>("")
  const [useRanked, setUseRanked] = useState(false)
  const [budgetAed, setBudgetAed] = useState("")
  const [preferredArea, setPreferredArea] = useState("")
  const [bedsPref, setBedsPref] = useState("")
  const [intent, setIntent] = useState<string>("")

  const [override2030, setOverride2030] = useState(false)
  const [overrideSpeculative, setOverrideSpeculative] = useState(false)
  const [overrideReason, setOverrideReason] = useState("")
  const [overrideAssetId, setOverrideAssetId] = useState("")
  const [overrideDisclosure, setOverrideDisclosure] = useState<OverrideDisclosure | null>(null)
  const [overrideActive, setOverrideActive] = useState(false)
  const [overrideLoading, setOverrideLoading] = useState(false)
  const [disclosureLoading, setDisclosureLoading] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showAdminOverride, setShowAdminOverride] = useState(false)
  const [expandedChart, setExpandedChart] = useState<null | "safety" | "status" | "safetyBand" | "priceTier" | "city">(null)

  const [page, setPage] = useState(1)
  const pageSize = 20
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [compareLeft, setCompareLeft] = useState("")
  const [compareRight, setCompareRight] = useState("")
  const [compareResult, setCompareResult] = useState<{ left: MarketScoreSummary; right: MarketScoreSummary } | null>(null)
  const [compareLoading, setCompareLoading] = useState(false)
  const [compareError, setCompareError] = useState<string | null>(null)

  const { isAdmin } = useIsAdmin()

  const isRankedReady = useRanked && Boolean(budgetAed) && Boolean(riskProfile) && Boolean(horizon)
  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    selectedCities.forEach((city) => params.append("city", city))
    selectedAreas.forEach((area) => params.append("area", area))
    selectedStatusBands.forEach((band) => params.append("status_band", band))
    selectedPriceTiers.forEach((tier) => params.append("price_tier", tier))
    selectedSafetyBands.forEach((band) => params.append("safety_band", band))
    if (riskProfile) params.set("risk_profile", riskProfile)
    if (horizon) params.set("horizon", horizon)
    if (isRankedReady) params.set("ranked", "true")
    if (useRanked && budgetAed) params.set("budget_aed", budgetAed)
    if (useRanked && preferredArea) params.set("preferred_area", preferredArea)
    if (useRanked && bedsPref) params.set("beds_pref", bedsPref)
    if (useRanked && intent) params.set("intent", intent)
    if (overrideActive && override2030) params.set("override_2030", "true")
    if (overrideActive && overrideSpeculative) params.set("override_speculative", "true")
    return params
  }, [
    selectedCities,
    selectedAreas,
    selectedStatusBands,
    selectedPriceTiers,
    selectedSafetyBands,
    riskProfile,
    horizon,
    useRanked,
    budgetAed,
    preferredArea,
    bedsPref,
    intent,
    overrideActive,
    override2030,
    overrideSpeculative,
    isRankedReady,
  ])

  const availableAreas = summary?.available.areas ?? []
  const compareQuery = compareLeft && compareRight ? `${compareLeft}|${compareRight}` : ""
  const chartDetails = {
    safety: {
      title: "Safety mix",
      description: "Shows how inventory splits across safety bands.",
    },
    status: {
      title: "Average score by delivery band",
      description: "Compare score quality across delivery timelines.",
    },
    safetyBand: {
      title: "Average score by safety band",
      description: "Highlights score strength within each safety band.",
    },
    priceTier: {
      title: "Average score by price tier",
      description: "Compare quality across pricing tiers when available.",
    },
    city: {
      title: "Assets by city",
      description: "Distribution of scored assets across major cities.",
    },
  }

  const getTopDistributionLabel = (rows: { label: string; count: number }[] = []) => {
    if (rows.length === 0) return "—"
    return rows.reduce((max, row) => (row.count > max.count ? row : max), rows[0]).label
  }

  const applyPreset = (profile: string, window: string) => {
    setRiskProfile(profile)
    setHorizon(window)
    setShowAdvancedFilters(false)
  }

  const handleSwapCompare = () => {
    setCompareLeft(compareRight)
    setCompareRight(compareLeft)
    setCompareResult(null)
    setCompareError(null)
  }

  const handleCompare = async () => {
    if (!compareLeft || !compareRight) return
    setCompareLoading(true)
    setCompareError(null)
    setCompareResult(null)
    try {
      const leftParams = new URLSearchParams({ area: compareLeft })
      const rightParams = new URLSearchParams({ area: compareRight })
      const [leftRes, rightRes] = await Promise.all([
        fetch(`/api/market-score/summary?${leftParams.toString()}`),
        fetch(`/api/market-score/summary?${rightParams.toString()}`),
      ])
      if (!leftRes.ok || !rightRes.ok) throw new Error("Comparison failed")
      const [leftData, rightData] = await Promise.all([leftRes.json(), rightRes.json()])
      setCompareResult({ left: leftData, right: rightData })
    } catch (error) {
      console.error("Compare error:", error)
      setCompareError("Unable to compare those areas right now.")
    } finally {
      setCompareLoading(false)
    }
  }

  useEffect(() => {
    if (availableAreas.length === 0) return
    setSelectedAreas((current) => current.filter((area) => availableAreas.includes(area)))
  }, [availableAreas])

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const [summaryRes, chartsRes] = await Promise.all([
          fetch(`/api/market-score/summary?${queryParams.toString()}`),
          fetch(`/api/market-score/charts?${queryParams.toString()}`),
        ])
        if (!summaryRes.ok || !chartsRes.ok) throw new Error("Summary fetch failed")
        const summaryData = await summaryRes.json()
        const chartsData = await chartsRes.json()
        setSummary(summaryData)
        setCharts(chartsData)
      } catch (error) {
        console.error("Market score summary error:", error)
      }
    }

    fetchSummary()
  }, [queryParams])

  useEffect(() => {
    const fetchHealthcheck = async () => {
      try {
        const res = await fetch("/api/market-score/healthcheck")
        if (!res.ok) throw new Error("Healthcheck failed")
        const data = await res.json()
        setHealthcheck(data.healthcheck || null)
      } catch (error) {
        console.error("Healthcheck error:", error)
      }
    }

    fetchHealthcheck()
  }, [])

  useEffect(() => {
    const fetchTruthChecks = async () => {
      try {
        const res = await fetch("/api/market-score/truth-checks")
        if (!res.ok) throw new Error("Truth checks failed")
        const data = await res.json()
        setTruthChecks(data)
      } catch (error) {
        console.error("Truth checks error:", error)
      }
    }

    fetchTruthChecks()
  }, [])

  useEffect(() => {
    const fetchInventory = async () => {
      if (!showInventory) {
        setTableLoading(false)
        return
      }
      setTableLoading(true)
      try {
        const params = new URLSearchParams(queryParams)
        params.set("page", page.toString())
        params.set("pageSize", pageSize.toString())
        const res = await fetch(`/api/market-score/inventory?${params.toString()}`)
        if (!res.ok) throw new Error("Inventory fetch failed")
        const data = await res.json()
        setInventory(data)
      } catch (error) {
        console.error("Market score inventory error:", error)
      } finally {
        setTableLoading(false)
      }
    }

    fetchInventory()
  }, [queryParams, page, showInventory])

  useEffect(() => {
    setPage(1)
  }, [queryParams])

  const renderExpandedChart = () => {
    if (!expandedChart) return null
    if (!charts) {
      return <div className="text-sm text-muted-foreground">Chart data is loading.</div>
    }

    switch (expandedChart) {
      case "safety":
        return (
          <ChartContainer
            config={{
              count: { label: "Assets", color: "hsl(var(--chart-1))" },
            }}
            className="h-[360px]"
          >
            <BarChart data={charts?.safetyDistribution ?? []}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )
      case "status":
        return (
          <ChartContainer
            config={{
              avgScore: { label: "Score", color: "hsl(var(--chart-2))" },
            }}
            className="h-[360px]"
          >
            <BarChart data={charts?.avgScoreByStatus ?? []}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickFormatter={formatStatusBand} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} labelFormatter={formatStatusBand} />
              <Bar dataKey="avgScore" fill="var(--color-avgScore)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )
      case "safetyBand":
        return (
          <ChartContainer
            config={{
              avgScore: { label: "Score", color: "hsl(var(--chart-3))" },
            }}
            className="h-[360px]"
          >
            <BarChart data={charts?.avgScoreBySafetyBand ?? []}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="avgScore" fill="var(--color-avgScore)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )
      case "priceTier":
        return (
          <ChartContainer
            config={{
              avgScore: { label: "Score", color: "hsl(var(--chart-4))" },
            }}
            className="h-[360px]"
          >
            <BarChart data={charts?.avgScoreByPriceTier ?? []}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="avgScore" fill="var(--color-avgScore)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )
      case "city":
        return (
          <ChartContainer
            config={{
              count: { label: "Assets", color: "hsl(var(--chart-5))" },
            }}
            className="h-[360px]"
          >
            <BarChart data={charts?.countByCity ?? []}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )
      default:
        return null
    }
  }

  const handleOverrideLog = async () => {
    if (!overrideReason.trim() || !overrideAssetId) return
    setOverrideLoading(true)
    try {
      const res = await fetch("/api/market-score/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          risk_profile: riskProfile || undefined,
          horizon: horizon || undefined,
          override_flags: {
            allow_2030_plus: override2030,
            allow_speculative: overrideSpeculative,
          },
          reason: overrideReason,
          selected_asset_id: overrideAssetId,
        }),
      })
      if (!res.ok) throw new Error("Override log failed")
      const data = await res.json()
      setOverrideDisclosure(data.disclosure || null)
      setOverrideActive(true)
    } catch (error) {
      console.error("Override audit error:", error)
    } finally {
      setOverrideLoading(false)
    }
  }

  const handleOverrideToggle = (setter: (value: boolean) => void, value: boolean) => {
    setter(value)
    setOverrideActive(false)
  }

  const handleDisclosurePreview = async () => {
    if (!overrideAssetId || !riskProfile) return
    setDisclosureLoading(true)
    try {
      const overrideType = override2030 && overrideSpeculative
        ? "allow_2030_plus_and_speculative"
        : override2030
          ? "allow_2030_plus"
          : overrideSpeculative
            ? "allow_speculative"
            : ""
      if (!overrideType) return
      const params = new URLSearchParams({
        asset_id: overrideAssetId,
        override_type: overrideType,
        profile: riskProfile,
      })
      const res = await fetch(`/api/market-score/override-disclosure?${params.toString()}`)
      if (!res.ok) throw new Error("Disclosure preview failed")
      const data = await res.json()
      setOverrideDisclosure(data.disclosure || null)
    } catch (error) {
      console.error("Disclosure preview error:", error)
    } finally {
      setDisclosureLoading(false)
    }
  }

  const buildWhatsAppSummary = (row: MarketScoreInventoryResponse["rows"][number]) => {
    const status = row.status_band ? `Status: ${formatStatusBand(row.status_band)}` : "Status: N/A"
    const price = row.price_aed ? `Price: AED ${row.price_aed.toLocaleString()}` : "Price: N/A"
    const score = row.score_0_100 ? `Score: ${row.score_0_100}` : "Score: N/A"
    const safety = row.safety_band ? `Safety: ${row.safety_band}` : "Safety: N/A"
    const location = [row.area, row.city].filter(Boolean).join(", ") || "Location: N/A"
    return `Project ${row.name || row.asset_id} · ${location}\n${status} · ${price}\n${score} · ${safety}`
  }

  const handleCopySummary = async (row: MarketScoreInventoryResponse["rows"][number]) => {
    const message = buildWhatsAppSummary(row)
    try {
      await navigator.clipboard.writeText(message)
    } catch (error) {
      console.error("Clipboard error:", error)
    }
  }

  const renderBadges = (values?: unknown) => {
    const list = Array.isArray(values) ? values : []
    if (list.length === 0) {
      return <span className="text-xs text-muted-foreground">None</span>
    }
    return (
      <div className="flex flex-wrap gap-2">
        {list.map((item) => (
          <span
            key={String(item)}
            className="rounded-full border border-border/60 bg-secondary/40 px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            {String(item)}
          </span>
        ))}
      </div>
    )
  }

  const handleExport = async () => {
    const params = new URLSearchParams(queryParams)
    params.set("format", "csv")
    const res = await fetch(`/api/market-score/inventory?${params.toString()}`)
    if (!res.ok) return
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "market-score-inventory.csv"
    anchor.click()
    window.URL.revokeObjectURL(url)
  }

  const totalPages = inventory ? Math.ceil(inventory.total / pageSize) : 1
  const showRankedColumns = isRankedReady
  const tableColumns = [
    "Project ID",
    "Project",
    "Developer",
    "City",
    "Area",
    "Delivery",
    "Price (AED)",
    "Beds",
    "Score",
    ...(showRankedColumns ? ["Match score", "Priority"] : []),
    "Safety band",
    "Buyer fit",
    "ROI band",
    "Liquidity",
    "Timing risk",
  ]

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="mx-auto w-full max-w-[1440px] px-6">
          <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-slate-800/40 via-slate-900/50 to-slate-950/70 p-8 mb-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(720px_circle_at_20%_-20%,rgba(59,130,246,0.12),transparent_60%),radial-gradient(640px_circle_at_85%_0%,rgba(148,163,184,0.12),transparent_55%)]" />
            <div className="relative">
              <div className="max-w-3xl mb-10">
                <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Market Score</p>
                <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
                  See which projects are safe, steady, or high-risk.
                </h1>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                  Use this page to read the score, the safety group, and the best-fit timing for each project.
                  Everything is plain language with evidence visible.
                </p>
                <div className="mt-5">
                  <ExplainWithChat prompt="Explain Market Score, safety bands, and how to use this page." />
                </div>
              </div>

              <section className="rounded-xl border border-border/60 bg-muted/40 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Last healthcheck</p>
                  <p className="text-sm text-foreground">
                    {healthcheck?.created_at
                      ? new Date(String(healthcheck.created_at)).toLocaleString()
                      : "No healthcheck data yet"}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>
                    {healthcheck?.passing_count ?? "—"} / {healthcheck?.total_count ?? "—"} passing
                  </span>
                </div>
              </section>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
            <div className="rounded-xl border border-border/70 bg-card/80 p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Projects scored</p>
              <p className="text-2xl font-semibold text-foreground">
                {summary?.totalAssets.toLocaleString() ?? "—"}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                <Database className="h-4 w-4" />
                {summary?.source === "routed" ? "Matched to your filters" : "Full inventory"}
              </div>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/40 p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Safety mix</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                {(summary?.safetyDistribution ?? []).map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span>{row.label}</span>
                    <span className="font-medium text-foreground">
                      {row.count.toLocaleString()} · {row.percent ?? 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border/70 bg-secondary/40 p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Buyer fit mix</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                {(summary?.classificationDistribution ?? []).map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span>{row.label}</span>
                    <span className="font-medium text-foreground">
                      {row.count.toLocaleString()} · {row.percent ?? 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/70 p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Overall quality score</p>
              <p className="text-2xl font-semibold text-foreground">
                {summary ? summary.avgScore.toFixed(1) : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Delivery and safety breakdowns below.
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/30 p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Conservative buyers · Ready now</p>
              <p className="text-2xl font-semibold text-foreground">
                {summary?.conservativeReadyPool.toLocaleString() ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Matches for cautious buyers</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-secondary/30 p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Balanced buyers · 1-2 years</p>
              <p className="text-2xl font-semibold text-foreground">
                {summary?.balancedDefaultPool.toLocaleString() ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Matches for balanced buyers</p>
            </div>
          </section>

          <section className="sticky top-[var(--app-header-height)] z-20 bg-background/95 backdrop-blur-xl border border-border/70 rounded-xl p-5 mb-10">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Filter className="h-4 w-4 text-accent" />
                Find projects
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters((prev) => !prev)}
              >
                {showAdvancedFilters ? "Hide extra filters" : "More filters"}
              </Button>
            </div>
            <div className="mb-5 flex flex-wrap gap-2">
              {[
                { label: "Conservative · Ready now", profile: "Conservative", window: "Ready" },
                { label: "Balanced · 1-2 years", profile: "Balanced", window: "1-2yr" },
                { label: "Aggressive · 2-4 years", profile: "Aggressive", window: "2-4yr" },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset.profile, preset.window)}
                  className="rounded-full border border-border/60 bg-card/60 px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Step 1 · Buyer profile</p>
                <div className="grid grid-cols-3 gap-2">
                  {RISK_PROFILES.map((profile) => (
                    <button
                      key={profile}
                      type="button"
                      onClick={() => setRiskProfile(profile === riskProfile ? "" : profile)}
                      className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                        profile === riskProfile
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {profile}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Pick how cautious the buyer is.</p>
              </div>
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Step 2 · Delivery window</p>
                <div className="grid grid-cols-2 gap-2">
                  {HORIZON_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setHorizon(option === horizon ? "" : option)}
                      className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                        option === horizon
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Step 3 · Location focus</p>
                <div className="flex flex-wrap gap-2">
                  {(summary?.available.cities ?? []).map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setSelectedCities((prev) => toggleValue(prev, city))}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        selectedCities.includes(city)
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Optional: narrow by city.</p>
              </div>
            </div>

            {showAdvancedFilters && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Areas</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {availableAreas.map((area) => (
                      <label key={area} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                          checked={selectedAreas.includes(area)}
                          onCheckedChange={() => setSelectedAreas((prev) => toggleValue(prev, area))}
                        />
                        {area}
                      </label>
                    ))}
                    {availableAreas.length === 0 && (
                      <p className="text-xs text-muted-foreground">Select a city to show areas.</p>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Delivery timing</p>
                  <div className="space-y-2">
                    {(summary?.available.statusBands ?? []).map((band) => (
                      <label key={band} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                          checked={selectedStatusBands.includes(band)}
                          onCheckedChange={() => setSelectedStatusBands((prev) => toggleValue(prev, band))}
                        />
                        {formatStatusBand(band)}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Safety group</p>
                  <div className="space-y-2">
                    {(summary?.available.safetyBands ?? []).map((band) => (
                      <label key={band} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                          checked={selectedSafetyBands.includes(band)}
                          onCheckedChange={() => setSelectedSafetyBands((prev) => toggleValue(prev, band))}
                        />
                        {band}
                      </label>
                    ))}
                  </div>
                </div>
                {summary?.available.priceTiers.length ? (
                  <div className="space-y-3 lg:col-span-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Budget band</p>
                    <div className="flex flex-wrap gap-2">
                      {(summary?.available.priceTiers ?? []).map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setSelectedPriceTiers((prev) => toggleValue(prev, tier))}
                          className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                            selectedPriceTiers.includes(tier)
                              ? "border-primary/50 bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            <div className="mt-6 rounded-lg border border-border bg-card/60 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                <SlidersHorizontal className="h-4 w-4 text-accent" />
                Match to a client (optional)
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant={useRanked ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseRanked((prev) => !prev)}
                >
                  {useRanked ? "Client match on" : "Match to a client"}
                </Button>
                <span className="text-xs text-muted-foreground">
                  Add a budget to sort recommendations.
                </span>
              </div>
              {useRanked && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <Input
                      value={budgetAed}
                      onChange={(event) => setBudgetAed(event.target.value)}
                      placeholder="Budget AED"
                      type="number"
                      className="bg-background"
                    />
                    <Input
                      value={preferredArea}
                      onChange={(event) => setPreferredArea(event.target.value)}
                      placeholder="Preferred area"
                      className="bg-background"
                    />
                    <Input
                      value={bedsPref}
                      onChange={(event) => setBedsPref(event.target.value)}
                      placeholder="Beds (Studio, 1BR...)"
                      className="bg-background"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {INTENT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setIntent(option.value === intent ? "" : option.value)}
                        className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                          option.value === intent
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {useRanked && !budgetAed && (
                <p className="text-xs text-amber-200 mt-3">
                  Add a budget to activate client matching.
                </p>
              )}
              {useRanked && (!riskProfile || !horizon) && (
                <p className="text-xs text-amber-200 mt-2">
                  Select an investor profile and timeframe to match a client.
                </p>
              )}
            </div>

            {isAdmin && (
              <div className="mt-6 rounded-lg border border-border bg-card/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <SlidersHorizontal className="h-4 w-4 text-accent" />
                    Power user override
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdminOverride((prev) => !prev)}
                  >
                    {showAdminOverride ? "Hide" : "Open"}
                  </Button>
                </div>
                {showAdminOverride && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                          checked={override2030}
                          onCheckedChange={(value) => handleOverrideToggle(setOverride2030, Boolean(value))}
                        />
                        Allow 2030+ delivery assets
                      </label>
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                          checked={overrideSpeculative}
                          onCheckedChange={(value) => handleOverrideToggle(setOverrideSpeculative, Boolean(value))}
                        />
                        Allow speculative safety band
                      </label>
                    </div>
                    {(override2030 || overrideSpeculative) && (
                      <div className="mt-4 space-y-3">
                        <Input
                          value={overrideAssetId}
                          onChange={(event) => setOverrideAssetId(event.target.value)}
                          placeholder="Asset ID for disclosure preview"
                          className="bg-background"
                        />
                        <Textarea
                          value={overrideReason}
                          onChange={(event) => setOverrideReason(event.target.value)}
                          placeholder="Required: why this override is needed"
                          className="min-h-[90px]"
                        />
                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleDisclosurePreview}
                            disabled={!overrideAssetId || !riskProfile || disclosureLoading}
                          >
                            {disclosureLoading ? "Previewing..." : "Preview disclosure"}
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleOverrideLog}
                            disabled={!overrideReason.trim() || !overrideAssetId || overrideLoading}
                          >
                            {overrideLoading ? "Logging..." : "Submit override"}
                          </Button>
                          {overrideActive ? (
                            <span className="text-xs text-emerald-500">Override active</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Override not active until logged.</span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {overrideDisclosure && (
              <div className="mt-4 rounded-lg border border-border bg-amber-500/10 p-4 text-sm text-amber-200">
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  Override disclosure
                </div>
                <pre className="mt-2 text-xs text-amber-100 whitespace-pre-wrap break-words">
                  {JSON.stringify(overrideDisclosure, null, 2)}
                </pre>
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-sm font-medium text-foreground">{chartDetails.safety.title}</p>
                <button
                  type="button"
                  onClick={() => setExpandedChart("safety")}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Zoom
                  <Maximize2 className="h-3 w-3" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{chartDetails.safety.description}</p>
              <ChartContainer
                config={{
                  count: { label: "Assets", color: "hsl(var(--chart-1))" },
                }}
                className="h-[220px]"
              >
                <BarChart data={charts?.safetyDistribution ?? []}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-sm font-medium text-foreground">{chartDetails.status.title}</p>
                <button
                  type="button"
                  onClick={() => setExpandedChart("status")}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Zoom
                  <Maximize2 className="h-3 w-3" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{chartDetails.status.description}</p>
              <ChartContainer
                config={{
                  avgScore: { label: "Score", color: "hsl(var(--chart-2))" },
                }}
                className="h-[220px]"
              >
                <BarChart data={charts?.avgScoreByStatus ?? []}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickFormatter={formatStatusBand} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} labelFormatter={formatStatusBand} />
                  <Bar dataKey="avgScore" fill="var(--color-avgScore)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-sm font-medium text-foreground">{chartDetails.safetyBand.title}</p>
                <button
                  type="button"
                  onClick={() => setExpandedChart("safetyBand")}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Zoom
                  <Maximize2 className="h-3 w-3" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{chartDetails.safetyBand.description}</p>
              <ChartContainer
                config={{
                  avgScore: { label: "Score", color: "hsl(var(--chart-3))" },
                }}
                className="h-[220px]"
              >
                <BarChart data={charts?.avgScoreBySafetyBand ?? []}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="avgScore" fill="var(--color-avgScore)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
            {charts?.avgScoreByPriceTier?.length ? (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-medium text-foreground">{chartDetails.priceTier.title}</p>
                  <button
                    type="button"
                    onClick={() => setExpandedChart("priceTier")}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Zoom
                    <Maximize2 className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{chartDetails.priceTier.description}</p>
                <ChartContainer
                  config={{
                    avgScore: { label: "Score", color: "hsl(var(--chart-4))" },
                  }}
                  className="h-[220px]"
                >
                  <BarChart data={charts?.avgScoreByPriceTier ?? []}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Bar dataKey="avgScore" fill="var(--color-avgScore)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            ) : null}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-sm font-medium text-foreground">{chartDetails.city.title}</p>
                <button
                  type="button"
                  onClick={() => setExpandedChart("city")}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Zoom
                  <Maximize2 className="h-3 w-3" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{chartDetails.city.description}</p>
              <ChartContainer
                config={{
                  count: { label: "Assets", color: "hsl(var(--chart-5))" },
                }}
                className="h-[220px]"
              >
                <BarChart data={charts?.countByCity ?? []}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card/70 p-6 mb-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-medium text-foreground">Compare two areas</h2>
                <p className="text-sm text-muted-foreground">
                  See safety mix and average score side by side before you decide.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSwapCompare} disabled={!compareLeft && !compareRight}>
                Swap
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Area A</label>
                <select
                  value={compareLeft}
                  onChange={(event) => setCompareLeft(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">Select an area</option>
                  {availableAreas.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Area B</label>
                <select
                  value={compareRight}
                  onChange={(event) => setCompareRight(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">Select an area</option>
                  {availableAreas.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handleCompare}
                disabled={!compareLeft || !compareRight || compareLoading}
                className="h-10"
              >
                {compareLoading ? "Comparing..." : "Compare"}
              </Button>
            </div>

            {compareError && (
              <div className="mt-4 text-sm text-amber-200">{compareError}</div>
            )}

            {!compareResult && !compareError && (
              <div className="mt-6 text-sm text-muted-foreground">
                Select two areas to compare market quality and safety mix.
              </div>
            )}

            {compareResult && (
              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[{ label: compareLeft, data: compareResult.left }, { label: compareRight, data: compareResult.right }].map((item) => (
                    <div key={item.label} className="rounded-xl border border-border bg-background/60 p-5">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Area</p>
                      <p className="text-lg font-semibold text-foreground mt-2">{item.label}</p>
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Assets</p>
                          <p className="text-foreground font-medium">{item.data.totalAssets.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Average score</p>
                          <p className="text-foreground font-medium">{item.data.avgScore.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Top safety band</p>
                          <p className="text-foreground font-medium">
                            {getTopDistributionLabel(item.data.safetyDistribution)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Classification leader</p>
                          <p className="text-foreground font-medium">
                            {getTopDistributionLabel(item.data.classificationDistribution)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {compareQuery ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm">
                    <span className="text-muted-foreground">
                      Continue the comparison with guided requests inside Explorer.
                    </span>
                    <Link
                      href={`/markets?compare=${encodeURIComponent(compareQuery)}`}
                      className="inline-flex items-center gap-2 text-primary hover:text-primary/80"
                    >
                      Open in Explorer
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : null}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-6 mb-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-medium text-foreground">Project list</h2>
                <p className="text-sm text-muted-foreground">
                  {useRanked
                    ? "Client-matched recommendations based on the details you shared."
                    : "Open the detailed list after you narrow the filters."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInventory((prev) => !prev)}
                >
                  {showInventory ? "Hide list" : "Show list"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={!showInventory}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>

            {showInventory ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                        {tableColumns.map((label) => (
                          <th key={label} className="py-3 px-3 text-left whitespace-nowrap">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableLoading && (
                        <tr>
                          <td colSpan={tableColumns.length} className="py-6 text-center text-muted-foreground">
                            Loading projects...
                          </td>
                        </tr>
                      )}
                      {!tableLoading && inventory?.rows.length === 0 && (
                        <tr>
                          <td colSpan={tableColumns.length} className="py-6 text-center text-muted-foreground">
                            No projects match the current filters.
                          </td>
                        </tr>
                      )}
                      {inventory?.rows.map((row) => {
                        const rowId = String(row.asset_id ?? row.name ?? "")
                        const isExpanded = Boolean(expandedRows[rowId])
                        return (
                          <Fragment key={rowId}>
                            <tr
                              className="border-b border-border/60 hover:bg-secondary/40 cursor-pointer"
                              onClick={() =>
                                setExpandedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }))
                              }
                            >
                              <td className="py-3 px-3 text-foreground">{row.asset_id}</td>
                              <td className="py-3 px-3 text-foreground">{row.name}</td>
                              <td className="py-3 px-3 text-muted-foreground">{row.developer}</td>
                              <td className="py-3 px-3 text-muted-foreground">{row.city}</td>
                              <td className="py-3 px-3 text-muted-foreground">{row.area}</td>
                              <td className="py-3 px-3 text-muted-foreground">
                                {formatStatusBand(row.status_band)}
                              </td>
                              <td className="py-3 px-3 text-muted-foreground">
                                {row.price_aed ? row.price_aed.toLocaleString() : "—"}
                              </td>
                              <td className="py-3 px-3 text-muted-foreground">{row.beds ?? "—"}</td>
                              <td className="py-3 px-3 text-foreground">{row.score_0_100 ?? "—"}</td>
                              {showRankedColumns && (
                                <>
                                  <td className="py-3 px-3 text-muted-foreground">{row.match_score ?? "—"}</td>
                                  <td className="py-3 px-3 text-muted-foreground">{row.final_rank ?? "—"}</td>
                                </>
                              )}
                              <td className="py-3 px-3 text-muted-foreground">{row.safety_band}</td>
                              <td className="py-3 px-3 text-muted-foreground">{row.classification}</td>
                              <td className="py-3 px-3 text-muted-foreground">{row.roi_band}</td>
                              <td className="py-3 px-3 text-muted-foreground">{row.liquidity_band}</td>
                              <td className="py-3 px-3 text-muted-foreground">{row.timeline_risk_band}</td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-secondary/30 border-b border-border/60">
                                <td colSpan={tableColumns.length} className="px-4 py-4">
                                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 text-xs text-muted-foreground">
                                    <div className="rounded-lg border border-border bg-card/80 p-3">
                                      <p className="text-xs font-semibold text-foreground mb-2">Evidence tags</p>
                                      {renderBadges(row.reason_codes)}
                                    </div>
                                    <div className="rounded-lg border border-border bg-card/80 p-3">
                                      <p className="text-xs font-semibold text-foreground mb-2">Risk notes</p>
                                      {renderBadges(row.risk_flags)}
                                    </div>
                                    <div className="rounded-lg border border-border bg-card/80 p-3 lg:col-span-2">
                                      <p className="text-xs font-semibold text-foreground mb-2">Why it scored this way</p>
                                      <pre className="whitespace-pre-wrap break-words">
                                        {JSON.stringify(row.drivers ?? {}, null, 2)}
                                      </pre>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-3"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          handleCopySummary(row)
                                        }}
                                      >
                                        <Copy className="h-4 w-4" />
                                        Copy WhatsApp summary
                                      </Button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                  <div>
                    {inventory ? `${inventory.total.toLocaleString()} projects` : "—"} · Page {page} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-border bg-background/60 p-4 text-sm text-muted-foreground">
                Use the filters above, then open the list when you want to review every project.
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-4">
              <ShieldCheck className="h-4 w-4 text-accent" />
              Validation checks
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Conservative · Ready
                </p>
                {(truthChecks?.conservativeReady ?? []).map((row: { label: string; count: number }) => (
                  <div key={row.label} className="flex items-center justify-between text-muted-foreground">
                    <span>{row.label}</span>
                    <span className="text-foreground font-medium">{row.count}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Balanced · 1-2yr
                </p>
                {(truthChecks?.balancedShort ?? []).map((row: { label: string; count: number }) => (
                  <div key={row.label} className="flex items-center justify-between text-muted-foreground">
                    <span>{row.label}</span>
                    <span className="text-foreground font-medium">{row.count}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Timing check</p>
                <div className="flex items-center gap-2 text-sm">
                  {truthChecks?.horizonViolations === 0 ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-foreground">No violations</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-foreground">
                        {truthChecks?.horizonViolations ?? "—"} violations
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Speculative check</p>
                <div className="flex items-center gap-2 text-sm">
                  {truthChecks?.speculativeLeak === 0 ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-foreground">None detected</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-foreground">
                        {truthChecks?.speculativeLeak ?? "—"} flagged
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      {expandedChart && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-4xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Chart focus</p>
                <h3 className="text-lg font-medium text-foreground mt-2">
                  {chartDetails[expandedChart].title}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {chartDetails[expandedChart].description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpandedChart(null)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Close chart"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6">{renderExpandedChart()}</div>
          </div>
        </div>
      )}
      <Footer />
    </main>
  )
}
