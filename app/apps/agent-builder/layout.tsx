import type React from "react"
import { Space_Grotesk, Fraunces, JetBrains_Mono } from "next/font/google"
import "./builder.css"

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space", weight: ["400", "500", "600", "700"] })
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", weight: ["400", "500", "600", "700"] })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" })

export default function AgentBuilderLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className={`agent-builder-scope ${spaceGrotesk.variable} ${fraunces.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
      {children}
    </div>
  )
}
