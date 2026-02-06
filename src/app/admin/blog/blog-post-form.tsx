"use client"
"use no memo" // React Hook Form's watch() is incompatible with React Compiler

import { useState, useEffect, useRef, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ArrowLeft, Save, Eye } from "lucide-react"
import Link from "next/link"
import { blogSchema, type BlogFormValues } from "@/lib/schemas/blog"
import { createBlogPost, updateBlogPost } from "./actions"
import { generateSlug, calculateReadTime, extractExcerpt } from "@/lib/blog-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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
import { BlogEditor } from "@/components/blog/blog-editor"
import type { BlogPost } from "@/types/database"

interface BlogPostFormProps {
  data?: BlogPost
}

export function BlogPostForm({ data }: BlogPostFormProps) {
  const [isPending, startTransition] = useTransition()
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved")
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const router = useRouter()
  const isEdit = !!data
  const postId = data?.id

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: data?.title ?? "",
      slug: data?.slug ?? "",
      excerpt: data?.excerpt ?? "",
      content: data?.content ?? "",
      cover_image_url: data?.cover_image_url ?? "",
      tags: data?.tags ?? [],
      published: data?.published ?? false,
      published_at: data?.published_at ?? null,
      read_time_minutes: data?.read_time_minutes ?? null,
      meta_title: data?.meta_title ?? "",
      meta_description: data?.meta_description ?? "",
      og_image_url: data?.og_image_url ?? "",
    },
  })

  // Track content changes for read time / excerpt auto-generation
  // eslint-disable-next-line react-hooks/incompatible-library -- React Hook Form watch() is intentionally reactive
  const content = form.watch("content")
  const title = form.watch("title")
  const published = form.watch("published")

  // Auto-calculate read time when content changes
  useEffect(() => {
    if (content) {
      form.setValue("read_time_minutes", calculateReadTime(content))
    }
  }, [content, form])

  // Auto-save (only for existing posts)
  const doAutoSave = useCallback(() => {
    if (!isEdit) return
    const values = form.getValues()
    if (!values.title || !values.content) return

    setSaveStatus("saving")
    startTransition(async () => {
      const result = await updateBlogPost(data.id, values)
      if (result?.error) {
        setSaveStatus("unsaved")
      } else {
        setSaveStatus("saved")
      }
    })
  }, [isEdit, data?.id, form, startTransition])

  useEffect(() => {
    if (!isEdit) return
    setSaveStatus("unsaved")

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(doAutoSave, 30_000)

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [content, title, published, isEdit, doAutoSave])

  function onSubmit(values: BlogFormValues) {
    // Set published_at if publishing for the first time
    if (values.published && !values.published_at) {
      values.published_at = new Date().toISOString()
    }
    // Auto-generate excerpt if empty
    if (!values.excerpt && values.content) {
      values.excerpt = extractExcerpt(values.content)
    }

    startTransition(async () => {
      const result = isEdit ? await updateBlogPost(data.id, values) : await createBlogPost(values)

      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(isEdit ? "Post updated" : "Post created")
        setSaveStatus("saved")
        if (!isEdit && "id" in result && result.id) {
          router.push(`/admin/blog/${result.id}`)
        }
      }
    })
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    form.setValue("title", e.target.value)
    if (!isEdit || !data?.slug) {
      form.setValue("slug", generateSlug(e.target.value))
    }
  }

  const readTime = form.watch("read_time_minutes")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Top bar */}
        <div className="bg-background sticky top-14 z-30 flex items-center justify-between border-b px-4 py-2 md:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/blog"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-muted-foreground text-sm">
              {isEdit ? "Edit Post" : "New Post"}
            </span>
            {isEdit && (
              <span className="text-muted-foreground text-xs">
                {saveStatus === "saved" && "Saved"}
                {saveStatus === "saving" && "Saving..."}
                {saveStatus === "unsaved" && "Unsaved changes"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isEdit && data?.published && data?.slug && (
              <Link href={`/blog/${data.slug}`} target="_blank">
                <Button type="button" variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
              </Link>
            )}
            <Button type="submit" size="sm" disabled={isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isPending ? "Saving..." : published ? "Publish" : "Save Draft"}
            </Button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[1fr_320px]">
          {/* Left column — Editor */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={handleTitleChange}
                      placeholder="Post title"
                      className="h-auto border-0 px-0 text-2xl font-bold shadow-none focus-visible:ring-0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <BlogEditor content={field.value} onChange={field.onChange} postId={postId} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Right column — Metadata sidebar */}
          <div className="space-y-4">
            <FormSection title="Status">
              <FormField
                control={form.control}
                name="published"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Published</FormLabel>
                      <FormDescription>Make this post visible publicly</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="published_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publish Date</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? new Date(e.target.value).toISOString() : null,
                          )
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </FormSection>

            <FormSection title="Details">
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
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Excerpt</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Auto-generated from content if empty"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cover_image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value || null}
                        onChange={(url) => field.onChange(url ?? "")}
                        bucket="blog"
                        path={postId ?? "covers"}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <DynamicList
                        items={field.value ?? []}
                        onChange={field.onChange}
                        placeholder="Add tag..."
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div>
                <Label className="text-sm font-medium">Read Time</Label>
                <p className="text-muted-foreground text-sm">{readTime ?? 0} min read</p>
              </div>
            </FormSection>

            <details className="rounded-lg border">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
                SEO Settings
              </summary>
              <div className="space-y-4 px-4 pb-4">
                <FormField
                  control={form.control}
                  name="meta_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Defaults to post title"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="meta_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Description</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={2}
                          placeholder="Defaults to excerpt"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="og_image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OG Image</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value || null}
                          onChange={(url) => field.onChange(url ?? "")}
                          bucket="blog"
                          path={postId ? `${postId}/og` : "og"}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </details>
          </div>
        </div>
      </form>
    </Form>
  )
}
