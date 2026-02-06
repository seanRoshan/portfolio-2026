import { z } from "zod"

export const blogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
  excerpt: z.string().nullable().default(null),
  content: z.string().min(1, "Content is required"),
  cover_image_url: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(false),
  published_at: z.string().nullable().default(null),
  read_time_minutes: z.number().nullable().default(null),
  meta_title: z.string().nullable().default(null),
  meta_description: z.string().nullable().default(null),
  og_image_url: z.string().nullable().default(null),
})

export type BlogFormValues = z.input<typeof blogSchema>
