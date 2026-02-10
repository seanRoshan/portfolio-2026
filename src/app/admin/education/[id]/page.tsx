import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../../admin-header"
import { EducationForm } from "../education-form"
import type { Education } from "@/types/database"

export default async function EditEducationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from("education").select("*").eq("id", id).single()

  if (!data) notFound()

  return (
    <>
      <AdminHeader title={`Edit: ${data.school}`} />
      <div className="max-w-3xl p-4 md:p-6">
        <EducationForm data={data as Education} />
      </div>
    </>
  )
}
