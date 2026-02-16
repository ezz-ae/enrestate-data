import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { PillarsSection } from "@/components/pillars-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { CtaSection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Entrestate - Decision Infrastructure for Real Estate",
  description:
    "Study markets, build briefings, and run execution apps in one real estate decision platform.",
}

export default function Home() {
  return (
    <main id="main-content">
      <Navbar />
      <HeroSection />
      <PillarsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaSection />
      <Footer />
    </main>
  )
}
