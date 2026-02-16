import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Market Score - Entrestate",
  description:
    "Validate rule-based market scores, matching rules, and asset safety bands with real-time data.",
}

export default function MarketScoreLayout({ children }: { children: React.ReactNode }) {
  return children
}
