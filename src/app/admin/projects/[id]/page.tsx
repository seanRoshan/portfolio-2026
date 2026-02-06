import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../../admin-header"
import { ProjectForm } from "../project-form"
import type { Project } from "@/types/database"

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from("projects").select("*").eq("id", id).single()

  if (!data) notFound()

  return (
    <>
      <AdminHeader title={`Edit: ${data.title}`} />
      <div className="max-w-3xl p-4 md:p-6">
        <ProjectForm data={data as Project} />
      </div>
    </>
  )
}
