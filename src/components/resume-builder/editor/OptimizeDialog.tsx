'use client'

import { useState, useMemo, useTransition } from 'react'
import {
  Sparkles,
  AlertTriangle,
  Check,
  X,
  Loader2,
  SkipForward,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  executeAIPrompt,
  updateAchievementText,
  updateSummaryText,
} from '@/app/admin/resume-builder/actions'
import type { ResumeWithRelations } from '@/types/resume-builder'

interface FixableItem {
  id: string
  type: 'weak_verb' | 'missing_metric' | 'buzzword' | 'missing_summary'
  text: string
  label: string
  section: string
  slug: string
  variables: Record<string, string>
  /** Callback to save the fix */
  save: (newText: string) => Promise<void>
}

interface OptimizeDialogProps {
  resume: ResumeWithRelations
}

export function OptimizeDialog({ resume }: OptimizeDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          Optimize
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Optimize Resume
          </DialogTitle>
        </DialogHeader>
        {open && <OptimizeContent resume={resume} />}
      </DialogContent>
    </Dialog>
  )
}

function OptimizeContent({ resume }: { resume: ResumeWithRelations }) {
  const fixableItems = useMemo(() => buildFixableItems(resume), [resume])
  const [fixedCount, setFixedCount] = useState(0)
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set())

  const remaining = fixableItems.filter(
    (item) => !skippedIds.has(item.id)
  )

  const currentItem = remaining[0] ?? null

  function handleFixed() {
    setFixedCount((c) => c + 1)
    // Mark this item as handled by adding to skipped
    if (currentItem) {
      setSkippedIds((prev) => new Set(prev).add(currentItem.id))
    }
  }

  function handleSkip() {
    if (currentItem) {
      setSkippedIds((prev) => new Set(prev).add(currentItem.id))
    }
  }

  const total = fixableItems.length

  if (total === 0) {
    return (
      <div className="py-8 text-center">
        <Check className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
        <p className="text-sm font-medium">No fixable issues found</p>
        <p className="text-muted-foreground text-xs">
          Your resume is looking good.
        </p>
      </div>
    )
  }

  if (!currentItem) {
    return (
      <div className="py-8 text-center">
        <Check className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
        <p className="text-sm font-medium">
          Done — fixed {fixedCount} of {total} items
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">
          {fixedCount + skippedIds.size} / {total} reviewed
        </Badge>
        <span className="text-muted-foreground text-xs">
          {fixedCount} fixed
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1.5 w-full rounded-full bg-muted">
        <div
          className="h-1.5 rounded-full bg-emerald-500 transition-all"
          style={{
            width: `${((fixedCount + skippedIds.size) / total) * 100}%`,
          }}
        />
      </div>

      <FixItemCard
        item={currentItem}
        onFixed={handleFixed}
        onSkip={handleSkip}
      />
    </div>
  )
}

function FixItemCard({
  item,
  onFixed,
  onSkip,
}: {
  item: FixableItem
  onFixed: () => void
  onSkip: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)

  function handleGenerate() {
    setResult(null)
    startTransition(async () => {
      try {
        const text = await executeAIPrompt(item.slug, item.variables)
        setResult(text)
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'AI generation failed'
        )
      }
    })
  }

  function handleAccept() {
    if (!result) return
    startTransition(async () => {
      try {
        await item.save(result)
        toast.success('Fixed')
        setResult(null)
        onFixed()
      } catch {
        toast.error('Failed to save')
      }
    })
  }

  function handleSkip() {
    setResult(null)
    onSkip()
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium">{item.label}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Section: {item.section}
          </p>
        </div>
      </div>

      {/* Current text */}
      <div className="mb-3 rounded-md bg-muted p-2">
        <p className="text-muted-foreground text-[10px] font-medium uppercase">
          Current
        </p>
        <p className="mt-0.5 text-xs">{item.text}</p>
      </div>

      {/* AI Result */}
      {result && (
        <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 p-2 dark:border-blue-900 dark:bg-blue-950">
          <p className="text-[10px] font-medium uppercase text-blue-600">
            Suggested
          </p>
          <p className="mt-0.5 text-xs text-blue-800 dark:text-blue-200">
            {result}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {!result ? (
          <>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleGenerate}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="mr-1 h-3 w-3" />
              )}
              Fix with AI
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleSkip}
            >
              <SkipForward className="mr-1 h-3 w-3" />
              Skip
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleAccept}
              disabled={isPending}
            >
              <Check className="mr-1 h-3 w-3" />
              Accept
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleSkip}
            >
              <X className="mr-1 h-3 w-3" />
              Skip
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Build the list of fixable items from validation + scoring.
 */
function buildFixableItems(resume: ResumeWithRelations): FixableItem[] {
  const items: FixableItem[] = []

  // Weak verb bullets
  const allExps = resume.work_experiences ?? []
  for (const exp of allExps) {
    for (const ach of exp.achievements ?? []) {
      const firstWord = ach.text
        .trim()
        .split(/\s+/)[0]
        ?.toLowerCase()
        .replace(/[^a-z]/g, '')
      const weakVerbs = new Set([
        'was', 'did', 'used', 'worked', 'helped', 'made', 'got',
        'went', 'had', 'been', 'responsible', 'participated',
      ])
      if (firstWord && weakVerbs.has(firstWord)) {
        items.push({
          id: `weak-${ach.id}`,
          type: 'weak_verb',
          text: ach.text,
          label: `Weak verb "${firstWord}" — replace with a strong action verb`,
          section: 'Experience',
          slug: 'bullet_fix_verb',
          variables: {
            bullet: ach.text,
            job_title: exp.job_title,
            company: exp.company,
          },
          save: (newText: string) =>
            updateAchievementText(ach.id, newText, resume.id),
        })
      }
    }
  }

  // Missing metrics bullets
  for (const exp of allExps) {
    for (const ach of exp.achievements ?? []) {
      if (!/\d/.test(ach.text) && ach.text.length > 10) {
        // Skip if already listed as weak verb
        if (items.some((i) => i.id === `weak-${ach.id}`)) continue
        items.push({
          id: `metric-${ach.id}`,
          type: 'missing_metric',
          text: ach.text,
          label: 'Missing quantifiable metrics — add numbers for impact',
          section: 'Experience',
          slug: 'bullet_add_metrics',
          variables: {
            bullet: ach.text,
            job_title: exp.job_title,
            company: exp.company,
          },
          save: (newText: string) =>
            updateAchievementText(ach.id, newText, resume.id),
        })
      }
    }
  }

  // Project bullets with missing metrics
  for (const proj of resume.projects ?? []) {
    for (const ach of proj.achievements ?? []) {
      if (!/\d/.test(ach.text) && ach.text.length > 10) {
        items.push({
          id: `metric-proj-${ach.id}`,
          type: 'missing_metric',
          text: ach.text,
          label: 'Missing quantifiable metrics',
          section: 'Projects',
          slug: 'bullet_add_metrics',
          variables: {
            bullet: ach.text,
            job_title: proj.name,
            company: '',
          },
          save: (newText: string) =>
            updateAchievementText(ach.id, newText, resume.id),
        })
      }
    }
  }

  // Missing summary
  if (!resume.summary?.text || resume.summary.text.length < 20) {
    items.push({
      id: 'missing-summary',
      type: 'missing_summary',
      text: resume.summary?.text || '(empty)',
      label: 'Professional summary is missing or too short',
      section: 'Summary',
      slug: 'summary_generate',
      variables: {
        name: resume.contact_info?.full_name ?? '',
        experience_level: resume.experience_level ?? 'mid',
        skills: resume.skill_categories
          .flatMap((c) => c.skills)
          .slice(0, 10)
          .join(', '),
        titles: resume.work_experiences
          .map((e) => e.job_title)
          .slice(0, 3)
          .join(', '),
        companies: resume.work_experiences
          .map((e) => e.company)
          .slice(0, 3)
          .join(', '),
        context: '',
      },
      save: (newText: string) => updateSummaryText(resume.id, newText),
    })
  }

  return items
}
