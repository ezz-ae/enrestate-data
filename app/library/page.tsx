"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"
import {
  FileText,
  TrendingUp,
  Scale,
  Clock,
  ArrowRight,
  BookOpen,
  Layers,
  ShieldCheck,
  BarChart3,
  Gauge,
} from "lucide-react"
import { libraryArticles, type LibraryCategory } from "@/lib/library-data"
import { ReadingControls } from "@/components/reading-controls"
import { ExplainWithChat } from "@/components/explain-with-chat"
import type { InventoryRow, MarketScoreInventoryResponse } from "@/lib/market-score/types"

type Category = "all" | LibraryCategory

const categories = [
  { key: "all" as Category, label: "All" },
  { key: "reports" as Category, label: "Market Reports" },
  { key: "insights" as Category, label: "Insights" },
  { key: "contracts" as Category, label: "Contracts Explained" },
]

const categoryIcons: Record<LibraryCategory, typeof TrendingUp> = {
  reports: TrendingUp,
  insights: FileText,
  contracts: Scale,
}

const coverageStats = [
  { label: "Projects tracked", value: "7,000+", note: "Active and historical inventory" },
  { label: "Areas indexed", value: "200+", note: "City + district coverage" },
  { label: "Developers profiled", value: "120+", note: "Track record and delivery mix" },
  { label: "Update cadence", value: "Monthly", note: "With weekly signal reviews" },
]

const tableLegend = [
  {
    title: "Price (AED)",
    description: "Latest observed starting price per project.",
    icon: BarChart3,
  },
  {
    title: "Safety band",
    description: "Institutional Safe, Capital Safe, Opportunistic, Speculative.",
    icon: ShieldCheck,
  },
  {
    title: "Liquidity",
    description: "How quickly units trade in the secondary market.",
    icon: Gauge,
  },
  {
    title: "Delivery band",
    description: "Completed, 2025, 2026, and future delivery windows.",
    icon: Layers,
  },
  {
    title: "Investor class",
    description: "Conservative, Balanced, or Aggressive fit.",
    icon: FileText,
  },
]

export default function LibraryPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("all")
  const [sampleRows, setSampleRows] = useState<InventoryRow[]>([])
  const [sampleLoading, setSampleLoading] = useState(true)
  const [sampleError, setSampleError] = useState<string | null>(null)

  const filtered =
    activeCategory === "all" ? libraryArticles : libraryArticles.filter((a) => a.category === activeCategory)
  const featuredArticle = libraryArticles[0]

  useEffect(() => {
    const controller = new AbortController()
    const loadSample = async () => {
      setSampleLoading(true)
      setSampleError(null)
      try {
        const res = await fetch("/api/market-score/inventory?page=1&pageSize=3", {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error("Live sample unavailable")
        const data = (await res.json()) as MarketScoreInventoryResponse
        setSampleRows(data.rows ?? [])
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        setSampleError(error instanceof Error ? error.message : "Live sample unavailable")
      } finally {
        setSampleLoading(false)
      }
    }

    loadSample()
    return () => controller.abort()
  }, [])

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Library</p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
              What we learned from the market
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Reports, pricing behavior, transaction patterns, and contract explanations. Signed, sourced, and maintained.
            </p>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeCategory === cat.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Featured */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <div className="relative p-8 md:p-10 rounded-lg overflow-hidden border border-border bg-gradient-to-br from-slate-700/35 via-slate-800/50 to-slate-900/70">
              <div className="absolute inset-0 opacity-10" aria-hidden="true">
                <div className="absolute inset-0" style={{
                  backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
                  backgroundSize: "24px 24px",
                }} />
              </div>
              <div className="relative">
                <span className="inline-block px-2.5 py-1 text-xs font-medium bg-muted/50 text-muted-foreground rounded-full mb-4">
                  Featured report
                </span>
                <h2 className="text-2xl md:text-3xl font-serif text-foreground leading-tight mb-3">
                  {featuredArticle.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {featuredArticle.description}
                </p>
                <div className="flex items-center gap-4">
                  <Link
                    href={`/library/${featuredArticle.slug}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Read brief
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {featuredArticle.readTime} read
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between p-8 md:p-10 bg-card border border-border rounded-lg">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-accent" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">About the Library</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every piece in the Library is researched, written, and signed by Entrestate analysts. We translate signals into plain market language and explain how to read the numbers without pushing buy or sell decisions.
                </p>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-serif text-foreground">7,000+</p>
                  <p className="text-xs text-muted-foreground mt-1">Projects tracked</p>
                </div>
                <div>
                  <p className="text-2xl font-serif text-foreground">200+</p>
                  <p className="text-xs text-muted-foreground mt-1">Areas indexed</p>
                </div>
                <div>
                  <p className="text-2xl font-serif text-foreground">Monthly</p>
                  <p className="text-xs text-muted-foreground mt-1">Signal refresh</p>
                </div>
              </div>
            </div>
          </div>

          {/* Coverage Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {coverageStats.map((stat) => (
              <div key={stat.label} className="p-5 bg-card border border-border rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-serif text-foreground mt-2">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.note}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/60 p-6 mb-12">
            <ReadingControls />
            <p className="mt-3 text-xs text-muted-foreground">
              Tip: Use Day mode for long reads, Night mode for late sessions, and toggle Reading mode for calmer spacing.
            </p>
          </div>

          {/* Reading Guide */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 mb-12">
            <div className="p-8 bg-card border border-border rounded-lg">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-medium text-foreground">How to read our tables</h2>
                </div>
                <ExplainWithChat prompt="Explain how to read Entrestate library tables and what each signal means." />
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Every table follows the same logic so brokers can move quickly: price, safety band, liquidity,
                delivery band, and investor class. Use it to read the story behind each project or area.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tableLegend.map((item) => (
                  <div key={item.title} className="flex items-start gap-3 p-4 rounded-lg bg-background/60 border border-border/60">
                    <div className="p-2 rounded-md bg-secondary">
                      <item.icon className="w-4 h-4 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-card border border-border rounded-lg">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-medium text-foreground">Sample table</h2>
                </div>
                <ExplainWithChat prompt="Explain the sample project table fields in clear real estate language." />
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Live rows to show how signals read together.
              </p>
              {sampleLoading ? (
                <div className="text-sm text-muted-foreground">Loading live sample…</div>
              ) : sampleRows.length > 0 ? (
                <div className="space-y-3">
                  {sampleRows.map((row) => (
                    <div key={String(row.asset_id)} className="border border-border rounded-lg p-4 bg-background/60">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{row.name ?? row.asset_id}</p>
                        <span className="text-xs text-muted-foreground">{row.safety_band ?? "Safety —"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-2">
                        <span>
                          Price:{" "}
                          <span className="text-foreground">
                            {row.price_aed ? `AED ${row.price_aed.toLocaleString()}` : "—"}
                          </span>
                        </span>
                        <span>
                          Delivery: <span className="text-foreground">{row.status_band ?? "—"}</span>
                        </span>
                        <span>
                          Liquidity: <span className="text-foreground">{row.liquidity_band ?? "—"}</span>
                        </span>
                        <span>
                          Investor class: <span className="text-foreground">{row.classification ?? "—"}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">{sampleError ?? "Live sample unavailable."}</div>
              )}
            </div>
          </div>

          {/* Article Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filtered.map((article) => {
              const Icon = categoryIcons[article.category]
              return (
              <Link
                key={article.slug}
                href={`/library/${article.slug}`}
                className="group p-6 bg-card border border-border rounded-lg hover:border-accent/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium px-2 py-0.5 bg-secondary text-muted-foreground rounded-full">
                    {article.tag}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.readTime}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Icon className="w-3.5 h-3.5 text-accent" />
                  <span>{article.date}</span>
                </div>
                <h3 className="text-base font-medium text-foreground mb-2 leading-snug group-hover:text-accent transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {article.description}
                </p>
                <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
                  Read brief
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
              )
            })}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
