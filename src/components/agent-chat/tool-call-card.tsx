"use client"

import { Check, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToolCallCardProps {
  toolName: string
  state: "partial-call" | "call" | "result"
  output?: unknown
  className?: string
}

const TOOL_LABELS: Record<string, string> = {
  save_work_experience: "Saving work experience",
  save_project: "Saving project",
  save_skill_category: "Saving skills",
  update_summary: "Updating summary",
  analyze_jd: "Analyzing job description",
  generate_tailored_bullets: "Generating tailored bullets",
  generate_full_resume: "Generating full resume",
}

function getToolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] ?? toolName.replace(/_/g, " ")
}

export function ToolCallCard({ toolName, state, output, className }: ToolCallCardProps) {
  const label = getToolLabel(toolName)
  const isLoading = state === "partial-call" || state === "call"
  const isSuccess = state === "result" && output !== undefined
  const isError = state === "result" && output === undefined

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm",
        isLoading && "border-blue-500/30 bg-blue-500/5",
        isSuccess && "border-green-500/30 bg-green-500/5",
        isError && "border-destructive/30 bg-destructive/5",
        className,
      )}
    >
      {isLoading && <Loader2 className="size-4 animate-spin text-blue-500" />}
      {isSuccess && <Check className="size-4 text-green-500" />}
      {isError && <AlertCircle className="text-destructive size-4" />}

      <span
        className={cn(
          isLoading && "text-blue-500",
          isSuccess && "text-green-500",
          isError && "text-destructive",
        )}
      >
        {isLoading ? `${label}...` : isError ? `Failed: ${label}` : label}
      </span>
    </div>
  )
}
