import { z } from "zod"

export const educationSchema = z.object({
  school: z.string().min(1, "School is required"),
  degree: z.string().min(1, "Degree is required"),
  field: z.string().nullable().default(null),
  year: z.string().nullable().default(null),
  details: z.string().nullable().default(null),
  logo_url: z.string().nullable().default(null),
  published: z.boolean().default(true),
  show_on_resume: z.boolean().default(true),
})

export type EducationFormValues = z.input<typeof educationSchema>
