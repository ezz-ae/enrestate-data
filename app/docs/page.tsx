"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronRight, Zap, Database, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DocsHeader } from "@/components/docs/docs-header"
import { DocsSidebar } from "@/components/docs/docs-sidebar"
import { CodeBlock } from "@/components/docs/code-block"
import { CopyPageButton } from "@/components/docs/copy-page-button"
import type { DocsSectionId } from "@/lib/docs-content"

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<DocsSectionId>("introduction")

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <DocsHeader />

      <div className="flex pt-16">
        <DocsSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

        <main id="main-content" className="flex-1 lg:ml-64 px-6 lg:px-12 py-12 max-w-4xl">
          {/* Introduction */}
          <section id="introduction" className="mb-16">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground">Guides</span>
            </div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-4xl font-bold">Market Data Guide</h1>
              <CopyPageButton />
            </div>
            <p className="text-lg text-muted-foreground mb-8">
              Entrestate is a market data and decision platform for real estate teams. This guide explains how to access
              the live feed, understand the fields, and use the data in daily work.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-surface-elevated border border-white/10 rounded-lg p-4">
                <Zap className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">UAE coverage</h3>
                <p className="text-sm text-muted-foreground">Cities, areas, and projects in one feed</p>
              </div>
              <div className="bg-surface-elevated border border-white/10 rounded-lg p-4">
                <Database className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">Safety + timing tiers</h3>
                <p className="text-sm text-muted-foreground">Clarity on delivery and risk bands</p>
              </div>
              <div className="bg-surface-elevated border border-white/10 rounded-lg p-4">
                <Key className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">Access keys</h3>
                <p className="text-sm text-muted-foreground">Secure feed access for your team</p>
              </div>
            </div>
          </section>

          {/* Quickstart */}
          <section id="quickstart" className="mb-16">
            <h2 className="text-2xl font-bold mb-4">Getting access</h2>
            <p className="text-muted-foreground mb-6">
              Start the market feed in minutes. Choose the delivery format that fits your team.
            </p>
            <h3 className="text-lg font-semibold mb-3">1. Request access</h3>
            <CodeBlock code="Submit your access request from /contact." language="text" />
            <h3 className="text-lg font-semibold mt-6 mb-3">2. Choose delivery</h3>
            <CodeBlock
              language="text"
              code={`Live feed (JSON)\nData packs (CSV)\nScheduled exports (reports)`}
            />
            <h3 className="text-lg font-semibold mt-6 mb-3">3. Start with Explorer</h3>
            <CodeBlock
              language="text"
              code={`Use /markets to search projects, compare areas, and validate pricing.`}
            />
          </section>

          {/* Authentication */}
          <section id="authentication" className="mb-16">
            <h2 className="text-2xl font-bold mb-4">Access keys</h2>
            <p className="text-muted-foreground mb-6">
              Access keys protect the feed. Keep them private and rotate them regularly.
            </p>
            <h3 className="text-lg font-semibold mb-3">Using your access key</h3>
            <p className="text-muted-foreground mb-4">
              Include your access key in the{" "}
              <code className="bg-surface-dark px-2 py-0.5 rounded text-sm">Authorization</code> header:
            </p>
            <CodeBlock
              language="bash"
              code={`curl https://api.entrestate.ai/v1/market-feed \\
  -H "Authorization: Bearer YOUR_ACCESS_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"city": "Dubai"}'`}
            />
          </section>

          {/* Market Requests */}
          <section id="chat-completions" className="mb-16">
            <h2 className="text-2xl font-bold mb-4">Market requests</h2>
            <p className="text-muted-foreground mb-6">
              Ask for market answers in plain language and receive structured results.
            </p>
            <h3 className="text-lg font-semibold mb-3">Request</h3>
            <CodeBlock
              language="json"
              code={`POST /api/chat
{
  "message": "Studios under AED 800K in Business Bay"
}`}
            />
            <h3 className="text-lg font-semibold mt-6 mb-3">Response</h3>
            <CodeBlock
              language="json"
              code={`{
  "content": "Found matches in Business Bay...",
  "results": [
    {
      "name": "Project name",
      "price_aed": 780000,
      "status_band": "2026",
      "safety_band": "Capital Safe"
    }
  ]
}`}
            />
          </section>

          {/* Field dictionary */}
          <section id="embeddings" className="mb-16">
            <h2 className="text-2xl font-bold mb-4">Field dictionary</h2>
            <p className="text-muted-foreground mb-6">
              These are the most-used fields in the market feed.
            </p>
            <CodeBlock
              language="json"
              code={`{
  "price_aed": 1850000,
  "status_band": "2026",
  "safety_band": "Capital Safe",
  "classification": "Balanced",
  "roi_band": "Mid",
  "liquidity_band": "Short (1-2yr)"
}`}
            />
          </section>

          {/* Coverage map */}
          <section id="models" className="mb-16">
            <h2 className="text-2xl font-bold mb-4">Coverage map</h2>
            <p className="text-muted-foreground mb-6">
              Coverage is organized by city, area, and project. Use the Coverage page to see the latest footprint.
            </p>
            <div className="mt-6">
              <Link href="/models" className="text-primary hover:underline inline-flex items-center gap-1">
                View market coverage <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          {/* Match rules */}
          <section id="model-routing" className="mb-16">
            <h2 className="text-2xl font-bold mb-4">Match rules</h2>
            <p className="text-muted-foreground mb-6">
              Investor matching uses risk profile and horizon to filter inventory safely.
            </p>
            <CodeBlock
              language="json"
              code={`POST /api/market-score/inventory
{
  "risk_profile": "Conservative",
  "horizon": "Ready"
}`}
            />
          </section>

          {/* Update cadence */}
          <section id="streaming" className="mb-16">
            <h2 className="text-2xl font-bold mb-4">Update cadence</h2>
            <p className="text-muted-foreground mb-6">
              Updates follow a clear schedule so teams can trust the timing.
            </p>
            <CodeBlock
              language="text"
              code={`Core inventory: weekly\nSafety & scoring: after each refresh\nMedia assets: rolling updates`}
            />
          </section>

          {/* Add-ons */}
          <section id="function-calling" className="mb-16">
            <h2 className="text-2xl font-bold mb-4">Add-ons</h2>
            <p className="text-muted-foreground mb-6">
              Optional add-ons can be enabled per client.
            </p>
            <CodeBlock
              language="text"
              code={`Media packs (images + plans)\nTransaction history\nRental pricing bands`}
            />
          </section>

          {/* Access Keys */}
          <section id="api-keys" className="mb-16">
            <h2 className="text-2xl font-bold mb-4">Access keys</h2>
            <p className="text-muted-foreground mb-6">
              Keys are assigned per team and can be revoked anytime.
            </p>
            <div className="bg-surface-elevated border border-yellow-500/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-500">
                <strong>Security Warning:</strong> Keep access keys private and never share them in public code.
              </p>
            </div>
            <CodeBlock
              language="bash"
              code={`# Store your access key in environment variables
export ENTRESTATE_ACCESS_KEY="ent_live_..."`}
            />
          </section>

          {/* Delivery Limits */}
          <section id="rate-limits" className="mb-16">
            <h2 className="text-2xl font-bold mb-4">Delivery limits</h2>
            <p className="text-muted-foreground mb-6">
              Delivery limits vary by plan and protect the market feed.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 font-semibold">Plan</th>
                    <th className="text-left py-3 px-4 font-semibold">Daily requests</th>
                    <th className="text-left py-3 px-4 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Starter</td>
                    <td className="py-3 px-4">2,000</td>
                    <td className="py-3 px-4">Standard access</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4">Pro</td>
                    <td className="py-3 px-4">10,000</td>
                    <td className="py-3 px-4">Priority refresh</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Enterprise</td>
                    <td className="py-3 px-4">Custom</td>
                    <td className="py-3 px-4">Dedicated lanes</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <h3 className="text-lg font-semibold mt-6 mb-3">Delivery notes</h3>
            <CodeBlock
              language="text"
              code={`Need higher limits? Contact the team for a dedicated feed.`}
            />
          </section>

          {/* Footer navigation */}
          <div className="border-t border-white/10 pt-8 mt-16">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Questions?</p>
                <Link href="/contact" className="text-primary hover:underline">
                  Contact our team
                </Link>
              </div>
              <Link href="/signup">
                <Button className="bg-primary hover:bg-primary/90">Request access</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
