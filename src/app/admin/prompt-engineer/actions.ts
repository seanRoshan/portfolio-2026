"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { generateText } from "ai"
import { getAnthropicClient } from "@/lib/resume-builder/ai/client"
import { getModel } from "@/lib/ai/models"
import type { AIPrompt } from "@/types/ai-prompts"

export async function listPrompts(): Promise<AIPrompt[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ai_prompts")
    .select("*")
    .order("category")
    .order("name")

  if (error) throw new Error(error.message)
  return (data ?? []) as AIPrompt[]
}

export async function getPrompt(id: string): Promise<AIPrompt> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("ai_prompts").select("*").eq("id", id).single()

  if (error) throw new Error(error.message)
  return data as AIPrompt
}

export async function createPrompt(prompt: {
  slug: string
  name: string
  category: string
  description: string
  system_prompt: string
  user_prompt_template: string
  model: string
  max_tokens: number
}): Promise<AIPrompt> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ai_prompts")
    .insert({ ...prompt, is_default: false })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath("/admin/prompt-engineer")
  return data as AIPrompt
}

export async function updatePrompt(
  id: string,
  updates: Partial<{
    name: string
    category: string
    description: string
    system_prompt: string
    user_prompt_template: string
    model: string
    max_tokens: number
  }>,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("ai_prompts").update(updates).eq("id", id)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/prompt-engineer")
}

export async function deletePrompt(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("ai_prompts").delete().eq("id", id)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/prompt-engineer")
}

export async function testPrompt(
  systemPrompt: string,
  userPromptTemplate: string,
  variables: Record<string, string>,
  model: string,
  maxTokens: number,
): Promise<string> {
  const client = getAnthropicClient()
  if (!client) throw new Error("AI not available: ANTHROPIC_API_KEY not set")

  // Substitute variables
  const userMessage = userPromptTemplate.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? "")

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  })

  const textBlock = response.content.find((b) => b.type === "text")
  return textBlock?.text?.trim() ?? ""
}

const META_PROMPT_SYSTEM = `<role>
You are an expert Prompt Engineer specializing in Claude system prompts.
</role>

<task>
The user will provide a draft system prompt. Restructure and optimize it for maximum AI compliance.
</task>

<rules>
1. Use clear XML tags to separate role, objective, rules, and output_format sections.
2. Add explicit constraints for edge cases the draft may have missed.
3. Include a "begin by" instruction to anchor the AI's first response.
4. Remove ambiguity — replace vague instructions with specific, testable behaviors.
5. Preserve the original intent and domain expertise completely.
6. Do NOT add placeholder examples — only add examples if the original prompt warrants them.
</rules>

<output_format>
Return ONLY the perfected prompt text. No commentary, no markdown wrapping, no explanation.
</output_format>`

/** Use a meta-AI call to optimize a draft system prompt */
export async function autoOptimizePrompt(draftPrompt: string): Promise<string> {
  if (!draftPrompt.trim()) {
    throw new Error("Draft prompt cannot be empty")
  }

  // Fetch the meta_prompt_optimizer from DB (if customized), fall back to hardcoded
  const supabase = await createClient()
  const { data: metaPrompt } = await supabase
    .from("ai_prompts")
    .select("system_prompt, model_id")
    .eq("slug", "meta_prompt_optimizer")
    .single()

  const systemPrompt = metaPrompt?.system_prompt ?? META_PROMPT_SYSTEM
  const modelId = metaPrompt?.model_id ?? undefined

  const { text } = await generateText({
    model: getModel(modelId),
    system: systemPrompt,
    prompt: draftPrompt,
    maxOutputTokens: 4096,
  })

  return text.trim()
}
