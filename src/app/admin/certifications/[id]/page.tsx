import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../../admin-header"
import { CertificationForm } from "../certification-form"
import type { Certification } from "@/types/database"

export default async function EditCertificationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from("certifications").select("*").eq("id", id).single()

  if (!data) notFound()

  return (
    <>
      <AdminHeader title={`Edit: ${data.name}`} />
      <div className="max-w-3xl p-4 md:p-6">
        <CertificationForm data={data as Certification} />
      </div>
    </>
  )
}
