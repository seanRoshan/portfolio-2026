import { getResumeWithRelations } from "@/lib/resume-builder/queries"
import type { ResumeWithRelations } from "@/types/resume-builder"

/**
 * Build a structured career context string from a resume for AI agent consumption.
 * Includes token budgeting to stay within reasonable context limits.
 */
export async function buildCareerContext(
  resumeId: string,
  maxChars: number = 8000,
): Promise<string | null> {
  const resume = await getResumeWithRelations(resumeId)
  if (!resume) return null
  return formatResumeContext(resume, maxChars)
}

export function formatResumeContext(resume: ResumeWithRelations, maxChars: number = 8000): string {
  const sections: string[] = []

  // Header
  if (resume.contact_info?.full_name) {
    sections.push(`<candidate_name>${resume.contact_info.full_name}</candidate_name>`)
  }

  // Summary
  if (resume.summary?.text) {
    sections.push(`<professional_summary>\n${resume.summary.text}\n</professional_summary>`)
  }

  // Work Experience — highest priority, most space
  if (resume.work_experiences.length > 0) {
    const expLines = resume.work_experiences.map((exp) => {
      const dateRange = [exp.start_date, exp.end_date ?? "Present"].filter(Boolean).join(" — ")
      const bullets = (exp.achievements ?? []).map((a) => `  - ${a.text}`).join("\n")
      return `${exp.job_title} at ${exp.company}${exp.location ? ` (${exp.location})` : ""} [${dateRange}]\n${bullets}`
    })
    sections.push(`<work_experience>\n${expLines.join("\n\n")}\n</work_experience>`)
  }

  // Projects
  if (resume.projects.length > 0) {
    const projLines = resume.projects.map((proj) => {
      const bullets = (proj.achievements ?? []).map((a) => `  - ${a.text}`).join("\n")
      const desc = proj.description ? `: ${proj.description}` : ""
      return `${proj.name}${desc}\n${bullets}`
    })
    sections.push(`<projects>\n${projLines.join("\n\n")}\n</projects>`)
  }

  // Skills
  if (resume.skill_categories.length > 0) {
    const skillLines = resume.skill_categories.map((cat) => `${cat.name}: ${cat.skills.join(", ")}`)
    sections.push(`<skills>\n${skillLines.join("\n")}\n</skills>`)
  }

  // Education
  if (resume.education.length > 0) {
    const eduLines = resume.education.map((edu) => {
      const parts = [
        edu.degree,
        edu.field_of_study ? `in ${edu.field_of_study}` : null,
        `from ${edu.institution}`,
        edu.graduation_date ? `(${edu.graduation_date})` : null,
        edu.gpa ? `GPA: ${edu.gpa}` : null,
        edu.honors ?? null,
      ].filter(Boolean)
      return parts.join(" ")
    })
    sections.push(`<education>\n${eduLines.join("\n")}\n</education>`)
  }

  // Certifications
  if (resume.certifications.length > 0) {
    const certLines = resume.certifications.map((c) => {
      const parts = [c.name, c.issuer ? `(${c.issuer})` : null, c.date ?? null].filter(Boolean)
      return parts.join(" ")
    })
    sections.push(`<certifications>\n${certLines.join("\n")}\n</certifications>`)
  }

  // Build and truncate
  let result = sections.join("\n\n")
  if (result.length > maxChars) {
    result = result.slice(0, maxChars) + "\n... (truncated for token budget)"
  }

  return result
}
