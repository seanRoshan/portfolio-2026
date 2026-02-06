import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../admin-header"
import { ProjectsList } from "./projects-list"
import type { Project } from "@/types/database"

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true })

  return (
    <>
      <AdminHeader title="Projects" />
      <div className="max-w-4xl p-4 md:p-6">
        <ProjectsList projects={(data as Project[]) ?? []} />
      </div>
    </>
  )
}
