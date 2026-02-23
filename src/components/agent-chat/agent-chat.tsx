"use client"

import { useRef, useEffect, useState, type ReactNode } from "react"
import { useChat, type UIMessage } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { ArrowUp, Square, MessageSquare, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { MessageBubble } from "./message-bubble"
import { ToolCallCard } from "./tool-call-card"
import { MermaidBlock } from "./mermaid-block"
import { JsonPreview } from "./json-preview"

export interface AgentChatProps {
  /** API route endpoint (e.g., "/api/agents/coach") */
  apiEndpoint: string
  /** Additional body params sent with every request */
  body?: Record<string, unknown>
  /** Initial messages to restore a previous session (v6: passed as `messages`) */
  initialMessages?: UIMessage[]
  /** Callback when a tool call completes */
  onToolResult?: (toolName: string, result: unknown) => void
  /** Callback when messages change (for persistence) */
  onMessagesChange?: (messages: Array<{ role: string; content: string }>) => void
  /** Custom renderer for additional block types */
  renderCustomBlock?: (block: { type: string; data: unknown }) => ReactNode
  /** Placeholder text for the input */
  placeholder?: string
  /** Empty state message */
  emptyMessage?: string
  /** Custom icon for the empty state (defaults to MessageSquare) */
  emptyStateIcon?: LucideIcon
  className?: string
}

/** Detect and extract mermaid/json code blocks from text */
function extractBlocks(
  text: string,
): Array<{ type: "text" | "mermaid" | "json"; content: string }> {
  const blocks: Array<{ type: "text" | "mermaid" | "json"; content: string }> = []
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/g
  const jsonRegex = /```json\n([\s\S]*?)```/g

  let lastIndex = 0
  const allMatches: Array<{
    index: number
    end: number
    type: "mermaid" | "json"
    content: string
  }> = []

  let match: RegExpExecArray | null
  while ((match = mermaidRegex.exec(text)) !== null) {
    allMatches.push({
      index: match.index,
      end: match.index + match[0].length,
      type: "mermaid",
      content: match[1],
    })
  }
  while ((match = jsonRegex.exec(text)) !== null) {
    allMatches.push({
      index: match.index,
      end: match.index + match[0].length,
      type: "json",
      content: match[1],
    })
  }

  allMatches.sort((a, b) => a.index - b.index)

  for (const m of allMatches) {
    if (m.index > lastIndex) {
      blocks.push({ type: "text", content: text.slice(lastIndex, m.index) })
    }
    blocks.push({ type: m.type, content: m.content })
    lastIndex = m.end
  }

  if (lastIndex < text.length) {
    blocks.push({ type: "text", content: text.slice(lastIndex) })
  }

  return blocks.length > 0 ? blocks : [{ type: "text", content: text }]
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 150, 300].map((delay) => (
        <div
          key={delay}
          className="bg-muted-foreground/50 size-2 animate-bounce rounded-full"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  )
}

/** Check if a message part is a tool invocation (dynamic-tool in v6) */
function isToolPart(part: UIMessage["parts"][number]): part is UIMessage["parts"][number] & {
  type: "dynamic-tool"
  toolName: string
  state: string
  input?: unknown
  output?: unknown
  errorText?: string
} {
  return part.type === "dynamic-tool"
}

/** Map v6 tool states to our ToolCallCard states */
function mapToolState(state: string): "partial-call" | "call" | "result" {
  switch (state) {
    case "input-streaming":
      return "partial-call"
    case "input-available":
      return "call"
    case "output-available":
    case "output-error":
      return "result"
    default:
      return "call"
  }
}

export function AgentChat({
  apiEndpoint,
  body,
  initialMessages,
  onToolResult,
  onMessagesChange,
  renderCustomBlock,
  placeholder = "Type your message...",
  emptyMessage = "Start a conversation to begin.",
  emptyStateIcon: EmptyIcon = MessageSquare,
  className,
}: AgentChatProps) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, sendMessage, status, stop, error } = useChat({
    transport: new DefaultChatTransport({
      api: apiEndpoint,
      body,
    }),
    // v6: `initialMessages` was renamed to `messages`
    messages: initialMessages,
    onFinish: ({ message }) => {
      if (!onToolResult) return
      for (const part of message.parts) {
        if (isToolPart(part) && part.state === "output-available" && part.output !== undefined) {
          onToolResult(part.toolName, part.output)
        }
      }
    },
  })

  // Notify parent when messages change (for persistence)
  useEffect(() => {
    if (onMessagesChange && messages.length > 0) {
      const simplified = messages.map((m) => ({
        role: m.role,
        content: m.parts
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join(""),
      }))
      onMessagesChange(simplified)
    }
  }, [messages, onMessagesChange])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }, [messages, status])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const isLoading = status === "submitted" || status === "streaming"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input.trim() })
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 px-4">
        <div className="mx-auto max-w-3xl space-y-4 py-4">
          {messages.length === 0 && (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-muted/50 mb-4 rounded-full p-4">
                <EmptyIcon className="size-10 opacity-40" />
              </div>
              <p className="text-sm">{emptyMessage}</p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              {message.parts.map((part, index) => {
                // Text parts — extract mermaid/json blocks
                if (part.type === "text" && part.text) {
                  const blocks = extractBlocks(part.text)
                  return blocks.map((block, bi) => {
                    if (block.type === "mermaid") {
                      return <MermaidBlock key={`${index}-${bi}`} code={block.content} />
                    }
                    if (block.type === "json") {
                      try {
                        const parsed = JSON.parse(block.content)
                        return <JsonPreview key={`${index}-${bi}`} data={parsed} />
                      } catch {
                        // Fall through to text rendering
                      }
                    }
                    if (renderCustomBlock) {
                      const custom = renderCustomBlock({ type: block.type, data: block.content })
                      if (custom) return <div key={`${index}-${bi}`}>{custom}</div>
                    }
                    return (
                      <MessageBubble
                        key={`${index}-${bi}`}
                        role={message.role as "user" | "assistant"}
                        content={block.content.trim()}
                        timestamp={new Date().toISOString()}
                      />
                    )
                  })
                }

                // Dynamic tool parts (v6 pattern for server-defined tools)
                if (isToolPart(part)) {
                  return (
                    <ToolCallCard
                      key={`${index}-tool`}
                      toolName={part.toolName}
                      state={mapToolState(part.state)}
                      output={part.state === "output-available" ? part.output : undefined}
                    />
                  )
                }

                return null
              })}
            </div>
          ))}

          {status === "submitted" && <LoadingDots />}

          {error && (
            <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border px-4 py-3 text-sm">
              {error.message || "Something went wrong. Please try again."}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="bg-background px-4 pb-4 pt-2">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div
            className={cn(
              "bg-muted/30 relative rounded-2xl border transition-all",
              "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40",
            )}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              rows={1}
              className="w-full resize-none bg-transparent px-4 pt-3 pb-12 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
            />

            <div className="absolute right-3 bottom-3">
              {isLoading ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8 rounded-lg"
                      onClick={() => stop()}
                    >
                      <Square className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Stop generating</TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      size="icon"
                      className="size-8 rounded-lg"
                      disabled={!input.trim()}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Send message (Enter)</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
