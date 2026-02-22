'use client'

import { useTransition, useState, useEffect } from 'react'
import {
  Palette,
  Type,
  Rows3,
  Calendar,
  FileText,
  Eye,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  updateResumeSettings,
  fetchPromptsByCategory,
  getResumePromptOverrides,
  saveResumePromptOverride,
  deleteResumePromptOverride,
} from '@/app/admin/resume-builder/actions'
import type { ResumeSettings } from '@/types/resume-builder'
import type { AIPrompt, ResumePromptOverride } from '@/types/ai-prompts'

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

      <SettingRow icon={Type} label="Font Size" description="Base font size for body text (8-12pt)">
        <div className="flex items-center gap-3">
          <Slider
            defaultValue={[settings?.font_size_base ?? 10]}
            min={8}
            max={12}
            step={0.5}
            onValueCommit={([v]) => handleUpdate('font_size_base', v)}
            disabled={isPending}
            className="flex-1"
          />
          <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
            {settings?.font_size_base ?? 10}pt
          </span>
        </div>
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

      {/* AI Prompts */}
      <SectionHeader title="AI Prompts" />

      <SettingRow icon={Sparkles} label="Prompt Overrides" description="Customize AI prompts for this resume">
        <AIPromptsOverrides resumeId={resumeId} />
      </SettingRow>
    </div>
  )
}

function AIPromptsOverrides({ resumeId }: { resumeId: string }) {
  const [prompts, setPrompts] = useState<AIPrompt[]>([])
  const [overrides, setOverrides] = useState<ResumePromptOverride[]>([])
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    Promise.all([
      fetchPromptsByCategory(),
      getResumePromptOverrides(resumeId),
    ]).then(([p, o]) => {
      setPrompts(p)
      setOverrides(o)
    }).catch(() => {})
  }, [resumeId])

  const overrideMap = new Map(overrides.map((o) => [o.prompt_slug, o]))

  function handleSave(slug: string, systemPrompt: string, userTemplate: string) {
    startTransition(async () => {
      try {
        await saveResumePromptOverride(resumeId, slug, {
          system_prompt: systemPrompt || null,
          user_prompt_template: userTemplate || null,
        })
        // Update local state
        const existing = overrideMap.get(slug)
        if (existing) {
          setOverrides((prev) =>
            prev.map((o) =>
              o.prompt_slug === slug
                ? { ...o, system_prompt: systemPrompt, user_prompt_template: userTemplate }
                : o
            )
          )
        } else {
          setOverrides((prev) => [
            ...prev,
            {
              id: 'temp',
              resume_id: resumeId,
              prompt_slug: slug,
              system_prompt: systemPrompt,
              user_prompt_template: userTemplate,
              model: null,
              max_tokens: null,
            },
          ])
        }
        toast.success('Override saved')
      } catch {
        toast.error('Failed to save override')
      }
    })
  }

  function handleReset(slug: string) {
    startTransition(async () => {
      try {
        await deleteResumePromptOverride(resumeId, slug)
        setOverrides((prev) => prev.filter((o) => o.prompt_slug !== slug))
        toast.success('Reset to default')
      } catch {
        toast.error('Failed to reset')
      }
    })
  }

  if (prompts.length === 0) {
    return (
      <p className="text-muted-foreground text-xs">Loading prompts...</p>
    )
  }

  return (
    <div className="space-y-2">
      {prompts.map((p) => {
        const override = overrideMap.get(p.slug)
        const isCustom = !!override
        const isExpanded = expandedSlug === p.slug

        return (
          <div key={p.slug} className="rounded-md border">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs"
              onClick={() =>
                setExpandedSlug(isExpanded ? null : p.slug)
              }
            >
              <span className="flex-1 font-medium">{p.name}</span>
              <Badge
                variant={isCustom ? 'default' : 'secondary'}
                className="text-[9px]"
              >
                {isCustom ? 'Custom' : 'Default'}
              </Badge>
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
            {isExpanded && (
              <PromptOverrideEditor
                prompt={p}
                override={override ?? null}
                onSave={(sys, user) => handleSave(p.slug, sys, user)}
                onReset={() => handleReset(p.slug)}
                isPending={isPending}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function PromptOverrideEditor({
  prompt,
  override,
  onSave,
  onReset,
  isPending,
}: {
  prompt: AIPrompt
  override: ResumePromptOverride | null
  onSave: (systemPrompt: string, userTemplate: string) => void
  onReset: () => void
  isPending: boolean
}) {
  const [systemPrompt, setSystemPrompt] = useState(
    override?.system_prompt ?? prompt.system_prompt
  )
  const [userTemplate, setUserTemplate] = useState(
    override?.user_prompt_template ?? prompt.user_prompt_template
  )

  return (
    <div className="space-y-3 border-t px-3 py-2">
      <div className="space-y-1">
        <Label className="text-[11px]">System Prompt</Label>
        <Textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={4}
          className="font-mono text-[11px]"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px]">User Prompt Template</Label>
        <Textarea
          value={userTemplate}
          onChange={(e) => setUserTemplate(e.target.value)}
          rows={3}
          className="font-mono text-[11px]"
        />
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-6 text-[11px]"
          onClick={() => onSave(systemPrompt, userTemplate)}
          disabled={isPending}
        >
          Save Override
        </Button>
        {override && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px]"
            onClick={() => {
              setSystemPrompt(prompt.system_prompt)
              setUserTemplate(prompt.user_prompt_template)
              onReset()
            }}
            disabled={isPending}
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset to Default
          </Button>
        )}
      </div>
    </div>
  )
}
