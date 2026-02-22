'use client'

import { useState, useEffect, useTransition } from 'react'
import { Sparkles, Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  executeAIPrompt,
  fetchPromptsByCategory,
} from '@/app/admin/resume-builder/actions'
import type { AIPrompt } from '@/types/ai-prompts'

// Module-level cache so multiple AIAssistButtons with the same category
// share a single fetch instead of firing N identical requests.
const promptCache = new Map<string, Promise<AIPrompt[]>>()

function getCachedPrompts(category: string): Promise<AIPrompt[]> {
  if (!promptCache.has(category)) {
    promptCache.set(
      category,
      fetchPromptsByCategory(category).catch((err) => {
        promptCache.delete(category)
        throw err
      })
    )
  }
  return promptCache.get(category)!
}

interface AIAssistButtonProps {
  category: 'bullet' | 'summary' | 'description'
  currentText: string
  context: Record<string, string>
  resumeId: string
  onAccept: (newText: string) => void
}

export function AIAssistButton({
  category,
  currentText,
  context,
  resumeId,
  onAccept,
}: AIAssistButtonProps) {
  const [prompts, setPrompts] = useState<AIPrompt[]>([])
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    getCachedPrompts(category).then(setPrompts).catch(() => {})
  }, [category])

  function handleAction(slug: string) {
    if (!currentText.trim()) {
      toast.error('Enter some text first')
      return
    }

    setResult(null)
    startTransition(async () => {
      try {
        const text = await executeAIPrompt(
          slug,
          {
            bullet: currentText,
            text: currentText,
            name: context.name ?? '',
            job_title: context.job_title ?? '',
            company: context.company ?? '',
            context: context.context ?? '',
            experience_level: context.experience_level ?? '',
            skills: context.skills ?? '',
            titles: context.titles ?? '',
            companies: context.companies ?? '',
            length: String(currentText.length),
          },
          resumeId
        )
        setResult(text)
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'AI generation failed'
        )
      }
    })
  }

  function handleAccept() {
    if (result) {
      onAccept(result)
      setResult(null)
    }
  }

  function handleReject() {
    setResult(null)
  }

  if (prompts.length === 0) return null

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {prompts.map((p) => (
            <DropdownMenuItem
              key={p.slug}
              onClick={() => handleAction(p.slug)}
              disabled={isPending}
            >
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              {p.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Inline result preview */}
      {result && (
        <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 p-2 dark:border-blue-900 dark:bg-blue-950">
          <p className="text-xs text-blue-800 dark:text-blue-200">{result}</p>
          <div className="mt-1.5 flex gap-1.5">
            <Button
              variant="default"
              size="sm"
              className="h-6 px-2 text-[11px]"
              onClick={handleAccept}
            >
              <Check className="mr-1 h-3 w-3" />
              Accept
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px]"
              onClick={handleReject}
            >
              <X className="mr-1 h-3 w-3" />
              Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
