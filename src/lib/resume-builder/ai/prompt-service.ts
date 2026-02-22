import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from './client'
import type { AIPrompt, ResolvedPrompt } from '@/types/ai-prompts'

/**
 * Resolve a prompt by slug: check resume-level override first, fall back to default.
 */
export async function resolvePrompt(
  slug: string,
  resumeId?: string
): Promise<ResolvedPrompt> {
  const supabase = await createClient()

  // Fetch default prompt
  const { data: defaultPrompt, error } = await supabase
    .from('ai_prompts')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !defaultPrompt) {
    throw new Error(`Prompt not found: ${slug}`)
  }

  // Check for resume-level override
  let override = null
  if (resumeId) {
    const { data } = await supabase
      .from('resume_prompt_overrides')
      .select('*')
      .eq('resume_id', resumeId)
      .eq('prompt_slug', slug)
      .maybeSingle()
    override = data
  }

  return {
    slug: defaultPrompt.slug,
    name: defaultPrompt.name,
    category: defaultPrompt.category,
    system_prompt: override?.system_prompt ?? defaultPrompt.system_prompt,
    user_prompt_template:
      override?.user_prompt_template ?? defaultPrompt.user_prompt_template,
    model: override?.model ?? defaultPrompt.model,
    max_tokens: override?.max_tokens ?? defaultPrompt.max_tokens,
    is_override: !!override,
  }
}

/**
 * Substitute {{variables}} in a template string.
 */
function substituteVariables(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? '')
}

/**
 * Execute a prompt by slug with variable substitution.
 * Resolves the prompt (override → default), substitutes variables, calls Claude.
 */
export async function executePrompt(
  slug: string,
  variables: Record<string, string>,
  resumeId?: string
): Promise<string> {
  const prompt = await resolvePrompt(slug, resumeId)

  const client = getAnthropicClient()
  if (!client) throw new Error('AI not available: ANTHROPIC_API_KEY not set')

  const userMessage = substituteVariables(
    prompt.user_prompt_template,
    variables
  )

  const response = await client.messages.create({
    model: prompt.model,
    max_tokens: prompt.max_tokens,
    system: prompt.system_prompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  return textBlock?.text?.trim() ?? ''
}

/**
 * List all available prompts, optionally filtered by category.
 */
export async function listPrompts(
  category?: string
): Promise<AIPrompt[]> {
  const supabase = await createClient()

  let query = supabase
    .from('ai_prompts')
    .select('*')
    .order('category')
    .order('name')

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as AIPrompt[]
}
