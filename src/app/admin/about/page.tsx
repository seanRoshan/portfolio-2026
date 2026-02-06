import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../admin-header"
import { AboutForm } from "./about-form"
import type { AboutSection } from "@/types/database"

export default async function AboutPage() {
  const supabase = await createClient()
  const { data } = await supabase.from("about_section").select("*").single()

  if (!data) {
    return (
      <>
        <AdminHeader title="About" />
        <div className="p-4 md:p-6">
          <p className="text-muted-foreground">No about section found. Run the seed script first.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <AdminHeader title="About" />
      <div className="p-4 md:p-6 max-w-3xl">
        <AboutForm data={data as AboutSection} />
      </div>
    </>
  )
}
