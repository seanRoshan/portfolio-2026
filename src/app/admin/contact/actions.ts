"use server"

import { revalidateTag, revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/admin-auth"
import { z } from "zod"

const contactInfoSchema = z.object({
  // Identity
  full_name: z.string().optional().transform((v) => v?.trim() || null),
  contact_email: z
    .string()
    .email()
    .nullable()
    .or(z.literal(""))
    .transform((v) => v || null),
  phone: z.string().optional().transform((v) => v?.trim() || null),
  // Location
  city: z.string().optional().transform((v) => v?.trim() || null),
  state: z.string().optional().transform((v) => v?.trim() || null),
  country: z.string().optional().transform((v) => v?.trim() || null),
  // Settings
  contact_form_enabled: z.boolean(),
  social_links: z.record(z.string(), z.string()),
  // Visibility toggles
  landing_show_email: z.boolean().optional().default(true),
  landing_show_phone: z.boolean().optional().default(false),
  landing_show_location: z.boolean().optional().default(true),
  landing_show_linkedin: z.boolean().optional().default(true),
  landing_show_github: z.boolean().optional().default(true),
  landing_show_portfolio: z.boolean().optional().default(true),
  // Availability
  availability_text: z.string().optional().transform((v) => v?.trim() || null),
  landing_show_availability: z.boolean().optional().default(false),
})

export type ContactInfoFormValues = z.input<typeof contactInfoSchema>

export async function updateContactInfo(data: ContactInfoFormValues) {
  await requireAuth()
  const validated = contactInfoSchema.parse(data)
  const supabase = await createClient()

  const { data: current } = await supabase.from("site_settings").select("id").single()
  if (!current) return { error: "Site settings not found" }

  const { error } = await supabase
    .from("site_settings")
    .update(validated)
    .eq("id", current.id)

  if (error) return { error: error.message }

  revalidateTag("site_settings", "max")
  revalidatePath("/")
  return { success: true }
}
