"use client"

import { useEffect, useRef } from "react"
import DOMPurify from "dompurify"

interface BlogRendererProps {
  content: string
}

export function BlogRenderer({ content }: BlogRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current

    // Sanitize HTML with DOMPurify before rendering (XSS protection)
    const sanitized = DOMPurify.sanitize(content, {
      ADD_TAGS: ["iframe"],
      ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "loading", "srcdoc"],
    })
    // Safe: content is sanitized by DOMPurify above
    el.innerHTML = sanitized

    // Post-process: external links
    el.querySelectorAll("a").forEach((a) => {
      if (a.hostname && a.hostname !== window.location.hostname) {
        a.setAttribute("target", "_blank")
        a.setAttribute("rel", "noopener noreferrer")
      }
    })

    // Post-process: YouTube iframes — add lazy loading
    el.querySelectorAll("iframe").forEach((iframe) => {
      iframe.setAttribute("loading", "lazy")
      const parent = iframe.parentElement
      if (parent && !parent.classList.contains("aspect-video")) {
        const wrapper = document.createElement("div")
        wrapper.className = "aspect-video w-full overflow-hidden rounded-lg my-6"
        parent.insertBefore(wrapper, iframe)
        wrapper.appendChild(iframe)
        iframe.className = "h-full w-full"
      }
    })

    // Post-process: images — lazy load
    el.querySelectorAll("img").forEach((img) => {
      img.classList.add("rounded-lg", "max-w-full")
      img.setAttribute("loading", "lazy")
    })
  }, [content])

  return (
    <div
      ref={containerRef}
      className="prose prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-primary prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-pre:bg-muted prose-img:rounded-lg"
    />
  )
}
