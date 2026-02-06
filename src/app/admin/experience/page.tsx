import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../admin-header"
import { ExperienceList } from "./experience-list"
import type { Experience } from "@/types/database"

export default async function ExperiencePage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("experience")
    .select("*")
    .order("sort_order", { ascending: true })

  return (
    <>
      <AdminHeader title="Experience" />
      <div className="max-w-4xl p-4 md:p-6">
        <ExperienceList entries={(data as Experience[]) ?? []} />
      </div>
    </>
  )
}
