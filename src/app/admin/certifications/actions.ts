"use server"

import { revalidateTag, revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/admin-auth"
import { certificationSchema, type CertificationFormValues } from "@/lib/schemas/certification"

export async function createCertification(data: CertificationFormValues) {
  await requireAuth()
  const validated = certificationSchema.parse(data)
  const supabase = await createClient()

  const { data: last } = await supabase
    .from("certifications")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single()

  const sort_order = (last?.sort_order ?? 0) + 1

  const { error } = await supabase.from("certifications").insert({ ...validated, sort_order })
  if (error) return { error: error.message }

  revalidateTag("certifications", "max")
  revalidatePath("/")
  return { success: true }
}

export async function updateCertification(id: string, data: CertificationFormValues) {
  await requireAuth()
  const validated = certificationSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase.from("certifications").update(validated).eq("id", id)
  if (error) return { error: error.message }

  revalidateTag("certifications", "max")
  revalidatePath("/")
  return { success: true }
}

export async function deleteCertification(id: string) {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase.from("certifications").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidateTag("certifications", "max")
  revalidatePath("/")
  return { success: true }
}

export async function updateCertificationOrder(ids: string[]) {
  await requireAuth()
  const supabase = await createClient()

  const updates = ids.map((id, index) =>
    supabase.from("certifications").update({ sort_order: index }).eq("id", id),
  )

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }

  revalidateTag("certifications", "max")
  return { success: true }
}
