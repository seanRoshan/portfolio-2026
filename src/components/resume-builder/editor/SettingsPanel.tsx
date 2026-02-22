'use client'

import { useTransition } from 'react'
import {
  Palette,
  Type,
  Rows3,
  Calendar,
  FileText,
  Eye,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { updateResumeSettings } from '@/app/admin/resume-builder/actions'
import type { ResumeSettings } from '@/types/resume-builder'

const fontOptions = [
  { value: 'inter', label: 'Inter', desc: 'Modern Sans' },
  { value: 'source_sans', label: 'Source Sans', desc: 'Clean Sans' },
  { value: 'lato', label: 'Lato', desc: 'Friendly Sans' },
  { value: 'georgia', label: 'Georgia', desc: 'Classic Serif' },
  { value: 'garamond', label: 'Garamond', desc: 'Elegant Serif' },
  { value: 'source_code', label: 'Source Code Pro', desc: 'Monospace' },
]

const densityOptions = [
  { value: 'compact', label: 'Compact', desc: 'Tight spacing, more content per page' },
  { value: 'comfortable', label: 'Comfortable', desc: 'Balanced spacing (recommended)' },
  { value: 'spacious', label: 'Spacious', desc: 'Generous whitespace, easier to scan' },
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

function SettingRow({
  icon: Icon,
  label,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="text-muted-foreground h-4 w-4 shrink-0" />
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          {description && (
            <p className="text-muted-foreground text-[11px] leading-tight">
              {description}
            </p>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
        {title}
      </span>
      <div className="bg-border h-px flex-1" />
    </div>
  )
}

const sectionNames: Record<string, string> = {
  contact: 'Contact Info',
  summary: 'Summary',
  experience: 'Work Experience',
  skills: 'Skills',
  education: 'Education',
  projects: 'Projects',
  certifications: 'Certifications',
  extracurriculars: 'Activities',
}

export function SettingsPanel({ resumeId, settings, sectionOrder }: Props) {
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

  const accentColor = settings?.accent_color ?? '#000000'
  const hiddenSet = new Set(settings?.hidden_sections ?? [])

  return (
    <div className="space-y-5 pt-4">
      {/* Appearance Section */}
      <SectionHeader title="Appearance" />

      <SettingRow icon={Palette} label="Accent Color" description="Headers, links, and highlights">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              type="color"
              defaultValue={accentColor}
              onChange={(e) => handleUpdate('accent_color', e.target.value)}
              className="h-9 w-12 cursor-pointer border-2 p-0.5"
            />
          </div>
          <Input
            key={accentColor}
            defaultValue={accentColor}
            onBlur={(e) => {
              const val = e.target.value.trim()
              if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                handleUpdate('accent_color', val)
              }
            }}
            className="h-9 w-24 font-mono text-xs uppercase"
            placeholder="#000000"
          />
          <div
            className="h-9 w-9 shrink-0 rounded-md border"
            style={{ backgroundColor: accentColor }}
          />
        </div>
      </SettingRow>

      <SettingRow icon={Type} label="Font Family" description="Typography used throughout the resume">
        <Select
          defaultValue={settings?.font_family ?? 'inter'}
          onValueChange={(v) => handleUpdate('font_family', v)}
          disabled={isPending}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontOptions.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                <span>{f.label}</span>
                <span className="text-muted-foreground ml-2 text-xs">({f.desc})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      {/* Layout Section */}
      <SectionHeader title="Layout" />

      <SettingRow icon={Rows3} label="Density" description="Controls spacing between sections">
        <Select
          defaultValue={settings?.font_size_preset ?? 'comfortable'}
          onValueChange={(v) => handleUpdate('font_size_preset', v)}
          disabled={isPending}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {densityOptions.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow icon={Calendar} label="Date Format" description="How dates appear in experience and education">
        <Select
          defaultValue={settings?.date_format ?? 'month_year'}
          onValueChange={(v) => handleUpdate('date_format', v)}
          disabled={isPending}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dateFormatOptions.map((d) => (
              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow icon={FileText} label="Page Limit" description="Maximum number of pages for PDF export">
        <Select
          defaultValue={String(settings?.page_limit ?? 2)}
          onValueChange={(v) => handleUpdate('page_limit', parseInt(v))}
          disabled={isPending}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Page</SelectItem>
            <SelectItem value="2">2 Pages</SelectItem>
            <SelectItem value="3">3 Pages</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>

      {/* Sections */}
      <SectionHeader title="Sections" />

      <SettingRow icon={Eye} label="Section Visibility" description="Toggle which sections appear on the resume">
        <div className="space-y-3">
          {sectionOrder.map((section) => (
            <div key={section} className="flex items-center justify-between">
              <Label className="text-sm">{sectionNames[section] ?? section}</Label>
              <Switch
                checked={!hiddenSet.has(section)}
                onCheckedChange={(checked) => {
                  const newHidden = checked
                    ? (settings?.hidden_sections ?? []).filter((s) => s !== section)
                    : [...(settings?.hidden_sections ?? []), section]
                  handleUpdate('hidden_sections', newHidden)
                }}
                disabled={section === 'contact' || isPending}
              />
            </div>
          ))}
        </div>
      </SettingRow>
    </div>
  )
}
