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
      <div className="p-4 md:p-6 max-w-4xl">
        <ProjectsList projects={(data as Project[]) ?? []} />
      </div>
    </>
  )
}
