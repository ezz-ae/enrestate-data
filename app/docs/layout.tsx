import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Guides - Entrestate",
  description:
    "Market data guide for Entrestate. Learn how to access the live feed, understand fields, and use coverage safely.",
  openGraph: {
    title: "Guides - Entrestate",
    description: "Market data guide for Entrestate. Access the live feed and understand coverage.",
  },
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
