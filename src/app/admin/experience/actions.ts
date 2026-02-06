"use server"

import { revalidateTag, revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/admin-auth"
import { experienceSchema, type ExperienceFormValues } from "@/lib/schemas/experience"

export async function createExperience(data: ExperienceFormValues) {
  await requireAuth()
  const validated = experienceSchema.parse(data)
  const supabase = await createClient()

  const { data: last } = await supabase
    .from("experience")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single()

  const sort_order = (last?.sort_order ?? 0) + 1

  const { error } = await supabase.from("experience").insert({ ...validated, sort_order })
  if (error) return { error: error.message }

  revalidateTag("experience", "max")
  revalidatePath("/")
  return { success: true }
}

export async function updateExperience(id: string, data: ExperienceFormValues) {
  await requireAuth()
  const validated = experienceSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase.from("experience").update(validated).eq("id", id)
  if (error) return { error: error.message }

  revalidateTag("experience", "max")
  revalidatePath("/")
  return { success: true }
}

export async function deleteExperience(id: string) {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase.from("experience").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidateTag("experience", "max")
  revalidatePath("/")
  return { success: true }
}

export async function updateExperienceOrder(ids: string[]) {
  await requireAuth()
  const supabase = await createClient()

  const updates = ids.map((id, index) =>
    supabase.from("experience").update({ sort_order: index }).eq("id", id),
  )

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }

  revalidateTag("experience", "max")
  return { success: true }
}
