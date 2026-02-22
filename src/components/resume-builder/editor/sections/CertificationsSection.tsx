'use client'

import { useTransition } from 'react'
import { Award, Plus, Trash2 } from 'lucide-react'
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
import { addCertification, updateCertification, deleteCertification } from '@/app/admin/resume-builder/actions'
import { EditorSection } from '../EditorSection'
import type { ResumeCertification } from '@/types/resume-builder'

interface Props {
  resumeId: string
  certifications: ResumeCertification[]
}

export function CertificationsSection({ resumeId, certifications }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleAdd() {
    startTransition(async () => {
      try {
        await addCertification(resumeId)
        toast.success('Certification added')
      } catch {
        toast.error('Failed to add certification')
      }
    })
  }

  return (
    <EditorSection
      title="Certifications"
      icon={Award}
      id="certifications"
      action={
        <Button variant="ghost" size="sm" onClick={handleAdd} disabled={isPending} className="h-5 px-1.5 text-[11px]">
          <Plus className="mr-0.5 h-3 w-3" />
          Add
        </Button>
      }
    >
      <div className="space-y-3">
        {certifications.length === 0 && (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No certifications added yet.
          </p>
        )}

        {certifications.map((cert) => (
          <CertificationCard key={cert.id} cert={cert} resumeId={resumeId} />
        ))}
      </div>
    </EditorSection>
  )
}

function CertificationCard({ cert, resumeId }: { cert: ResumeCertification; resumeId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleUpdate(field: string, value: unknown) {
    startTransition(async () => {
      try {
        await updateCertification(cert.id, resumeId, { [field]: value })
      } catch {
        toast.error('Failed to update')
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteCertification(cert.id, resumeId)
        toast.success('Certification removed')
      } catch {
        toast.error('Failed to delete')
      }
    })
  }

  return (
    <div className="flex items-start gap-2 rounded-lg border p-3">
      <div className="grid flex-1 gap-2 sm:grid-cols-3">
        <Input defaultValue={cert.name} onBlur={(e) => handleUpdate('name', e.target.value)} placeholder="AWS Solutions Architect" className="text-sm" />
        <Input defaultValue={cert.issuer ?? ''} onBlur={(e) => handleUpdate('issuer', e.target.value)} placeholder="Amazon" className="text-sm" />
        <Input type="month" defaultValue={cert.date?.slice(0, 7) ?? ''} onBlur={(e) => handleUpdate('date', e.target.value ? `${e.target.value}-01` : null)} className="text-sm" />
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending} className="text-destructive h-8 w-8 shrink-0">
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
