import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../admin-header"
import { SkillsList } from "./skills-list"
import type { Skill } from "@/types/database"

export default async function SkillsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("skills")
    .select("*")
    .order("sort_order", { ascending: true })

  return (
    <>
      <AdminHeader title="Skills" />
      <div className="max-w-4xl p-4 md:p-6">
        <SkillsList skills={(data as Skill[]) ?? []} />
      </div>
    </>
  )
}
