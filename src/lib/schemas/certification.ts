import { z } from "zod"

export const certificationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  issuer: z.string().min(1, "Issuer is required"),
  year: z.string().nullable().default(null),
  url: z
    .string()
    .url("Must be a valid URL")
    .nullable()
    .or(z.literal(""))
    .transform((v) => v || null),
  badge_url: z.string().nullable().default(null),
  published: z.boolean().default(true),
  show_on_resume: z.boolean().default(true),
})

export type CertificationFormValues = z.input<typeof certificationSchema>
