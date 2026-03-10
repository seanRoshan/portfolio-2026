"use client"

import { useState, useMemo } from "react"
import { Check, ChevronDown, ChevronRight, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface JsonPreviewProps {
  data: unknown
  title?: string
  className?: string
}

function JsonNode({ value, depth = 0 }: { value: unknown; depth?: number }) {
  const [collapsed, setCollapsed] = useState(depth > 2)

  if (value === null) return <span className="text-orange-400">null</span>
  if (value === undefined) return <span className="text-muted-foreground">undefined</span>
  if (typeof value === "boolean") return <span className="text-purple-400">{String(value)}</span>
  if (typeof value === "number") return <span className="text-cyan-400">{value}</span>
  if (typeof value === "string") {
    if (value.length > 120) {
      return <span className="text-green-400">&quot;{value.slice(0, 120)}...&quot;</span>
    }
    return <span className="text-green-400">&quot;{value}&quot;</span>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">[]</span>

    return (
      <span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:text-foreground inline-flex items-center"
        >
          {collapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
          <span className="text-xs">[{value.length}]</span>
        </button>
        {!collapsed && (
          <div className="border-muted ml-4 border-l pl-2">
            {value.map((item, i) => (
              <div key={i} className="py-0.5">
                <JsonNode value={item} depth={depth + 1} />
                {i < value.length - 1 && <span className="text-muted-foreground">,</span>}
              </div>
            ))}
          </div>
        )}
      </span>
    )
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return <span className="text-muted-foreground">{"{}"}</span>

    return (
      <span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:text-foreground inline-flex items-center"
        >
          {collapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
          <span className="text-xs">{`{${entries.length}}`}</span>
        </button>
        {!collapsed && (
          <div className="border-muted ml-4 border-l pl-2">
            {entries.map(([key, val], i) => (
              <div key={key} className="py-0.5">
                <span className="text-blue-400">&quot;{key}&quot;</span>
                <span className="text-muted-foreground">: </span>
                <JsonNode value={val} depth={depth + 1} />
                {i < entries.length - 1 && <span className="text-muted-foreground">,</span>}
              </div>
            ))}
          </div>
        )}
      </span>
    )
  }

  return <span>{String(value)}</span>
}

export function JsonPreview({ data, title, className }: JsonPreviewProps) {
  const [copied, setCopied] = useState(false)
  const jsonString = useMemo(() => JSON.stringify(data, null, 2), [data])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      <div className="bg-muted/50 flex items-center justify-between border-b px-3 py-1.5">
        <span className="text-muted-foreground text-xs font-medium">{title ?? "JSON Output"}</span>
        <Button variant="ghost" size="icon" className="size-6" onClick={handleCopy}>
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        </Button>
      </div>
      <div className="max-h-[500px] overflow-auto p-4 font-mono text-xs leading-relaxed">
        <JsonNode value={data} />
      </div>
    </div>
  )
}
