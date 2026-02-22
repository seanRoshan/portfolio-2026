'use client'

import { useState, useCallback, useTransition } from 'react'
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
  Briefcase,
  Check,
  Download,
  Eye,
  EyeOff,
  GripVertical,
  Settings2,
  Palette,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { updateResumeTemplate, updateResumeSettings, updateResumeMetadata } from '@/app/admin/resume-builder/actions'
import { ContactInfoSection } from './sections/ContactInfoSection'
import { SummarySection } from './sections/SummarySection'
import { WorkExperienceSection } from './sections/WorkExperienceSection'
import { EducationSection } from './sections/EducationSection'
import { SkillsSection } from './sections/SkillsSection'
import { ProjectsSection } from './sections/ProjectsSection'
import { CertificationsSection } from './sections/CertificationsSection'
import { ExtracurricularsSection } from './sections/ExtracurricularsSection'
import { SettingsPanel } from './SettingsPanel'
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels'
import { ResumePreviewPane } from '../templates/ResumePreviewPane'
import { ScorePanel } from './ScorePanel'
import { OptimizeDialog } from './OptimizeDialog'
import type { ResumeWithRelations, ResumeTemplate } from '@/types/resume-builder'

function SortableSection({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} className="group/section relative rounded-lg border border-transparent transition-colors hover:border-border/50">
      <div className="flex gap-2 px-1 pt-1">
        <button
          {...attributes}
          {...listeners}
          className="mt-2.5 flex h-7 w-5 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground/40 transition-colors hover:bg-muted hover:text-muted-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="min-w-0 flex-1 pb-1">{children}</div>
      </div>
    </div>
  )
}

function JobDetailsCard({ resume }: { resume: ResumeWithRelations }) {
  const [isPending, startTransition] = useTransition()

  function handleBlur(field: string, value: string) {
    const trimmed = value.trim() || null
    startTransition(async () => {
      try {
        await updateResumeMetadata(resume.id, { [field]: trimmed })
      } catch {
        toast.error(`Failed to update ${field.replace('_', ' ')}`)
      }
    })
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Briefcase className="h-4 w-4" />
        Job Details
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="jd-resume-title" className="text-xs">Resume Title</Label>
          <Input
            id="jd-resume-title"
            defaultValue={resume.title}
            placeholder="e.g., My Google Resume"
            onBlur={(e) => handleBlur('title', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="jd-target-role" className="text-xs">Target Role</Label>
          <Input
            id="jd-target-role"
            defaultValue={resume.target_role ?? ''}
            placeholder="e.g., Software Engineer"
            onBlur={(e) => handleBlur('target_role', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="jd-company" className="text-xs">Company</Label>
          <Input
            id="jd-company"
            defaultValue={resume.company_name ?? ''}
            placeholder="e.g., Google"
            onBlur={(e) => handleBlur('company_name', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="jd-location" className="text-xs">Location</Label>
          <Input
            id="jd-location"
            defaultValue={resume.job_location ?? ''}
            placeholder="e.g., San Francisco, CA"
            onBlur={(e) => handleBlur('job_location', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="jd-work-mode" className="text-xs">Work Mode</Label>
          <Select
            defaultValue={resume.work_mode ?? ''}
            onValueChange={(v) => {
              startTransition(async () => {
                try {
                  await updateResumeMetadata(resume.id, { work_mode: v || null })
                } catch {
                  toast.error('Failed to update work mode')
                }
              })
            }}
          >
            <SelectTrigger id="jd-work-mode" className="h-8 text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="onsite">On-site</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
  }, [resume.id, resume.contact_info?.full_name])

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

        <div className="min-w-0 flex-1">
          <h1 className="line-clamp-1 text-sm font-semibold">
            {resume.target_role || resume.title}
          </h1>
          {resume.company_name && (
            <p className="text-muted-foreground line-clamp-1 text-[11px]">
              {resume.company_name}
            </p>
          )}
        </div>

        <ScorePanel resume={resume} />

        <span className="text-muted-foreground hidden items-center gap-1 text-xs sm:flex">
          <Check className="h-3 w-3" />
          All changes saved
        </span>

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

          <OptimizeDialog resume={resume} />

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
      <div className="min-h-0 flex-1">
        <PanelGroup orientation="horizontal" id="resume-editor-layout">
          {/* Editor Panel */}
          <Panel defaultSize="50%" minSize="30%">
            <ScrollArea className="h-full border-r">
              <div className="max-w-2xl space-y-6 p-4 md:p-6">
                <JobDetailsCard resume={resume} />
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
          </Panel>

          {/* Resize Handle + Preview Panel (only when preview is shown) */}
          {showPreview && (
            <>
              <PanelResizeHandle className="hover:bg-primary/10 active:bg-primary/20 flex w-1.5 items-center justify-center bg-transparent transition-colors">
                <div className="bg-border h-8 w-0.5 rounded-full" />
              </PanelResizeHandle>

              <Panel defaultSize="50%" minSize="25%">
                <div className="hidden h-full bg-gray-100 dark:bg-gray-900 md:block">
                  <ResumePreviewPane resume={resume} />
                </div>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>
    </div>
  )
}
