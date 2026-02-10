import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../admin-header"
import { CertificationList } from "./certification-list"
import type { Certification } from "@/types/database"

export default async function CertificationsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("certifications")
    .select("*")
    .order("sort_order", { ascending: true })

  return (
    <>
      <AdminHeader title="Certifications" />
      <div className="max-w-4xl p-4 md:p-6">
        <CertificationList entries={(data as Certification[]) ?? []} />
      </div>
    </>
  )
}
