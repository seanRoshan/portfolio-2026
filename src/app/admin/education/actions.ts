"use server"

import { revalidateTag, revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/admin-auth"
import { educationSchema, type EducationFormValues } from "@/lib/schemas/education"

export async function createEducation(data: EducationFormValues) {
  await requireAuth()
  const validated = educationSchema.parse(data)
  const supabase = await createClient()

  const { data: last } = await supabase
    .from("education")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single()

  const sort_order = (last?.sort_order ?? 0) + 1

  const { error } = await supabase.from("education").insert({ ...validated, sort_order })
  if (error) return { error: error.message }

  revalidateTag("education", "max")
  revalidatePath("/")
  return { success: true }
}

export async function updateEducation(id: string, data: EducationFormValues) {
  await requireAuth()
  const validated = educationSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase.from("education").update(validated).eq("id", id)
  if (error) return { error: error.message }

  revalidateTag("education", "max")
  revalidatePath("/")
  return { success: true }
}

export async function deleteEducation(id: string) {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase.from("education").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidateTag("education", "max")
  revalidatePath("/")
  return { success: true }
}

export async function updateEducationOrder(ids: string[]) {
  await requireAuth()
  const supabase = await createClient()

  const updates = ids.map((id, index) =>
    supabase.from("education").update({ sort_order: index }).eq("id", id),
  )

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }

  revalidateTag("education", "max")
  return { success: true }
}
