'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  Eye,
  EyeOff,
  Settings2,
  Palette,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { updateResumeTemplate } from '@/app/admin/resume-builder/actions'
import { ContactInfoSection } from './sections/ContactInfoSection'
import { SummarySection } from './sections/SummarySection'
import { WorkExperienceSection } from './sections/WorkExperienceSection'
import { EducationSection } from './sections/EducationSection'
import { SkillsSection } from './sections/SkillsSection'
import { ProjectsSection } from './sections/ProjectsSection'
import { CertificationsSection } from './sections/CertificationsSection'
import { ExtracurricularsSection } from './sections/ExtracurricularsSection'
import { SettingsPanel } from './SettingsPanel'
import { ResumePreviewPane } from '../templates/ResumePreviewPane'
import { validateResume } from '@/lib/resume-builder/validation/rules'
import type { ResumeWithRelations, ResumeTemplate } from '@/types/resume-builder'

interface ResumeEditorProps {
  resume: ResumeWithRelations
  templates: ResumeTemplate[]
}

export function ResumeEditor({ resume, templates }: ResumeEditorProps) {
  const [showPreview, setShowPreview] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const validationResults = validateResume(resume)
  const criticalCount = validationResults.filter(
    (r) => r.severity === 'critical'
  ).length
  const warningCount = validationResults.filter(
    (r) => r.severity === 'warning'
  ).length

  const handleTemplateChange = useCallback(
    async (templateId: string) => {
      try {
        await updateResumeTemplate(resume.id, templateId)
        toast.success('Template updated')
      } catch {
        toast.error('Failed to update template')
      }
    },
    [resume.id]
  )

  const handleDownloadPdf = useCallback(async () => {
    setIsGeneratingPdf(true)
    try {
      const res = await fetch(`/api/resume-builder/pdf?resumeId=${resume.id}`)
      if (!res.ok) throw new Error('PDF generation failed')

      const blob = await res.blob()
      const name = resume.contact_info?.full_name?.replace(/\s+/g, '_') || 'Resume'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name}_Resume.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded')
    } catch {
      toast.error('Failed to generate PDF')
    } finally {
      setIsGeneratingPdf(false)
    }
  }, [resume.id, resume.contact_info?.full_name])

  const sectionMap: Record<string, React.ReactNode> = {
    contact: (
      <ContactInfoSection
        key="contact"
        resumeId={resume.id}
        contactInfo={resume.contact_info}
      />
    ),
    summary: (
      <SummarySection
        key="summary"
        resumeId={resume.id}
        summary={resume.summary}
      />
    ),
    experience: (
      <WorkExperienceSection
        key="experience"
        resumeId={resume.id}
        experiences={resume.work_experiences}
      />
    ),
    education: (
      <EducationSection
        key="education"
        resumeId={resume.id}
        entries={resume.education}
      />
    ),
    skills: (
      <SkillsSection
        key="skills"
        resumeId={resume.id}
        categories={resume.skill_categories}
      />
    ),
    projects: (
      <ProjectsSection
        key="projects"
        resumeId={resume.id}
        projects={resume.projects}
      />
    ),
    certifications: (
      <CertificationsSection
        key="certifications"
        resumeId={resume.id}
        certifications={resume.certifications}
      />
    ),
    extracurriculars: (
      <ExtracurricularsSection
        key="extracurriculars"
        resumeId={resume.id}
        items={resume.extracurriculars}
      />
    ),
  }

  const sectionOrder = resume.settings?.section_order ?? Object.keys(sectionMap)
  const hiddenSections = new Set(resume.settings?.hidden_sections ?? [])

  return (
    <div className="flex h-screen flex-col">
      {/* Top Bar */}
      <header className="bg-background flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <Link href="/admin/resume-builder">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        <h1 className="line-clamp-1 text-sm font-semibold">
          {resume.title}
        </h1>

        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {criticalCount} critical
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {warningCount} warnings
            </Badge>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Select
            value={resume.template_id ?? ''}
            onValueChange={handleTemplateChange}
          >
            <SelectTrigger className="h-8 w-40 text-xs">
              <Palette className="mr-1.5 h-3.5 w-3.5" />
              <SelectValue placeholder="Template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                  {t.layout === 'two_column' && ' (2-col)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Sheet open={showSettings} onOpenChange={setShowSettings}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Settings2 className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle>Resume Settings</SheetTitle>
              <SettingsPanel
                resumeId={resume.id}
                settings={resume.settings}
                sectionOrder={sectionOrder}
              />
            </SheetContent>
          </Sheet>

          <Button
            variant="outline"
            size="icon"
            className="hidden h-8 w-8 md:flex"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>

          <Button
            size="sm"
            className="h-8"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf || criticalCount > 0}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {isGeneratingPdf ? 'Generating...' : 'PDF'}
          </Button>
        </div>
      </header>

      {/* Editor + Preview */}
      <div className="flex min-h-0 flex-1">
        {/* Editor Panel */}
        <ScrollArea className={showPreview ? 'w-1/2 border-r' : 'w-full'}>
          <div className="max-w-2xl space-y-6 p-4 md:p-6">
            {sectionOrder
              .filter((s) => !hiddenSections.has(s))
              .map((sectionId) => sectionMap[sectionId])}
          </div>
        </ScrollArea>

        {/* Preview Panel */}
        {showPreview && (
          <div className="hidden w-1/2 bg-gray-100 dark:bg-gray-900 md:block">
            <ResumePreviewPane resume={resume} />
          </div>
        )}
      </div>
    </div>
  )
}
