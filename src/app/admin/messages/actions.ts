"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/admin-auth"

export async function markMessageRead(id: string, read: boolean) {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase.from("contact_submissions").update({ read }).eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/admin/messages")
  revalidatePath("/admin")
  return { success: true }
}

export async function markAllMessagesRead() {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase
    .from("contact_submissions")
    .update({ read: true })
    .eq("read", false)

  if (error) return { error: error.message }

  revalidatePath("/admin/messages")
  revalidatePath("/admin")
  return { success: true }
}

export async function deleteMessage(id: string) {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase.from("contact_submissions").delete().eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/admin/messages")
  revalidatePath("/admin")
  return { success: true }
}
