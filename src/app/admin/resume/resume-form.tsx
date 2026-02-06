"use client"

import { useTransition } from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Plus, Trash2, FileDown, Loader2 } from "lucide-react"
import { resumeSchema, type ResumeFormValues } from "@/lib/schemas/resume"
import {
  updateResume,
  toggleSkillResume,
  toggleExperienceResume,
  generateAndUploadPdf,
} from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { FormSection } from "@/components/admin/form-section"
import { DynamicList } from "@/components/admin/dynamic-list"
import { ResumePreview } from "@/components/resume/ResumePreview"
import type {
  Resume,
  Skill,
  Experience,
  EducationEntry,
  CertificationEntry,
  AdditionalSectionEntry,
} from "@/types/database"

interface ResumeFormProps {
  data: Resume | null
  skills: Skill[]
  experience: Experience[]
}

export function ResumeForm({ data, skills, experience }: ResumeFormProps) {
  const [isPending, startTransition] = useTransition()
  const [isPdfPending, startPdfTransition] = useTransition()

  const form = useForm<ResumeFormValues>({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      full_name: data?.full_name ?? "",
      title: data?.title ?? "",
      email: data?.email ?? "",
      phone: data?.phone ?? "",
      location: data?.location ?? "",
      website: data?.website ?? "",
      linkedin: data?.linkedin ?? "",
      github: data?.github ?? "",
      summary: data?.summary ?? "",
      education: data?.education ?? [],
      certifications: data?.certifications ?? [],
      additional_sections: data?.additional_sections ?? [],
    },
  })

  const educationFields = useFieldArray({ control: form.control, name: "education" })
  const certificationFields = useFieldArray({ control: form.control, name: "certifications" })
  const additionalFields = useFieldArray({ control: form.control, name: "additional_sections" })

  const watched = useWatch({ control: form.control })
  const summaryLength = (watched.summary ?? "").length

  // Group skills by category for display
  const skillsByCategory = new Map<string, Skill[]>()
  for (const skill of skills) {
    if (!skillsByCategory.has(skill.category)) skillsByCategory.set(skill.category, [])
    skillsByCategory.get(skill.category)!.push(skill)
  }

  const categoryLabels: Record<string, string> = {
    frontend: "Frontend",
    backend: "Backend",
    devops: "DevOps & Cloud",
    database: "Databases",
    tools: "Tools",
  }

  // Build preview data from watched form values + selected skills/experience
  const resumeSkillsForPreview = Array.from(skillsByCategory.entries())
    .map(([category, categorySkills]) => ({
      category,
      skills: categorySkills.filter((s) => s.show_on_resume).map((s) => s.name),
    }))
    .filter((g) => g.skills.length > 0)

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
  const experienceForPreview = experience
    .filter((e) => e.show_on_resume)
    .map((e) => {
      const start = new Date(e.start_date)
      const startStr = `${monthNames[start.getMonth()]} ${start.getFullYear()}`
      const endStr = e.end_date
        ? `${monthNames[new Date(e.end_date).getMonth()]} ${new Date(e.end_date).getFullYear()}`
        : "Present"
      return {
        company: e.company,
        role: e.role,
        location: e.location,
        period: `${startStr} – ${endStr}`,
        achievements: e.achievements ?? [],
      }
    })

  function onSubmit(values: ResumeFormValues) {
    startTransition(async () => {
      const result = await updateResume(values)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Resume saved")
      }
    })
  }

  function handleGeneratePdf() {
    startPdfTransition(async () => {
      const result = await generateAndUploadPdf()
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("PDF generated and uploaded")
      }
    })
  }

  function handleToggleSkill(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleSkillResume(id, !current)
      if (result?.error) toast.error(result.error)
    })
  }

  function handleToggleExperience(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleExperienceResume(id, !current)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <div className="flex items-start gap-6">
      {/* Form — left column */}
      <div className="min-w-0 flex-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Info */}
            <FormSection title="Personal Information">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Senior Full-Stack Developer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="San Francisco, CA" {...field} value={field.value ?? ""} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://..."
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://linkedin.com/in/..."
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="github"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://github.com/..."
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>

            {/* Summary */}
            <FormSection title="Professional Summary">
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Summary</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="A brief professional summary..."
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <p className="text-muted-foreground text-right text-xs">
                      {summaryLength} / 500 characters
                    </p>
                  </FormItem>
                )}
              />
            </FormSection>

            {/* Skills selector */}
            <FormSection title="Skills" description="Select which skills to show on the resume">
              {Array.from(skillsByCategory.entries()).map(([category, categorySkills]) => (
                <div key={category}>
                  <p className="mb-2 text-sm font-medium">{categoryLabels[category] ?? category}</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {categorySkills.map((skill) => (
                      <label
                        key={skill.id}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={skill.show_on_resume}
                          onCheckedChange={() => handleToggleSkill(skill.id, skill.show_on_resume)}
                        />
                        {skill.name}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {skills.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No published skills found. Add skills in the Skills section first.
                </p>
              )}
            </FormSection>

            {/* Experience selector */}
            <FormSection
              title="Experience"
              description="Select which experiences to show on the resume"
            >
              {experience.map((exp) => (
                <label
                  key={exp.id}
                  className="hover:bg-accent/50 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors"
                >
                  <Checkbox
                    checked={exp.show_on_resume}
                    onCheckedChange={() => handleToggleExperience(exp.id, exp.show_on_resume)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{exp.role}</p>
                    <p className="text-muted-foreground text-sm">{exp.company}</p>
                  </div>
                </label>
              ))}
              {experience.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No published experiences found. Add experiences in the Experience section first.
                </p>
              )}
            </FormSection>

            {/* Education */}
            <FormSection title="Education">
              {educationFields.fields.map((field, index) => (
                <div key={field.id} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Education #{index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => educationFields.remove(index)}
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`education.${index}.school`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`education.${index}.degree`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Degree</FormLabel>
                          <FormControl>
                            <Input placeholder="B.S." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`education.${index}.field`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Field of Study</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Computer Science"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`education.${index}.year`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year</FormLabel>
                          <FormControl>
                            <Input placeholder="2020" {...field} value={field.value ?? ""} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name={`education.${index}.details`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Details</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="GPA, honors, etc."
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  educationFields.append({
                    school: "",
                    degree: "",
                    field: null,
                    year: null,
                    details: null,
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" /> Add Education
              </Button>
            </FormSection>

            {/* Certifications */}
            <FormSection title="Certifications">
              {certificationFields.fields.map((field, index) => (
                <div key={field.id} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Certification #{index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => certificationFields.remove(index)}
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`certifications.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`certifications.${index}.issuer`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issuer</FormLabel>
                          <FormControl>
                            <Input placeholder="AWS, Google, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`certifications.${index}.year`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year</FormLabel>
                          <FormControl>
                            <Input placeholder="2024" {...field} value={field.value ?? ""} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`certifications.${index}.url`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credential URL</FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://..."
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  certificationFields.append({ name: "", issuer: "", year: null, url: "" })
                }
              >
                <Plus className="mr-1 h-4 w-4" /> Add Certification
              </Button>
            </FormSection>

            {/* Additional Sections */}
            <FormSection
              title="Additional Sections"
              description="Add custom sections like Languages, Interests, etc."
            >
              {additionalFields.fields.map((field, index) => (
                <div key={field.id} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <FormField
                      control={form.control}
                      name={`additional_sections.${index}.title`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Section Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Languages, Interests..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => additionalFields.remove(index)}
                      className="text-muted-foreground hover:text-destructive mt-6 ml-2 h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name={`additional_sections.${index}.items`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Items</FormLabel>
                        <FormControl>
                          <DynamicList
                            items={field.value ?? []}
                            onChange={field.onChange}
                            placeholder="Add item..."
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => additionalFields.append({ title: "", items: [] })}
              >
                <Plus className="mr-1 h-4 w-4" /> Add Section
              </Button>
            </FormSection>

            {/* Actions */}
            <div className="flex gap-3">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Resume"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleGeneratePdf}
                disabled={isPdfPending || !data}
              >
                {isPdfPending ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <FileDown className="mr-1 h-4 w-4" /> Generate PDF
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Preview — right column (hidden on mobile) */}
      <div className="sticky top-20 hidden w-[380px] shrink-0 lg:block">
        <p className="text-muted-foreground mb-2 text-sm font-medium">Preview</p>
        <div className="max-h-[calc(100vh-120px)] overflow-y-auto rounded-lg border">
          <ResumePreview
            data={{
              full_name: watched.full_name ?? "",
              title: watched.title ?? "",
              email: watched.email ?? null,
              phone: watched.phone ?? null,
              location: watched.location ?? null,
              website: watched.website ?? null,
              linkedin: watched.linkedin ?? null,
              github: watched.github ?? null,
              summary: watched.summary ?? null,
              education: (watched.education ?? []).filter(
                (e) => e?.school && e?.degree,
              ) as EducationEntry[],
              certifications: (watched.certifications ?? []).filter(
                (c) => c?.name && c?.issuer,
              ) as CertificationEntry[],
              additional_sections: (watched.additional_sections ?? []).filter(
                (s) => s?.title,
              ) as AdditionalSectionEntry[],
            }}
            skills={resumeSkillsForPreview}
            experience={experienceForPreview}
          />
        </div>
      </div>
    </div>
  )
}
