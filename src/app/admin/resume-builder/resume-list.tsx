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
} from 'lucide-react'
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
import { toast } from 'sonner'
import { createResume, deleteResume, cloneResume, generateTailoredResume } from './actions'
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

interface ResumeListProps {
  resumes: Resume[]
  templates: ResumeTemplate[]
}

export function ResumeList({ resumes, templates }: ResumeListProps) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [showClone, setShowClone] = useState<string | null>(null)
  const [showDelete, setShowDelete] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [level, setLevel] = useState<ExperienceLevel>('mid')
  const [targetRole, setTargetRole] = useState('')
  const [cloneTitle, setCloneTitle] = useState('')
  const [mode, setMode] = useState<'choose' | 'tailor' | 'scratch'>('choose')
  const [jobDescription, setJobDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  function handleCreate() {
    startTransition(async () => {
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
    startTransition(async () => {
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
    startTransition(async () => {
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
    startTransition(async () => {
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
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Your Resumes</h2>
          <p className="text-muted-foreground text-sm">
            Create and manage multiple resume versions for different applications.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Resume
        </Button>
      </div>

      {resumes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <FileText className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">No resumes yet</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Create your first resume to get started.
          </p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Resume
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <Card key={resume.id} className="group relative overflow-hidden">
              <Link
                href={`/admin/resume-builder/${resume.id}/edit`}
                className="block p-5"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="line-clamp-1 font-semibold">
                      {resume.title}
                    </h3>
                    {resume.is_master && (
                      <Badge
                        variant="secondary"
                        className="mt-1 gap-1 text-xs"
                      >
                        <Crown className="h-3 w-3" />
                        Master
                      </Badge>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.preventDefault()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
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
                          setShowDelete(resume.id)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="text-muted-foreground space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5" />
                    {getTemplateName(resume.template_id)} &middot;{' '}
                    {getLevelLabel(resume.experience_level)}
                  </div>
                  {resume.target_role && (
                    <div className="text-muted-foreground/80">
                      Target: {resume.target_role}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Updated {formatDate(resume.updated_at)}
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}

      {/* Create Resume Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => {
        setShowCreate(open)
        if (!open) {
          setMode('choose')
          setJobDescription('')
          setTitle('')
          setTargetRole('')
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
                  className="flex items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-accent"
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
                  className="flex items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-accent"
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
                    className="min-h-[200px] resize-y"
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
                    disabled={isGenerating || isPending}
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
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
                    disabled={isPending}
                    className="flex-1"
                  >
                    {isPending ? 'Creating...' : 'Create Resume'}
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
        onOpenChange={() => setShowClone(null)}
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
              disabled={isPending}
              className="w-full"
            >
              {isPending ? 'Cloning...' : 'Clone Resume'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!showDelete}
        onOpenChange={() => setShowDelete(null)}
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
