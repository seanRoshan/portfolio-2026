'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  FileText,
  Copy,
  Trash2,
  MoreHorizontal,
  Crown,
  Clock,
  Target,
  Sparkles,
  Loader2,
  Menu,
  Search,
  Share2,
  Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet'
import { toast } from 'sonner'
import { createResume, deleteResume, cloneResume, generateTailoredResume } from './actions'
import { AdminSidebar } from '../admin-sidebar'
import type { Resume, ResumeTemplate, ExperienceLevel } from '@/types/resume-builder'

const experienceLevels: { value: ExperienceLevel; label: string }[] = [
  { value: 'intern', label: 'Intern' },
  { value: 'new_grad', label: 'New Graduate' },
  { value: 'bootcamp_grad', label: 'Bootcamp Graduate' },
  { value: 'junior', label: 'Junior (1-3 years)' },
  { value: 'mid', label: 'Mid-Level (3-5 years)' },
  { value: 'senior', label: 'Senior (5-10 years)' },
  { value: 'staff_plus', label: 'Staff+ (10+ years)' },
  { value: 'tech_lead', label: 'Tech Lead' },
  { value: 'eng_manager', label: 'Engineering Manager' },
]

const TEMPLATE_COLORS: Record<string, string> = {
  Pragmatic: 'border-l-blue-500',
  Mono: 'border-l-zinc-400',
  Smarkdown: 'border-l-emerald-500',
  CareerCup: 'border-l-orange-500',
  Parker: 'border-l-violet-500',
  Experienced: 'border-l-teal-500',
}

function getTemplateColor(name: string): string {
  return TEMPLATE_COLORS[name] ?? 'border-l-zinc-500'
}

const WORK_MODE_STYLES: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  remote: { label: 'Remote', dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
  hybrid: { label: 'Hybrid', dot: 'bg-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  onsite: { label: 'On-site', dot: 'bg-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
}

interface ResumeListProps {
  resumes: Resume[]
  templates: ResumeTemplate[]
}

export function ResumeList({ resumes, templates }: ResumeListProps) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [showClone, setShowClone] = useState<string | null>(null)
  const [showDelete, setShowDelete] = useState<string | null>(null)
  const [isCreating, startCreateTransition] = useTransition()
  const [isCloning, startCloneTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [level, setLevel] = useState<ExperienceLevel>('mid')
  const [targetRole, setTargetRole] = useState('')
  const [cloneTitle, setCloneTitle] = useState('')
  const [mode, setMode] = useState<'choose' | 'tailor' | 'scratch'>('choose')
  const [jobDescription, setJobDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const masterResume = resumes.find((r) => r.is_master) ?? null
  const tailoredResumes = resumes.filter((r) => !r.is_master)
  const filteredTailored = tailoredResumes.filter((r) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      r.title.toLowerCase().includes(q) ||
      (r.target_role?.toLowerCase().includes(q) ?? false) ||
      (r.company_name?.toLowerCase().includes(q) ?? false) ||
      (r.job_location?.toLowerCase().includes(q) ?? false)
    )
  })

  function handleCreate() {
    startCreateTransition(async () => {
      try {
        const resumeId = await createResume({
          title: title || 'Untitled Resume',
          experience_level: level,
          target_role: targetRole || undefined,
          is_master: resumes.length === 0,
        })
        toast.success('Resume created')
        router.push(`/admin/resume-builder/${resumeId}/edit`)
      } catch {
        toast.error('Failed to create resume')
      }
    })
  }

  function handleGenerate() {
    if (!jobDescription.trim()) {
      toast.error('Please paste a job description')
      return
    }
    setIsGenerating(true)
    startCreateTransition(async () => {
      try {
        const resumeId = await generateTailoredResume({
          experience_level: level,
          job_description: jobDescription,
        })
        toast.success('Resume generated!')
        router.push(`/admin/resume-builder/${resumeId}/edit`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to generate resume')
      } finally {
        setIsGenerating(false)
      }
    })
  }

  function handleDelete(id: string) {
    startDeleteTransition(async () => {
      try {
        await deleteResume(id)
        setShowDelete(null)
        toast.success('Resume deleted')
      } catch {
        toast.error('Failed to delete resume')
      }
    })
  }

  function handleClone(id: string) {
    startCloneTransition(async () => {
      try {
        const resumeId = await cloneResume(id, cloneTitle || 'Cloned Resume')
        toast.success('Resume cloned')
        router.push(`/admin/resume-builder/${resumeId}/edit`)
      } catch {
        toast.error('Failed to clone resume')
      }
    })
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function getTemplateName(templateId: string | null) {
    if (!templateId) return 'No template'
    return templates.find((t) => t.id === templateId)?.name ?? 'Unknown'
  }

  function getLevelLabel(level: ExperienceLevel | null) {
    if (!level) return ''
    return experienceLevels.find((l) => l.value === level)?.label ?? level
  }

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      {/* Page Header */}
      <div className="mb-8 flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[264px] p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <AdminSidebar />
          </SheetContent>
        </Sheet>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resume Builder</h1>
          <p className="text-muted-foreground text-sm">
            Manage your master resume and tailored versions.
          </p>
        </div>
      </div>

      {/* Master Resume Hero */}
      {masterResume ? (
        <Card className="mb-8 gap-0 border-l-4 border-l-primary py-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
          <div className="flex flex-col gap-4 p-4 md:flex-row">
            {/* PDF Thumbnail Placeholder */}
            <div className="bg-muted/50 flex h-[200px] w-[155px] shrink-0 items-center justify-center rounded-md border">
              <FileText className="text-muted-foreground/50 h-12 w-12" />
            </div>

            {/* Master Resume Details */}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="mb-2">
                <Badge variant="secondary" className="mb-2 gap-1">
                  <Crown className="h-3 w-3" />
                  Master Resume
                </Badge>
                <h2 className="truncate text-xl font-semibold" title={masterResume.target_role || masterResume.title}>
                  {masterResume.target_role || masterResume.title}
                </h2>
                {(masterResume.company_name || masterResume.job_location || (masterResume.work_mode && WORK_MODE_STYLES[masterResume.work_mode])) && (
                  <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                    {(masterResume.company_name || masterResume.job_location) && (
                      <span className="truncate">
                        {[masterResume.company_name, masterResume.job_location].filter(Boolean).join(' · ')}
                      </span>
                    )}
                    {masterResume.work_mode && WORK_MODE_STYLES[masterResume.work_mode] && (
                      <span className={cn(
                        'inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-px text-[11px] font-medium',
                        WORK_MODE_STYLES[masterResume.work_mode].bg,
                        WORK_MODE_STYLES[masterResume.work_mode].text,
                      )}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', WORK_MODE_STYLES[masterResume.work_mode].dot)} />
                        {WORK_MODE_STYLES[masterResume.work_mode].label}
                      </span>
                    )}
                  </div>
                )}
                {masterResume.target_role && masterResume.title.toLowerCase() !== masterResume.target_role.toLowerCase() && (
                  <p className="text-muted-foreground/70 mt-0.5 text-xs italic">{masterResume.title}</p>
                )}
              </div>

              <div className="mb-3 flex flex-wrap gap-1.5">
                <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium">
                  <FileText className="h-3 w-3" />
                  {getTemplateName(masterResume.template_id)}
                </span>
                {getLevelLabel(masterResume.experience_level) && (
                  <span className="bg-muted text-muted-foreground inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium">
                    {getLevelLabel(masterResume.experience_level)}
                  </span>
                )}
                <span className="text-muted-foreground/60 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs">
                  <Clock className="h-3 w-3" />
                  Updated {formatDate(masterResume.updated_at)}
                </span>
              </div>

              {masterResume.short_id && (
                <p className="text-muted-foreground mb-3 text-xs">
                  Public URL:{' '}
                  <Link
                    href={`/r/${masterResume.short_id}`}
                    className="text-primary hover:underline"
                    target="_blank"
                  >
                    /r/{masterResume.short_id}
                  </Link>
                </p>
              )}

              <div className="mt-auto flex flex-wrap items-center gap-2">
                <Button asChild>
                  <Link href={`/admin/resume-builder/${masterResume.id}/edit`}>
                    Edit Master Resume
                  </Link>
                </Button>
                {masterResume.short_id && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const url = `${window.location.origin}/r/${masterResume.short_id}`
                      try {
                        await navigator.clipboard.writeText(url)
                        toast.success('Share link copied to clipboard')
                      } catch {
                        toast.error('Failed to copy link')
                      }
                    }}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Link
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="More actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() => {
                        setCloneTitle(`${masterResume.title} (Copy)`)
                        setShowClone(masterResume.id)
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Clone
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="mb-8 border-2 border-dashed">
          <div className="flex flex-col items-center justify-center py-4">
            <Crown className="text-muted-foreground mb-4 h-10 w-10" />
            <h3 className="mb-1 text-lg font-semibold">No Master Resume</h3>
            <p className="text-muted-foreground mb-4 max-w-sm text-center text-sm">
              Create a master resume to serve as the foundation for all your tailored versions.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Master Resume
            </Button>
          </div>
        </Card>
      )}

      {/* Tailored Resumes Section */}
      <div>
        {/* Section Header */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Tailored Resumes</h2>
            <Badge variant="secondary">{tailoredResumes.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="text-muted-foreground absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search resumes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-[240px] pl-8"
              />
            </div>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Resume
            </Button>
          </div>
        </div>

        {/* Grid */}
        {tailoredResumes.length === 0 ? (
          <Card className="border-2 border-dashed">
            <div className="flex flex-col items-center justify-center py-4">
              <Target className="text-muted-foreground mb-4 h-10 w-10" />
              <h3 className="mb-1 text-lg font-semibold">No Tailored Resumes</h3>
              <p className="text-muted-foreground mb-4 max-w-sm text-center text-sm">
                Create tailored versions of your resume for specific job applications.
              </p>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Resume
              </Button>
            </div>
          </Card>
        ) : filteredTailored.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground text-sm">
              No resumes matching &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTailored.map((resume) => {
              const templateName = getTemplateName(resume.template_id)
              const levelLabel = getLevelLabel(resume.experience_level)
              const workMode = resume.work_mode ? WORK_MODE_STYLES[resume.work_mode] : null
              const showTitle = resume.target_role && resume.title.toLowerCase() !== resume.target_role.toLowerCase()
              return (
                <Card
                  key={resume.id}
                  className={cn(
                    'group relative h-[120px] gap-0 overflow-hidden border-l-[3px] py-0 transition-all hover:shadow-md hover:-translate-y-0.5',
                    getTemplateColor(templateName),
                  )}
                >
                  {/* Clickable content zone */}
                  <Link href={`/admin/resume-builder/${resume.id}/edit`} className="flex flex-1 flex-col px-3 py-2">
                    {/* Role heading + kebab menu */}
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="min-w-0 line-clamp-2 text-[13px] font-semibold leading-tight" title={resume.target_role || resume.title}>
                        {resume.target_role || resume.title}
                      </h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Resume actions"
                            className="-mr-1 -mt-0.5 h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              router.push(`/admin/resume-builder/${resume.id}/edit`)
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setCloneTitle(`${resume.title} (Copy)`)
                              setShowClone(resume.id)
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Clone
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setShowDelete(resume.id)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Company · Location + work mode pill — single line */}
                    {(resume.company_name || resume.job_location || workMode) && (
                      <div className="mt-px flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        {(resume.company_name || resume.job_location) && (
                          <span className="min-w-0 truncate">
                            {[resume.company_name, resume.job_location].filter(Boolean).join(' · ')}
                          </span>
                        )}
                        {workMode && (
                          <span className={cn(
                            'inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-medium',
                            workMode.bg,
                            workMode.text,
                          )}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', workMode.dot)} />
                            {workMode.label}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Resume title — only if different from role */}
                    {showTitle && (
                      <p className="mt-0.5 truncate text-[10px] italic text-muted-foreground/60">
                        {resume.title}
                      </p>
                    )}
                  </Link>

                  {/* Footer: meta + date — pinned to bottom */}
                  <div className="mt-auto flex items-center gap-1.5 border-t border-border/40 px-3 py-1.5">
                    <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded px-1.5 py-px text-[10px] font-medium">
                      <FileText className="h-2.5 w-2.5" />
                      {templateName}
                    </span>
                    {levelLabel && (
                      <span className="bg-muted text-muted-foreground inline-flex items-center rounded px-1.5 py-px text-[10px] font-medium">
                        {levelLabel}
                      </span>
                    )}
                    <span className="text-muted-foreground/50 ml-auto text-[10px]">
                      {formatDate(resume.updated_at)}
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Resume Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => {
        if (!open && isGenerating) return
        setShowCreate(open)
        if (!open) {
          setMode('choose')
          setJobDescription('')
          setTitle('')
          setTargetRole('')
          setLevel('mid')
          setIsGenerating(false)
        }
      }}>
        <DialogContent>
          {mode === 'choose' && (
            <>
              <DialogHeader>
                <DialogTitle>Create New Resume</DialogTitle>
                <DialogDescription>
                  Choose how to start your resume.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => setMode('tailor')}
                  className="flex items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Tailor for a Job</div>
                    <p className="text-muted-foreground text-sm">
                      Paste a job description and AI will draft a tailored resume using your portfolio data.
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('scratch')}
                  className="flex items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold">Start from Scratch</div>
                    <p className="text-muted-foreground text-sm">
                      Create an empty resume and fill in each section manually.
                    </p>
                  </div>
                </button>
              </div>
            </>
          )}

          {mode === 'tailor' && (
            <>
              <DialogHeader>
                <DialogTitle>Tailor for a Job</DialogTitle>
                <DialogDescription>
                  Paste the job description and AI will craft a tailored resume from your portfolio data.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="level-tailor">Experience Level</Label>
                  <Select
                    value={level}
                    onValueChange={(v) => setLevel(v as ExperienceLevel)}
                  >
                    <SelectTrigger id="level-tailor">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceLevels.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jd">Job Description</Label>
                  <Textarea
                    id="jd"
                    placeholder="Paste the full job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="h-[300px] overflow-y-auto resize-none"
                    style={{ fieldSizing: 'fixed' }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setMode('choose')}
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || isCreating}
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating (~30s)...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Resume
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}

          {mode === 'scratch' && (
            <>
              <DialogHeader>
                <DialogTitle>Start from Scratch</DialogTitle>
                <DialogDescription>
                  Set up your resume profile. You can change these settings later.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Resume Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Senior Backend Engineer - Google"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level-scratch">Experience Level</Label>
                  <Select
                    value={level}
                    onValueChange={(v) => setLevel(v as ExperienceLevel)}
                  >
                    <SelectTrigger id="level-scratch">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceLevels.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Target Role (optional)</Label>
                  <Input
                    id="role"
                    placeholder="e.g., Frontend, Backend, Full Stack"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setMode('choose')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={isCreating}
                    className="flex-1"
                  >
                    {isCreating ? 'Creating...' : 'Create Resume'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Clone Dialog */}
      <Dialog
        open={!!showClone}
        onOpenChange={(open) => {
          if (!open && isCloning) return
          if (!open) setShowClone(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone Resume</DialogTitle>
            <DialogDescription>
              Create a copy of this resume with a new title.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clone-title">New Title</Label>
              <Input
                id="clone-title"
                value={cloneTitle}
                onChange={(e) => setCloneTitle(e.target.value)}
              />
            </div>
            <Button
              onClick={() => showClone && handleClone(showClone)}
              disabled={isCloning}
              className="w-full"
            >
              {isCloning ? 'Cloning...' : 'Clone Resume'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!showDelete}
        onOpenChange={(open) => {
          if (!open && isDeleting) return
          if (!open) setShowDelete(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resume</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All data for this resume will be
              permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDelete(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDelete && handleDelete(showDelete)}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
