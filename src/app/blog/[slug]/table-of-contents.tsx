"use client"

import { useState, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"

interface Heading {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: string
}

function parseHeadings(html: string): Heading[] {
  const headings: Heading[] = []
  const regex = /<(h[23])[^>]*>(.*?)<\/\1>/gi
  let result = regex.exec(html)
  while (result !== null) {
    const level = parseInt(result[1][1])
    const text = result[2].replace(/<[^>]*>/g, "")
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
    headings.push({ id, text, level })
    result = regex.exec(html)
  }
  return headings
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const headings = useMemo(() => parseHeadings(content), [content])
  const [activeId, setActiveId] = useState("")

  useEffect(() => {
    if (headings.length === 0) return

    // Add IDs to actual heading elements in the DOM
    const article = document.querySelector("article")
    if (article) {
      article.querySelectorAll("h2, h3").forEach((el) => {
        const text = el.textContent ?? ""
        const id = text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
        el.id = id
      })
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px" },
    )

    headings.forEach((h) => {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <div className="sticky top-24">
      <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
        On this page
      </p>
      <nav className="space-y-1">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            onClick={(e) => {
              e.preventDefault()
              document.getElementById(heading.id)?.scrollIntoView({ behavior: "smooth" })
            }}
            className={cn(
              "hover:text-foreground block text-sm transition-colors",
              heading.level === 3 && "pl-3",
              activeId === heading.id ? "text-primary font-medium" : "text-muted-foreground",
            )}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </div>
  )
}
