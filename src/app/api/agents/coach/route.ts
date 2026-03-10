import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai"
import { createClient } from "@/lib/supabase/server"
import { getModel } from "@/lib/ai/models"
import { createInterviewerTools } from "@/lib/ai/tools/career-interviewer"

export const maxDuration = 60

export async function POST(req: Request) {
  // Auth guard
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const {
    messages,
    resumeId,
    sessionType,
  }: {
    messages: UIMessage[]
    resumeId: string
    sessionType?: string
  } = await req.json()

  if (!resumeId) {
    return new Response("resumeId is required", { status: 400 })
  }

  // Fetch agent system prompt from DB
  const { data: agentPrompt } = await supabase
    .from("ai_prompts")
    .select("system_prompt, model_id, max_tokens")
    .eq("slug", "career_interviewer")
    .single()

  const systemPrompt =
    agentPrompt?.system_prompt ??
    "You are an elite Career Coach. Interview the user about their career experience and save structured data using the provided tools."

  const modelId = agentPrompt?.model_id ?? undefined
  const maxTokens = agentPrompt?.max_tokens ?? 4096

  // Build existing career data context for deduplication
  const { data: existingExperiences } = await supabase
    .from("resume_work_experiences")
    .select("job_title, company")
    .eq("resume_id", resumeId)

  const { data: existingProjects } = await supabase
    .from("resume_projects")
    .select("name")
    .eq("resume_id", resumeId)

  const existingContext =
    existingExperiences?.length || existingProjects?.length
      ? `\n\n<existing_career_data>
Already documented experiences: ${(existingExperiences ?? []).map((e) => `${e.job_title} at ${e.company}`).join(", ") || "None"}
Already documented projects: ${(existingProjects ?? []).map((p) => p.name).join(", ") || "None"}
Do NOT save duplicate entries for these.
</existing_career_data>`
      : ""

  const sessionAddendum = getSessionTypeAddendum(sessionType)

  const tools = createInterviewerTools(resumeId)

  const result = streamText({
    model: getModel(modelId),
    system: systemPrompt + existingContext + sessionAddendum,
    messages: await convertToModelMessages(messages),
    tools,
    maxOutputTokens: maxTokens,
    stopWhen: stepCountIs(5),
  })

  return result.toUIMessageStreamResponse()
}

function getSessionTypeAddendum(sessionType?: string): string {
  switch (sessionType) {
    case "project_builder":
      return `\n\n<session_instructions>
You are in PROJECT BUILDER mode. Your goal is to document the user's projects with compelling descriptions and measurable impact.
- Ask about each project's company context (was it built at work, freelance, personal?)
- Ask about the tech stack, architecture decisions, and challenges overcome
- Probe for measurable impact: users served, performance gains, time saved, revenue impact
- Always include the company field when saving projects using the save_project tool
- Help craft 2-4 achievement bullets per project using the XYZ formula
</session_instructions>`

    case "experience_builder":
      return `\n\n<session_instructions>
You are in EXPERIENCE BUILDER mode. Your goal is to interview the user about their work history and extract strong, metrics-driven bullet points.
- Interview about each role: responsibilities, team size, scope, key achievements
- Extract XYZ-formula bullets: "Accomplished [X] as measured by [Y] by doing [Z]"
- Ask probing follow-ups to uncover metrics: "How many users?", "What was the performance improvement?", "How much time did this save?"
- Cover 2-5 achievement bullets per role before moving to the next
- Prioritize quantifiable results over vague descriptions
</session_instructions>`

    case "interview_prep":
      return `\n\n<session_instructions>
You are in INTERVIEW PREP mode. Your goal is to help the user practice behavioral interview questions using the STAR method.
- Present one behavioral question at a time (e.g., "Tell me about a time you dealt with a difficult stakeholder")
- After the user answers, provide structured feedback on their STAR response:
  - Situation: Was the context clear?
  - Task: Was the responsibility well-defined?
  - Action: Were specific actions described?
  - Result: Were outcomes quantified?
- Suggest improvements and offer a follow-up question
- Cover common categories: leadership, conflict, failure, teamwork, technical challenges
</session_instructions>`

    case "career_narrative":
      return `\n\n<session_instructions>
You are in CAREER NARRATIVE mode. Your goal is to help the user build a cohesive story that connects their experiences.
- Ask about career transitions: why they moved between roles, industries, or technologies
- Help identify themes and throughlines across their career (e.g., "scaling systems", "developer experience")
- Connect the narrative to their target role — how does their journey lead naturally to where they want to go?
- Help craft a professional summary that tells this story in 2-3 sentences
- Focus on the "why" behind career moves, not just the "what"
</session_instructions>`

    default:
      return ""
  }
}
