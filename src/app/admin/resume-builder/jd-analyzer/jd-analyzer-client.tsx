'use client'

import { useState, useTransition } from 'react'
import {
  Search,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Target,
  BarChart3,
  Sparkles,
  Save,
  Trash2,
  Briefcase,
  GraduationCap,
  ListChecks,
  ArrowRight,
  Loader2,
  Building2,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { saveJobDescription, deleteJobDescription } from './actions'
import type { JobDescription, Resume, JDMatchResult } from '@/types/resume-builder'

interface JDAnalysis {
  skills: string[]
  requirements: string[]
  qualifications: string[]
  experienceLevel: string
  redFlags: string[]
  summary: string
}

interface JDAnalyzerClientProps {
  savedAnalyses: JobDescription[]
  resumes: Resume[]
  initialAnalysis?: JobDescription | null
}

export function JDAnalyzerClient({
  savedAnalyses,
  resumes,
  initialAnalysis,
}: JDAnalyzerClientProps) {
  const [rawText, setRawText] = useState(initialAnalysis?.raw_text ?? '')
  const [title, setTitle] = useState(initialAnalysis?.title ?? '')
  const [company, setCompany] = useState(initialAnalysis?.company ?? '')
  const [analysis, setAnalysis] = useState<JDAnalysis | null>(
    () => buildAnalysisFromJD(initialAnalysis)
  )
  const [matchResult, setMatchResult] = useState<JDMatchResult | null>(null)
  const [selectedResumeId, setSelectedResumeId] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isMatching, setIsMatching] = useState(false)
  const [isSaved, setIsSaved] = useState(!!initialAnalysis)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(
    initialAnalysis?.id ?? null
  )

  async function handleAnalyze() {
    if (!rawText.trim()) {
      toast.error('Please paste a job description first')
      return
    }

    setIsAnalyzing(true)
    setAnalysis(null)
    setMatchResult(null)
    setIsSaved(false)
    setActiveAnalysisId(null)

    try {
      const res = await fetch('/api/resume-builder/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze-jd', text: rawText }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Analysis failed')
      }

      const data = await res.json()
      setAnalysis(data)
      toast.success('Job description analyzed')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to analyze job description'
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function handleMatch() {
    if (!selectedResumeId) {
      toast.error('Please select a resume first')
      return
    }
    if (!rawText.trim()) {
      toast.error('No job description to match against')
      return
    }

    setIsMatching(true)
    setMatchResult(null)

    try {
      const res = await fetch('/api/resume-builder/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'match-jd',
          resumeId: selectedResumeId,
          jobDescription: rawText,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Matching failed')
      }

      const data: JDMatchResult = await res.json()
      setMatchResult(data)
      toast.success('Resume matched against job description')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to match resume'
      )
    } finally {
      setIsMatching(false)
    }
  }

  function handleSave() {
    if (!analysis) return

    const resolvedTitle = title.trim() || extractTitle(rawText)
    const resolvedCompany = company.trim() || extractCompany(rawText)

    startTransition(async () => {
      try {
        await saveJobDescription({
          title: resolvedTitle,
          company: resolvedCompany,
          raw_text: rawText,
          extracted_skills: analysis.skills,
          extracted_requirements: analysis.requirements,
          extracted_qualifications: analysis.qualifications,
          analysis: analysis as unknown as Record<string, unknown>,
        })
        setIsSaved(true)
        toast.success('Analysis saved')
      } catch {
        toast.error('Failed to save analysis')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteJobDescription(id)
        setShowDeleteConfirm(null)
        if (activeAnalysisId === id) {
          setAnalysis(null)
          setMatchResult(null)
          setRawText('')
          setActiveAnalysisId(null)
          setIsSaved(false)
        }
        toast.success('Analysis deleted')
      } catch {
        toast.error('Failed to delete analysis')
      }
    })
  }

  function loadSavedAnalysis(jd: JobDescription) {
    setRawText(jd.raw_text)
    setTitle(jd.title)
    setCompany(jd.company ?? '')
    setActiveAnalysisId(jd.id)
    setIsSaved(true)
    setMatchResult(null)
    setAnalysis(buildAnalysisFromJD(jd))
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Get all skills from the selected resume for comparison
  const selectedResume = resumes.find((r) => r.id === selectedResumeId)

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">JD Analyzer</h2>
        <p className="text-muted-foreground text-sm">
          Paste a job description to extract skills, requirements, and match against
          your resumes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Panel: Input + Saved Analyses */}
        <div className="lg:col-span-2 space-y-6">
          {/* JD Input */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Job Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="jd-title">Title</Label>
                  <Input
                    id="jd-title"
                    placeholder="e.g., Senior Software Engineer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="jd-company">Company</Label>
                  <Input
                    id="jd-company"
                    placeholder="e.g., Google"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="jd-text">Job Description Text</Label>
                <Textarea
                  id="jd-text"
                  placeholder="Paste a job description here..."
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value)
                    if (isSaved) setIsSaved(false)
                  }}
                  rows={12}
                  className="resize-none font-mono text-sm"
                />
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !rawText.trim()}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Saved Analyses */}
          {savedAnalyses.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Search className="h-4 w-4" />
                  Saved Analyses
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {savedAnalyses.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[400px]">
                  <div className="divide-y">
                    {savedAnalyses.map((jd) => (
                      <div
                        key={jd.id}
                        className={cn(
                          'flex items-start justify-between gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50',
                          activeAnalysisId === jd.id && 'bg-muted/50'
                        )}
                        onClick={() => loadSavedAnalysis(jd)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {jd.title}
                          </p>
                          <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs mt-0.5">
                            {jd.company && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {jd.company}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(jd.created_at)}
                            </span>
                            {jd.extracted_skills && jd.extracted_skills.length > 0 && (
                              <span>
                                {jd.extracted_skills.length} skill{jd.extracted_skills.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowDeleteConfirm(jd.id)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel: Results */}
        <div className="lg:col-span-3 space-y-6">
          {isAnalyzing && <AnalysisSkeleton />}

          {!isAnalyzing && !analysis && (
            <Card className="flex flex-col items-center justify-center py-20">
              <Target className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">No Analysis Yet</h3>
              <p className="text-muted-foreground text-sm text-center max-w-sm">
                Paste a job description on the left and click Analyze to extract
                skills, requirements, and more.
              </p>
            </Card>
          )}

          {!isAnalyzing && analysis && (
            <>
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={isPending || isSaved}
                >
                  {isSaved ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Analysis
                    </>
                  )}
                </Button>

                <Separator orientation="vertical" className="h-8" />

                <Select
                  value={selectedResumeId}
                  onValueChange={setSelectedResumeId}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Select a resume..." />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id}>
                        {resume.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleMatch}
                  disabled={isMatching || !selectedResumeId}
                >
                  {isMatching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Matching...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Match with Resume
                    </>
                  )}
                </Button>
              </div>

              {/* Overview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Briefcase className="h-4 w-4" />
                    Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="secondary" className="capitalize">
                      {analysis.experienceLevel} level
                    </Badge>
                  </div>
                  {analysis.summary && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {analysis.summary}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Skills */}
              {analysis.skills.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="h-4 w-4" />
                      Extracted Skills
                      <Badge variant="outline" className="ml-auto text-xs">
                        {analysis.skills.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedResumeId && matchResult ? (
                      <p className="text-xs text-muted-foreground mb-3">
                        Compared with{' '}
                        <span className="font-medium text-foreground">
                          {selectedResume?.title}
                        </span>
                        . <span className="text-green-600 dark:text-green-400 font-medium">Green</span> = present,{' '}
                        <span className="text-orange-600 dark:text-orange-400 font-medium">Orange</span> = missing.
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {analysis.skills.map((skill) => (
                        <SkillBadge
                          key={skill}
                          skill={skill}
                          matchResult={matchResult}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Requirements */}
              {analysis.requirements.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ListChecks className="h-4 w-4" />
                      Requirements
                      <Badge variant="outline" className="ml-auto text-xs">
                        {analysis.requirements.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.requirements.map((req, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm"
                        >
                          <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Qualifications */}
              {analysis.qualifications.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <GraduationCap className="h-4 w-4" />
                      Qualifications
                      <Badge variant="outline" className="ml-auto text-xs">
                        {analysis.qualifications.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.qualifications.map((qual, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm"
                        >
                          <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span>{qual}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Red Flags */}
              {analysis.redFlags.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Red Flags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysis.redFlags.map((flag, i) => (
                      <Alert key={i} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="text-sm">Warning</AlertTitle>
                        <AlertDescription className="text-sm">
                          {flag}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Resume Match Results */}
              {isMatching && <MatchSkeleton />}

              {!isMatching && matchResult && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="h-4 w-4" />
                      Resume Match
                      {selectedResume && (
                        <span className="text-muted-foreground font-normal">
                          &mdash; {selectedResume.title}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Match Rate Circle */}
                    <div className="flex items-center gap-6">
                      <MatchRateCircle rate={matchResult.matchRate} />
                      <div>
                        <p className="text-sm font-medium">
                          {getMatchRateLabel(matchResult.matchRate)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {matchResult.presentKeywords.length} keywords present,{' '}
                          {matchResult.missingKeywords.length} missing
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Present Keywords */}
                    {matchResult.presentKeywords.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                          Present Keywords
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {matchResult.presentKeywords.map((kw) => (
                            <Badge
                              key={kw}
                              className="text-xs bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 border-green-200 dark:border-green-800"
                            >
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing Keywords */}
                    {matchResult.missingKeywords.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          Missing Keywords
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {matchResult.missingKeywords.map((kw) => (
                            <Badge
                              key={kw}
                              variant="outline"
                              className="text-xs bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50 border-orange-200 dark:border-orange-800"
                            >
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggestions */}
                    {matchResult.suggestions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          Improvement Suggestions
                        </h4>
                        <ul className="space-y-2">
                          {matchResult.suggestions.map((s, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-muted-foreground"
                            >
                              <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Reorder Suggestions */}
                    {matchResult.reorderSuggestions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <ListChecks className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          Reorder Suggestions
                        </h4>
                        <ul className="space-y-2">
                          {matchResult.reorderSuggestions.map((s, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-muted-foreground"
                            >
                              <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!showDeleteConfirm}
        onOpenChange={() => setShowDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Analysis</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The saved analysis will be permanently
              deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                showDeleteConfirm && handleDelete(showDeleteConfirm)
              }
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===== Helper Components =====

function getMatchRateColors(rate: number): { text: string; stroke: string } {
  if (rate >= 80) {
    return {
      text: 'text-green-500 dark:text-green-400',
      stroke: 'stroke-green-500 dark:stroke-green-400',
    }
  }
  if (rate >= 60) {
    return {
      text: 'text-blue-500 dark:text-blue-400',
      stroke: 'stroke-blue-500 dark:stroke-blue-400',
    }
  }
  if (rate >= 40) {
    return {
      text: 'text-orange-500 dark:text-orange-400',
      stroke: 'stroke-orange-500 dark:stroke-orange-400',
    }
  }
  return {
    text: 'text-red-500 dark:text-red-400',
    stroke: 'stroke-red-500 dark:stroke-red-400',
  }
}

function getMatchRateLabel(rate: number): string {
  if (rate >= 80) return 'Excellent match!'
  if (rate >= 60) return 'Good match with room for improvement'
  if (rate >= 40) return 'Moderate match - consider tailoring'
  return 'Low match - significant gaps'
}

function MatchRateCircle({ rate }: { rate: number }) {
  const circumference = 2 * Math.PI * 40
  const offset = circumference - (rate / 100) * circumference
  const colors = getMatchRateColors(rate)

  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('transition-all duration-700 ease-out', colors.stroke)}
        />
      </svg>
      <div
        className={cn(
          'absolute inset-0 flex flex-col items-center justify-center',
          colors.text
        )}
      >
        <span className="text-2xl font-bold">{rate}%</span>
      </div>
    </div>
  )
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-20" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function MatchSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Separator />
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SkillBadge({
  skill,
  matchResult,
}: {
  skill: string
  matchResult: JDMatchResult | null
}) {
  if (!matchResult) {
    return (
      <Badge variant="outline" className="text-xs">
        {skill}
      </Badge>
    )
  }

  const skillLower = skill.toLowerCase()
  const isPresent = matchResult.presentKeywords.some(
    (k) => k.toLowerCase() === skillLower
  )
  const isMissing = matchResult.missingKeywords.some(
    (k) => k.toLowerCase() === skillLower
  )

  if (isPresent) {
    return (
      <Badge
        variant="default"
        className="text-xs bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 border-green-200 dark:border-green-800"
      >
        <CheckCircle2 className="mr-1 h-3 w-3" />
        {skill}
      </Badge>
    )
  }

  if (isMissing) {
    return (
      <Badge
        variant="destructive"
        className="text-xs bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50 border-orange-200 dark:border-orange-800"
      >
        <XCircle className="mr-1 h-3 w-3" />
        {skill}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="text-xs">
      {skill}
    </Badge>
  )
}

// ===== Utility Functions =====

function buildAnalysisFromJD(jd: JobDescription | null | undefined): JDAnalysis | null {
  if (!jd) return null

  if (jd.analysis) {
    return jd.analysis as unknown as JDAnalysis
  }

  if (jd.extracted_skills || jd.extracted_requirements || jd.extracted_qualifications) {
    const meta = (jd.analysis ?? {}) as Record<string, unknown>
    return {
      skills: jd.extracted_skills ?? [],
      requirements: jd.extracted_requirements ?? [],
      qualifications: jd.extracted_qualifications ?? [],
      experienceLevel: (meta.experienceLevel as string) ?? 'unknown',
      redFlags: (meta.redFlags as string[]) ?? [],
      summary: (meta.summary as string) ?? '',
    }
  }

  return null
}

function extractTitle(text: string): string {
  // Try to extract a job title from the first few lines
  const lines = text.trim().split('\n').filter((l) => l.trim())

  // Common patterns: "Senior Software Engineer", "Title: ...", first non-empty line
  for (const line of lines.slice(0, 5)) {
    const trimmed = line.trim()

    // Check for "Title:" or "Position:" prefix
    const titleMatch = trimmed.match(/^(?:job\s+)?title\s*[:\-]\s*(.+)/i)
    if (titleMatch) return titleMatch[1].trim()

    const posMatch = trimmed.match(/^position\s*[:\-]\s*(.+)/i)
    if (posMatch) return posMatch[1].trim()

    const roleMatch = trimmed.match(/^role\s*[:\-]\s*(.+)/i)
    if (roleMatch) return roleMatch[1].trim()
  }

  // Fallback: use the first non-empty line if it's short enough
  const firstLine = lines[0]?.trim() ?? ''
  if (firstLine.length > 0 && firstLine.length <= 80) {
    return firstLine
  }

  // Last resort: truncate the first line
  return firstLine.slice(0, 60) + (firstLine.length > 60 ? '...' : '') || 'Untitled JD'
}

function extractCompany(text: string): string | undefined {
  const lines = text.trim().split('\n').filter((l) => l.trim())

  for (const line of lines.slice(0, 10)) {
    const trimmed = line.trim()

    const companyMatch = trimmed.match(/^company\s*[:\-]\s*(.+)/i)
    if (companyMatch) return companyMatch[1].trim()

    const orgMatch = trimmed.match(/^organization\s*[:\-]\s*(.+)/i)
    if (orgMatch) return orgMatch[1].trim()

    const atMatch = trimmed.match(/\bat\s+(.+?)(?:\s*[-|]|$)/i)
    if (atMatch && atMatch[1].length < 40) return atMatch[1].trim()
  }

  return undefined
}
