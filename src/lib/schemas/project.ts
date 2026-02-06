import { z } from "zod"

export const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
  short_description: z
    .string()
    .min(1, "Short description is required")
    .max(160, "Max 160 characters"),
  long_description: z.string().nullable().default(null),
  thumbnail_url: z.string().nullable().default(null),
  images: z.array(z.string()).default([]),
  tech_stack: z.array(z.string().min(1)).default([]),
  color: z.string().nullable().default(null),
  year: z.string().nullable().default(null),
  live_url: z
    .string()
    .url("Must be a valid URL")
    .nullable()
    .or(z.literal(""))
    .transform((v) => v || null),
  github_url: z
    .string()
    .url("Must be a valid URL")
    .nullable()
    .or(z.literal(""))
    .transform((v) => v || null),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
})

export type ProjectFormValues = z.input<typeof projectSchema>
