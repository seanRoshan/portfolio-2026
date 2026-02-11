import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../../admin-header"
import { VentureForm } from "../venture-form"
import type { Venture } from "@/types/database"

export default async function EditVenturePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from("ventures").select("*").eq("id", id).single()

  if (!data) notFound()

  return (
    <>
      <AdminHeader title={`Edit: ${data.name}`} />
      <div className="max-w-3xl p-4 md:p-6">
        <VentureForm data={data as Venture} />
      </div>
    </>
  )
}
