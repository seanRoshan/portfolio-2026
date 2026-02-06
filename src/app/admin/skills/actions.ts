"use server"

import { revalidateTag, revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/admin-auth"
import { skillSchema, type SkillFormValues } from "@/lib/schemas/skill"

export async function createSkill(data: SkillFormValues) {
  await requireAuth()
  const validated = skillSchema.parse(data)
  const supabase = await createClient()

  const { data: last } = await supabase
    .from("skills")
    .select("sort_order")
    .eq("category", validated.category)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single()

  const sort_order = (last?.sort_order ?? 0) + 1

  const { error } = await supabase.from("skills").insert({ ...validated, sort_order })
  if (error) return { error: error.message }

  revalidateTag("skills", "max")
  revalidatePath("/")
  return { success: true }
}

export async function updateSkill(id: string, data: SkillFormValues) {
  await requireAuth()
  const validated = skillSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase.from("skills").update(validated).eq("id", id)
  if (error) return { error: error.message }

  revalidateTag("skills", "max")
  revalidatePath("/")
  return { success: true }
}

export async function deleteSkill(id: string) {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase.from("skills").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidateTag("skills", "max")
  revalidatePath("/")
  return { success: true }
}

export async function updateSkillOrder(ids: string[]) {
  await requireAuth()
  const supabase = await createClient()

  const updates = ids.map((id, index) =>
    supabase.from("skills").update({ sort_order: index }).eq("id", id),
  )

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }

  revalidateTag("skills", "max")
  return { success: true }
}
