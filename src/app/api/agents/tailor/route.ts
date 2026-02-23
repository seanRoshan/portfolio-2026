import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai"
import { createClient } from "@/lib/supabase/server"
import { getModel } from "@/lib/ai/models"
import { createTailorTools } from "@/lib/ai/tools/resume-tailor"
import { buildCareerContext } from "@/lib/ai/context-builder"

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
    .eq("slug", "resume_tailor")
    .single()

  const systemPrompt =
    agentPrompt?.system_prompt ??
    "You are an Executive Resume Writer. Tailor existing experience to specific job descriptions with ATS optimization."

  const modelId = agentPrompt?.model_id ?? undefined

  // Build career context from resume data
  const careerContext = await buildCareerContext(resumeId)
  const contextBlock = careerContext ? `\n\n<career_data>\n${careerContext}\n</career_data>` : ""

  const tools = createTailorTools(resumeId)

  const result = streamText({
    model: getModel(modelId),
    system: systemPrompt + contextBlock,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
  })

  return result.toUIMessageStreamResponse()
}
