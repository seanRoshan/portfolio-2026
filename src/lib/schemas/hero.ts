import { z } from "zod"

export const heroSchema = z.object({
  greeting: z.string().nullable().default(null),
  name: z.string().min(1, "Name is required"),
  rotating_titles: z.array(z.string().min(1)).min(1, "At least one title is required"),
  description: z.string().nullable().default(null),
  cta_primary_text: z.string().nullable().default(null),
  cta_primary_link: z.string().nullable().default(null),
  cta_secondary_text: z.string().nullable().default(null),
  cta_secondary_link: z.string().nullable().default(null),
  avatar_url: z.string().nullable().default(null),
  resume_url: z.string().nullable().default(null),
})

export type HeroFormValues = z.input<typeof heroSchema>
