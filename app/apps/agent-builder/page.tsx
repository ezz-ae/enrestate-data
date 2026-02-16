import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import AgentBuilderApp from "@/agent-builder/agent-builder-app"

export const metadata: Metadata = {
  title: "Agent-First Builder - Entrestate",
  description:
    "Build real estate agents with a guided wizard, clear rules, and business-first outputs.",
}

export default function AgentBuilderPage() {
  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-24">
        <AgentBuilderApp />
      </div>
    </main>
  )
}
