"use server"

import { revalidateTag, revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/admin-auth"
import { settingsSchema, type SettingsFormValues } from "@/lib/schemas/settings"

export async function updateSettings(data: SettingsFormValues) {
  await requireAuth()
  const validated = settingsSchema.parse(data)
  const supabase = await createClient()

  const { data: current } = await supabase.from("site_settings").select("id").single()
  if (!current) return { error: "Site settings not found" }

  const { error } = await supabase.from("site_settings").update(validated).eq("id", current.id)
  if (error) return { error: error.message }

  revalidateTag("site_settings", "max")
  revalidatePath("/")
  return { success: true }
}
