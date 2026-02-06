"use server"

import { revalidateTag, revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/admin-auth"
import { projectSchema, type ProjectFormValues } from "@/lib/schemas/project"

export async function createProject(data: ProjectFormValues) {
  await requireAuth()
  const validated = projectSchema.parse(data)
  const supabase = await createClient()

  // Auto-increment sort_order
  const { data: last } = await supabase
    .from("projects")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single()

  const sort_order = (last?.sort_order ?? 0) + 1

  const { error } = await supabase.from("projects").insert({ ...validated, sort_order })
  if (error) return { error: error.message }

  revalidateTag("projects", "max")
  revalidatePath("/")
  return { success: true }
}

export async function updateProject(id: string, data: ProjectFormValues) {
  await requireAuth()
  const validated = projectSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase.from("projects").update(validated).eq("id", id)
  if (error) return { error: error.message }

  revalidateTag("projects", "max")
  revalidatePath("/")
  return { success: true }
}

export async function deleteProject(id: string) {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase.from("projects").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidateTag("projects", "max")
  revalidatePath("/")
  return { success: true }
}

export async function updateProjectOrder(ids: string[]) {
  await requireAuth()
  const supabase = await createClient()

  // Update sort_order for each project based on array position
  const updates = ids.map((id, index) =>
    supabase.from("projects").update({ sort_order: index }).eq("id", id)
  )

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }

  revalidateTag("projects", "max")
  return { success: true }
}
