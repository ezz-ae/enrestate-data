"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ArrowRight, Import, ShieldCheck } from "lucide-react"
import type { SystemHealthcheckRow } from "@/lib/market-score/types"

const steps = [
  "Ingest managed market datasets",
  "Profile columns and detect anomalies",
  "Route insights into workspace views",
]

export default function ImportsPage() {
  const [healthcheck, setHealthcheck] = useState<SystemHealthcheckRow | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        const res = await fetch("/api/market-score/healthcheck", { signal: controller.signal })
        if (!res.ok) throw new Error("Healthcheck unavailable")
        const data = await res.json()
        setHealthcheck(data.healthcheck || null)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        setHealthError(error instanceof Error ? error.message : "Healthcheck unavailable")
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
              Data sources
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Managed ingestion for Entrestate datasets and governance signals.
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-lg mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Import className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-medium text-foreground">Ingestion workflow</h2>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/30 p-6 mb-8">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ShieldCheck className="w-4 h-4 text-accent" />
              Data trust check
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {healthcheck?.created_at
                ? `Last verified ${new Date(String(healthcheck.created_at)).toLocaleString()}.`
                : healthError ?? "Waiting on the latest healthcheck."}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This is a managed feed. You do not need to upload or configure sources here.
            </p>
          </div>

          <Link
            href="/workspace/data-scientist"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
              Open Market Intelligence Desk
              <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  )
}
