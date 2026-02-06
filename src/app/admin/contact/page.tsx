import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../admin-header"
import { ContactInfoForm } from "./contact-form"
import type { SiteSettings } from "@/types/database"

export default async function ContactInfoPage() {
  const supabase = await createClient()
  const { data } = await supabase.from("site_settings").select("*").single()

  if (!data) {
    return (
      <>
        <AdminHeader title="Contact Info" />
        <div className="p-4 md:p-6">
          <p className="text-muted-foreground">No site settings found. Run the seed script first.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <AdminHeader title="Contact Info" />
      <div className="p-4 md:p-6 max-w-3xl">
        <ContactInfoForm data={data as SiteSettings} />
      </div>
    </>
  )
}
