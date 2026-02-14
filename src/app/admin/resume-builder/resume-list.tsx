'use client'

import { useState, useTransition } from 'react'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { createResume, deleteResume, cloneResume } from './actions'
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
  const [showCreate, setShowCreate] = useState(false)
  const [showClone, setShowClone] = useState<string | null>(null)
  const [showDelete, setShowDelete] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [level, setLevel] = useState<ExperienceLevel>('mid')
  const [targetRole, setTargetRole] = useState('')
  const [cloneTitle, setCloneTitle] = useState('')

  function handleCreate() {
    startTransition(async () => {
      try {
        await createResume({
          title: title || 'Untitled Resume',
          experience_level: level,
          target_role: targetRole || undefined,
          is_master: resumes.length === 0,
        })
        toast.success('Resume created')
      } catch {
        toast.error('Failed to create resume')
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
        await cloneResume(id, cloneTitle || 'Cloned Resume')
        toast.success('Resume cloned')
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
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Resume</DialogTitle>
            <DialogDescription>
              Set up your resume profile. You can change these settings later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Resume Title</Label>
              <Input
                id="title"
                placeholder="e.g., Senior Backend Engineer - Google"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="level">Experience Level</Label>
              <Select
                value={level}
                onValueChange={(v) => setLevel(v as ExperienceLevel)}
              >
                <SelectTrigger>
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
            <div>
              <Label htmlFor="role">Target Role (optional)</Label>
              <Input
                id="role"
                placeholder="e.g., Frontend, Backend, Full Stack"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />
            </div>
            <Button
              onClick={handleCreate}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? 'Creating...' : 'Create Resume'}
            </Button>
          </div>
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
            <div>
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
