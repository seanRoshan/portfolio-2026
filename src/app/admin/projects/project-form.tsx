"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { projectSchema, type ProjectFormValues } from "@/lib/schemas/project"
import { createProject, updateProject } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { FormSection } from "@/components/admin/form-section"
import { DynamicList } from "@/components/admin/dynamic-list"
import { DynamicKeyValueList } from "@/components/admin/dynamic-key-value-list"
import { ImageUpload } from "@/components/admin/image-upload"
import { MultiImageUpload } from "@/components/admin/multi-image-upload"
import { ColorPicker } from "@/components/admin/color-picker"
import { ExperienceSelector } from "@/components/admin/experience-selector"
import { EducationSelector } from "@/components/admin/education-selector"
import { CertificationSelector } from "@/components/admin/certification-selector"
import { SkillAutocomplete } from "@/components/admin/skill-autocomplete"
import type { ProjectWithRelations } from "@/types/database"

interface ProjectFormProps {
  data?: ProjectWithRelations
  experiences: { id: string; company: string; role: string }[]
  skills: { id: string; name: string; category: string }[]
  education: { id: string; school: string; degree: string }[]
  certifications: { id: string; name: string; issuer: string }[]
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function ProjectForm({
  data,
  experiences,
  skills: initialSkills,
  education,
  certifications,
}: ProjectFormProps) {
  const [isPending, startTransition] = useTransition()
  const [skills, setSkills] = useState(initialSkills)
  const router = useRouter()
  const isEdit = !!data

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: data?.title ?? "",
      slug: data?.slug ?? "",
      short_description: data?.short_description ?? "",
      long_description: data?.long_description ?? "",
      thumbnail_url: data?.thumbnail_url ?? "",
      images: data?.images ?? [],
      image_captions: data?.image_captions ?? {},
      tech_stack: data?.tech_stack ?? [],
      color: data?.color ?? "",
      year: data?.year ?? "",
      live_url: data?.live_url ?? "",
      github_url: data?.github_url ?? "",
      architecture_url: data?.architecture_url ?? "",
      project_role: data?.project_role ?? "",
      status: data?.status ?? "completed",
      highlights: data?.highlights ?? [],
      featured: data?.featured ?? false,
      published: data?.published ?? true,
      experience_ids: data?.experience_ids ?? [],
      skill_ids: data?.skill_ids ?? [],
      education_ids: data?.education_ids ?? [],
      certification_ids: data?.certification_ids ?? [],
    },
  })

  function onSubmit(values: ProjectFormValues) {
    startTransition(async () => {
      const result = isEdit ? await updateProject(data.id, values) : await createProject(values)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(isEdit ? "Project updated" : "Project created")
        if (!isEdit) router.push("/admin/projects")
      }
    })
  }

  // Auto-generate slug from title
  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    form.setValue("title", e.target.value)
    if (!isEdit || !data?.slug) {
      form.setValue("slug", slugify(e.target.value))
    }
  }

  const shortDescValue = useWatch({ control: form.control, name: "short_description" }) ?? ""

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Basic Info ── */}
        <FormSection title="Basic Info">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} onChange={handleTitleChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="short_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short Description ({shortDescValue.length}/160)</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="long_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Long Description</FormLabel>
                <FormControl>
                  <Textarea rows={6} {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
        </FormSection>

        {/* ── Media ── */}
        <FormSection title="Media">
          <FormField
            control={form.control}
            name="thumbnail_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thumbnail</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value || null}
                    onChange={(url) => field.onChange(url ?? "")}
                    bucket="projects"
                    path="thumbnails"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="architecture_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Architecture Diagram</FormLabel>
                <FormDescription>Upload a system architecture or flow diagram</FormDescription>
                <FormControl>
                  <ImageUpload
                    value={field.value || null}
                    onChange={(url) => field.onChange(url ?? "")}
                    bucket="projects"
                    path="architecture"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="images"
            render={({ field }) => {
              const captions = (form.watch("image_captions") ?? {}) as Record<string, string>
              return (
                <FormItem>
                  <FormLabel>Photo Album</FormLabel>
                  <FormDescription>Add screenshots, demos, or project photos</FormDescription>
                  <FormControl>
                    <MultiImageUpload
                      images={field.value ?? []}
                      captions={captions}
                      onChange={(imgs, caps) => {
                        field.onChange(imgs)
                        form.setValue("image_captions", caps)
                      }}
                      bucket="projects"
                      path="gallery"
                    />
                  </FormControl>
                </FormItem>
              )
            }}
          />
        </FormSection>

        {/* ── Project Context ── */}
        <FormSection title="Project Context">
          <FormField
            control={form.control}
            name="experience_ids"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Associated Experience</FormLabel>
                <FormDescription>Link this project to your work experience</FormDescription>
                <FormControl>
                  <ExperienceSelector
                    experiences={experiences}
                    selectedIds={field.value ?? []}
                    onChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="education_ids"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Associated Education</FormLabel>
                <FormDescription>Link this project to your education</FormDescription>
                <FormControl>
                  <EducationSelector
                    education={education}
                    selectedIds={field.value ?? []}
                    onChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="certification_ids"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Associated Certifications</FormLabel>
                <FormDescription>Link this project to your certifications</FormDescription>
                <FormControl>
                  <CertificationSelector
                    certifications={certifications}
                    selectedIds={field.value ?? []}
                    onChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="project_role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Role</FormLabel>
                  <FormControl>
                    <Input placeholder="Lead Developer" {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? "completed"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="open_source">Open Source</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* ── Details ── */}
        <FormSection title="Details">
          <FormField
            control={form.control}
            name="skill_ids"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tech Stack</FormLabel>
                <FormDescription>Search existing skills or create new ones</FormDescription>
                <FormControl>
                  <SkillAutocomplete
                    skills={skills}
                    selectedIds={field.value ?? []}
                    onChange={field.onChange}
                    onSkillCreated={(newSkill) => {
                      setSkills((prev) => [...prev, newSkill])
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tech_stack"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Tags</FormLabel>
                <FormDescription>Technologies not in the skills list (optional)</FormDescription>
                <FormControl>
                  <DynamicList
                    items={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="Add technology..."
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="highlights"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Key Metrics & Highlights</FormLabel>
                <FormDescription>Quantifiable impact numbers</FormDescription>
                <FormControl>
                  <DynamicKeyValueList
                    items={(field.value ?? []).map((h) => ({
                      label: h.metric,
                      value: h.value,
                    }))}
                    onChange={(items) =>
                      field.onChange(items.map((i) => ({ metric: i.label, value: i.value })))
                    }
                    keyLabel="Metric"
                    valueLabel="Value"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accent Color</FormLabel>
                  <FormControl>
                    <ColorPicker value={field.value ?? ""} onChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input placeholder="2026" {...field} value={field.value ?? ""} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="live_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Live URL</FormLabel>
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
              name="github_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub URL</FormLabel>
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
          </div>
        </FormSection>

        {/* ── Visibility ── */}
        <FormSection title="Visibility">
          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="featured"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel>Featured</FormLabel>
                    <FormDescription>Highlight this project on the home page</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="published"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel>Published</FormLabel>
                    <FormDescription>Make this project visible to the public</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Project"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/projects")}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
