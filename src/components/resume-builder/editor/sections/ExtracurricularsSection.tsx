'use client'

import { useTransition } from 'react'
import { Star, Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { addExtracurricular, updateExtracurricular, deleteExtracurricular } from '@/app/admin/resume-builder/actions'
import { EditorSection } from '../EditorSection'
import type { ResumeExtracurricular, ExtracurricularType } from '@/types/resume-builder'

const typeLabels: Record<ExtracurricularType, string> = {
  patent: 'Patent',
  publication: 'Publication',
  talk: 'Talk / Conference',
  open_source: 'Open Source',
  community: 'Community',
  other: 'Other',
}

interface Props {
  resumeId: string
  items: ResumeExtracurricular[]
}

export function ExtracurricularsSection({ resumeId, items }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleAdd() {
    startTransition(async () => {
      try {
        await addExtracurricular(resumeId)
        toast.success('Item added')
      } catch {
        toast.error('Failed to add')
      }
    })
  }

  return (
    <EditorSection
      title="Extracurricular Activities"
      icon={Star}
      id="extracurriculars"
      action={
        <Button variant="ghost" size="sm" onClick={handleAdd} disabled={isPending} className="h-7 text-xs">
          <Plus className="mr-1 h-3 w-3" />
          Add
        </Button>
      }
    >
      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No extracurricular activities. Add patents, publications, talks, or open source contributions.
          </p>
        )}

        {items.map((item) => (
          <ExtracurricularCard key={item.id} item={item} resumeId={resumeId} />
        ))}
      </div>
    </EditorSection>
  )
}

function ExtracurricularCard({ item, resumeId }: { item: ResumeExtracurricular; resumeId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleUpdate(field: string, value: unknown) {
    startTransition(async () => {
      try {
        await updateExtracurricular(item.id, resumeId, { [field]: value })
      } catch {
        toast.error('Failed to update')
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteExtracurricular(item.id, resumeId)
        toast.success('Item removed')
      } catch {
        toast.error('Failed to delete')
      }
    })
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex gap-2">
        <Select defaultValue={item.type ?? 'other'} onValueChange={(v) => handleUpdate('type', v)}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(typeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input defaultValue={item.title} onBlur={(e) => handleUpdate('title', e.target.value)} placeholder="Title" className="h-8 flex-1 text-sm" />
        <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isPending} className="h-8 w-8 shrink-0">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Textarea defaultValue={item.description ?? ''} onBlur={(e) => handleUpdate('description', e.target.value || null)} placeholder="Brief description..." rows={2} className="resize-none text-xs" />
      <Input defaultValue={item.url ?? ''} onBlur={(e) => handleUpdate('url', e.target.value || null)} placeholder="URL (optional)" className="mt-2 h-7 text-xs" />
    </div>
  )
}
