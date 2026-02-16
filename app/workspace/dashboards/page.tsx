"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ArrowRight, BarChart3, Activity, Layers, ShieldCheck, Database } from "lucide-react"
import type { MarketScoreSummary } from "@/lib/market-score/types"

const dashboards = [
  {
    title: "Market Snapshot",
    description: "Price movement, volume, and absorption across tracked cities.",
    icon: Activity,
    href: "/top-data",
  },
  {
    title: "Scenario Monitor",
    description: "Track scenario states and recovery signals across campaigns.",
    icon: Layers,
    href: "/markets",
  },
  {
    title: "Portfolio Health",
    description: "Compare portfolio risk, yield, and delivery confidence.",
    icon: BarChart3,
    href: "/markets",
  },
]

export default function DashboardsPage() {
  const [summary, setSummary] = useState<MarketScoreSummary | null>(null)
  const [summaryError, setSummaryError] = useState<string | null>(null)

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

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Workspace</p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
              Dashboards
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Monitor market velocity, scenario status, and portfolio health in one view.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 mb-10">
            <div className="rounded-2xl border border-border/70 bg-card/60 p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Database className="w-4 h-4 text-accent" />
                Market snapshot
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Live counts pulled from the scoring feed.
              </p>
              {summary ? (
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                    <p className="text-xs text-muted-foreground">Assets scored</p>
                    <p className="text-lg font-semibold text-foreground mt-1">
                      {summary.totalAssets.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/50 p-3">
                    <p className="text-xs text-muted-foreground">Average score</p>
                    <p className="text-lg font-semibold text-foreground mt-1">
                      {summary.avgScore.toFixed(1)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Conservative ready</p>
                    <p className="text-sm font-medium text-foreground mt-1">
                      {summary.conservativeReadyPool.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Balanced 1-2yr</p>
                    <p className="text-sm font-medium text-foreground mt-1">
                      {summary.balancedDefaultPool.toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  {summaryError ?? "Loading live snapshot..."}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ShieldCheck className="w-4 h-4 text-accent" />
                Why dashboards matter
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Use dashboards to confirm delivery timing, safety mix, and liquidity before you act on pricing.
              </p>
              <div className="mt-4 text-xs text-muted-foreground space-y-2">
                <div>• Confirm supply pressure in your target corridor.</div>
                <div>• Spot safety band drift before it hits listings.</div>
                <div>• Keep client recommendations grounded in evidence.</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dashboards.map((dashboard) => (
              <Link
                key={dashboard.title}
                href={dashboard.href}
                className="p-6 bg-card border border-border rounded-lg hover:border-accent/30 transition-colors"
              >
                <dashboard.icon className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-medium text-foreground mt-4">{dashboard.title}</h2>
                <p className="text-sm text-muted-foreground mt-2">{dashboard.description}</p>
                <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
                  Open dashboard
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
