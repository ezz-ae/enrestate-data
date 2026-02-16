import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function CtaSection() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-6">
        <div className="relative bg-primary rounded-lg p-12 md:p-20 overflow-hidden">
          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-5" aria-hidden="true">
            <div className="absolute inset-0" style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }} />
          </div>

          <div className="relative max-w-2xl">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-primary-foreground leading-tight text-balance">
              Understand real estate clearly. Act through professionals.
            </h2>
            <p className="mt-6 text-base text-primary-foreground/70 leading-relaxed max-w-lg">
              No selling. No listing. No pushing outcomes. Just market clarity and professional execution.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="flex items-center gap-2 px-6 py-3 text-sm font-medium bg-primary-foreground text-primary rounded-md hover:bg-primary-foreground/90 transition-colors"
              >
                Request Access
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/markets"
                className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Explore markets first
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
