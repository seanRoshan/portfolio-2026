import { z } from "zod"

export const skillSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  icon_name: z.string().nullable().default(null),
  icon_url: z.string().nullable().default(null),
  published: z.boolean().default(true),
  show_on_resume: z.boolean().default(true),
})

export type SkillFormValues = z.input<typeof skillSchema>
