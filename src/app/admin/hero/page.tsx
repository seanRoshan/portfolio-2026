import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../admin-header"
import { HeroForm } from "./hero-form"
import type { HeroSection } from "@/types/database"

export default async function HeroPage() {
  const supabase = await createClient()
  const { data } = await supabase.from("hero_section").select("*").single()

  if (!data) {
    return (
      <>
        <AdminHeader title="Hero" />
        <div className="p-4 md:p-6">
          <p className="text-muted-foreground">No hero section found. Run the seed script first.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <AdminHeader title="Hero" />
      <div className="p-4 md:p-6 max-w-3xl">
        <HeroForm data={data as HeroSection} />
      </div>
    </>
  )
}
