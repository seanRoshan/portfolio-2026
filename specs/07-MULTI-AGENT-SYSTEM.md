# Specification: Multi-Agent Career AI System

## 1. Executive Summary

Transform the existing portfolio admin dashboard into a multi-agent AI workspace using the **Vercel AI SDK** with **Amazon Bedrock** as the AI provider. The system features three distinct AI personas (**Interviewer**, **Architect**, **Resume Tailor**) that share memory asynchronously via Supabase PostgreSQL, plus an **On-Demand Prompt Engineer** with meta-AI optimization. Each agent uses a cost-optimized model from the Bedrock model catalog.

### Provider Strategy

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| SDK | `ai` (Vercel AI SDK core) | `useChat()`, tool calling, streaming, structured output |
| Provider | `@ai-sdk/amazon-bedrock` | Multi-model access (Claude, Llama, Nova) via single provider |
| Sub-provider | `bedrockAnthropic()` | Claude-specific features: tool calling, cache points, reasoning |
| Auth | Bedrock API Key (Bearer token) | Single env var: `AWS_BEARER_TOKEN_BEDROCK` |

### Per-Agent Model Selection

Each agent is assigned an optimized model based on its capability requirements:

| Agent | Default Model ID | Why |
|-------|-----------------|-----|
| Career Interviewer (Gem 1) | `us.anthropic.claude-sonnet-4-20250514-v1:0` | Tool calling + nuanced multi-turn conversation |
| Enterprise Architect (Gem 2) | `us.anthropic.claude-sonnet-4-20250514-v1:0` | Creative reasoning + structured Mermaid output |
| Resume Tailor (Gem 3) | `us.anthropic.claude-sonnet-4-20250514-v1:0` | Large context + structured JSON output |
| Prompt Optimizer | `us.anthropic.claude-sonnet-4-20250514-v1:0` | One-shot prompt restructuring |
| Bullet Rewrite / Cliché Detect | `us.anthropic.claude-3-5-haiku-20241022-v1:0` | Simple, fast tasks — lower cost |

> **Model override:** Every agent's model is configurable via the `ai_prompts.model_id` column, allowing runtime model swaps through the Prompt Engineer admin UI without code changes.

### Bedrock Cache Points (Cost Optimization)

For agents with large static context (especially Gem 3's career data dump), use Bedrock cache points to avoid re-processing the same context on every turn:

```typescript
messages: [{
  role: 'assistant',
  content: [{ type: 'text', text: systemPrompt }, { type: 'text', text: careerContext }],
  providerOptions: { bedrock: { cachePoint: { type: 'default' } } },
}]
```

This can reduce input token costs by up to 90% for repeated context.

---

## 2. Core Infrastructure Changes

### 2.1. Vercel AI SDK Migration

**Current State:** Direct `@anthropic-ai/sdk` calls in `src/lib/resume-builder/ai/client.ts` — no streaming, no tool-calling, no structured output.

**Target State:** Vercel AI SDK with `@ai-sdk/amazon-bedrock` provider, enabling `useChat()`, `streamText()`, `generateObject()`, Zod-typed tool definitions, and multi-model routing.

**Tasks:**

1. Install dependencies:
   ```bash
   npm install ai @ai-sdk/amazon-bedrock
   ```
   > Note: `zod` v4 is already installed. Verify compatibility with `ai` SDK's `tool()` function.
   > `@aws-sdk/credential-providers` is NOT needed — Bedrock API key uses Bearer token auth.

2. Add Bedrock API key to `.env.local`:
   ```
   AWS_BEARER_TOKEN_BEDROCK=your-bedrock-api-key-here
   ```
   > Generate a **long-term** API key in the AWS Bedrock console for development.

3. Create new provider module at `src/lib/ai/provider.ts`:
   ```typescript
   // Zero-config: auto-reads AWS_BEARER_TOKEN_BEDROCK from env
   import { bedrock } from '@ai-sdk/amazon-bedrock'
   export { bedrock }
   ```

4. Create model registry at `src/lib/ai/models.ts`:
   ```typescript
   import { bedrock } from './provider'

   // Available models with metadata for the admin UI
   export const AVAILABLE_MODELS = {
     'us.anthropic.claude-sonnet-4-20250514-v1:0': {
       label: 'Claude Sonnet 4',
       provider: 'Anthropic',
       tier: 'premium',
       capabilities: ['tools', 'streaming', 'vision', 'reasoning'],
     },
     'us.anthropic.claude-3-5-sonnet-20241022-v2:0': {
       label: 'Claude 3.5 Sonnet v2',
       provider: 'Anthropic',
       tier: 'standard',
       capabilities: ['tools', 'streaming', 'vision'],
     },
     'us.anthropic.claude-3-5-haiku-20241022-v1:0': {
       label: 'Claude 3.5 Haiku',
       provider: 'Anthropic',
       tier: 'fast',
       capabilities: ['tools', 'streaming'],
     },
     'amazon.nova-pro-v1:0': {
       label: 'Amazon Nova Pro',
       provider: 'Amazon',
       tier: 'standard',
       capabilities: ['streaming'],
     },
     'meta.llama3-70b-instruct-v1:0': {
       label: 'Llama 3 70B',
       provider: 'Meta',
       tier: 'standard',
       capabilities: ['streaming'],
     },
   } as const

   export type ModelId = keyof typeof AVAILABLE_MODELS

   export function getModel(modelId?: string) {
     const id = modelId ?? 'us.anthropic.claude-sonnet-4-20250514-v1:0'
     return bedrock(id)
   }

   export function getModelInfo(modelId: string) {
     return AVAILABLE_MODELS[modelId as ModelId] ?? null
   }
   ```

5. **Do NOT remove** the existing `@anthropic-ai/sdk` client yet — existing services in `services.ts` will be migrated incrementally in later phases.

### 2.2. Shared Agent Chat Component

**Problem:** Building 3 separate chat UIs (Interviewer, Architect, Tailor) will duplicate streaming logic, tool-call rendering, and message persistence.

**Solution:** Create `src/components/agent-chat/` with:

| File | Purpose |
|------|---------|
| `agent-chat.tsx` | Core chat shell: `useChat()` hook, message list, input, streaming |
| `message-bubble.tsx` | Renders user/assistant messages with markdown support |
| `tool-call-card.tsx` | Renders in-progress and completed tool calls (e.g., "Saving experience...") |
| `mermaid-block.tsx` | Detects and renders `mermaid` code blocks inline |
| `json-preview.tsx` | Renders structured JSON output with syntax highlighting |

**Architecture:**
```typescript
// Usage pattern for each agent page:
<AgentChat
  apiEndpoint="/api/agents/coach"
  systemPromptSlug="career_interviewer"
  onToolResult={(toolName, result) => { /* handle UI updates */ }}
  renderCustomBlock={(block) => { /* mermaid, json, etc. */ }}
/>
```

The component uses Vercel AI SDK's `useChat()` hook internally, which handles:
- Streaming token-by-token rendering
- Automatic message state management
- Tool call lifecycle (pending → result)
- Error states and retry

### 2.3. The "On-Demand Prompt Engineer"

**Current State:** Basic prompt CRUD in `src/app/admin/prompt-engineer/` backed by `ai_prompts` table.

**Target State:** Add "Auto-Perfect" button that uses a meta-AI call to optimize any prompt.

**Tasks:**

1. Add `autoOptimizePrompt` Server Action in `src/app/admin/prompt-engineer/actions.ts`:
   ```typescript
   export async function autoOptimizePrompt(draftPrompt: string): Promise<string>
   ```

2. Use `generateText()` from Vercel AI SDK with this meta-prompt:

   ```xml
   <role>
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
   </output_format>
   ```

3. Wire to UI: Add "Auto-Optimize" button in `prompt-engineer-client.tsx` next to the save button.

---

## 3. The Multi-Agent Ecosystem (The 3 Gems)

### Shared Infrastructure

All 3 agents share:

1. **API Route Pattern:** `src/app/api/agents/[agentName]/route.ts` using Vercel AI SDK's `streamText()` with tool definitions.
2. **System Prompt Resolution:** Fetch from `ai_prompts` table by slug, with fallback to hardcoded defaults.
3. **Auth Guard:** All routes verify admin session via `src/lib/admin-auth.ts`.
4. **Usage Logging:** Wrap `streamText()` calls to log tokens to `ai_usage_log`.

**Tool Definition Pattern:**
```typescript
import { tool } from 'ai'
import { z } from 'zod'

const saveExperience = tool({
  description: 'Save a work experience entry to the database',
  parameters: z.object({
    jobTitle: z.string(),
    company: z.string(),
    startDate: z.string(),
    endDate: z.string().nullable(),
    techStack: z.array(z.string()),
    bullets: z.array(z.string().min(10).max(200)),
  }),
  execute: async (params) => {
    // Supabase INSERT
  },
})
```

---

### GEM 1: The Career Interviewer (`career-coach`)

**Goal:** Iteratively interview the user and autonomously save structured career data to the database via tool calls.

**UI:** Enhance `src/app/admin/resume-builder/career-coach/[id]/chat-interface.tsx` to use `<AgentChat>`.

**API Route:** Refactor `src/app/api/resume-builder/coach/route.ts` → `src/app/api/agents/coach/route.ts`

**Vercel AI SDK Tools:**

| Tool Name | Parameters (Zod) | DB Action |
|-----------|-----------------|-----------|
| `save_work_experience` | `{ jobTitle, company, startDate, endDate, location, bullets[] }` | INSERT into `resume_work_experiences` + `resume_achievements` |
| `save_project` | `{ name, description, url, techStack[], bullets[] }` | INSERT into `resume_projects` + `resume_achievements` |
| `save_skill_category` | `{ categoryName, skills[] }` | UPSERT into `resume_skill_categories` |
| `update_summary` | `{ summaryText }` | UPSERT into `resume_summaries` |

**Context Injection:** On session start, fetch existing resume data and inject as XML context block:
```xml
<existing_career_data>
  <work_experiences>...</work_experiences>
  <projects>...</projects>
  <skills>...</skills>
</existing_career_data>
```

**System Prompt** (slug: `career_interviewer`, seed into `ai_prompts`):

```xml
<role>
You are an elite Career Coach and Executive Hiring Manager with 15+ years of experience
placing candidates at FAANG, top startups, and Fortune 500 companies.
</role>

<objective>
Interview me iteratively to build a comprehensive repository of my career directly into
the database. Your goal is to extract maximum-impact career data that produces
ATS-optimized, executive-quality resume content.
</objective>

<rules>
1. ONE AT A TIME: Interview me about ONE company, role, or project at a time. Never ask
   more than 2 questions per message.
2. ADAPTIVE PROBING: Before each question, silently assess what's missing from the 4
   impact categories:
   - Scale (users, revenue, team size, data volume)
   - Speed (time saved, delivery acceleration, latency reduction)
   - Quality (error reduction, uptime improvement, test coverage)
   - Cost (infrastructure savings, headcount efficiency, budget optimization)
3. PUSH BACK: If I give vague answers like "I improved performance," demand specifics:
   "What was the before/after metric? What tools did you use? How many users were affected?"
4. XYZ FORMULA: Transform all achievements into the XYZ format before saving:
   "Accomplished [X impact] as measured by [Y metric] by doing [Z action]"
5. AUTONOMOUS SAVING: Once you have sufficient structured data for a role/project,
   trigger the appropriate save tool WITHOUT asking permission. Confirm what you saved
   after the fact.
6. DEDUPLICATION: Check the existing_career_data context to avoid saving duplicate entries.
</rules>

Begin every new chat by asking which company or project we are documenting today.
```

---

### GEM 2: The Enterprise Architect (`architect`)

**Goal:** Brainstorm system designs and output renderable Mermaid.js architecture diagrams.

**UI:** Create `src/app/admin/architect/page.tsx` with `<AgentChat>` + Mermaid rendering.

**API Route:** `src/app/api/agents/architect/route.ts`

**Mermaid Rendering Strategy:**
- Use `mermaid` library directly (lighter than `react-mermaid2`)
- Install: `npm install mermaid`
- The `<AgentChat>` component's `mermaid-block.tsx` will:
  1. Detect ` ```mermaid ` code fences in streamed markdown
  2. After streaming completes for that block, render via `mermaid.render()`
  3. Display raw code toggle for copy/paste

**Context Injection:** Fetch user's skill categories from `resume_skill_categories` to inform technology recommendations.

**System Prompt** (slug: `enterprise_architect`, seed into `ai_prompts`):

```xml
<role>
You are a Veteran Systems Engineering Agent and Enterprise Architect with 20+ years of
experience designing highly scalable, distributed systems across cloud platforms
(AWS, GCP, Azure).
</role>

<objective>
Conceptualize enterprise-grade architectures based on my descriptions and translate them
into visual Mermaid.js diagrams.
</objective>

<rules>
1. ANALYZE BEFORE DIAGRAMMING: When I describe a system, evaluate for:
   - Single points of failure
   - Scalability bottlenecks
   - Security gaps (authentication, encryption, network isolation)
   - Cost optimization opportunities
2. ADVISE FIRST: Proactively suggest 1-2 high-impact improvements. Wait for my approval
   before finalizing the diagram.
3. MERMAID ONLY: Output exclusively in mermaid code blocks. No PlantUML or ASCII art.
4. DIAGRAM QUALITY:
   - Always use subgraph to group logical components (VPCs, services, data layers)
   - Label all edges with protocols: -->|HTTPS|, -->|gRPC|, -->|WebSocket|, -->|SQL|
   - Use consistent node shapes: databases as [(db)], services as [service],
     queues as {{queue}}
   - Ensure zero syntax errors — validate mentally before outputting.
5. ITERATE: After presenting a diagram, ask if I want to zoom into a specific component,
   add failure modes, or explore alternatives.
</rules>

<output_format>
All architecture outputs must be in mermaid code blocks. Accompany each diagram with a
brief (2-3 sentence) explanation of the key design decisions.
</output_format>

Begin every new chat by asking what system or architecture we are designing today.
```

---

### GEM 3: The Resume Tailor (`jd-analyzer`)

**Goal:** Map a target Job Description against the user's entire career history to generate a fully tailored resume JSON.

**UI:** Enhance `src/app/admin/resume-builder/jd-analyzer/jd-analyzer-client.tsx` to use `<AgentChat>` with JSON preview panel.

**API Route:** Refactor `src/app/api/resume-builder/ai/route.ts` (analyze-jd action) → `src/app/api/agents/tailor/route.ts`

**RAG Workflow with Token Budgeting:**

The full portfolio JSON dump can exceed 50K tokens for extensive careers. Strategy:

1. **Fetch** all career data via `getPortfolioData()` (existing function).
2. **Prioritize:** Sort experiences by recency. For each experience, include full bullets. For experiences older than 10 years, include only company/title/dates.
3. **Budget:** Estimate tokens (~4 chars/token). If context exceeds 30K tokens, truncate oldest entries first.
4. **Inject** as XML context block alongside the JD.

**Vercel AI SDK Tools:**

| Tool Name | Parameters (Zod) | Action |
|-----------|-----------------|--------|
| `analyze_jd` | `{ rawText }` → returns `JDAnalysis` | Extract skills, requirements, experience level |
| `generate_tailored_bullets` | `{ experienceId, count }` → returns `string[]` | Generate bullets for specific role |
| `generate_full_resume` | `{ templateId }` → returns `ResumeWithRelations` (partial) | Full resume JSON matching existing type |

**Structured Output:** Use `generateObject()` with Zod schema matching `ResumeWithRelations` for the `/full` command. This eliminates JSON parsing errors entirely.

**System Prompt** (slug: `resume_tailor`, seed into `ai_prompts`):

```xml
<role>
You are an Executive Resume Writer and Career Strategist with expertise in ATS
optimization. You have full access to the user's factual career history via the
provided context.
</role>

<objective>
Tailor existing experience to specific job descriptions, ensuring high ATS match rates
without fabricating information.
</objective>

<rules>
1. STRICT FACTUAL ACCURACY: Use ONLY data from the provided career context. Never
   hallucinate, invent, or exaggerate experience. If the user lacks a required skill,
   flag it as a gap — do not fabricate it.
2. VOCABULARY MIRRORING: Cross-reference existing bullet points against the target JD.
   Rewrite bullets to mirror the exact terminology and keywords from the JD while
   preserving factual accuracy.
3. XYZ FORMULA: All bullets must follow: "Accomplished [X] as measured by [Y] by doing [Z]"
4. PRIORITIZATION: Lead with the most JD-relevant experiences. Reorder sections to
   front-load matching skills.
5. STRUCTURED OUTPUT: When generating full resumes or bullet sets, always use the
   provided tool calls. Never output raw JSON in chat text.
</rules>

<commands>
- /analyze [paste JD]: Extract top 5 technical skills, top 3 soft skills, and provide a
  match rating (0-100%) against the user's profile.
- /bullets: Generate 5-7 tailored bullet points for the most relevant roles.
- /full: Generate a complete tailored resume using the generate_full_resume tool.
- /gap: Identify missing skills and provide interview talking points to address them.
</commands>

Begin every new chat by asking the user to paste the target Job Description.
```

---

## 4. Database & Schema Changes

### 4.1. Migration: Extend `ai_prompts` for Agent Personas

Create `supabase/migrations/YYYYMMDD_agent_personas.sql`:

```sql
-- Add persona_name column to identify agent-specific prompts
ALTER TABLE ai_prompts ADD COLUMN IF NOT EXISTS persona_name TEXT;

-- Add model_id column for explicit model binding
ALTER TABLE ai_prompts ADD COLUMN IF NOT EXISTS model_id TEXT;

-- Extend category enum to include 'agent' type
-- (category is TEXT, no enum change needed — just convention)

-- Index for fast persona lookups
CREATE INDEX IF NOT EXISTS idx_ai_prompts_persona
  ON ai_prompts(persona_name) WHERE persona_name IS NOT NULL;
```

### 4.2. Seed Agent Prompts

Insert the 3 agent system prompts + the meta-prompt into `ai_prompts` via a migration or seed script:

| slug | persona_name | category |
|------|-------------|----------|
| `career_interviewer` | `interviewer` | `agent` |
| `enterprise_architect` | `architect` | `agent` |
| `resume_tailor` | `tailor` | `agent` |
| `meta_prompt_optimizer` | `prompt_engineer` | `agent` |

### 4.3. Verify Existing Tables

The following tables already exist and require **no changes**:
- `resume_work_experiences`, `resume_achievements` — used by Gem 1 tool calls
- `resume_projects` — used by Gem 1 tool calls
- `resume_skill_categories` — used by Gem 1 & 2
- `job_descriptions` — used by Gem 3
- `career_coach_sessions` — used by Gem 1 (message persistence)
- `ai_usage_log` — used by all agents

---

## 5. Security & Access Control

1. **All agent API routes** (`/api/agents/*`) must verify admin session via `src/lib/admin-auth.ts`.
2. **Anthropic API key** stored in `.env.local`, never exposed to client bundle.
3. **Tool execution** happens server-side only — the client sees tool call results, never executes them.
4. **Rate limiting** (future): Consider adding per-user rate limits on agent API routes.

---

## 6. Error Handling & Resilience

| Scenario | Strategy |
|----------|----------|
| LLM timeout (>30s) | Vercel AI SDK handles via `maxDuration` on route config; show "Taking longer than expected..." in UI |
| Invalid tool parameters | Zod validation rejects before execution; return error to LLM for self-correction |
| Tool execution failure (DB error) | Return error message to LLM; it should inform the user and retry |
| JSON parse failure | Eliminated by `generateObject()` with Zod schemas |
| Token limit exceeded | Pre-flight token estimation; truncate context before sending |
| API key missing | Graceful degradation: show "AI features unavailable" banner |

---

## 7. Implementation Phases

### Phase 1: Foundation (SDK Migration)
- Install `ai`, `@ai-sdk/anthropic`
- Create `src/lib/ai/provider.ts` and `src/lib/ai/models.ts`
- Verify Vercel AI SDK works with a simple test route
- **Does NOT remove** existing `@anthropic-ai/sdk` usage

### Phase 2: Shared Components
- Build `src/components/agent-chat/` (AgentChat, MessageBubble, ToolCallCard)
- Install `mermaid`, build MermaidBlock component
- Build JsonPreview component

### Phase 3: Prompt Engineer Enhancement
- Add `autoOptimizePrompt` server action with meta-prompt
- Wire to prompt-engineer UI
- Run migration: add `persona_name`, `model_id` columns
- Seed 3 agent prompts + meta-prompt into DB

### Phase 4: Gem 1 — The Career Interviewer
- Create `/api/agents/coach/route.ts` with `streamText()` + tool definitions
- Define Zod tool schemas for `save_work_experience`, `save_project`, `save_skill_category`
- Implement tool execution functions (Supabase INSERTs)
- Refactor career-coach UI to use `<AgentChat>`
- Test: full interview flow → data appears in DB

### Phase 5: Gem 2 — The Enterprise Architect
- Create `src/app/admin/architect/page.tsx`
- Create `/api/agents/architect/route.ts` with `streamText()`
- Integrate Mermaid rendering in chat
- Test: describe a system → see rendered diagram

### Phase 6: Gem 3 — The Resume Tailor
- Create `/api/agents/tailor/route.ts` with `streamText()` + tools
- Implement RAG context builder with token budgeting
- Define `generate_full_resume` tool with `ResumeWithRelations` Zod schema
- Refactor JD analyzer UI to use `<AgentChat>` + JSON preview
- Test: paste JD → get tailored resume JSON → preview renders correctly
