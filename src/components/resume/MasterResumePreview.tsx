'use client'

import { useState, useMemo, useTransition } from 'react'
import {
  FileDown,
  Loader2,
  LayoutTemplate,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ResumePreviewPane } from '@/components/resume-builder/templates/ResumePreviewPane'
import { toast } from 'sonner'
import type { AdditionalSectionEntry } from '@/types/database'
import type { ResumeWithRelations, ResumeTemplate } from '@/types/resume-builder'

// Template metadata (matches the seeded resume_templates rows)
const TEMPLATES: { id: string; name: string; description: string; layout: 'single_column' | 'two_column' }[] = [
  {
    id: 'a1b2c3d4-0001-4000-8000-000000000001',
    name: 'Pragmatic',
    description: 'Classic single-column',
    layout: 'single_column',
  },
  {
    id: 'a1b2c3d4-0002-4000-8000-000000000002',
    name: 'Mono',
    description: 'Monospace code-editor',
    layout: 'single_column',
  },
  {
    id: 'a1b2c3d4-0003-4000-8000-000000000003',
    name: 'Smarkdown',
    description: 'Markdown-inspired',
    layout: 'single_column',
  },
  {
    id: 'a1b2c3d4-0004-4000-8000-000000000004',
    name: 'CareerCup',
    description: 'Dense Big Tech style',
    layout: 'single_column',
  },
  {
    id: 'a1b2c3d4-0005-4000-8000-000000000005',
    name: 'Parker',
    description: 'Two-column dark sidebar',
    layout: 'two_column',
  },
  {
    id: 'a1b2c3d4-0006-4000-8000-000000000006',
    name: 'Experienced',
    description: 'Two-column professional',
    layout: 'two_column',
  },
]

const SECTION_LABELS: Record<string, string> = {
  summary: 'Summary',
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
  certifications: 'Certifications',
  additional: 'Additional Sections',
}

const DEFAULT_SECTIONS = ['summary', 'skills', 'experience', 'education', 'certifications', 'additional']

interface MasterResumePreviewProps {
  data: {
    full_name: string
    title: string
    email: string | null
    phone: string | null
    location: string | null
    website: string | null
    linkedin: string | null
    github: string | null
    summary: string | null
    additional_sections: AdditionalSectionEntry[]
  }
  skills: { category: string; skills: string[] }[]
  experience: {
    company: string
    role: string
    location: string | null
    period: string
    start_date: string
    end_date: string | null
    achievements: string[]
  }[]
  education: {
    school: string
    degree: string
    field: string | null
    year: string | null
    details: string | null
  }[]
  certifications: {
    name: string
    issuer: string
    year: string | null
    url: string | null
  }[]
}

export function MasterResumePreview({
  data,
  skills,
  experience,
  education,
  certifications,
}: MasterResumePreviewProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(TEMPLATES[0].id)
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set())
  const [isPdfPending, startPdfTransition] = useTransition()

  // Convert old resume data shape into ResumeWithRelations for the template components
  const resumeWithRelations: ResumeWithRelations = useMemo(() => {
    const sectionOrder = DEFAULT_SECTIONS
      .filter((s) => s !== 'additional')
      .map((s) => {
        // Map our section names to the resume-builder section names
        if (s === 'skills') return 'skills'
        if (s === 'experience') return 'experience'
        if (s === 'education') return 'education'
        if (s === 'certifications') return 'certifications'
        if (s === 'summary') return 'summary'
        return s
      })

    const hidden = Array.from(hiddenSections).map((s) => {
      // Map back for the builder format
      return s
    })

    return {
      id: 'master-preview',
      user_id: null,
      title: 'Master Resume',
      template_id: selectedTemplateId,
      experience_level: null,
      target_role: null,
      company_name: null,
      job_location: null,
      work_mode: null,
      job_description_text: null,
      is_master: true,
      parent_resume_id: null,
      short_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      template: null,
      contact_info: {
        id: 'ci-preview',
        resume_id: 'master-preview',
        full_name: data.full_name || 'Your Name',
        email: data.email,
        phone: data.phone,
        city: data.location,
        state: null,
        country: null,
        linkedin_url: data.linkedin,
        github_url: data.github,
        portfolio_url: data.website,
        blog_url: null,
      },
      summary: {
        id: 'sum-preview',
        resume_id: 'master-preview',
        text: data.summary,
        is_visible: !hiddenSections.has('summary') && !!data.summary,
      },
      work_experiences: hiddenSections.has('experience')
        ? []
        : experience.map((exp, i) => ({
            id: `exp-preview-${i}`,
            resume_id: 'master-preview',
            job_title: exp.role,
            company: exp.company,
            location: exp.location,
            start_date: exp.start_date,
            end_date: exp.end_date,
            is_promotion: false,
            is_visible: true,
            parent_experience_id: null,
            sort_order: i,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            achievements: exp.achievements.map((text, j) => ({
              id: `ach-preview-${i}-${j}`,
              parent_id: `exp-preview-${i}`,
              parent_type: 'work' as const,
              text,
              has_metric: false,
              sort_order: j,
              created_at: new Date().toISOString(),
            })),
          })),
      skill_categories: hiddenSections.has('skills')
        ? []
        : skills.map((group, i) => ({
            id: `skill-preview-${i}`,
            resume_id: 'master-preview',
            name: group.category,
            skills: group.skills,
            sort_order: i,
          })),
      education: hiddenSections.has('education')
        ? []
        : education.map((edu, i) => ({
            id: `edu-preview-${i}`,
            resume_id: 'master-preview',
            degree: edu.degree,
            institution: edu.school,
            field_of_study: edu.field,
            graduation_date: edu.year ? `${edu.year}-01-01` : null,
            gpa: null,
            relevant_coursework: null,
            honors: edu.details,
            sort_order: i,
            created_at: new Date().toISOString(),
          })),
      projects: [],
      certifications: hiddenSections.has('certifications')
        ? []
        : certifications.map((cert, i) => ({
            id: `cert-preview-${i}`,
            resume_id: 'master-preview',
            name: cert.name,
            issuer: cert.issuer,
            date: cert.year ? `${cert.year}-01-01` : null,
            sort_order: i,
          })),
      extracurriculars: hiddenSections.has('additional')
        ? []
        : data.additional_sections.flatMap((section, i) =>
            section.items.map((item, j) => ({
              id: `extra-preview-${i}-${j}`,
              resume_id: 'master-preview',
              type: null,
              title: `${section.title}: ${item}`,
              description: null,
              url: null,
              sort_order: i * 100 + j,
            }))
          ),
      settings: {
        id: 'settings-preview',
        resume_id: 'master-preview',
        accent_color: '#000000',
        font_family: 'inter',
        font_size_preset: 'comfortable',
        date_format: 'month_year',
        section_order: ['contact', 'summary', 'experience', 'skills', 'education', 'certifications', 'extracurriculars'],
        hidden_sections: hidden,
        page_limit: 2,
      },
    }
  }, [data, skills, experience, education, certifications, selectedTemplateId, hiddenSections])

  function toggleSection(section: string) {
    setHiddenSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  function handleDownloadPdf() {
    startPdfTransition(async () => {
      try {
        const response = await fetch(
          `/api/resume/preview-pdf?templateId=${selectedTemplateId}&hiddenSections=${Array.from(hiddenSections).join(',')}`
        )
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to generate PDF')
        }
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${data.full_name.replace(/\s+/g, '_') || 'Resume'}_Resume.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('PDF downloaded')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to generate PDF')
      }
    })
  }

  const selectedTemplate = TEMPLATES.find((t) => t.id === selectedTemplateId)

  return (
    <div className="flex flex-col gap-3">
      {/* Template selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="text-muted-foreground h-4 w-4" />
          <Label className="text-sm font-medium">Template</Label>
        </div>
        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEMPLATES.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {t.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Section visibility */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Eye className="text-muted-foreground h-4 w-4" />
          <Label className="text-sm font-medium">Visible Sections</Label>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {DEFAULT_SECTIONS.map((section) => {
            const isVisible = !hiddenSections.has(section)
            return (
              <label
                key={section}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <Switch
                  checked={isVisible}
                  onCheckedChange={() => toggleSection(section)}
                  className="h-4 w-7 [&>span]:h-3 [&>span]:w-3"
                />
                <span className={isVisible ? '' : 'text-muted-foreground line-through'}>
                  {SECTION_LABELS[section]}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {/* PDF Download */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadPdf}
        disabled={isPdfPending}
        className="w-full"
      >
        {isPdfPending ? (
          <>
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            Generating PDF...
          </>
        ) : (
          <>
            <FileDown className="mr-1.5 h-4 w-4" />
            Download as {selectedTemplate?.name ?? 'PDF'}
          </>
        )}
      </Button>

      {/* Preview */}
      <div className="rounded-lg border bg-gray-50" style={{ height: 'calc(100vh - 380px)', minHeight: '400px' }}>
        <ResumePreviewPane resume={resumeWithRelations} />
      </div>
    </div>
  )
}
