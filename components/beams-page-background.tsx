"use client"

import { usePathname } from "next/navigation"
import BeamsBackground from "@/components/kokonutui/beams-background"

const marketingRoutes = ["/agents", "/storyboard", "/timeline", "/image-playground", "/demo"]

export function BeamsPageBackground() {
  const pathname = usePathname()

  const isMarketing = marketingRoutes.some((route) => pathname.startsWith(route))
  const isAgentBuilder =
    pathname.startsWith("/apps/agent-builder") || pathname.startsWith("/workspace/agent-creator")

  if (isAgentBuilder) {
    return null
  }

  return (
    <BeamsBackground
      intensity={isMarketing ? "subtle" : "medium"}
      className={isMarketing ? "opacity-80" : undefined}
    />
  )
}
