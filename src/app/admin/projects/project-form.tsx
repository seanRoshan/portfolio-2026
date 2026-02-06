"use client"

import { useTransition } from "react"
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
import { ImageUpload } from "@/components/admin/image-upload"
import type { Project } from "@/types/database"

interface ProjectFormProps {
  data?: Project
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function ProjectForm({ data }: ProjectFormProps) {
  const [isPending, startTransition] = useTransition()
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
      tech_stack: data?.tech_stack ?? [],
      color: data?.color ?? "",
      year: data?.year ?? "",
      live_url: data?.live_url ?? "",
      github_url: data?.github_url ?? "",
      featured: data?.featured ?? false,
      published: data?.published ?? true,
    },
  })

  function onSubmit(values: ProjectFormValues) {
    startTransition(async () => {
      const result = isEdit
        ? await updateProject(data.id, values)
        : await createProject(values)

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
                <FormControl><Input {...field} /></FormControl>
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
                <FormControl><Textarea rows={2} {...field} /></FormControl>
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
                <FormControl><Textarea rows={6} {...field} value={field.value ?? ""} /></FormControl>
              </FormItem>
            )}
          />
        </FormSection>

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
        </FormSection>

        <FormSection title="Details">
          <FormField
            control={form.control}
            name="tech_stack"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tech Stack</FormLabel>
                <FormControl>
                  <DynamicList items={field.value ?? []} onChange={field.onChange} placeholder="Add technology..." />
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
                  <FormControl><Input placeholder="#6366f1" {...field} value={field.value ?? ""} /></FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl><Input placeholder="2026" {...field} value={field.value ?? ""} /></FormControl>
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
                  <FormControl><Input type="url" placeholder="https://..." {...field} value={field.value ?? ""} /></FormControl>
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
                  <FormControl><Input type="url" placeholder="https://github.com/..." {...field} value={field.value ?? ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

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
