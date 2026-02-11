"use server"

import { revalidateTag, revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/admin-auth"
import { ventureSchema, type VentureFormValues } from "@/lib/schemas/venture"

export async function createVenture(data: VentureFormValues) {
  await requireAuth()
  const validated = ventureSchema.parse(data)
  const supabase = await createClient()

  const { data: last } = await supabase
    .from("ventures")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single()

  const sort_order = (last?.sort_order ?? 0) + 1

  const { error } = await supabase.from("ventures").insert({ ...validated, sort_order })
  if (error) return { error: error.message }

  revalidateTag("ventures", "max")
  revalidatePath("/")
  return { success: true }
}

export async function updateVenture(id: string, data: VentureFormValues) {
  await requireAuth()
  const validated = ventureSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase.from("ventures").update(validated).eq("id", id)
  if (error) return { error: error.message }

  revalidateTag("ventures", "max")
  revalidatePath("/")
  return { success: true }
}

export async function deleteVenture(id: string) {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase.from("ventures").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidateTag("ventures", "max")
  revalidatePath("/")
  return { success: true }
}

export async function updateVentureOrder(ids: string[]) {
  await requireAuth()
  const supabase = await createClient()

  const updates = ids.map((id, index) =>
    supabase.from("ventures").update({ sort_order: index }).eq("id", id),
  )

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }

  revalidateTag("ventures", "max")
  return { success: true }
}
