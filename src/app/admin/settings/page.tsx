import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../admin-header"
import { SettingsForm } from "./settings-form"
import type { SiteSettings } from "@/types/database"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data } = await supabase.from("site_settings").select("*").single()

  if (!data) {
    return (
      <>
        <AdminHeader title="Settings" />
        <div className="p-4 md:p-6">
          <p className="text-muted-foreground">
            No site settings found. Run the seed script first.
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <AdminHeader title="Settings" />
      <div className="max-w-3xl p-4 md:p-6">
        <SettingsForm data={data as SiteSettings} />
      </div>
    </>
  )
}
