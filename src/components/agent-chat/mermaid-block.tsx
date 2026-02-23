"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Code, Copy, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MermaidBlockProps {
  code: string
  className?: string
}

export function MermaidBlock({ code, className }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showRaw, setShowRaw] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function render() {
      if (!containerRef.current || showRaw) return

      try {
        // Dynamic import to avoid SSR issues
        const mermaid = (await import("mermaid")).default
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "loose",
        })

        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const { svg } = await mermaid.render(id, code.trim())

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg
          setRendered(true)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to render diagram")
          setShowRaw(true)
        }
      }
    }

    render()
    return () => {
      cancelled = true
    }
  }, [code, showRaw])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("my-3 overflow-hidden rounded-lg border", className)}>
      <div className="bg-muted/50 flex items-center justify-between border-b px-3 py-1.5">
        <span className="text-muted-foreground text-xs font-medium">Mermaid Diagram</span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => setShowRaw(!showRaw)}
          >
            <Code className="size-3" />
          </Button>
          <Button variant="ghost" size="icon" className="size-6" onClick={handleCopy}>
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/5 text-destructive flex items-center gap-2 border-b px-3 py-2 text-xs">
          <AlertCircle className="size-3" />
          {error}
        </div>
      )}

      {showRaw ? (
        <pre className="overflow-x-auto p-4 text-xs">
          <code>{code}</code>
        </pre>
      ) : (
        <div ref={containerRef} className="flex justify-center overflow-x-auto p-4">
          {!rendered && !error && (
            <div className="text-muted-foreground text-sm">Rendering diagram...</div>
          )}
        </div>
      )}
    </div>
  )
}
