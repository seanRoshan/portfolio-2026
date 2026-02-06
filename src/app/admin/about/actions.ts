"use server"

import { revalidateTag, revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/admin-auth"
import { aboutSchema, type AboutFormValues } from "@/lib/schemas/about"

export async function updateAbout(data: AboutFormValues) {
  await requireAuth()
  const validated = aboutSchema.parse(data)
  const supabase = await createClient()

  const { data: current } = await supabase.from("about_section").select("id").single()
  if (!current) return { error: "About section not found" }

  const { error } = await supabase.from("about_section").update(validated).eq("id", current.id)
  if (error) return { error: error.message }

  revalidateTag("about", "max")
  revalidatePath("/")
  return { success: true }
}
