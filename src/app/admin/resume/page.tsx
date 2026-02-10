import { createClient } from "@/lib/supabase/server"
import { AdminHeader } from "../admin-header"
import { ResumeForm } from "./resume-form"
import type { Resume, Skill, Experience, Education, Certification } from "@/types/database"

export default async function ResumeAdminPage() {
  const supabase = await createClient()

  const [
    { data: resume },
    { data: skills },
    { data: experience },
    { data: education },
    { data: certifications },
  ] = await Promise.all([
    supabase.from("resume").select("*").single(),
    supabase.from("skills").select("*").eq("published", true).order("sort_order"),
    supabase.from("experience").select("*").eq("published", true).order("sort_order"),
    supabase.from("education").select("*").eq("published", true).order("sort_order"),
    supabase.from("certifications").select("*").eq("published", true).order("sort_order"),
  ])

  return (
    <>
      <AdminHeader title="Resume" />
      <div className="p-4 md:p-6">
        <ResumeForm
          data={(resume as Resume) ?? null}
          skills={(skills as Skill[]) ?? []}
          experience={(experience as Experience[]) ?? []}
          educationEntries={(education as Education[]) ?? []}
          certificationEntries={(certifications as Certification[]) ?? []}
        />
      </div>
    </>
  )
}
