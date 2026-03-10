import { tool } from "ai"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Career Interviewer Agent Tools
 *
 * These tools allow the Career Interviewer agent to autonomously save
 * structured career data to the resume database as it interviews the user.
 * Each tool maps directly to an existing resume builder DB table.
 */

/** Create tools bound to a specific resume ID */
export function createInterviewerTools(resumeId: string) {
  const supabase = createAdminClient()

  return {
    save_work_experience: tool({
      description:
        "Save a work experience entry with achievement bullet points to the user's resume. " +
        "Use this after gathering sufficient details about a role including company, title, dates, and at least 2-3 XYZ-formula achievements.",
      inputSchema: z.object({
        job_title: z.string().describe("Job title (e.g. 'Senior Software Engineer')"),
        company: z.string().describe("Company name"),
        location: z.string().optional().describe("City, State or 'Remote'"),
        start_date: z.string().optional().describe("Start date in YYYY-MM format (e.g. '2022-01')"),
        end_date: z
          .string()
          .nullable()
          .optional()
          .describe("End date in YYYY-MM format, or null if current role"),
        achievements: z
          .array(z.string())
          .min(1)
          .describe(
            "Achievement bullet points in XYZ formula: 'Accomplished [X] as measured by [Y] by doing [Z]'",
          ),
      }),
      execute: async ({ job_title, company, location, start_date, end_date, achievements }) => {
        // Get current max sort_order
        const { data: existing } = await supabase
          .from("resume_work_experiences")
          .select("sort_order")
          .eq("resume_id", resumeId)
          .order("sort_order", { ascending: false })
          .limit(1)

        const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

        // Insert work experience
        const { data: exp, error: expError } = await supabase
          .from("resume_work_experiences")
          .insert({
            resume_id: resumeId,
            job_title,
            company,
            location: location ?? null,
            start_date: start_date ?? null,
            end_date: end_date ?? null,
            sort_order: nextOrder,
            is_visible: true,
            is_promotion: false,
          })
          .select("id")
          .single()

        if (expError) return { success: false, error: expError.message }

        // Insert achievements
        const achievementRows = achievements.map((text, i) => ({
          parent_id: exp.id,
          parent_type: "work" as const,
          text,
          has_metric: /\d/.test(text),
          sort_order: i,
        }))

        const { error: achError } = await supabase
          .from("resume_achievements")
          .insert(achievementRows)

        if (achError) return { success: false, error: achError.message }

        return {
          success: true,
          experience_id: exp.id,
          message: `Saved ${job_title} at ${company} with ${achievements.length} bullet points.`,
        }
      },
    }),

    save_project: tool({
      description:
        "Save a project entry with description and achievement bullets to the user's resume. " +
        "Use this after gathering project details including name, description, and impact metrics.",
      inputSchema: z.object({
        name: z.string().describe("Project name"),
        company: z
          .string()
          .optional()
          .describe("Company or organization this project was built for/at"),
        description: z.string().optional().describe("Brief project description (1-2 sentences)"),
        project_url: z.string().url().optional().describe("Live project URL"),
        source_url: z.string().url().optional().describe("Source code URL (e.g. GitHub)"),
        achievements: z
          .array(z.string())
          .min(1)
          .describe("Achievement bullet points describing impact and technical details"),
      }),
      execute: async ({ name, company, description, project_url, source_url, achievements }) => {
        const { data: existing } = await supabase
          .from("resume_projects")
          .select("sort_order")
          .eq("resume_id", resumeId)
          .order("sort_order", { ascending: false })
          .limit(1)

        const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

        const { data: proj, error: projError } = await supabase
          .from("resume_projects")
          .insert({
            resume_id: resumeId,
            name,
            company: company ?? null,
            description: description ?? null,
            project_url: project_url ?? null,
            source_url: source_url ?? null,
            sort_order: nextOrder,
          })
          .select("id")
          .single()

        if (projError) return { success: false, error: projError.message }

        const achievementRows = achievements.map((text, i) => ({
          parent_id: proj.id,
          parent_type: "project" as const,
          text,
          has_metric: /\d/.test(text),
          sort_order: i,
        }))

        const { error: achError } = await supabase
          .from("resume_achievements")
          .insert(achievementRows)

        if (achError) return { success: false, error: achError.message }

        return {
          success: true,
          project_id: proj.id,
          message: `Saved project "${name}"${company ? ` at ${company}` : ""} with ${achievements.length} bullet points.`,
        }
      },
    }),

    save_education: tool({
      description:
        "Save an education entry to the user's resume. " +
        "Use this after gathering degree, institution, field of study, and graduation date.",
      inputSchema: z.object({
        degree: z.string().describe("Degree name (e.g. 'Bachelor of Science')"),
        institution: z.string().describe("University or institution name"),
        field_of_study: z.string().optional().describe("Major or field of study"),
        graduation_date: z
          .string()
          .optional()
          .describe("Graduation date in YYYY-MM format (e.g. '2020-05')"),
        gpa: z.number().optional().describe("GPA if notable (e.g. 3.8)"),
        honors: z.string().optional().describe("Honors or distinctions (e.g. 'Magna Cum Laude')"),
        relevant_coursework: z.array(z.string()).optional().describe("List of relevant courses"),
      }),
      execute: async ({
        degree,
        institution,
        field_of_study,
        graduation_date,
        gpa,
        honors,
        relevant_coursework,
      }) => {
        const { data: existing } = await supabase
          .from("resume_education")
          .select("sort_order")
          .eq("resume_id", resumeId)
          .order("sort_order", { ascending: false })
          .limit(1)

        const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

        const { data: edu, error } = await supabase
          .from("resume_education")
          .insert({
            resume_id: resumeId,
            degree,
            institution,
            field_of_study: field_of_study ?? null,
            graduation_date: graduation_date ?? null,
            gpa: gpa ?? null,
            honors: honors ?? null,
            relevant_coursework: relevant_coursework ?? null,
            sort_order: nextOrder,
          })
          .select("id")
          .single()

        if (error) return { success: false, error: error.message }

        return {
          success: true,
          education_id: edu.id,
          message: `Saved ${degree} from ${institution}.`,
        }
      },
    }),

    save_skills: tool({
      description:
        "Save a skill category with a list of skills to the user's resume. " +
        "Use categories like 'Languages', 'Frameworks', 'Cloud & DevOps', 'Databases', etc.",
      inputSchema: z.object({
        category_name: z
          .string()
          .describe("Skill category name (e.g. 'Languages', 'Frameworks & Libraries')"),
        skills: z
          .array(z.string())
          .min(1)
          .describe("List of individual skills (e.g. ['TypeScript', 'Python', 'Go'])"),
      }),
      execute: async ({ category_name, skills }) => {
        const { data: existing } = await supabase
          .from("resume_skill_categories")
          .select("sort_order")
          .eq("resume_id", resumeId)
          .order("sort_order", { ascending: false })
          .limit(1)

        const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

        const { data: cat, error } = await supabase
          .from("resume_skill_categories")
          .insert({
            resume_id: resumeId,
            name: category_name,
            skills,
            sort_order: nextOrder,
          })
          .select("id")
          .single()

        if (error) return { success: false, error: error.message }

        return {
          success: true,
          category_id: cat.id,
          message: `Saved skill category "${category_name}" with ${skills.length} skills.`,
        }
      },
    }),

    save_certification: tool({
      description:
        "Save a certification to the user's resume. " +
        "Use this for professional certifications like AWS Solutions Architect, PMP, etc.",
      inputSchema: z.object({
        name: z.string().describe("Certification name"),
        issuer: z.string().optional().describe("Issuing organization (e.g. 'Amazon Web Services')"),
        date: z.string().optional().describe("Date obtained in YYYY-MM format"),
      }),
      execute: async ({ name, issuer, date }) => {
        const { data: existing } = await supabase
          .from("resume_certifications")
          .select("sort_order")
          .eq("resume_id", resumeId)
          .order("sort_order", { ascending: false })
          .limit(1)

        const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

        const { data: cert, error } = await supabase
          .from("resume_certifications")
          .insert({
            resume_id: resumeId,
            name,
            issuer: issuer ?? null,
            date: date ?? null,
            sort_order: nextOrder,
          })
          .select("id")
          .single()

        if (error) return { success: false, error: error.message }

        return {
          success: true,
          certification_id: cert.id,
          message: `Saved certification "${name}".`,
        }
      },
    }),

    get_existing_career_data: tool({
      description:
        "Query the user's existing career data to check for duplicates before saving. " +
        "Always call this at the start of a session to understand what's already documented.",
      inputSchema: z.object({
        sections: z
          .array(z.enum(["work_experiences", "projects", "education", "skills", "certifications"]))
          .describe("Which sections to retrieve"),
      }),
      execute: async ({ sections }) => {
        const result: Record<string, unknown> = {}

        if (sections.includes("work_experiences")) {
          const { data } = await supabase
            .from("resume_work_experiences")
            .select("id, job_title, company, start_date, end_date")
            .eq("resume_id", resumeId)
            .order("sort_order")
          result.work_experiences = data ?? []
        }

        if (sections.includes("projects")) {
          const { data } = await supabase
            .from("resume_projects")
            .select("id, name, description")
            .eq("resume_id", resumeId)
            .order("sort_order")
          result.projects = data ?? []
        }

        if (sections.includes("education")) {
          const { data } = await supabase
            .from("resume_education")
            .select("id, degree, institution, field_of_study")
            .eq("resume_id", resumeId)
            .order("sort_order")
          result.education = data ?? []
        }

        if (sections.includes("skills")) {
          const { data } = await supabase
            .from("resume_skill_categories")
            .select("id, name, skills")
            .eq("resume_id", resumeId)
            .order("sort_order")
          result.skills = data ?? []
        }

        if (sections.includes("certifications")) {
          const { data } = await supabase
            .from("resume_certifications")
            .select("id, name, issuer, date")
            .eq("resume_id", resumeId)
            .order("sort_order")
          result.certifications = data ?? []
        }

        return result
      },
    }),
  }
}
