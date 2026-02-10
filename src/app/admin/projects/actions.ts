"use server"

import { revalidateTag, revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/admin-auth"
import { projectSchema, type ProjectFormValues } from "@/lib/schemas/project"

export async function createProject(data: ProjectFormValues) {
  await requireAuth()
  const { experience_ids, skill_ids, education_ids, certification_ids, ...projectData } =
    projectSchema.parse(data)
  const supabase = await createClient()

  // Auto-increment sort_order
  const { data: last } = await supabase
    .from("projects")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single()

  const sort_order = (last?.sort_order ?? 0) + 1

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ ...projectData, sort_order })
    .select("id")
    .single()
  if (error) return { error: error.message }

  // Insert junction table rows
  if (experience_ids.length > 0) {
    await supabase.from("project_experiences").insert(
      experience_ids.map((experience_id) => ({
        project_id: project.id,
        experience_id,
      })),
    )
  }

  if (skill_ids.length > 0) {
    await supabase.from("project_skills").insert(
      skill_ids.map((skill_id) => ({
        project_id: project.id,
        skill_id,
      })),
    )
  }

  if (education_ids.length > 0) {
    await supabase.from("project_education").insert(
      education_ids.map((education_id) => ({
        project_id: project.id,
        education_id,
      })),
    )
  }

  if (certification_ids.length > 0) {
    await supabase.from("project_certifications").insert(
      certification_ids.map((certification_id) => ({
        project_id: project.id,
        certification_id,
      })),
    )
  }

  revalidateTag("projects", "max")
  revalidatePath("/")
  return { success: true }
}

export async function updateProject(id: string, data: ProjectFormValues) {
  await requireAuth()
  const { experience_ids, skill_ids, education_ids, certification_ids, ...projectData } =
    projectSchema.parse(data)
  const supabase = await createClient()

  const { error } = await supabase.from("projects").update(projectData).eq("id", id)
  if (error) return { error: error.message }

  // Replace junction table rows (delete old, insert new)
  await Promise.all([
    supabase.from("project_experiences").delete().eq("project_id", id),
    supabase.from("project_skills").delete().eq("project_id", id),
    supabase.from("project_education").delete().eq("project_id", id),
    supabase.from("project_certifications").delete().eq("project_id", id),
  ])

  if (experience_ids.length > 0) {
    await supabase.from("project_experiences").insert(
      experience_ids.map((experience_id) => ({
        project_id: id,
        experience_id,
      })),
    )
  }

  if (skill_ids.length > 0) {
    await supabase.from("project_skills").insert(
      skill_ids.map((skill_id) => ({
        project_id: id,
        skill_id,
      })),
    )
  }

  if (education_ids.length > 0) {
    await supabase.from("project_education").insert(
      education_ids.map((education_id) => ({
        project_id: id,
        education_id,
      })),
    )
  }

  if (certification_ids.length > 0) {
    await supabase.from("project_certifications").insert(
      certification_ids.map((certification_id) => ({
        project_id: id,
        certification_id,
      })),
    )
  }

  revalidateTag("projects", "max")
  revalidatePath("/")
  return { success: true }
}

export async function deleteProject(id: string) {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase.from("projects").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidateTag("projects", "max")
  revalidatePath("/")
  return { success: true }
}

export async function updateProjectOrder(ids: string[]) {
  await requireAuth()
  const supabase = await createClient()

  // Update sort_order for each project based on array position
  const updates = ids.map((id, index) =>
    supabase.from("projects").update({ sort_order: index }).eq("id", id),
  )

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }

  revalidateTag("projects", "max")
  return { success: true }
}

export async function syncSkillFromProject(name: string, category: string) {
  await requireAuth()
  const supabase = await createClient()

  // Check if skill already exists (case-insensitive)
  const { data: existing } = await supabase
    .from("skills")
    .select("id")
    .ilike("name", name)
    .limit(1)
    .single()

  if (existing) return { skill_id: existing.id }

  // Create new skill
  const { data: newSkill, error } = await supabase
    .from("skills")
    .insert({
      name,
      category,
      published: true,
      show_on_resume: false,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  revalidateTag("skills", "max")
  return { skill_id: newSkill.id }
}
