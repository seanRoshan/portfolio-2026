# Multi-Agent System — Execution Plan

> Generated from `specs/07-MULTI-AGENT-SYSTEM.md` after codebase audit and multi-perspective review.

---

## Phase 1: Foundation (SDK Migration)

### Issue 1.1: Install Vercel AI SDK + Amazon Bedrock dependencies
- **Files:** `package.json`
- **Requirement:** Install `ai` and `@ai-sdk/amazon-bedrock`. No `@aws-sdk/credential-providers` needed (using Bedrock API key auth). Verify `zod` v4 compatibility with the `ai` SDK's `tool()` function.
- **Command:** `npm install ai @ai-sdk/amazon-bedrock`
- **Verification:** `npm ls ai @ai-sdk/amazon-bedrock` shows installed versions. `npx tsc --noEmit` passes.

### Issue 1.2: Configure Bedrock API key + create provider module
- **Files:**
  - `.env.local` — Add `AWS_BEARER_TOKEN_BEDROCK`
  - `.env.example` — Add placeholder
  - Create `src/lib/ai/provider.ts` — Re-export `bedrock` from `@ai-sdk/amazon-bedrock` (zero-config, auto-reads env var)
  - Create `src/lib/ai/models.ts` — Model registry with `AVAILABLE_MODELS` map (label, provider, tier, capabilities), `getModel(id?)`, `getModelInfo(id)` exports
- **Requirement:** Provider is zero-config (auto-reads `AWS_BEARER_TOKEN_BEDROCK` for Bearer auth). Model registry includes at least 5 models: Claude Sonnet 4, Claude 3.5 Sonnet v2, Claude 3.5 Haiku, Amazon Nova Pro, Llama 3 70B. Each entry has `tier` (premium/standard/fast) for cost-aware routing. Keep existing `src/lib/resume-builder/ai/client.ts` untouched.
- **Verification:** Import and call `getModel()`, confirm no TypeScript errors.

### Issue 1.3: Create test API route to verify Bedrock SDK
- **Files:**
  - Create `src/app/api/agents/test/route.ts`
- **Requirement:** Simple `POST` route using `streamText()` from Vercel AI SDK with the Bedrock provider. Tests with `us.anthropic.claude-3-5-haiku-20241022-v1:0` (cheapest). Returns streaming response. Auth-guarded.
- **Verification:** `curl` or browser test returns streamed text. Remove route after verification.

---

## Phase 2: Shared Agent Chat Components

### Issue 2.1: Build AgentChat core component
- **Files:**
  - Create `src/components/agent-chat/agent-chat.tsx`
  - Create `src/components/agent-chat/index.ts` (barrel export)
- **Requirement:** React client component using `useChat()` from `ai/react`. Props: `apiEndpoint`, `initialMessages?`, `onToolResult?`, `className?`. Handles streaming, error states, loading indicator. Auto-scroll to bottom on new messages.
- **Verification:** Renders in Storybook or test page with mock endpoint.

### Issue 2.2: Build MessageBubble component
- **Files:**
  - Create `src/components/agent-chat/message-bubble.tsx`
- **Requirement:** Renders user/assistant messages. Supports markdown (use existing markdown renderer or `react-markdown`). Detects and delegates special blocks (mermaid, JSON) to sub-components. Timestamps. Copy button for assistant messages.
- **Verification:** Renders markdown, code blocks, and plain text correctly.

### Issue 2.3: Build ToolCallCard component
- **Files:**
  - Create `src/components/agent-chat/tool-call-card.tsx`
- **Requirement:** Renders tool call lifecycle: pending (spinner + "Saving experience..."), success (checkmark + summary), error (red + error message). Uses Vercel AI SDK's `toolInvocations` from message parts.
- **Verification:** Shows correct states for mock tool calls.

### Issue 2.4: Build MermaidBlock component
- **Files:**
  - `package.json` (add `mermaid`)
  - Create `src/components/agent-chat/mermaid-block.tsx`
- **Requirement:** Install `mermaid` library. Detect ` ```mermaid ` fences. Render diagram via `mermaid.render()` in a `useEffect`. Include raw code toggle button for copy/paste. Handle syntax errors gracefully (show raw code with error message).
- **Verification:** Renders a valid Mermaid flowchart. Shows error state for invalid syntax.

### Issue 2.5: Build JsonPreview component
- **Files:**
  - Create `src/components/agent-chat/json-preview.tsx`
- **Requirement:** Renders JSON output with syntax highlighting. Collapsible sections. Copy button. Used by Gem 3 to show tailored resume output.
- **Verification:** Renders a sample `ResumeWithRelations` JSON object with proper formatting.

---

## Phase 3: Prompt Engineer Enhancement

### Issue 3.1: Database migration — extend ai_prompts
- **Files:**
  - Create `supabase/migrations/YYYYMMDD_agent_personas.sql`
- **Requirement:** Add `persona_name TEXT` and `model_id TEXT` columns to `ai_prompts`. Add index on `persona_name`. Run via `npx supabase db push`.
- **Verification:** Query `SELECT column_name FROM information_schema.columns WHERE table_name = 'ai_prompts'` shows new columns.

### Issue 3.2: Seed agent system prompts
- **Files:**
  - Create `supabase/migrations/YYYYMMDD_seed_agent_prompts.sql`
- **Requirement:** INSERT 4 rows into `ai_prompts`: `career_interviewer`, `enterprise_architect`, `resume_tailor`, `meta_prompt_optimizer`. Use the exact prompt text from the spec. Set `category = 'agent'`, `persona_name` accordingly, `is_default = true`.
- **Verification:** `SELECT slug, persona_name FROM ai_prompts WHERE category = 'agent'` returns 4 rows.

### Issue 3.3: Update AIPrompt TypeScript types
- **Files:**
  - `src/types/ai-prompts.ts`
- **Requirement:** Add `persona_name: string | null` and `model_id: string | null` to `AIPrompt` interface. Update `category` union type to include `'agent'`.
- **Verification:** `npx tsc --noEmit` passes.

### Issue 3.4: Implement autoOptimizePrompt server action
- **Files:**
  - `src/app/admin/prompt-engineer/actions.ts`
- **Requirement:** Add `autoOptimizePrompt(draftPrompt: string): Promise<string>` function. Uses `generateText()` from Vercel AI SDK with the meta-prompt from the spec. Returns the optimized prompt text.
- **Verification:** Call with a simple draft prompt, verify it returns a well-structured XML prompt.

### Issue 3.5: Wire Auto-Optimize to Prompt Engineer UI
- **Files:**
  - `src/app/admin/prompt-engineer/prompt-engineer-client.tsx`
- **Requirement:** Add "Auto-Optimize" button (with sparkle icon) next to the system prompt textarea. On click, calls `autoOptimizePrompt()` with current system prompt text. Shows loading state. Replaces textarea content with the optimized result. User can undo via browser undo or cancel.
- **Verification:** Click button → system prompt field updates with optimized version.

---

## Phase 4: Gem 1 — The Career Interviewer

### Issue 4.1: Define Zod tool schemas for Career Interviewer
- **Files:**
  - Create `src/lib/ai/tools/coach-tools.ts`
- **Requirement:** Define Zod schemas and `tool()` definitions for: `save_work_experience`, `save_project`, `save_skill_category`, `update_summary`. Each tool's `execute` function performs Supabase INSERTs/UPSERTs using the admin client. All tools require `resumeId` in context.
- **Verification:** Import schemas, validate sample data, confirm Zod parsing works.

### Issue 4.2: Create streaming Coach API route
- **Files:**
  - Create `src/app/api/agents/coach/route.ts`
- **Requirement:** POST route using `streamText()` with tools from Issue 4.1. Fetches system prompt from `ai_prompts` (slug: `career_interviewer`). Injects existing career data as XML context. Auth-guarded. Logs token usage. Supports `maxDuration: 60` for Vercel.
- **Verification:** POST with test messages → streaming response with tool calls in the stream.

### Issue 4.3: Refactor Career Coach UI to use AgentChat
- **Files:**
  - `src/app/admin/resume-builder/career-coach/[id]/chat-interface.tsx`
  - `src/app/admin/resume-builder/career-coach/[id]/page.tsx` (if needed)
- **Requirement:** Replace the existing custom chat UI with `<AgentChat apiEndpoint="/api/agents/coach" />`. Pass `resumeId` as a body parameter. Handle `onToolResult` to show toast notifications ("Experience saved!"). Maintain session list sidebar.
- **Verification:** Full conversation flow: ask about a company → AI probes → AI triggers save tool → data appears in resume editor.

### Issue 4.4: Message persistence for Coach sessions
- **Files:**
  - `src/app/api/agents/coach/route.ts` (add persistence hooks)
  - OR `src/app/admin/resume-builder/career-coach/[id]/chat-interface.tsx`
- **Requirement:** Persist messages to `career_coach_sessions.messages` JSONB column. On page load, restore previous messages via `initialMessages` prop. Handle both user messages and tool call results.
- **Verification:** Start conversation → refresh page → messages are restored.

---

## Phase 5: Gem 2 — The Enterprise Architect

### Issue 5.1: Create Architect page and layout
- **Files:**
  - Create `src/app/admin/architect/page.tsx`
  - Create `src/app/admin/architect/layout.tsx` (if needed)
- **Requirement:** Server component page that renders `<AgentChat>` pointed at `/api/agents/architect`. Full-width layout. Title: "Enterprise Architect". Sidebar navigation link in admin layout.
- **Verification:** Navigate to `/admin/architect` → see chat interface.

### Issue 5.2: Create Architect API route
- **Files:**
  - Create `src/app/api/agents/architect/route.ts`
- **Requirement:** POST route using `streamText()`. Fetches system prompt from `ai_prompts` (slug: `enterprise_architect`). Injects user's skill categories as context. Auth-guarded. No tool definitions needed (Architect only outputs text/mermaid).
- **Verification:** POST with "Design a microservices architecture for an e-commerce platform" → returns streaming text with mermaid code blocks.

### Issue 5.3: Add Architect to admin navigation
- **Files:**
  - `src/components/admin/admin-sidebar.tsx` (or equivalent navigation component)
- **Requirement:** Add "Architect" link to admin sidebar under an "AI Agents" section or similar grouping.
- **Verification:** Sidebar shows Architect link, navigates to `/admin/architect`.

---

## Phase 6: Gem 3 — The Resume Tailor

### Issue 6.1: Build RAG context builder with token budgeting
- **Files:**
  - Create `src/lib/ai/context/career-context.ts`
- **Requirement:** Function `buildCareerContext(userId: string, maxTokens?: number): Promise<string>` that:
  1. Fetches all career data via existing portfolio data functions
  2. Formats as XML
  3. Estimates token count (~4 chars/token)
  4. If over budget (default 30K tokens), truncates oldest experiences to title/company/dates only
  5. Returns the XML string
- **Verification:** Call with test user → returns XML under token budget.

### Issue 6.2: Define Zod tool schemas for Resume Tailor
- **Files:**
  - Create `src/lib/ai/tools/tailor-tools.ts`
- **Requirement:** Define tools: `analyze_jd` (input: raw text, output: JDAnalysis), `generate_tailored_bullets` (input: experienceId + count, output: string[]), `generate_full_resume` (input: templateId, output: partial ResumeWithRelations). Use Zod schemas matching existing TypeScript types.
- **Verification:** Schema validation passes for sample inputs/outputs.

### Issue 6.3: Create Tailor API route
- **Files:**
  - Create `src/app/api/agents/tailor/route.ts`
- **Requirement:** POST route using `streamText()` with tools from Issue 6.2. Fetches system prompt from `ai_prompts` (slug: `resume_tailor`). Injects career context via `buildCareerContext()`. Auth-guarded. Logs usage.
- **Verification:** POST with JD text → streaming response with tool calls for analysis.

### Issue 6.4: Refactor JD Analyzer UI to use AgentChat
- **Files:**
  - `src/app/admin/resume-builder/jd-analyzer/jd-analyzer-client.tsx`
- **Requirement:** Replace existing JD analyzer interface with `<AgentChat>` + `<JsonPreview>` side panel. The chat handles conversational JD analysis. Tool results (especially `generate_full_resume`) render in the JSON preview panel. Maintain existing "Save JD" functionality.
- **Verification:** Paste JD → `/analyze` → see match analysis → `/full` → see resume JSON in preview panel.

---

## Summary

| Phase | Issues | Key Deliverable |
|-------|--------|----------------|
| 1. Foundation | 1.1–1.3 | Bedrock + Vercel AI SDK working with streaming + model registry |
| 2. Shared Components | 2.1–2.5 | Reusable AgentChat with Mermaid + JSON |
| 3. Prompt Engineer | 3.1–3.5 | Auto-Optimize feature + agent prompts seeded + model selector |
| 4. Gem 1 (Interviewer) | 4.1–4.4 | AI interviews user → saves to DB via tools |
| 5. Gem 2 (Architect) | 5.1–5.3 | AI generates Mermaid diagrams in chat |
| 6. Gem 3 (Tailor) | 6.1–6.4 | AI tailors resume from JD with RAG context + cache points |

**Total: 22 issues across 6 phases.**
