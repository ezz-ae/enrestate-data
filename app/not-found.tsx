import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ArrowRight } from "lucide-react"

export default function NotFound() {
  return (
    <main id="main-content" className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center py-24 md:py-32">
        <div className="text-center px-6 max-w-xl mx-auto">
          <p className="text-8xl md:text-9xl font-serif text-border mb-8">404</p>
          <h1 className="text-2xl md:text-3xl font-serif text-foreground mb-4">Page not found</h1>
          <p className="text-muted-foreground mb-10">
            {"The page you're looking for doesn't exist or has been moved."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Back to Home
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/markets"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Explore Markets
            </Link>
          </div>

          <div className="mt-16">
            <p className="text-xs text-muted-foreground mb-4">Quick links:</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { label: "Markets", href: "/markets" },
                { label: "Library", href: "/library" },
                { label: "Workspace", href: "/workspace" },
                { label: "About", href: "/about" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-accent/30 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
