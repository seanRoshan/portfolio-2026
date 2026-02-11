import { z } from "zod"

export const settingsSchema = z.object({
  site_title: z.string().min(1, "Site title is required"),
  site_description: z.string().nullable().default(null),
  og_image_url: z.string().nullable().default(null),
  google_analytics_id: z.string().nullable().default(null),
  maintenance_mode: z.boolean().default(false),
  link_animations: z
    .object({
      header: z.string().default("underline-slide"),
      footer: z.string().default("underline-slide"),
    })
    .default({ header: "underline-slide", footer: "underline-slide" }),
})

export type SettingsFormValues = z.input<typeof settingsSchema>
