import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const supabase = await createClient()

  const { data: resume } = await supabase.from("resume").select("*").single()

  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 })
  }

  // If a pre-built PDF exists, redirect to it
  if (resume.pdf_url) {
    return NextResponse.redirect(resume.pdf_url, 302)
  }

  // Otherwise generate on the fly
  const { data: skills } = await supabase
    .from("skills")
    .select("name, category")
    .eq("published", true)
    .eq("show_on_resume", true)
    .order("sort_order")

  const { data: experience } = await supabase
    .from("experience")
    .select("*")
    .eq("published", true)
    .eq("show_on_resume", true)
    .order("sort_order")

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]

  const skillGroups = new Map<string, string[]>()
  for (const skill of skills ?? []) {
    if (!skillGroups.has(skill.category)) skillGroups.set(skill.category, [])
    skillGroups.get(skill.category)!.push(skill.name)
  }

  const formattedExperience = (experience ?? []).map((e) => {
    const start = new Date(e.start_date)
    const startStr = `${monthNames[start.getMonth()]} ${start.getFullYear()}`
    const endStr = e.end_date
      ? `${monthNames[new Date(e.end_date).getMonth()]} ${new Date(e.end_date).getFullYear()}`
      : "Present"
    return {
      company: e.company as string,
      role: e.role as string,
      location: e.location as string | null,
      period: `${startStr} – ${endStr}`,
      description: e.description as string | null,
      achievements: (e.achievements ?? []) as string[],
    }
  })

  const { generateResumePdf } = await import("@/lib/pdf/generate-resume-pdf")

  const pdfBuffer = await generateResumePdf({
    ...resume,
    skillGroups: Array.from(skillGroups.entries()).map(([category, names]) => ({
      category,
      skills: names,
    })),
    experience: formattedExperience,
  })

  // Upload for future use
  const admin = createAdminClient()
  const fileName = `resume-${Date.now()}.pdf`
  await admin.storage.from("resume").upload(fileName, pdfBuffer, {
    contentType: "application/pdf",
    upsert: true,
  })

  const { data: urlData } = admin.storage.from("resume").getPublicUrl(fileName)
  await supabase.from("resume").update({ pdf_url: urlData.publicUrl }).eq("id", resume.id)

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${resume.full_name.replace(/\s+/g, "_")}_Resume.pdf"`,
    },
  })
}
