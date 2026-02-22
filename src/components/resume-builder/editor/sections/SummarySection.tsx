'use client'

import { useTransition, useState } from 'react'
import { AlignLeft } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { updateSummary } from '@/app/admin/resume-builder/actions'
import { EditorSection } from '../EditorSection'
import { AIAssistButton } from '../AIAssistButton'
import type { ResumeSummary } from '@/types/resume-builder'

interface Props {
  resumeId: string
  summary: ResumeSummary | null
}

export function SummarySection({ resumeId, summary }: Props) {
  const [isPending, startTransition] = useTransition()
  const [text, setText] = useState(summary?.text ?? '')
  const [isVisible, setIsVisible] = useState(summary?.is_visible ?? true)
  const [isDirty, setIsDirty] = useState(false)

  function handleSave() {
    startTransition(async () => {
      try {
        await updateSummary(resumeId, { text, is_visible: isVisible })
        setIsDirty(false)
        toast.success('Summary saved')
      } catch {
        toast.error('Failed to save summary')
      }
    })
  }

  return (
    <EditorSection
      title="Professional Summary"
      icon={AlignLeft}
      id="summary"
      badge={!isVisible ? 'Hidden' : undefined}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">
            1-3 sentences highlighting your key strengths and career goals.
          </Label>
          <div className="flex items-center gap-2">
            <Label htmlFor="summary-visible" className="text-xs">
              Visible
            </Label>
            <Switch
              id="summary-visible"
              checked={isVisible}
              onCheckedChange={(v) => {
                setIsVisible(v)
                setIsDirty(true)
              }}
            />
          </div>
        </div>

        <div className="relative">
          <Textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setIsDirty(true)
            }}
            placeholder="Experienced software engineer with 5+ years building scalable web applications..."
            rows={4}
            maxLength={500}
          />
          <span className="text-muted-foreground absolute bottom-2 right-2 text-xs">
            {text.length}/500
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleSave}
            disabled={isPending || !isDirty}
            size="sm"
          >
            {isPending ? 'Saving...' : 'Save Summary'}
          </Button>
          <AIAssistButton
            category="summary"
            currentText={text}
            context={{}}
            resumeId={resumeId}
            onAccept={(newText) => {
              setText(newText)
              setIsDirty(true)
            }}
          />
        </div>
      </div>
    </EditorSection>
  )
}
