'use client'

import { useTransition, useState, useCallback } from 'react'
import {
  Briefcase,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  EyeOff,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
  addWorkExperience,
  updateWorkExperience,
  deleteWorkExperience,
  addAchievement,
  updateAchievement,
  deleteAchievement,
} from '@/app/admin/resume-builder/actions'
import { EditorSection } from '../EditorSection'
import { AIAssistButton } from '../AIAssistButton'
import { analyzeAchievement } from '@/lib/resume-builder/validation/rules'
import type { ResumeWorkExperience } from '@/types/resume-builder'

interface Props {
  resumeId: string
  experiences: ResumeWorkExperience[]
}

export function WorkExperienceSection({ resumeId, experiences }: Props) {
  const [isPending, startTransition] = useTransition()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(experiences.map((e) => e.id))
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
        const data = await addWorkExperience(resumeId)
        setExpandedIds((prev) => new Set(prev).add(data.id))
        toast.success('Experience added')
      } catch {
        toast.error('Failed to add experience')
      }
    })
  }

  return (
    <EditorSection
      title="Work Experience"
      icon={Briefcase}
      id="experience"
      action={
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAdd}
          disabled={isPending}
          className="h-5 px-1.5 text-[11px]"
        >
          <Plus className="mr-0.5 h-3 w-3" />
          Add Role
        </Button>
      }
    >
      <div className="space-y-3">
        {experiences.length === 0 && (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No work experience added yet. Click &quot;Add Role&quot; to get started.
          </p>
        )}

        {experiences.map((exp) => (
          <ExperienceCard
            key={exp.id}
            experience={exp}
            resumeId={resumeId}
            isExpanded={expandedIds.has(exp.id)}
            onToggle={() => toggleExpand(exp.id)}
          />
        ))}
      </div>
    </EditorSection>
  )
}

function ExperienceCard({
  experience,
  resumeId,
  isExpanded,
  onToggle,
}: {
  experience: ResumeWorkExperience
  resumeId: string
  isExpanded: boolean
  onToggle: () => void
}) {
  const [isPending, startTransition] = useTransition()

  function handleUpdate(field: string, value: unknown) {
    startTransition(async () => {
      try {
        await updateWorkExperience(experience.id, resumeId, {
          [field]: value,
        })
      } catch {
        toast.error('Failed to update')
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteWorkExperience(experience.id, resumeId)
        toast.success('Experience removed')
      } catch {
        toast.error('Failed to delete')
      }
    })
  }

  function handleAddBullet() {
    startTransition(async () => {
      try {
        await addAchievement(experience.id, 'work', resumeId)
      } catch {
        toast.error('Failed to add bullet')
      }
    })
  }

  const bulletCount = experience.achievements?.length ?? 0
  const bulletWarning =
    bulletCount > 5
      ? 'Too many bullets (max 5)'
      : bulletCount < 2 && bulletCount > 0
        ? 'Consider adding more bullets (3-4 recommended)'
        : null

  return (
    <div className="rounded-lg border">
      {/* Header */}
      <button
        type="button"
        className={`flex w-full items-center gap-3 p-3 text-left${experience.is_visible === false ? ' opacity-50' : ''}`}
        onClick={onToggle}
      >
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground">
            {experience.job_title || 'Untitled Role'}
          </div>
          <div className="text-muted-foreground text-xs text-foreground/60">
            {experience.company || 'Company'}{' '}
            {experience.location && `· ${experience.location}`}
          </div>
        </div>
        {experience.is_visible === false && (
          <Badge variant="outline" className="text-[10px]">
            <EyeOff className="mr-1 h-2.5 w-2.5" />
            Hidden
          </Badge>
        )}
        {experience.is_promotion && (
          <Badge variant="secondary" className="text-xs">
            Promotion
          </Badge>
        )}
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-4 border-t p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">Job Title *</Label>
              <Input
                defaultValue={experience.job_title}
                onBlur={(e) => handleUpdate('job_title', e.target.value)}
                placeholder="Senior Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Company *</Label>
              <Input
                defaultValue={experience.company}
                onBlur={(e) => handleUpdate('company', e.target.value)}
                placeholder="Acme Corp"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs">Location</Label>
              <Input
                defaultValue={experience.location ?? ''}
                onBlur={(e) => handleUpdate('location', e.target.value)}
                placeholder="San Francisco, CA"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="month"
                defaultValue={experience.start_date?.slice(0, 7) ?? ''}
                onBlur={(e) =>
                  handleUpdate(
                    'start_date',
                    e.target.value ? `${e.target.value}-01` : null
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">End Date</Label>
              <Input
                type="month"
                defaultValue={experience.end_date?.slice(0, 7) ?? ''}
                onBlur={(e) =>
                  handleUpdate(
                    'end_date',
                    e.target.value ? `${e.target.value}-01` : null
                  )
                }
                placeholder="Present"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={experience.is_visible !== false}
                onCheckedChange={(v) => handleUpdate('is_visible', v)}
              />
              <Label className="text-xs">Show on resume</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={experience.is_promotion}
                onCheckedChange={(v) => handleUpdate('is_promotion', v)}
              />
              <Label className="text-xs">This is a promotion</Label>
            </div>
          </div>

          {/* Achievement Bullets */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs font-medium">
                Achievement Bullets
              </Label>
              {bulletWarning && (
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  {bulletWarning}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {experience.achievements?.map((achievement) => (
                <AchievementRow
                  key={achievement.id}
                  achievement={achievement}
                  resumeId={resumeId}
                  jobTitle={experience.job_title}
                  company={experience.company}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddBullet}
              disabled={isPending}
              className="mt-2 h-7 text-xs"
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Bullet
            </Button>
          </div>

          <div className="flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  className="text-destructive h-7 text-xs"
                >
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

function AchievementRow({
  achievement,
  resumeId,
  jobTitle,
  company,
}: {
  achievement: { id: string; text: string; has_metric: boolean }
  resumeId: string
  jobTitle: string
  company: string
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
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleSave}
          placeholder="Accomplished [X] as measured by [Y] by doing [Z]..."
          rows={2}
          className="resize-none text-sm"
        />
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
        <div className="mt-1 flex items-center gap-2">
          {analysis.hasMetric && (
            <Badge variant="secondary" className="text-[10px]">
              Has metric
            </Badge>
          )}
          {analysis.startsWithVerb && (
            <Badge variant="secondary" className="text-[10px]">
              Strong verb
            </Badge>
          )}
        </div>
        <AIAssistButton
          category="bullet"
          currentText={text}
          context={{ job_title: jobTitle, company }}
          resumeId={resumeId}
          onAccept={handleAIAccept}
        />
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={isPending}
            className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100"
          >
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
