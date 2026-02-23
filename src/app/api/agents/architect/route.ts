import { streamText, UIMessage, convertToModelMessages } from "ai"
import { createClient } from "@/lib/supabase/server"
import { getModel } from "@/lib/ai/models"

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

  const { messages }: { messages: UIMessage[] } = await req.json()

  // Fetch agent system prompt from DB
  const { data: agentPrompt } = await supabase
    .from("ai_prompts")
    .select("system_prompt, model_id")
    .eq("slug", "enterprise_architect")
    .single()

  const systemPrompt =
    agentPrompt?.system_prompt ??
    "You are a Veteran Systems Engineering Agent. Design architectures and output Mermaid.js diagrams."

  const modelId = agentPrompt?.model_id ?? undefined

  const result = streamText({
    model: getModel(modelId),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
