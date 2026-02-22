'use client'

import { useMemo } from 'react'
import { AlertCircle, AlertTriangle, ChevronRight, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { validateResume } from '@/lib/resume-builder/validation/rules'
import { scoreResume } from '@/lib/resume-builder/ai/services'
import type { ResumeWithRelations } from '@/types/resume-builder'

function scoreColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

function scoreTextColor(score: number): string {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-600'
}

function scrollToSection(sectionId: string) {
  const el = document.getElementById(sectionId)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

interface ScorePanelProps {
  resume: ResumeWithRelations
}

export function ScorePanel({ resume }: ScorePanelProps) {
  const score = useMemo(() => scoreResume(resume), [resume])
  const validationResults = useMemo(() => validateResume(resume), [resume])

  const criticalCount = validationResults.filter(
    (r) => r.severity === 'critical'
  ).length
  const warningCount = validationResults.filter(
    (r) => r.severity === 'warning'
  ).length

  const gradeVariant =
    score.grade === 'A' || score.grade === 'B' ? 'secondary' : 'destructive'

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="View resume score and issues"
          className="flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-accent"
        >
          {criticalCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {criticalCount} critical
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {warningCount} warnings
            </Badge>
          )}
          <Badge variant={gradeVariant} className="text-xs">
            {score.grade} &middot; {score.overall}
          </Badge>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96 p-0">
        <ScrollArea className="max-h-[70vh]">
          <div className="p-4">
            {/* Score Dimensions */}
            <h4 className="mb-3 text-sm font-semibold">Score Breakdown</h4>
            <div className="space-y-3">
              {score.dimensions.map((dim) => (
                <div key={dim.name}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium">{dim.name}</span>
                    <span
                      className={`text-xs font-semibold ${scoreTextColor(dim.score)}`}
                    >
                      {dim.score}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div
                      className={`h-1.5 rounded-full transition-all ${scoreColor(dim.score)}`}
                      style={{ width: `${Math.min(dim.score, 100)}%` }}
                    />
                  </div>
                  {dim.suggestions[0] && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {dim.suggestions[0]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Issues */}
            {(criticalCount > 0 || warningCount > 0) && (
              <>
                <Separator className="my-4" />
                <h4 className="mb-3 text-sm font-semibold">Issues</h4>
                <div className="space-y-2">
                  {validationResults
                    .filter((r) => r.severity === 'critical')
                    .map((r, i) => (
                      <div
                        key={`c-${i}`}
                        className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2 dark:border-red-900 dark:bg-red-950"
                      >
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-red-800 dark:text-red-200">
                            {r.message}
                          </p>
                          {r.suggestion && (
                            <p className="mt-0.5 text-[11px] text-red-600 dark:text-red-400">
                              {r.suggestion}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 shrink-0 px-2 text-[11px]"
                          onClick={() => scrollToSection(r.section)}
                        >
                          Go to
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  {validationResults
                    .filter((r) => r.severity === 'warning')
                    .map((r, i) => (
                      <div
                        key={`w-${i}`}
                        className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 dark:border-amber-900 dark:bg-amber-950"
                      >
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                            {r.message}
                          </p>
                          {r.suggestion && (
                            <p className="mt-0.5 text-[11px] text-amber-600 dark:text-amber-400">
                              {r.suggestion}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 shrink-0 px-2 text-[11px]"
                          onClick={() => scrollToSection(r.section)}
                        >
                          Go to
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
