"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  role: "user" | "assistant"
  content: string
  timestamp?: string
  className?: string
}

/** Render inline markdown: **bold**, `code`, and line breaks */
function renderMarkdown(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    if (line.trim() === "") return <br key={i} />

    // Split on bold (**text**) and inline code (`code`)
    const parts = line.split(/(\*\*.*?\*\*|`[^`]+`)/g)
    const rendered = parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j}>{part.slice(2, -2)}</strong>
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={j} className="bg-muted rounded px-1 py-0.5 text-sm">
            {part.slice(1, -1)}
          </code>
        )
      }
      return part
    })

    return (
      <p key={i} className="mb-1 last:mb-0">
        {rendered}
      </p>
    )
  })
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return ""
  }
}

export function MessageBubble({ role, content, timestamp, className }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = role === "user"

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("group flex", isUser ? "justify-end" : "justify-start", className)}>
      <div
        className={cn(
          "relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        <div className="whitespace-pre-wrap">{renderMarkdown(content)}</div>

        <div className="mt-1.5 flex items-center justify-between gap-2">
          {timestamp && (
            <span
              className={cn(
                "text-xs",
                isUser ? "text-primary-foreground/60" : "text-muted-foreground",
              )}
            >
              {formatTimestamp(timestamp)}
            </span>
          )}

          {!isUser && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={handleCopy}
            >
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
