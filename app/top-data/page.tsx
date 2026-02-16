"use client"

import { useEffect, useMemo, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ExplainWithChat } from "@/components/explain-with-chat"
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Search,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import type { MarketScoreSummary } from "@/lib/market-score/types"

type DashboardResponse = {
  source: string
  overview: {
    total_projects: number
    portfolio_value: number
    avg_price: number | null
    avg_yield: number | null
    avg_appreciation: number | null
  }
  market_health: {
    undersupplied_pct: number | null
    high_confidence_pct: number | null
    avg_liquidity: number | null
  }
  top_areas_by_yield: Array<{ label: string; value: number | null }>
  alerts: string[]
}

type ChatCard = {
  type: "stat" | "area" | "project"
  title: string
  value: string
  subtitle?: string
}

type ChatResponse = {
  content: string
  dataCards?: ChatCard[]
  suggestions?: string[]
}

const quickQueries = [
  "Studios under AED 800K in Business Bay",
  "Compare Dubai Marina vs JBR",
  "Projects in Abu Dhabi under AED 2M",
  "Best areas for 1-2 year delivery",
]

const formatNumber = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return "—"
  return value.toLocaleString()
}

const formatPercent = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return "—"
  return `${value.toFixed(1)}%`
}

export default function TopDataPage() {
  const [summary, setSummary] = useState<MarketScoreSummary | null>(null)
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [query, setQuery] = useState("")
  const [chatResponse, setChatResponse] = useState<ChatResponse | null>(null)
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)

  const topSafetyBand = useMemo(() => {
    return summary?.safetyDistribution?.reduce<{ label: string; count: number } | null>(
      (best, item) => (!best || item.count > best.count ? item : best),
      null,
    )?.label
  }, [summary])

  const signalCards = useMemo(() => {
    if (!dashboard && !summary) return []
    return [
      {
        title: "Highest yield area",
        value:
          dashboard?.top_areas_by_yield?.[0]?.label
            ? `${dashboard.top_areas_by_yield[0].label}`
            : "—",
        subtitle: dashboard?.top_areas_by_yield?.[0]?.value
          ? `${dashboard.top_areas_by_yield[0].value.toFixed(1)}% gross`
          : "Waiting for yield band",
      },
      {
        title: "Liquidity score",
        value: dashboard ? formatNumber(dashboard.market_health.avg_liquidity) : "—",
        subtitle: "Average liquidity index",
      },
      {
        title: "Conservative-ready pool",
        value: summary ? summary.conservativeReadyPool.toLocaleString() : "—",
        subtitle: "Ready for cautious buyers",
      },
      {
        title: "Average ticket",
        value: dashboard ? `AED ${formatNumber(dashboard.overview.avg_price)}` : "—",
        subtitle: "Across tracked projects",
      },
    ]
  }, [dashboard, summary])

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setIsLoading(true)
      try {
        const [summaryRes, dashboardRes] = await Promise.all([
          fetch("/api/market-score/summary", { signal: controller.signal }),
          fetch("/api/daas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product: "dashboard", params: {} }),
            signal: controller.signal,
          }),
        ])

        if (!summaryRes.ok) throw new Error("Market score feed unavailable")
        const summaryData = (await summaryRes.json()) as MarketScoreSummary
        setSummary(summaryData)

        if (!dashboardRes.ok) throw new Error("Market data feed unavailable")
        const dashboardData = await dashboardRes.json()
        setDashboard(dashboardData.result as DashboardResponse)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Live feed unavailable"
        setSummaryError(message)
        setDashboardError(message)
      } finally {
        setIsLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [])

  const runChat = async (message: string) => {
    if (!message.trim()) return
    setChatError(null)
    setIsChatLoading(true)
    setChatResponse(null)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })
      if (!res.ok) throw new Error("Query failed")
      const data = (await res.json()) as ChatResponse
      setChatResponse(data)
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Query failed")
    } finally {
      setIsChatLoading(false)
    }
  }

  return (
    <main id="main-content" className="bg-background min-h-screen">
      <Navbar />

      <div className="pt-28 pb-24">
        <div className="mx-auto w-full max-w-[1440px] px-6 space-y-12">
          <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-slate-800/35 via-slate-900/45 to-slate-950/65 p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.18),transparent_60%)]" />
            <div className="relative max-w-3xl space-y-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Top Data</p>
              <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
                Live market signals, explained in real estate language.
              </h1>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                This desk turns live market data into clear signals. Everything here is pulled from inventory and
                scoring, so you can brief clients without digging through raw data.
              </p>
              <div className="pt-4">
                <ExplainWithChat prompt="Explain the Top Data desk and how to read these live signals." />
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  {summary ? `${summary.totalAssets.toLocaleString()} assets scored` : "Live scoring feed"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-accent" />
                  {dashboard ? `${formatNumber(dashboard.overview.total_projects)} projects tracked` : "Market feed"}
                </span>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6">
            <div className="rounded-2xl border border-border/70 bg-card/60 p-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">How to use Top Data</p>
              <h2 className="text-xl font-semibold text-foreground mt-2">Turn signals into client-ready answers</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Start with a question, read the signal cards, then pull the exact inventory using the Explorer desk.
              </p>
              <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
                {[
                  "Pick a question from the quick queries or ask your own.",
                  "Confirm the signal direction using the live cards below.",
                  "Open Explorer to see the exact projects behind the signal.",
                ].map((item, index) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-border/60 bg-muted/40 text-xs text-foreground">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-2xl border border-border/70 bg-secondary/30 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Signal cards</p>
                  <h2 className="text-xl font-semibold text-foreground mt-2">Live market pulse</h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  {dashboard || summary ? "Live" : "Connecting"}
                </span>
              </div>
              {signalCards.length > 0 ? (
                <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
                  {signalCards.map((card) => (
                    <div
                      key={card.title}
                      className="min-w-[220px] rounded-xl border border-border/60 bg-card/70 p-4"
                    >
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{card.title}</p>
                      <p className="text-base font-semibold text-foreground mt-2">{card.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                  Live signal cards will appear once the feed is ready.
                </div>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6">
            <div className="rounded-2xl border border-border/70 bg-card/60 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Scoring overview</p>
                  <h2 className="text-xl font-semibold text-foreground mt-2">Safety and investor mix</h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  {summary ? "Live" : isLoading ? "Loading…" : "Unavailable"}
                </span>
              </div>
              {summary ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Top safety band</p>
                    <p className="text-base font-semibold text-foreground mt-2">
                      {topSafetyBand ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-secondary/30 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Average score</p>
                    <p className="text-base font-semibold text-foreground mt-2">
                      {summary.avgScore.toFixed(1)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-card/70 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Safety bands</p>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {summary.safetyDistribution.slice(0, 4).map((band) => (
                        <div key={band.label} className="flex items-center justify-between">
                          <span>{band.label}</span>
                          <span className="text-foreground">{band.count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Investor class</p>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {summary.classificationDistribution.slice(0, 4).map((band) => (
                        <div key={band.label} className="flex items-center justify-between">
                          <span>{band.label}</span>
                          <span className="text-foreground">{band.count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                  {summaryError ?? "Loading scoring overview…"}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border/70 bg-secondary/30 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Market coverage</p>
                  <h2 className="text-xl font-semibold text-foreground mt-2">Portfolio health</h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  {dashboard ? "Live" : isLoading ? "Loading…" : "Unavailable"}
                </span>
              </div>
              {dashboard ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border/60 bg-card/60 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Average price</p>
                    <p className="text-base font-semibold text-foreground mt-2">
                      AED {formatNumber(dashboard.overview.avg_price)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Average yield</p>
                    <p className="text-base font-semibold text-foreground mt-2">
                      {formatPercent(dashboard.overview.avg_yield)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-card/70 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Liquidity score</p>
                    <p className="text-base font-semibold text-foreground mt-2">
                      {formatNumber(dashboard.market_health.avg_liquidity)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Undersupplied</p>
                    <p className="text-base font-semibold text-foreground mt-2">
                      {formatPercent(dashboard.market_health.undersupplied_pct)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                  {dashboardError ?? "Loading market coverage…"}
                </div>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6">
            <div className="rounded-2xl border border-border/70 bg-card/60 p-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Yield leaders</p>
              <h2 className="text-xl font-semibold text-foreground mt-2">Top areas by yield</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Use these to anchor conversations when clients ask for income-first options.
              </p>
              {dashboard ? (
                <div className="mt-4 space-y-3">
                  {dashboard.top_areas_by_yield.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Yield signals are still loading.</p>
                  ) : (
                    dashboard.top_areas_by_yield.map((area) => (
                      <div
                        key={area.label}
                        className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm"
                      >
                        <span className="text-muted-foreground">{area.label}</span>
                        <span className="text-foreground">
                          {area.value === null ? "—" : `${area.value.toFixed(1)}%`}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="mt-4 text-sm text-muted-foreground">{dashboardError ?? "Loading…"}</div>
              )}
            </div>

            <div className="rounded-2xl border border-border/70 bg-secondary/30 p-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Trusted pools</p>
              <h2 className="text-xl font-semibold text-foreground mt-2">Investor-ready inventory</h2>
              <p className="text-sm text-muted-foreground mt-2">
                These pools are already matched by safety and timing.
              </p>
              {summary ? (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border/60 bg-card/70 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Conservative · Ready</p>
                    <p className="text-lg font-semibold text-foreground mt-2">
                      {summary.conservativeReadyPool.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Balanced · 1-2yr</p>
                    <p className="text-lg font-semibold text-foreground mt-2">
                      {summary.balancedDefaultPool.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-secondary/40 p-4 sm:col-span-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Top cities covered</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {summary.available.cities.slice(0, 6).map((city) => (
                        <span
                          key={city}
                          className="rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground"
                        >
                          {city}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-sm text-muted-foreground">{summaryError ?? "Loading…"}</div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card/60 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Ask the desk</p>
                <h2 className="text-xl font-semibold text-foreground mt-2">Pull a live answer</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Ask a plain question and get matched options pulled from live inventory.
              </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQuery("")
                  setChatResponse(null)
                  setChatError(null)
                }}
                className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-border/60 bg-background/40 px-4 py-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void runChat(query)
                }}
                className="flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Example: Studios under AED 800K in Business Bay"
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!query.trim() || isChatLoading}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                >
                  Run
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-4 flex flex-wrap gap-2">
                {quickQueries.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setQuery(item)
                      void runChat(item)
                    }}
                    className="rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {chatError && (
              <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-amber-400 inline-block mr-2" />
                {chatError}
              </div>
            )}

            {chatResponse && (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Summary</p>
                  <p className="mt-3 text-sm text-foreground leading-relaxed">{chatResponse.content}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/70 p-5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Highlights</p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(chatResponse.dataCards ?? []).map((card) => (
                      <div key={`${card.title}-${card.value}`} className="rounded-lg border border-border/60 bg-background/40 p-3">
                        <p className="text-xs text-muted-foreground">{card.title}</p>
                        <p className="text-sm font-semibold text-foreground mt-2">{card.value}</p>
                        {card.subtitle && (
                          <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                        )}
                      </div>
                    ))}
                    {(chatResponse.dataCards ?? []).length === 0 && (
                      <p className="text-sm text-muted-foreground">No highlights returned yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <Footer />
    </main>
  )
}
