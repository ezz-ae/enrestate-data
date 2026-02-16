"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowRight, GitCompare, ArrowLeftRight } from "lucide-react"
import type { MarketScoreSummary } from "@/lib/market-score/types"

type AreaComparison = {
  area: string
  totalAssets: number
  avgScore: number
  topSafetyBand: string
  conservativeReadyPool: number
}

function ComparisonsContent() {
  const [summary, setSummary] = useState<MarketScoreSummary | null>(null)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [left, setLeft] = useState("")
  const [right, setRight] = useState("")
  const [compareData, setCompareData] = useState<{ left?: AreaComparison; right?: AreaComparison }>({})
  const [compareError, setCompareError] = useState<string | null>(null)
  const [compareLoading, setCompareLoading] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        const res = await fetch("/api/market-score/summary", { signal: controller.signal })
        if (!res.ok) throw new Error("Live feed unavailable")
        const data = await res.json()
        setSummary(data)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        setSummaryError(error instanceof Error ? error.message : "Live feed unavailable")
      }
    }

    load()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const leftParam = searchParams.get("left")
    const rightParam = searchParams.get("right")
    if (!left && leftParam) setLeft(leftParam)
    if (!right && rightParam) setRight(rightParam)
  }, [searchParams, left, right])

  useEffect(() => {
    const controller = new AbortController()
    const runCompare = async () => {
      if (!left || !right) {
        setCompareData({})
        setCompareError(null)
        return
      }
      setCompareLoading(true)
      setCompareError(null)
      try {
        const [leftRes, rightRes] = await Promise.all([
          fetch(`/api/market-score/summary?area=${encodeURIComponent(left)}`, { signal: controller.signal }),
          fetch(`/api/market-score/summary?area=${encodeURIComponent(right)}`, { signal: controller.signal }),
        ])
        if (!leftRes.ok || !rightRes.ok) throw new Error("Comparison feed unavailable")
        const [leftData, rightData] = (await Promise.all([leftRes.json(), rightRes.json()])) as MarketScoreSummary[]
        const toComparison = (area: string, data: MarketScoreSummary): AreaComparison => {
          const topSafetyBand =
            data.safetyDistribution?.reduce<{ label: string; count: number } | null>(
              (best, item) => (!best || item.count > best.count ? item : best),
              null,
            )?.label ?? "—"
          return {
            area,
            totalAssets: data.totalAssets,
            avgScore: data.avgScore,
            topSafetyBand,
            conservativeReadyPool: data.conservativeReadyPool,
          }
        }
        setCompareData({
          left: toComparison(left, leftData),
          right: toComparison(right, rightData),
        })
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        setCompareError(error instanceof Error ? error.message : "Comparison feed unavailable")
      } finally {
        setCompareLoading(false)
      }
    }

    runCompare()
    return () => controller.abort()
  }, [left, right])

  const areas = summary?.available.areas ?? []
  const compareQuery = left && right ? `${left}|${right}` : ""
  const comparisonReady = left && right && compareData.left && compareData.right
  const leaderNote = useMemo(() => {
    if (!comparisonReady) return null
    const leftScore = compareData.left?.avgScore ?? 0
    const rightScore = compareData.right?.avgScore ?? 0
    if (leftScore === rightScore) return "Both areas are evenly matched on score."
    return leftScore > rightScore
      ? `${left} currently leads on average score.`
      : `${right} currently leads on average score.`
  }, [comparisonReady, compareData.left, compareData.right, left, right])

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Workspace</p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
              Comparisons
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Side-by-side analysis of areas, developers, and pricing bands.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 mb-8">
            <div className="rounded-2xl border border-border/70 bg-card/60 p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <GitCompare className="w-4 h-4 text-accent" />
                Compare two areas
              </div>
              <p className="text-sm text-muted-foreground">
                Pick two areas to compare safety mix, delivery timing, and pricing pressure.
              </p>
              {summaryError ? (
                <p className="mt-4 text-sm text-muted-foreground">{summaryError}</p>
              ) : (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground">Area A</label>
                    <select
                      value={left}
                      onChange={(event) => setLeft(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="">Select area</option>
                      {areas.map((area) => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-center">
                    <ArrowLeftRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground">Area B</label>
                    <select
                      value={right}
                      onChange={(event) => setRight(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="">Select area</option>
                      {areas.map((area) => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              <Link
                href={compareQuery ? `/markets?compare=${encodeURIComponent(compareQuery)}` : "/markets"}
                className={`mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  compareQuery
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-secondary text-muted-foreground cursor-not-allowed"
                }`}
                aria-disabled={!compareQuery}
              >
                Start comparison
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">How to use it</p>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <div>1. Pick two areas with similar unit types.</div>
                <div>2. Review safety mix and delivery timing.</div>
                <div>3. Open Explorer to see inventory and pricing spreads.</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/60 p-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Comparison snapshot</p>
            <h2 className="text-lg font-medium text-foreground mt-2">Live scores side by side</h2>
            <p className="text-sm text-muted-foreground mt-2">
              This snapshot reads from the scoring feed to keep the comparison grounded.
            </p>
            {compareError ? (
              <p className="mt-4 text-sm text-muted-foreground">{compareError}</p>
            ) : compareLoading ? (
              <p className="mt-4 text-sm text-muted-foreground">Loading comparison…</p>
            ) : comparisonReady ? (
              <>
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {[compareData.left, compareData.right].map((item) =>
                    item ? (
                      <div key={item.area} className="rounded-xl border border-border/60 bg-background/60 p-5">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">{item.area}</p>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Assets scored</p>
                            <p className="text-lg font-semibold text-foreground mt-1">
                              {item.totalAssets.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Average score</p>
                            <p className="text-lg font-semibold text-foreground mt-1">
                              {item.avgScore.toFixed(1)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Top safety band</p>
                            <p className="text-sm font-medium text-foreground mt-1">{item.topSafetyBand}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Conservative ready</p>
                            <p className="text-sm font-medium text-foreground mt-1">
                              {item.conservativeReadyPool.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null,
                  )}
                </div>
                {leaderNote && (
                  <p className="mt-4 text-sm text-muted-foreground">{leaderNote}</p>
                )}
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Select two areas above to load the comparison.
              </p>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}

export default function ComparisonsPage() {
  return (
    <Suspense
      fallback={
        <main id="main-content">
          <Navbar />
          <div className="pt-28 pb-20 md:pt-36 md:pb-32">
            <div className="container mx-auto px-6">
              <div className="max-w-2xl mb-12">
                <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Workspace</p>
                <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
                  Comparisons
                </h1>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                  Loading comparison tools…
                </p>
              </div>
            </div>
          </div>
          <Footer />
        </main>
      }
    >
      <ComparisonsContent />
    </Suspense>
  )
}
