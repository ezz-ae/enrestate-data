"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { MapPin, ShieldCheck, TrendingUp, ArrowRight } from "lucide-react"
import type { MarketScoreCharts, MarketScoreSummary } from "@/lib/market-score/types"

export default function MarketCoveragePage() {
  const [summary, setSummary] = useState<MarketScoreSummary | null>(null)
  const [charts, setCharts] = useState<MarketScoreCharts | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCoverage = async () => {
      try {
        const [summaryRes, chartsRes] = await Promise.all([
          fetch("/api/market-score/summary"),
          fetch("/api/market-score/charts"),
        ])
        if (!summaryRes.ok || !chartsRes.ok) throw new Error("Coverage fetch failed")
        const summaryData = await summaryRes.json()
        const chartsData = await chartsRes.json()
        setSummary(summaryData)
        setCharts(chartsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load market coverage.")
      }
    }

    loadCoverage()
  }, [])

  const topSafetyBand = useMemo(() => {
    if (!summary?.safetyDistribution?.length) return null
    return summary.safetyDistribution.reduce((max, row) => (row.count > max.count ? row : max), summary.safetyDistribution[0])
  }, [summary])

  const topCities = useMemo(() => {
    const rows = charts?.countByCity ?? []
    return rows.slice(0, 8)
  }, [charts])

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <section className="rounded-2xl border border-border/70 bg-card/60 p-8 md:p-12 mb-10">
            <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Market Coverage</p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
              A clear view of what the market feed covers.
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-2xl">
              Coverage updates as inventory refreshes. Use this page to confirm which cities and safety tiers are live
              today.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/markets">
                  Open Explorer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/market-score">Open Market Score</Link>
              </Button>
            </div>
            {error && (
              <p className="mt-4 text-sm text-destructive">
                {error}
              </p>
            )}
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="rounded-xl border border-border/70 bg-card/70 p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-accent" />
                Total projects tracked
              </div>
              <p className="mt-3 text-2xl font-semibold text-foreground">
                {summary?.totalAssets?.toLocaleString() ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/40 p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-accent" />
                Most common safety tier
              </div>
              <p className="mt-3 text-2xl font-semibold text-foreground">
                {topSafetyBand?.label ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {topSafetyBand?.count?.toLocaleString() ?? "—"} projects
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-secondary/30 p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-accent" />
                Cities covered
              </div>
              <p className="mt-3 text-2xl font-semibold text-foreground">
                {summary?.available?.cities?.length?.toLocaleString() ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Active cities in the live feed</p>
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card/70 p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Coverage by city</p>
                <h2 className="text-xl font-semibold text-foreground">Top cities in the feed</h2>
              </div>
              <span className="text-xs text-muted-foreground">Live from Market Score</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(topCities.length ? topCities : []).map((city) => (
                <span
                  key={city.label}
                  className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs text-muted-foreground"
                >
                  {city.label}
                  <span className="text-foreground font-medium">{city.count}</span>
                </span>
              ))}
              {topCities.length === 0 && (
                <span className="text-sm text-muted-foreground">City coverage will appear once the feed loads.</span>
              )}
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  )
}
