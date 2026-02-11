import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../admin-header"
import { VentureList } from "./venture-list"
import type { Venture } from "@/types/database"

export default async function VenturesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("ventures")
    .select("*")
    .order("sort_order", { ascending: true })

  return (
    <>
      <AdminHeader title="Ventures" />
      <div className="max-w-4xl p-4 md:p-6">
        <VentureList entries={(data as Venture[]) ?? []} />
      </div>
    </>
  )
}
