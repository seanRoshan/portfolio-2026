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
  }: {
    messages: UIMessage[]
    resumeId: string
  } = await req.json()

  if (!resumeId) {
    return new Response("resumeId is required", { status: 400 })
  }

  // Fetch agent system prompt from DB
  const { data: agentPrompt } = await supabase
    .from("ai_prompts")
    .select("system_prompt, model_id")
    .eq("slug", "career_interviewer")
    .single()

  const systemPrompt =
    agentPrompt?.system_prompt ??
    "You are an elite Career Coach. Interview the user about their career experience and save structured data using the provided tools."

  const modelId = agentPrompt?.model_id ?? undefined

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

  const tools = createInterviewerTools(resumeId)

  const result = streamText({
    model: getModel(modelId),
    system: systemPrompt + existingContext,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
  })

  return result.toUIMessageStreamResponse()
}
