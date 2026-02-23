-- Multi-Agent System: extend ai_prompts for agent personas and model binding

-- Add persona_name to identify agent-specific prompts
ALTER TABLE ai_prompts ADD COLUMN IF NOT EXISTS persona_name TEXT;

-- Add model_id for explicit model binding per agent
ALTER TABLE ai_prompts ADD COLUMN IF NOT EXISTS model_id TEXT;

-- Index for fast persona lookups
CREATE INDEX IF NOT EXISTS idx_ai_prompts_persona
  ON ai_prompts(persona_name) WHERE persona_name IS NOT NULL;
