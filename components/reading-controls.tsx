"use client"

import { useEffect, useState } from "react"
import { BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "entrestate.reading.mode"

export function ReadingControls({ className }: { className?: string }) {
  const [readingMode, setReadingMode] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === "on") {
      setReadingMode(true)
      document.documentElement.dataset.reading = "on"
    }
  }, [])

  useEffect(() => {
    if (typeof document === "undefined") return
    document.documentElement.dataset.reading = readingMode ? "on" : "off"
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, readingMode ? "on" : "off")
    }
  }, [readingMode])

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BookOpen className="h-4 w-4 text-accent" />
        Reading comfort
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={readingMode ? "default" : "outline"}
          size="sm"
          onClick={() => setReadingMode((prev) => !prev)}
        >
          {readingMode ? "Reading mode on" : "Reading mode"}
        </Button>
        <ThemeSwitcher />
      </div>
    </div>
  )
}
