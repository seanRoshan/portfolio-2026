import { z } from "zod"

export const experienceSchema = z.object({
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  location: z.string().nullable().default(null),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  achievements: z.array(z.string().min(1)).default([]),
  company_logo_url: z.string().nullable().default(null),
  company_url: z
    .string()
    .url("Must be a valid URL")
    .nullable()
    .or(z.literal(""))
    .transform((v) => v || null),
  published: z.boolean().default(true),
  show_on_resume: z.boolean().default(true),
})

export type ExperienceFormValues = z.input<typeof experienceSchema>
