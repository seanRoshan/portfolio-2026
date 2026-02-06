"use server"

import { revalidateTag, revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/admin-auth"
import { heroSchema, type HeroFormValues } from "@/lib/schemas/hero"

export async function updateHero(data: HeroFormValues) {
  await requireAuth()
  const validated = heroSchema.parse(data)
  const supabase = await createClient()

  const { data: current } = await supabase.from("hero_section").select("id").single()
  if (!current) return { error: "Hero section not found" }

  const { error } = await supabase.from("hero_section").update(validated).eq("id", current.id)
  if (error) return { error: error.message }

  revalidateTag("hero", "max")
  revalidatePath("/")
  return { success: true }
}
