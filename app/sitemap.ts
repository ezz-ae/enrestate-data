import type { MetadataRoute } from "next"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://entrestate.com"

const routes = [
  "",
  "/markets",
  "/top-data",
  "/library",
  "/library/reports",
  "/library/insights",
  "/library/contracts-explained",
  "/workspace",
  "/agent-runtime",
  "/workspace/data-scientist",
  "/workspace/data-scientist/notebook",
  "/market-score",
  "/workspace/daas",
  "/workspace/agent-creator",
  "/apps",
  "/apps/agent-builder",
  "/apps/lead-agent",
  "/apps/coldcalling",
  "/apps/docs/storyboard-builder",
  "/apps/docs/launch-timeline",
  "/apps/docs/image-playground",
  "/apps/docs/agent-first-builder",
  "/apps/docs/cold-calling",
  "/apps/docs/insta-dm-lead-agent",
  "/agents",
  "/agents/sessions",
  "/agents/contracts",
  "/agents/onboarding",
  "/storyboard",
  "/image-playground",
  "/timeline",
  "/about",
  "/contact",
  "/support",
  "/status",
  "/roadmap",
  "/changelog",
  "/privacy",
  "/terms",
  "/account",
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
  }))
}
