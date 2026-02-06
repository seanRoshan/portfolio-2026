import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../admin-header"
import { MessagesList } from "./messages-list"
import type { ContactSubmission } from "@/types/database"

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("contact_submissions")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <>
      <AdminHeader title="Messages" />
      <div className="p-4 md:p-6 max-w-4xl">
        <MessagesList messages={(data as ContactSubmission[]) ?? []} />
      </div>
    </>
  )
}
