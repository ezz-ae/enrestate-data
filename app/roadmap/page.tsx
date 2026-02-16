import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

const roadmap = [
  {
    title: "Now",
    focus: "Operational clarity",
    items: [
      "Decision Infrastructure language normalization",
      "Media Creator script library",
      "Workspace data ingestion for bulk feeds",
    ],
  },
  {
    title: "Next",
    focus: "Decision surface automation",
    items: [
      "Occalizer pressure controls in campaign views",
      "Lead Direction scoring with Fairness %",
      "Scenario Management templates in workspace",
    ],
  },
  {
    title: "Later",
    focus: "Full Decision Zipper Layer",
    items: [
      "Semantic inventory kernel with 5-layer model",
      "Scenario recommendations engine",
      "Multi-tenant governance for brokerage groups",
    ],
  },
]

export default function RoadmapPage() {
  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Roadmap</p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
              What we are building next
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Each phase tightens control, increases signal quality, and protects capital.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roadmap.map((phase) => (
              <div key={phase.title} className="p-6 bg-card border border-border rounded-lg">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{phase.title}</p>
                <h2 className="text-lg font-medium text-foreground mt-2">{phase.focus}</h2>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground list-disc pl-5">
                  {phase.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
