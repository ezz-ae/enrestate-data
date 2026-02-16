import { Search, BarChart3, Users, FileCheck } from "lucide-react"

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Explore the market",
    description: "Search cities, areas, and projects. Understand price behavior and historical shifts through market views.",
  },
  {
    icon: BarChart3,
    step: "02",
    title: "Analyze and compare",
    description: "Use math tools, scenario comparisons, and saved searches to test assumptions and build conviction.",
  },
  {
    icon: Users,
    step: "03",
    title: "Request an agent",
    description: "When you are ready to act, request a verified agent who drafts contracts and manages sessions on your behalf.",
  },
  {
    icon: FileCheck,
    step: "04",
    title: "Execute through professionals",
    description: "Agents operate contracts following Entrestate rules. Identity is handled privately and lawfully.",
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-20 md:py-32 bg-card">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mb-16">
          <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Process</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-foreground leading-tight text-balance">
            From analysis to execution
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Users study. Agents execute. The platform connects the two with structure and transparency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, i) => (
            <div key={item.step} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-border -translate-x-4 z-0" />
              )}
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-secondary rounded-md">
                    <item.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{item.step}</span>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
