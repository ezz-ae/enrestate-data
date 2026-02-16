"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Database, ShieldCheck, LineChart, MapPin, Building2, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getDatasetFromLocalStorage, clearDatasetFromLocalStorage } from "@/lib/local-storage"
import { saveDatasetToLocalStorage } from "@/lib/local-storage"

const focusSignals = [
  "Delivery confidence",
  "Price pressure",
  "Developer execution",
  "Liquidity timeline",
  "Capital efficiency",
  "Market discount markers",
]

const deskHighlights = [
  {
    title: "Inventory coverage",
    description: "Projects, pricing bands, and unit types across tracked markets.",
    icon: Building2,
  },
  {
    title: "Area signals",
    description: "Momentum, absorption, and direction by city and district.",
    icon: MapPin,
  },
  {
    title: "Decision guardrails",
    description: "Risk class, delivery windows, and readiness markers.",
    icon: ShieldCheck,
  },
]

export default function MarketDeskPage() {
  const router = useRouter()
  const [savedDatasetId, setSavedDatasetId] = useState<string | null>(null)
  const [isLoadingDesk, setIsLoadingDesk] = useState(false)

  useEffect(() => {
    const saved = getDatasetFromLocalStorage()
    if (saved?.datasetId) {
      setSavedDatasetId(saved.datasetId)
    }
  }, [])

  const handleContinue = () => {
    if (savedDatasetId) {
      router.push(`/explore?datasetId=${savedDatasetId}`)
    }
  }

  const handleClearSaved = () => {
    clearDatasetFromLocalStorage()
    setSavedDatasetId(null)
  }

  const handleLoadDesk = async () => {
    setIsLoadingDesk(true)
    try {
      const res = await fetch("/api/dataset/entrestate", { method: "POST" })
      if (!res.ok) throw new Error("Failed to load market desk")
      const data = await res.json()

      if (data.storedDataset) {
        saveDatasetToLocalStorage(data.storedDataset)
      }

      router.push(`/explore?datasetId=${data.datasetId}`)
    } catch (error) {
      console.error("Failed to load market desk:", error)
    } finally {
      setIsLoadingDesk(false)
    }
  }

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_55%)] pointer-events-none" />

      <div className="container relative mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-4xl space-y-10">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Entrestate Market Desk
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
              Market Intelligence Desk
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              A clear market brief for brokers. Built on verified inventory, delivery timing, and pricing signals.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button onClick={handleLoadDesk} disabled={isLoadingDesk} className="bg-primary hover:bg-primary/90">
                {isLoadingDesk ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary-foreground" />
                    Loading desk
                  </>
                ) : (
                  <>
                    Open desk
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <Button variant="outline" className="border-primary/40 hover:bg-primary/10">
                Request a guided briefing
              </Button>
            </div>
          </div>

          {savedDatasetId && (
            <div className="rounded-[6px] border border-primary/30 bg-primary/10 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/20 p-2">
                    <Database className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Saved desk</p>
                    <p className="text-xs text-muted-foreground">Continue where you left off</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleClearSaved}>
                    Clear
                  </Button>
                  <Button size="sm" onClick={handleContinue} className="bg-primary hover:bg-primary/90">
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {deskHighlights.map((item) => (
              <div key={item.title} className="rounded-[6px] border border-border/60 bg-card/60 p-5">
                <item.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 text-base font-medium text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[6px] border border-border/60 bg-card/50 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <Layers className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-medium text-foreground">Focus signals</h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {focusSignals.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1 rounded-full border border-border/60 text-muted-foreground bg-secondary/40"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="rounded-[6px] border border-border/50 bg-card/50 p-5">
              <LineChart className="h-5 w-5 text-primary mx-auto" />
              <p className="mt-3 text-sm font-medium text-foreground">Market overview</p>
              <p className="text-xs text-muted-foreground mt-2">
                Concentration, clusters, and outliers across the portfolio.
              </p>
            </div>
            <div className="rounded-[6px] border border-border/50 bg-card/50 p-5">
              <MapPin className="h-5 w-5 text-primary mx-auto" />
              <p className="mt-3 text-sm font-medium text-foreground">Area comparisons</p>
              <p className="text-xs text-muted-foreground mt-2">
                Compare neighborhoods by price, delivery, and demand.
              </p>
            </div>
            <div className="rounded-[6px] border border-border/50 bg-card/50 p-5">
              <ShieldCheck className="h-5 w-5 text-primary mx-auto" />
              <p className="mt-3 text-sm font-medium text-foreground">Decision guardrails</p>
              <p className="text-xs text-muted-foreground mt-2">
                Risk classes and timing windows keep decisions disciplined.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
