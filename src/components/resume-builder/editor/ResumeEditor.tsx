'use client'

import { useState, useCallback, useTransition, useEffect, useRef } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// ScrollArea removed — using native overflow for ref-based scroll tracking
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
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

const OPTIONAL_SECTIONS = new Set(['projects', 'certifications', 'extracurriculars'])

function SectionNav({
  sections,
  hiddenSections,
  onToggleVisibility,
  scrollContainerRef,
}: {
  sections: string[]
  hiddenSections: Set<string>
  onToggleVisibility: (section: string) => void
  scrollContainerRef: React.RefObject<HTMLElement | null>
}) {
  const [activeSection, setActiveSection] = useState<string>('')

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { root: container, rootMargin: '-10% 0px -70% 0px' }
    )

    sections.forEach((id) => {
      const el = container.querySelector(`#${id}`)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sections, scrollContainerRef])

  return (
    <nav className="hidden w-44 shrink-0 flex-col gap-0.5 overflow-y-auto border-r p-2 pt-4 md:flex">
      {sections.map((id) => {
        const isHidden = hiddenSections.has(id)
        const isOptional = OPTIONAL_SECTIONS.has(id)
        const isActive = activeSection === id
        return (
          <div key={id}>
            <div className="group/nav flex items-center gap-1">
              <button
                onClick={() => {
                  const container = scrollContainerRef.current
                  const el = container?.querySelector(`#${id}`)
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className={cn(
                  'flex-1 truncate rounded px-2 py-1.5 text-left text-xs transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  isHidden && 'line-through opacity-40'
                )}
              >
                {sectionNames[id] ?? id}
              </button>
            {isOptional && (
              <button
                onClick={() => onToggleVisibility(id)}
                className="text-muted-foreground hover:text-foreground rounded p-0.5 opacity-0 transition-opacity group-hover/nav:opacity-100"
              >
                {isHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            )}
            </div>
          </div>
        )
      })}
    </nav>
  )
}

function SortableSection({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} className="group/section relative rounded-lg border border-transparent transition-colors hover:border-border/50">
      <div className="flex gap-0.5 p-2 pb-1">
        <div className="flex h-5 items-center">
          <button
            {...attributes}
            {...listeners}
            className="flex h-5 w-5 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground/40 transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}

function JobInfoSheet({ resume }: { resume: ResumeWithRelations }) {
  const [editingDetails, setEditingDetails] = useState(false)
  const [editingJd, setEditingJd] = useState(false)
  const [, startTransition] = useTransition()

  function handleDetailBlur(field: string, value: string) {
    const trimmed = value.trim() || null
    startTransition(async () => {
      try {
        await updateResumeMetadata(resume.id, { [field]: trimmed })
      } catch {
        toast.error(`Failed to update ${field.replace('_', ' ')}`)
      }
    })
  }

  function handleJdSave(value: string) {
    const trimmed = value.trim() || null
    startTransition(async () => {
      try {
        await updateResumeMetadata(resume.id, { job_description_text: trimmed })
        setEditingJd(false)
      } catch {
        toast.error('Failed to save job description')
      }
    })
  }

  const hasJdText = !!resume.job_description_text?.trim()

  const detailFields = [
    { key: 'title', label: 'Resume Title', value: resume.title, placeholder: 'e.g., My Google Resume' },
    { key: 'target_role', label: 'Target Role', value: resume.target_role, placeholder: 'e.g., Software Engineer' },
    { key: 'company_name', label: 'Company', value: resume.company_name, placeholder: 'e.g., Google' },
    { key: 'job_location', label: 'Location', value: resume.job_location, placeholder: 'e.g., San Francisco, CA' },
  ]

  return (
    <Tabs defaultValue="details" className="mt-4">
      <TabsList className="w-full">
        <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
        <TabsTrigger value="description" className="flex-1">Description</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs">Job targeting information</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px]"
            onClick={() => setEditingDetails(!editingDetails)}
          >
            {editingDetails ? 'Done' : 'Edit'}
          </Button>
        </div>

        {editingDetails ? (
          <div className="grid gap-3">
            {detailFields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={`ji-${f.key}`} className="text-xs">{f.label}</Label>
                <Input
                  id={`ji-${f.key}`}
                  defaultValue={f.value ?? ''}
                  placeholder={f.placeholder}
                  onBlur={(e) => handleDetailBlur(f.key, e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label htmlFor="ji-work-mode" className="text-xs">Work Mode</Label>
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
                <SelectTrigger id="ji-work-mode" className="h-8 text-sm">
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
        ) : (
          <div className="grid gap-2">
            {detailFields.map((f) => (
              <div key={f.key}>
                <p className="text-muted-foreground text-[11px]">{f.label}</p>
                <p className="text-sm">{f.value || <span className="text-muted-foreground italic">Not set</span>}</p>
              </div>
            ))}
            <div>
              <p className="text-muted-foreground text-[11px]">Work Mode</p>
              <p className="text-sm capitalize">{resume.work_mode || <span className="text-muted-foreground italic">Not set</span>}</p>
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="description" className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs">Paste a job description to help AI tailor your resume</p>
          {hasJdText && !editingJd && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px]"
              onClick={() => setEditingJd(true)}
            >
              Edit
            </Button>
          )}
        </div>

        {editingJd || !hasJdText ? (
          <div className="space-y-2">
            <Textarea
              defaultValue={resume.job_description_text ?? ''}
              placeholder="Paste the job description here..."
              rows={12}
              className="text-sm"
              onBlur={(e) => handleJdSave(e.target.value)}
            />
            {editingJd && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px]"
                onClick={() => setEditingJd(false)}
              >
                Cancel
              </Button>
            )}
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto rounded-md border p-3">
            <p className="text-muted-foreground whitespace-pre-wrap text-xs leading-relaxed">
              {resume.job_description_text}
            </p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}

interface ResumeEditorProps {
  resume: ResumeWithRelations
  templates: ResumeTemplate[]
}

export function ResumeEditor({ resume, templates }: ResumeEditorProps) {
  const [showPreview, setShowPreview] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showJobInfo, setShowJobInfo] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const editorScrollRef = useRef<HTMLDivElement>(null)

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
  const [hiddenSections, setHiddenSections] = useState(
    () => new Set(resume.settings?.hidden_sections ?? [])
  )
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

  const handleToggleSectionVisibility = useCallback(async (section: string) => {
    const isHidden = hiddenSections.has(section)
    const newHidden = isHidden
      ? (resume.settings?.hidden_sections ?? []).filter((s) => s !== section)
      : [...(resume.settings?.hidden_sections ?? []), section]

    // Optimistic update
    setHiddenSections(new Set(newHidden))

    try {
      await updateResumeSettings(resume.id, { hidden_sections: newHidden })
    } catch {
      // Revert on failure
      setHiddenSections(new Set(resume.settings?.hidden_sections ?? []))
      toast.error('Failed to toggle section visibility')
    }
  }, [hiddenSections, resume.id, resume.settings?.hidden_sections])

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

          <Sheet open={showJobInfo} onOpenChange={setShowJobInfo}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Briefcase className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto px-5">
              <SheetTitle>Job Info</SheetTitle>
              <JobInfoSheet resume={resume} />
            </SheetContent>
          </Sheet>

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
                templateId={resume.template_id}
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
      <div className="min-h-0 flex-1 overflow-hidden flex">
        <SectionNav
          sections={currentOrder}
          hiddenSections={hiddenSections}
          onToggleVisibility={handleToggleSectionVisibility}
          scrollContainerRef={editorScrollRef}
        />
        <div className="min-w-0 flex-1">
          {showPreview ? (
            <PanelGroup orientation="horizontal" id="resume-editor-layout">
              {/* Editor Panel */}
              <Panel defaultSize="50%" minSize="30%">
                <div ref={editorScrollRef} className="h-full overflow-y-auto border-r">
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
                </div>
              </Panel>

              <PanelResizeHandle className="hover:bg-primary/10 active:bg-primary/20 flex w-1.5 items-center justify-center bg-transparent transition-colors">
                <div className="bg-border h-8 w-0.5 rounded-full" />
              </PanelResizeHandle>

              <Panel defaultSize="50%" minSize="25%">
                <div className="hidden h-full bg-gray-100 dark:bg-gray-900 md:block">
                  <ResumePreviewPane resume={resume} />
                </div>
              </Panel>
            </PanelGroup>
          ) : (
            <div ref={editorScrollRef} className="h-full overflow-y-auto">
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
