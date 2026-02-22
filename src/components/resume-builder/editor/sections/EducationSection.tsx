'use client'

import { useTransition, useState, useCallback } from 'react'
import { GraduationCap, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
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
  addEducation,
  updateEducation,
  deleteEducation,
} from '@/app/admin/resume-builder/actions'
import { EditorSection } from '../EditorSection'
import type { ResumeEducation } from '@/types/resume-builder'

interface Props {
  resumeId: string
  entries: ResumeEducation[]
}

export function EducationSection({ resumeId, entries }: Props) {
  const [isPending, startTransition] = useTransition()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(entries.map((e) => e.id))
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
        await addEducation(resumeId)
        toast.success('Education added')
      } catch {
        toast.error('Failed to add education')
      }
    })
  }

  return (
    <EditorSection
      title="Education"
      icon={GraduationCap}
      id="education"
      action={
        <Button variant="ghost" size="sm" onClick={handleAdd} disabled={isPending} className="h-7 text-xs">
          <Plus className="mr-1 h-3 w-3" />
          Add
        </Button>
      }
    >
      <div className="space-y-3">
        {entries.length === 0 && (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No education added yet.
          </p>
        )}

        {entries.map((entry) => (
          <EducationCard
            key={entry.id}
            entry={entry}
            resumeId={resumeId}
            isExpanded={expandedIds.has(entry.id)}
            onToggle={() => toggleExpand(entry.id)}
          />
        ))}
      </div>
    </EditorSection>
  )
}

function EducationCard({
  entry,
  resumeId,
  isExpanded,
  onToggle,
}: {
  entry: ResumeEducation
  resumeId: string
  isExpanded: boolean
  onToggle: () => void
}) {
  const [isPending, startTransition] = useTransition()

  function handleUpdate(field: string, value: unknown) {
    startTransition(async () => {
      try {
        await updateEducation(entry.id, resumeId, { [field]: value })
      } catch {
        toast.error('Failed to update')
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteEducation(entry.id, resumeId)
        toast.success('Education removed')
      } catch {
        toast.error('Failed to delete')
      }
    })
  }

  return (
    <div className="rounded-lg border">
      <button type="button" className="flex w-full items-center gap-3 p-3 text-left" onClick={onToggle}>
        <div className="flex-1">
          <div className="text-sm font-medium">{entry.degree || 'Untitled Degree'}</div>
          <div className="text-muted-foreground text-xs">{entry.institution || 'Institution'}</div>
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isExpanded && (
        <div className="space-y-3 border-t p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">Degree *</Label>
              <Input defaultValue={entry.degree} onBlur={(e) => handleUpdate('degree', e.target.value)} placeholder="B.S. Computer Science" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Institution *</Label>
              <Input defaultValue={entry.institution} onBlur={(e) => handleUpdate('institution', e.target.value)} placeholder="Stanford University" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs">Field of Study</Label>
              <Input defaultValue={entry.field_of_study ?? ''} onBlur={(e) => handleUpdate('field_of_study', e.target.value || null)} placeholder="Computer Science" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Graduation Date</Label>
              <Input type="month" defaultValue={entry.graduation_date?.slice(0, 7) ?? ''} onBlur={(e) => handleUpdate('graduation_date', e.target.value ? `${e.target.value}-01` : null)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">GPA (if &gt; 3.5)</Label>
              <Input type="number" step="0.01" min="0" max="4.0" defaultValue={entry.gpa ?? ''} onBlur={(e) => handleUpdate('gpa', e.target.value ? parseFloat(e.target.value) : null)} placeholder="3.8" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Honors</Label>
            <Input defaultValue={entry.honors ?? ''} onBlur={(e) => handleUpdate('honors', e.target.value || null)} placeholder="magna cum laude, Dean's List" />
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
