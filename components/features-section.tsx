"use client"

import { useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  Search,
  TrendingUp,
  Calculator,
  MessageSquare,
  Layers,
  Import,
  BookOpen,
  Wrench,
} from "lucide-react"

const features = [
  {
    icon: TrendingUp,
    title: "Market views",
    description: "City trends, area behavior, project history, price ranges, and time-based shifts. Clear and comparative.",
  },
  {
    icon: Search,
    title: "Fast market search",
    description: "City, area, and project search with depth. Built for decisions, not endless browsing.",
  },
  {
    icon: Calculator,
    title: "Smart Math Tools",
    description: "Price range builders, yield calculators, rent vs own scenarios, stress testing. All results are explainable.",
  },
  {
    icon: MessageSquare,
    title: "Market desk",
    description: "Explain results, clarify assumptions, request deeper analysis, or call an agent. No selling or pushing.",
  },
  {
    icon: Layers,
    title: "Area comparisons",
    description: "Test assumptions side by side. Compare areas, projects, and price trajectories over time.",
  },
  {
    icon: Import,
    title: "Bring your own listings",
    description: "Bring your internal listings and align them with Entrestate market signals.",
  },
  {
    icon: BookOpen,
    title: "Contract Clarity",
    description: "Agents handle drafting. The platform provides structure, storage, and validation following Entrestate rules.",
  },
  {
    icon: Wrench,
    title: "Execution apps",
    description: "Builders, deployable agents, and request desks. Turn analysis into action through focused apps.",
  },
]

export function FeaturesSection() {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set())
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    itemRefs.current.forEach((ref, index) => {
      if (!ref) return
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleItems((prev) => new Set([...prev, index]))
            observer.disconnect()
          }
        },
        { threshold: 0.15 },
      )
      observer.observe(ref)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  return (
    <section id="platform" className="py-20 md:py-32 bg-card">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mb-16">
          <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Core capability</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-foreground leading-tight text-balance">
            Everything you need to understand a market
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
            Data, analysis, and execution tools built for real estate professionals who need clarity, not noise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              ref={(el) => { itemRefs.current[i] = el }}
              className={cn(
                "bg-background p-8 transition-all duration-700",
                visibleItems.has(i) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
              )}
              style={{ transitionDelay: `${(i % 4) * 80}ms` }}
            >
              <div className="p-2 bg-secondary rounded-md w-fit mb-4">
                <feature.icon className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="text-base font-medium text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
