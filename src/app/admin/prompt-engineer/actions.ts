'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAnthropicClient } from '@/lib/resume-builder/ai/client'
import type { AIPrompt } from '@/types/ai-prompts'

export async function listPrompts(): Promise<AIPrompt[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ai_prompts')
    .select('*')
    .order('category')
    .order('name')

  if (error) throw new Error(error.message)
  return (data ?? []) as AIPrompt[]
}

export async function getPrompt(id: string): Promise<AIPrompt> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ai_prompts')
    .select('*')
    .eq('id', id)
    .single()

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
    .from('ai_prompts')
    .insert({ ...prompt, is_default: false })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/admin/prompt-engineer')
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
  }>
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('ai_prompts')
    .update(updates)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/prompt-engineer')
}

export async function deletePrompt(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('ai_prompts')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/prompt-engineer')
}

export async function testPrompt(
  systemPrompt: string,
  userPromptTemplate: string,
  variables: Record<string, string>,
  model: string,
  maxTokens: number
): Promise<string> {
  const client = getAnthropicClient()
  if (!client) throw new Error('AI not available: ANTHROPIC_API_KEY not set')

  // Substitute variables
  const userMessage = userPromptTemplate.replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => variables[key] ?? ''
  )

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  return textBlock?.text?.trim() ?? ''
}
