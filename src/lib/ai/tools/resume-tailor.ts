import { tool } from "ai"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { getResumeWithRelations } from "@/lib/resume-builder/queries"
import { matchJobDescription, analyzeJobDescription } from "@/lib/resume-builder/ai/services"

/**
 * Resume Tailor Agent Tools
 *
 * These tools allow the Resume Tailor agent to analyze job descriptions,
 * match them against a resume, and generate tailored bullet points.
 */

export function createTailorTools(resumeId: string) {
  const supabase = createAdminClient()

  return {
    analyze_job_description: tool({
      description:
        "Analyze a job description to extract key skills, requirements, qualifications, experience level, and red flags. " +
        "Use this when the user pastes a job description to understand what the role demands.",
      inputSchema: z.object({
        raw_text: z.string().describe("The full text of the job description"),
      }),
      execute: async ({ raw_text }) => {
        const analysis = await analyzeJobDescription(raw_text)
        return analysis
      },
    }),

    match_resume_to_jd: tool({
      description:
        "Match the user's resume against a job description to calculate a match rate, " +
        "identify present and missing keywords, and generate improvement suggestions. " +
        "Use this after analyzing the job description.",
      inputSchema: z.object({
        job_description_text: z.string().describe("The job description text to match against"),
      }),
      execute: async ({ job_description_text }) => {
        const resume = await getResumeWithRelations(resumeId)
        if (!resume) return { error: "Resume not found" }
        const matchResult = await matchJobDescription(resume, job_description_text)
        return matchResult
      },
    }),

    generate_tailored_bullets: tool({
      description:
        "Generate tailored resume bullet points that mirror the terminology from a job description " +
        "while preserving factual accuracy from the user's actual experience. " +
        "Always uses XYZ formula: 'Accomplished [X] as measured by [Y] by doing [Z]'.",
      inputSchema: z.object({
        experience_context: z
          .string()
          .describe("The original experience description or bullet points to rewrite"),
        target_keywords: z
          .array(z.string())
          .describe("Keywords from the JD to mirror in the rewritten bullets"),
        count: z.number().min(1).max(10).default(5).describe("Number of bullet points to generate"),
      }),
      execute: async ({ experience_context, target_keywords, count }) => {
        // This tool returns instructions for the LLM to generate bullets
        // The actual generation happens in the LLM's response
        return {
          instruction:
            "Generate the tailored bullets in your response text. " +
            "Mirror these keywords where factually accurate: " +
            target_keywords.join(", "),
          source_experience: experience_context,
          requested_count: count,
        }
      },
    }),

    save_job_analysis: tool({
      description:
        "Save a job description analysis to the database for future reference. " +
        "Use this after completing the analysis.",
      inputSchema: z.object({
        title: z.string().describe("Job title"),
        company: z.string().optional().describe("Company name"),
        raw_text: z.string().describe("Full job description text"),
        extracted_skills: z.array(z.string()).describe("Extracted skills"),
        extracted_requirements: z.array(z.string()).describe("Extracted requirements"),
        extracted_qualifications: z.array(z.string()).describe("Extracted qualifications"),
        experience_level: z.string().optional().describe("Detected experience level"),
        summary: z.string().optional().describe("Brief summary of the role"),
      }),
      execute: async ({
        title,
        company,
        raw_text,
        extracted_skills,
        extracted_requirements,
        extracted_qualifications,
        experience_level,
        summary,
      }) => {
        // Get user ID from the resume
        const { data: resume } = await supabase
          .from("resumes")
          .select("user_id")
          .eq("id", resumeId)
          .single()

        const { data: jd, error } = await supabase
          .from("job_descriptions")
          .insert({
            user_id: resume?.user_id ?? null,
            title,
            company: company ?? null,
            raw_text,
            extracted_skills,
            extracted_requirements,
            extracted_qualifications,
            analysis: { experience_level, summary },
          })
          .select("id")
          .single()

        if (error) return { success: false, error: error.message }

        return {
          success: true,
          jd_id: jd.id,
          message: `Saved analysis for "${title}"${company ? ` at ${company}` : ""}.`,
        }
      },
    }),

    update_resume_bullets: tool({
      description:
        "Update achievement bullet points for an existing work experience or project on the resume. " +
        "Use this to replace existing bullets with tailored versions. The user must confirm before saving.",
      inputSchema: z.object({
        parent_id: z.string().describe("The ID of the work experience or project to update"),
        parent_type: z
          .enum(["work", "project"])
          .describe("Whether this is a work experience or project"),
        new_bullets: z.array(z.string()).min(1).describe("The new tailored bullet points to save"),
      }),
      execute: async ({ parent_id, parent_type, new_bullets }) => {
        // Delete existing achievements for this parent
        const { error: delError } = await supabase
          .from("resume_achievements")
          .delete()
          .eq("parent_id", parent_id)
          .eq("parent_type", parent_type)

        if (delError) return { success: false, error: delError.message }

        // Insert new achievements
        const rows = new_bullets.map((text, i) => ({
          parent_id,
          parent_type,
          text,
          has_metric: /\d/.test(text),
          sort_order: i,
        }))

        const { error: insError } = await supabase.from("resume_achievements").insert(rows)

        if (insError) return { success: false, error: insError.message }

        return {
          success: true,
          message: `Updated ${new_bullets.length} bullet points for ${parent_type} entry.`,
        }
      },
    }),
  }
}
