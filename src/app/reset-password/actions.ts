"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function updatePassword(password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  redirect("/admin")
}
