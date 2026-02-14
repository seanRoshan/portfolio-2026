'use client'

import { useTransition } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { updateResumeSettings } from '@/app/admin/resume-builder/actions'
import type { ResumeSettings } from '@/types/resume-builder'

const fontOptions = [
  { value: 'inter', label: 'Inter (Modern Sans)' },
  { value: 'source_sans', label: 'Source Sans (Clean Sans)' },
  { value: 'lato', label: 'Lato (Friendly Sans)' },
  { value: 'georgia', label: 'Georgia (Classic Serif)' },
  { value: 'garamond', label: 'Garamond (Elegant Serif)' },
  { value: 'source_code', label: 'Source Code Pro (Monospace)' },
]

const densityOptions = [
  { value: 'compact', label: 'Compact' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'spacious', label: 'Spacious' },
]

const dateFormatOptions = [
  { value: 'full', label: 'September 2024' },
  { value: 'month_year', label: 'Sep 2024' },
  { value: 'year_only', label: '2024' },
]

interface Props {
  resumeId: string
  settings: ResumeSettings | null
  sectionOrder: string[]
}

export function SettingsPanel({ resumeId, settings }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleUpdate(field: string, value: unknown) {
    startTransition(async () => {
      try {
        await updateResumeSettings(resumeId, { [field]: value })
        toast.success('Settings saved')
      } catch {
        toast.error('Failed to update')
      }
    })
  }

  return (
    <div className="space-y-6 pt-4">
      <div>
        <Label className="text-sm font-medium">Accent Color</Label>
        <div className="mt-1 flex items-center gap-2">
          <Input
            type="color"
            defaultValue={settings?.accent_color ?? '#000000'}
            onChange={(e) => handleUpdate('accent_color', e.target.value)}
            className="h-8 w-12 cursor-pointer p-0.5"
          />
          <Input
            defaultValue={settings?.accent_color ?? '#000000'}
            onBlur={(e) => handleUpdate('accent_color', e.target.value)}
            className="h-8 w-24 font-mono text-xs"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium">Font Family</Label>
        <Select
          defaultValue={settings?.font_family ?? 'inter'}
          onValueChange={(v) => handleUpdate('font_family', v)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontOptions.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">Density</Label>
        <Select
          defaultValue={settings?.font_size_preset ?? 'comfortable'}
          onValueChange={(v) => handleUpdate('font_size_preset', v)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {densityOptions.map((d) => (
              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">Date Format</Label>
        <Select
          defaultValue={settings?.date_format ?? 'month_year'}
          onValueChange={(v) => handleUpdate('date_format', v)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dateFormatOptions.map((d) => (
              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">Page Limit</Label>
        <Select
          defaultValue={String(settings?.page_limit ?? 2)}
          onValueChange={(v) => handleUpdate('page_limit', parseInt(v))}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Page</SelectItem>
            <SelectItem value="2">2 Pages</SelectItem>
            <SelectItem value="3">3 Pages</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
