export interface AIPrompt {
  id: string
  slug: string
  name: string
  category: 'bullet' | 'summary' | 'description' | 'general'
  description: string | null
  system_prompt: string
  user_prompt_template: string
  model: string
  max_tokens: number
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface ResumePromptOverride {
  id: string
  resume_id: string
  prompt_slug: string
  system_prompt: string | null
  user_prompt_template: string | null
  model: string | null
  max_tokens: number | null
}

/** A prompt with overrides resolved — ready to execute */
export interface ResolvedPrompt {
  slug: string
  name: string
  category: string
  system_prompt: string
  user_prompt_template: string
  model: string
  max_tokens: number
  is_override: boolean
}
