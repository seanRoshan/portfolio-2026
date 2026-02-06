"use server"

import { revalidateTag, revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAuth } from "@/lib/admin-auth"
import { resumeSchema, type ResumeFormValues } from "@/lib/schemas/resume"

export async function updateResume(data: ResumeFormValues) {
  await requireAuth()
  const validated = resumeSchema.parse(data)
  const supabase = await createClient()

  // Check if resume row exists
  const { data: existing } = await supabase.from("resume").select("id").single()

  if (existing) {
    const { error } = await supabase.from("resume").update(validated).eq("id", existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from("resume").insert(validated)
    if (error) return { error: error.message }
  }

  revalidateTag("resume", "max")
  revalidatePath("/resume")
  return { success: true }
}

export async function toggleSkillResume(id: string, show: boolean) {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase.from("skills").update({ show_on_resume: show }).eq("id", id)
  if (error) return { error: error.message }

  revalidateTag("resume", "max")
  revalidateTag("skills", "max")
  return { success: true }
}

export async function toggleExperienceResume(id: string, show: boolean) {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase.from("experience").update({ show_on_resume: show }).eq("id", id)
  if (error) return { error: error.message }

  revalidateTag("resume", "max")
  revalidateTag("experience", "max")
  return { success: true }
}

export async function generateAndUploadPdf() {
  await requireAuth()
  const supabase = await createClient()

  // Fetch all resume data
  const { data: resume } = await supabase.from("resume").select("*").single()
  if (!resume) return { error: "No resume data found" }

  // Fetch skills for resume
  const { data: skills } = await supabase
    .from("skills")
    .select("name, category")
    .eq("published", true)
    .eq("show_on_resume", true)
    .order("sort_order")

  // Fetch experience for resume
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

  // Group skills by category
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
      company: e.company,
      role: e.role,
      location: e.location as string | null,
      period: `${startStr} – ${endStr}`,
      description: e.description as string | null,
      achievements: (e.achievements ?? []) as string[],
    }
  })

  // Dynamic import to avoid loading @react-pdf/renderer during SSR of other pages
  const { generateResumePdf } = await import("@/lib/pdf/generate-resume-pdf")

  const pdfBuffer = await generateResumePdf({
    ...resume,
    skillGroups: Array.from(skillGroups.entries()).map(([category, names]) => ({
      category,
      skills: names,
    })),
    experience: formattedExperience,
  })

  // Upload to Supabase storage
  const admin = createAdminClient()
  const fileName = `resume-${Date.now()}.pdf`

  // Delete old PDF if it exists
  if (resume.pdf_url) {
    const oldPath = resume.pdf_url.split("/resume/")[1]
    if (oldPath) {
      await admin.storage.from("resume").remove([oldPath])
    }
  }

  const { error: uploadError } = await admin.storage.from("resume").upload(fileName, pdfBuffer, {
    contentType: "application/pdf",
    upsert: true,
  })
  if (uploadError) return { error: uploadError.message }

  const { data: urlData } = admin.storage.from("resume").getPublicUrl(fileName)

  // Update resume row with PDF URL
  const { error: updateError } = await supabase
    .from("resume")
    .update({ pdf_url: urlData.publicUrl })
    .eq("id", resume.id)
  if (updateError) return { error: updateError.message }

  revalidateTag("resume", "max")
  revalidatePath("/resume")
  return { success: true, pdf_url: urlData.publicUrl }
}
