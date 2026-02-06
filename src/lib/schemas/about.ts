import { z } from "zod"

export const aboutSchema = z.object({
  heading: z.string().nullable().default(null),
  subheading: z.string().nullable().default(null),
  bio: z.string().min(1, "Bio is required"),
  bio_secondary: z.string().nullable().default(null),
  portrait_url: z.string().nullable().default(null),
  stats: z.array(z.object({
    label: z.string().min(1),
    value: z.string().min(1),
  })).default([]),
  tech_stack: z.array(z.string().min(1)).default([]),
})

export type AboutFormValues = z.input<typeof aboutSchema>
