"use server"

import { revalidateTag, revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/admin-auth"
import { z } from "zod"

const contactInfoSchema = z.object({
  contact_email: z.string().email().nullable().or(z.literal("")).transform(v => v || null),
  contact_form_enabled: z.boolean(),
  social_links: z.record(z.string(), z.string()),
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
    .update({
      contact_email: validated.contact_email,
      contact_form_enabled: validated.contact_form_enabled,
      social_links: validated.social_links,
    })
    .eq("id", current.id)

  if (error) return { error: error.message }

  revalidateTag("site_settings", "max")
  revalidatePath("/")
  return { success: true }
}
