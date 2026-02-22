'use client'

import { useTransition, useState, useCallback } from 'react'
import { FolderKanban, Plus, Trash2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  addProject,
  updateProject,
  deleteProject,
  addAchievement,
  updateAchievement,
  deleteAchievement,
} from '@/app/admin/resume-builder/actions'
import { EditorSection } from '../EditorSection'
import { AIAssistButton } from '../AIAssistButton'
import { analyzeAchievement } from '@/lib/resume-builder/validation/rules'
import type { ResumeProject } from '@/types/resume-builder'

interface Props {
  resumeId: string
  projects: ResumeProject[]
}

export function ProjectsSection({ resumeId, projects }: Props) {
  const [isPending, startTransition] = useTransition()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(projects.map((p) => p.id))
  )

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  function handleAdd() {
    startTransition(async () => {
      try {
        const data = await addProject(resumeId)
        setExpandedIds((prev) => new Set(prev).add(data.id))
        toast.success('Project added')
      } catch {
        toast.error('Failed to add project')
      }
    })
  }

  return (
    <EditorSection
      title="Projects"
      icon={FolderKanban}
      id="projects"
      action={
        <Button variant="ghost" size="sm" onClick={handleAdd} disabled={isPending} className="h-5 px-1.5 text-[11px]">
          <Plus className="mr-0.5 h-3 w-3" />
          Add Project
        </Button>
      }
    >
      <div className="space-y-3">
        {projects.length === 0 && (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No projects added yet. Projects are critical for new grads and career changers.
          </p>
        )}

        {projects.map((proj) => (
          <ProjectCard
            key={proj.id}
            project={proj}
            resumeId={resumeId}
            isExpanded={expandedIds.has(proj.id)}
            onToggle={() => toggleExpand(proj.id)}
          />
        ))}
      </div>
    </EditorSection>
  )
}

function ProjectCard({
  project,
  resumeId,
  isExpanded,
  onToggle,
}: {
  project: ResumeProject
  resumeId: string
  isExpanded: boolean
  onToggle: () => void
}) {
  const [isPending, startTransition] = useTransition()

  function handleUpdate(field: string, value: unknown) {
    startTransition(async () => {
      try {
        await updateProject(project.id, resumeId, { [field]: value })
      } catch {
        toast.error('Failed to update')
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteProject(project.id, resumeId)
        toast.success('Project removed')
      } catch {
        toast.error('Failed to delete')
      }
    })
  }

  function handleAddBullet() {
    startTransition(async () => {
      try {
        await addAchievement(project.id, 'project', resumeId)
      } catch {
        toast.error('Failed to add bullet')
      }
    })
  }

  return (
    <div className="rounded-lg border">
      <button type="button" className="flex w-full items-center gap-3 p-3 text-left" onClick={onToggle}>
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground">{project.name || 'Untitled Project'}</div>
          <div className="text-foreground/60 text-xs">{project.description?.slice(0, 60) || 'No description'}</div>
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isExpanded && (
        <div className="space-y-3 border-t p-3">
          <div className="space-y-2">
            <Label className="text-xs">Project Name *</Label>
            <Input defaultValue={project.name} onBlur={(e) => handleUpdate('name', e.target.value)} placeholder="My Awesome Project" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">Live URL</Label>
              <Input defaultValue={project.project_url ?? ''} onBlur={(e) => handleUpdate('project_url', e.target.value || null)} placeholder="https://myproject.com" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Source Code</Label>
              <Input defaultValue={project.source_url ?? ''} onBlur={(e) => handleUpdate('source_url', e.target.value || null)} placeholder="https://github.com/..." />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Description</Label>
              <AIAssistButton
                category="description"
                currentText={project.description ?? ''}
                context={{ name: project.name }}
                resumeId={resumeId}
                onAccept={(text) => handleUpdate('description', text)}
              />
            </div>
            <Textarea defaultValue={project.description ?? ''} onBlur={(e) => handleUpdate('description', e.target.value)} placeholder="Brief description of the project..." rows={2} className="resize-none text-sm" />
          </div>

          {/* Achievement Bullets */}
          <div>
            <Label className="mb-2 text-xs font-medium">Achievement Bullets</Label>
            <div className="space-y-2">
              {project.achievements?.map((achievement) => (
                <ProjectAchievementRow key={achievement.id} achievement={achievement} resumeId={resumeId} projectName={project.name} />
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={handleAddBullet} disabled={isPending} className="mt-2 h-7 text-xs">
              <Plus className="mr-1 h-3 w-3" />
              Add Bullet
            </Button>
          </div>

          <div className="flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isPending} className="text-destructive h-7 text-xs">
                  <Trash2 className="mr-1 h-3 w-3" />
                  Remove
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectAchievementRow({
  achievement,
  resumeId,
  projectName,
}: {
  achievement: { id: string; text: string; has_metric: boolean }
  resumeId: string
  projectName: string
}) {
  const [isPending, startTransition] = useTransition()
  const [text, setText] = useState(achievement.text)
  const analysis = analyzeAchievement(text)

  function handleSave() {
    if (text === achievement.text) return
    startTransition(async () => {
      try {
        await updateAchievement(achievement.id, resumeId, { text })
      } catch {
        toast.error('Failed to save')
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteAchievement(achievement.id, resumeId)
      } catch {
        toast.error('Failed to delete')
      }
    })
  }

  function handleAIAccept(newText: string) {
    setText(newText)
    startTransition(async () => {
      try {
        await updateAchievement(achievement.id, resumeId, { text: newText })
        toast.success('Bullet updated')
      } catch {
        toast.error('Failed to save')
      }
    })
  }

  return (
    <div className="group flex gap-2">
      <div className="flex-1">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} onBlur={handleSave} placeholder="Built X using Y, resulting in Z..." rows={2} className="resize-none text-sm" />
        {analysis.warnings.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {analysis.warnings.map((w, i) => (
              <p key={i} className="flex items-center gap-1 text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {w}
              </p>
            ))}
          </div>
        )}
        <AIAssistButton
          category="bullet"
          currentText={text}
          context={{ name: projectName, job_title: projectName, company: '' }}
          resumeId={resumeId}
          onAccept={handleAIAccept}
        />
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending} className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
