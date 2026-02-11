import { z } from "zod"

export const ventureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  url: z
    .string()
    .url("Must be a valid URL")
    .nullable()
    .or(z.literal(""))
    .transform((v) => v || null),
  icon_url: z.string().nullable().default(null),
  icon_url_dark: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  founded_year: z.string().nullable().default(null),
  published: z.boolean().default(true),
})

export type VentureFormValues = z.input<typeof ventureSchema>
