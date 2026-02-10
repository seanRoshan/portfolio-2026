import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../admin-header"
import { EducationList } from "./education-list"
import type { Education } from "@/types/database"

export default async function EducationPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("education")
    .select("*")
    .order("sort_order", { ascending: true })

  return (
    <>
      <AdminHeader title="Education" />
      <div className="max-w-4xl p-4 md:p-6">
        <EducationList entries={(data as Education[]) ?? []} />
      </div>
    </>
  )
}
