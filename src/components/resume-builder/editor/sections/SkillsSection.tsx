'use client'

import { useTransition, useState } from 'react'
import { Wrench, Plus, Trash2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
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
  addSkillCategory,
  updateSkillCategory,
  deleteSkillCategory,
} from '@/app/admin/resume-builder/actions'
import { EditorSection } from '../EditorSection'
import type { ResumeSkillCategory } from '@/types/resume-builder'

interface Props {
  resumeId: string
  categories: ResumeSkillCategory[]
}

export function SkillsSection({ resumeId, categories }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleAdd() {
    startTransition(async () => {
      try {
        await addSkillCategory(resumeId)
        toast.success('Category added')
      } catch {
        toast.error('Failed to add category')
      }
    })
  }

  return (
    <EditorSection
      title="Skills & Technologies"
      icon={Wrench}
      id="skills"
      action={
        <Button variant="ghost" size="sm" onClick={handleAdd} disabled={isPending} className="h-7 text-xs">
          <Plus className="mr-1 h-3 w-3" />
          Add Category
        </Button>
      }
    >
      <div className="space-y-3">
        {categories.length === 0 && (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No skill categories. Add categories like Languages, Frameworks, Cloud, etc.
          </p>
        )}

        {categories.map((cat) => (
          <SkillCategoryCard key={cat.id} category={cat} resumeId={resumeId} />
        ))}
      </div>
    </EditorSection>
  )
}

function SkillCategoryCard({
  category,
  resumeId,
}: {
  category: ResumeSkillCategory
  resumeId: string
}) {
  const [isPending, startTransition] = useTransition()
  const [newSkill, setNewSkill] = useState('')

  function handleUpdateName(name: string) {
    startTransition(async () => {
      try {
        await updateSkillCategory(category.id, resumeId, { name })
      } catch {
        toast.error('Failed to update')
      }
    })
  }

  function handleAddSkill() {
    if (!newSkill.trim()) return
    const updated = [...category.skills, newSkill.trim()]
    setNewSkill('')
    startTransition(async () => {
      try {
        await updateSkillCategory(category.id, resumeId, { skills: updated })
      } catch {
        toast.error('Failed to add skill')
      }
    })
  }

  function handleRemoveSkill(index: number) {
    const updated = category.skills.filter((_, i) => i !== index)
    startTransition(async () => {
      try {
        await updateSkillCategory(category.id, resumeId, { skills: updated })
      } catch {
        toast.error('Failed to remove skill')
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteSkillCategory(category.id, resumeId)
        toast.success('Category removed')
      } catch {
        toast.error('Failed to delete')
      }
    })
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center gap-2">
        <Input
          defaultValue={category.name}
          onBlur={(e) => handleUpdateName(e.target.value)}
          placeholder="Category name (e.g., Languages)"
          className="h-8 text-sm font-medium"
        />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isPending} className="h-8 w-8 shrink-0">
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

      <div className="mb-2 flex flex-wrap gap-1.5">
        {category.skills.map((skill, i) => (
          <Badge key={i} variant="secondary" className="gap-1 pr-1 text-xs">
            {skill}
            <button type="button" onClick={() => handleRemoveSkill(i)} className="hover:text-destructive rounded-sm p-0.5">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
          placeholder="Add skill..."
          className="h-7 text-xs"
        />
        <Button variant="outline" size="sm" onClick={handleAddSkill} disabled={isPending || !newSkill.trim()} className="h-7 text-xs">
          Add
        </Button>
      </div>
    </div>
  )
}
