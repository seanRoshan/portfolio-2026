import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../../admin-header"
import { ExperienceForm } from "../experience-form"
import type { Experience } from "@/types/database"

export default async function EditExperiencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from("experience").select("*").eq("id", id).single()

  if (!data) notFound()

  return (
    <>
      <AdminHeader title={`Edit: ${data.role} at ${data.company}`} />
      <div className="p-4 md:p-6 max-w-3xl">
        <ExperienceForm data={data as Experience} />
      </div>
    </>
  )
}
