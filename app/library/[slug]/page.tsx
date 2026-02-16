import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, ArrowRight } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getLibraryArticle } from "@/lib/library-data"
import { ReadingControls } from "@/components/reading-controls"
import { ExplainWithChat } from "@/components/explain-with-chat"

export default async function LibraryArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getLibraryArticle(slug)

  if (!article) {
    notFound()
  }

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="container mx-auto px-6">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </Link>

          <div className="max-w-3xl reading-container">
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
              <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
                {article.tag}
              </span>
              <span>{article.date}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {article.readTime}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance mb-6">
              {article.title}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-10">
              {article.description}
            </p>

            <div className="rounded-2xl border border-border/70 bg-card/60 p-5 mb-8">
              <ReadingControls />
              <div className="mt-3 flex flex-wrap gap-2">
                <ExplainWithChat prompt={`Explain the report "${article.title}" and the key takeaways.`} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Use Reading mode for calmer spacing. Switch Day/Night for eye comfort.
              </p>
            </div>

            <div className="prose dark:prose-invert max-w-none reading-copy">
              {article.content.split("\n\n").map((block) => (
                <p key={block} className="text-base text-foreground/90 leading-relaxed">
                  {block}
                </p>
              ))}
            </div>

            <div className="mt-12">
              <Link
                href="/workspace"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Open Workspace
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
