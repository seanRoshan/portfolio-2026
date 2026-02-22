'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowLeft,
  Download,
  Eye,
  EyeOff,
  GripVertical,
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
import { updateResumeTemplate, updateResumeSettings } from '@/app/admin/resume-builder/actions'
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
import { scoreResume } from '@/lib/resume-builder/ai/services'
import type { ResumeWithRelations, ResumeTemplate } from '@/types/resume-builder'

function SortableSection({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-start gap-1">
        <button
          {...attributes}
          {...listeners}
          className="mt-3 shrink-0 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}

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
    if (criticalCount > 0) {
      toast.warning('Resume has issues — PDF may have missing data', {
        description: validationResults
          .filter((r) => r.severity === 'critical')
          .map((r) => r.message)
          .join(', '),
      })
    }
    setIsGeneratingPdf(true)
    try {
      const res = await fetch(`/api/resume-builder/pdf?resumeId=${resume.id}`)
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error || `PDF generation failed (${res.status})`)
      }

      const blob = await res.blob()
      const name = resume.contact_info?.full_name?.replace(/\s+/g, '_') || 'Resume'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name}_Resume.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate PDF')
    } finally {
      setIsGeneratingPdf(false)
    }
  }, [resume.id, resume.contact_info?.full_name, criticalCount, validationResults])

  const sectionOrder = resume.settings?.section_order ?? [
    'contact', 'summary', 'experience', 'education',
    'skills', 'projects', 'certifications', 'extracurriculars',
  ]
  const hiddenSections = new Set(resume.settings?.hidden_sections ?? [])
  const [currentOrder, setCurrentOrder] = useState<string[]>(sectionOrder)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = currentOrder.indexOf(active.id as string)
    const newIndex = currentOrder.indexOf(over.id as string)
    const newOrder = arrayMove(currentOrder, oldIndex, newIndex)
    setCurrentOrder(newOrder)

    try {
      await updateResumeSettings(resume.id, { section_order: newOrder })
    } catch {
      toast.error('Failed to save section order')
      setCurrentOrder(sectionOrder) // revert
    }
  }, [currentOrder, resume.id, sectionOrder])

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

  const visibleSections = currentOrder.filter((s) => !hiddenSections.has(s))

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
          {(() => {
            const score = scoreResume(resume)
            const variant = score.grade === 'A' || score.grade === 'B' ? 'secondary' : 'destructive'
            return (
              <Badge variant={variant} className="text-xs">
                {score.grade} &middot; {score.overall}
              </Badge>
            )
          })()}
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
            <SheetContent className="overflow-y-auto px-5">
              <SheetTitle>Resume Settings</SheetTitle>
              <SettingsPanel
                resumeId={resume.id}
                settings={resume.settings}
                sectionOrder={sectionOrder}
              />
            </SheetContent>
          </Sheet>

          {/* Mobile preview button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 md:hidden">
                <Eye className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh] p-0">
              <SheetTitle className="sr-only">Resume Preview</SheetTitle>
              <div className="h-full overflow-auto bg-gray-100 p-4 dark:bg-gray-900">
                <ResumePreviewPane resume={resume} />
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop preview toggle */}
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
            disabled={isGeneratingPdf}
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={visibleSections} strategy={verticalListSortingStrategy}>
                {visibleSections.map((sectionId) => (
                  <SortableSection key={sectionId} id={sectionId}>
                    {sectionMap[sectionId]}
                  </SortableSection>
                ))}
              </SortableContext>
            </DndContext>
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
