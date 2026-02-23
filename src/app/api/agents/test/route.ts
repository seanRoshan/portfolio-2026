import { streamText, UIMessage, convertToModelMessages } from "ai"
import { createClient } from "@/lib/supabase/server"
import { getModel } from "@/lib/ai/models"

export const maxDuration = 30

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

  const result = streamText({
    model: getModel("us.anthropic.claude-3-5-haiku-20241022-v1:0"),
    system: "You are a helpful assistant. Keep responses brief.",
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
