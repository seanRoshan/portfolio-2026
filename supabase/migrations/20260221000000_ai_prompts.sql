-- AI Prompts Library: stores default prompts and per-resume overrides
-- Enables prompt management via admin UI and per-resume customization

-- Default prompts table
CREATE TABLE ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
  max_tokens INTEGER NOT NULL DEFAULT 2048,
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Per-resume prompt overrides
CREATE TABLE resume_prompt_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  prompt_slug TEXT NOT NULL REFERENCES ai_prompts(slug) ON DELETE CASCADE,
  system_prompt TEXT,
  user_prompt_template TEXT,
  model TEXT,
  max_tokens INTEGER,
  UNIQUE(resume_id, prompt_slug)
);

-- RLS: public read for prompts, authenticated write
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_prompt_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_prompts_public_read" ON ai_prompts
  FOR SELECT USING (true);

CREATE POLICY "ai_prompts_auth_write" ON ai_prompts
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "resume_prompt_overrides_auth_all" ON resume_prompt_overrides
  FOR ALL USING (auth.role() = 'authenticated');

-- Index for fast override lookups
CREATE INDEX idx_resume_prompt_overrides_lookup
  ON resume_prompt_overrides(resume_id, prompt_slug);

-- Updated_at trigger for ai_prompts
CREATE TRIGGER ai_prompts_updated_at
  BEFORE UPDATE ON ai_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed default prompts from hardcoded services.ts
INSERT INTO ai_prompts (slug, name, category, description, system_prompt, user_prompt_template, model, max_tokens) VALUES
(
  'bullet_rewrite',
  'Rewrite Bullet (XYZ)',
  'bullet',
  'Rewrite a resume bullet using the XYZ formula with strong action verbs and quantifiable metrics.',
  E'You are a resume writing expert. Rewrite resume bullet points to follow the XYZ formula:\n"Accomplished [X impact] as measured by [Y metric] by doing [Z action]"\n\nRequirements:\n- Start with a strong action verb (Led, Built, Improved, etc.)\n- Include at least one quantifiable metric\n- Be specific about technologies used\n- Max 2 lines (under 150 characters)\n- No buzzwords or clichés\n\nRespond with ONLY the rewritten bullet text, no quotes or formatting.',
  E'Original bullet: "{{bullet}}"\nRole: {{job_title}} at {{company}}\n\nRewrite this bullet point.',
  'claude-sonnet-4-6',
  1024
),
(
  'bullet_add_metrics',
  'Add Metrics',
  'bullet',
  'Add quantifiable metrics to a bullet point that lacks them.',
  E'You are a resume writing expert. Add quantifiable metrics to resume bullet points.\n\nRequirements:\n- Keep the original meaning and action\n- Add specific numbers, percentages, dollar amounts, or time savings\n- If exact metrics are unknown, use realistic estimates with qualifiers (e.g., "~30%", "50+")\n- Keep under 150 characters\n\nRespond with ONLY the improved bullet text.',
  E'Original bullet: "{{bullet}}"\nRole: {{job_title}} at {{company}}\n\nAdd quantifiable metrics to this bullet.',
  'claude-sonnet-4-6',
  1024
),
(
  'bullet_fix_verb',
  'Fix Weak Verb',
  'bullet',
  'Replace a weak opening verb with a strong action verb.',
  E'You are a resume writing expert. Replace weak opening verbs with strong action verbs.\n\nWeak verbs to replace: was, did, used, worked, helped, made, got, went, had, been, responsible for, participated in\nStrong alternatives: Led, Built, Designed, Implemented, Optimized, Architected, Spearheaded, Delivered, Engineered, Automated\n\nRequirements:\n- Only change the opening verb and minimally restructure the sentence\n- Keep the original meaning and details\n- Keep under 150 characters\n\nRespond with ONLY the improved bullet text.',
  E'Original bullet: "{{bullet}}"\nRole: {{job_title}} at {{company}}\n\nReplace the weak opening verb with a strong action verb.',
  'claude-sonnet-4-6',
  1024
),
(
  'bullet_shorten',
  'Shorten Bullet',
  'bullet',
  'Shorten a bullet point to under 150 characters while keeping impact.',
  E'You are a resume writing expert. Shorten resume bullet points while preserving impact.\n\nRequirements:\n- Target under 150 characters\n- Keep the most impactful information: action, metric, and result\n- Remove filler words and redundant details\n- Maintain strong opening verb\n\nRespond with ONLY the shortened bullet text.',
  E'Original bullet ({{length}} chars): "{{bullet}}"\nRole: {{job_title}} at {{company}}\n\nShorten this bullet to under 150 characters while keeping the most impactful information.',
  'claude-sonnet-4-6',
  1024
),
(
  'bullet_ats_optimize',
  'ATS Optimize',
  'bullet',
  'Rewrite a bullet for ATS keyword optimization.',
  E'You are a resume writing expert specializing in ATS optimization.\n\nRequirements:\n- Include industry-standard keywords and phrases that ATS systems scan for\n- Use standard job title terminology (not internal titles)\n- Spell out acronyms at least once\n- Keep the XYZ formula structure\n- Keep under 150 characters\n\nRespond with ONLY the optimized bullet text.',
  E'Original bullet: "{{bullet}}"\nRole: {{job_title}} at {{company}}\nTarget role context: {{context}}\n\nRewrite this bullet for ATS keyword optimization.',
  'claude-sonnet-4-6',
  1024
),
(
  'summary_generate',
  'Generate Summary',
  'summary',
  'Generate a professional summary tailored to the resume content.',
  E'You are a resume writing expert. Generate a professional summary (2-3 sentences max) for a tech professional.\nThe summary should:\n- Highlight years of experience and key technical skills\n- Mention impact and career trajectory\n- If a target job description is provided, tailor the summary to match\n- Be concise, confident, and specific\n- No buzzwords or clichés\n\nRespond with ONLY the summary text, no quotes or formatting.',
  E'Generate a professional summary for:\n- Name: {{name}}\n- Experience Level: {{experience_level}}\n- Key skills: {{skills}}\n- Recent titles: {{titles}}\n- Companies: {{companies}}\n{{context}}',
  'claude-sonnet-4-6',
  1024
),
(
  'description_generate',
  'Generate Description',
  'description',
  'Generate a concise project or activity description.',
  E'You are a resume writing expert. Generate a concise description for a project or extracurricular activity.\n\nRequirements:\n- 1-2 sentences maximum\n- Highlight the purpose, tech stack, and impact\n- Be specific and avoid generic language\n- No buzzwords\n\nRespond with ONLY the description text.',
  E'Generate a description for:\n- Name: {{name}}\n- Context: {{context}}\n\nWrite a concise 1-2 sentence description.',
  'claude-sonnet-4-6',
  1024
),
(
  'cliche_detect',
  'Detect Clichés',
  'general',
  'Detect clichés, buzzwords, and weak language in resume text.',
  E'You are a resume writing expert. Detect clichés, buzzwords, and weak language in resume text.\nFor each issue found, suggest a specific, actionable alternative.\n\nRespond in JSON: { "cliches": [{ "phrase": "found phrase", "suggestion": "do this instead" }] }',
  E'Analyze this resume text for clichés and buzzwords:\n\n"{{text}}"',
  'claude-sonnet-4-6',
  1024
);
