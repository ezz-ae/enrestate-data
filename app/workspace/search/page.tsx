"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ArrowRight, Search, MapPin, Layers } from "lucide-react"
import type { MarketScoreSummary } from "@/lib/market-score/types"

const searchTypes = [
  "City and area filters",
  "Developer reputation checks",
  "Budget and yield screening",
  "Delivery timeline comparisons",
]

export default function WorkspaceSearchPage() {
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

  const topCities = summary?.available.cities.slice(0, 6) ?? []

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Workspace</p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
              Search
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Use structured filters to locate projects, inventory, and pricing signals.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 mb-8">
            <div className="p-6 bg-card border border-border rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <Search className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-medium text-foreground">Search capabilities</h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                {searchTypes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="p-6 bg-muted/30 border border-border rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-medium text-foreground">Top cities ready now</h2>
              </div>
              {summaryError ? (
                <p className="text-sm text-muted-foreground">{summaryError}</p>
              ) : topCities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {topCities.map((city) => (
                    <span
                      key={city}
                      className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground"
                    >
                      {city}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Loading live city list…</p>
              )}
              <p className="text-xs text-muted-foreground mt-4">
                These update with the live inventory feed.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/markets"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Open Explorer
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/market-score"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-md text-foreground hover:border-foreground/30 transition-colors"
            >
              Open Market Score
              <Layers className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
