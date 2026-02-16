"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

const pillars = [
  {
    number: "1",
    title: "Market Analysis Playground",
    subtitle: "Where thinking happens",
    description: "Study cities, areas, and projects. Test assumptions. Compare scenarios. Save and revisit decisions. A professional workspace for market clarity.",
    href: "/workspace",
    cta: "Open Workspace",
  },
  {
    number: "2",
    title: "Agent Platform",
    subtitle: "Where execution happens",
    description: "Agents and brokers operate contracts, draft agreements, manage transaction sessions, and represent users when execution is required.",
    href: "/agents",
    cta: "Meet the Agents",
  },
  {
    number: "3",
    title: "Library",
    subtitle: "What we learned",
    description: "A growing, signed knowledge base. Market reports, pricing behavior, transaction patterns, contract explanations. Not what to buy.",
    href: "/library",
    cta: "Browse Library",
  },
  {
    number: "4",
    title: "Smart Apps",
    subtitle: "Analysis into action",
    description: "Composable tools that turn analysis into action. Builders, deployable agents, and request desks. Each tool serves a single, clear purpose.",
    href: "/apps",
    cta: "Explore Apps",
  },
]

export function PillarsSection() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mb-16">
          <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Product</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-foreground leading-tight text-balance">
            Four pillars. One platform.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((pillar) => (
            <div
              key={pillar.number}
              className="group relative p-8 md:p-10 bg-card border border-border rounded-lg hover:border-accent/30 transition-colors duration-300"
            >
              <span className="text-6xl md:text-7xl font-serif text-border absolute top-6 right-8">{pillar.number}</span>
              <div className="relative">
                <p className="text-xs font-medium uppercase tracking-wider text-accent mb-2">{pillar.subtitle}</p>
                <h3 className="text-2xl md:text-3xl font-serif text-foreground mb-4">{pillar.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-md">{pillar.description}</p>
                <Link
                  href={pillar.href}
                  className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent transition-colors group/link"
                >
                  {pillar.cta}
                  <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
