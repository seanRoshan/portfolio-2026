# AI Prompts, Score Panel & Editor UX — Implementation Record

> Date: 2026-02-21 | Status: Implemented | Branch: `feat/resume-builder-foundation`

## Overview

This document records the implementation of the AI prompt library system, interactive score panel, inline AI assist buttons, optimize dialog, prompt engineer admin page, resume-level prompt overrides, and supporting fixes (contact info fallbacks, PDF page breaks). Use this as a reference for future development sessions.

## What Was Built

### 1. AI Prompts Database (Migration)

**File:** `supabase/migrations/20260221000000_ai_prompts.sql`

Two new tables:

```
ai_prompts
├── id (UUID PK)
├── slug (TEXT UNIQUE) — e.g. 'bullet_rewrite', 'summary_generate'
├── name (TEXT) — display name
├── category (TEXT) — 'bullet' | 'summary' | 'description' | 'general'
├── description (TEXT)
├── system_prompt (TEXT)
├── user_prompt_template (TEXT) — uses {{variable}} syntax
├── model (TEXT) — default 'claude-sonnet-4-6'
├── max_tokens (INTEGER) — default 2048
├── is_default (BOOLEAN)
├── created_at, updated_at (TIMESTAMPTZ)

resume_prompt_overrides
├── id (UUID PK)
├── resume_id (UUID FK → resumes)
├── prompt_slug (TEXT FK → ai_prompts.slug)
├── system_prompt (TEXT, nullable) — null = use default
├── user_prompt_template (TEXT, nullable)
├── model (TEXT, nullable)
├── max_tokens (INTEGER, nullable)
├── UNIQUE(resume_id, prompt_slug)
```

**8 seeded default prompts:** `bullet_rewrite`, `bullet_add_metrics`, `bullet_fix_verb`, `bullet_shorten`, `bullet_ats_optimize`, `summary_generate`, `description_generate`, `cliche_detect`

**RLS:** Public read for authenticated users, write restricted to authenticated.

**To apply:** Run `npx supabase db reset` or apply the migration manually.

### 2. TypeScript Types

**File:** `src/types/ai-prompts.ts`

```typescript
export interface AIPrompt { ... }           // Maps to ai_prompts table
export interface ResumePromptOverride { ... } // Maps to resume_prompt_overrides table
export interface ResolvedPrompt { ... }      // Result of resolving default + override
```

### 3. Prompt Service Layer

**File:** `src/lib/resume-builder/ai/prompt-service.ts`

Core functions:
- `resolvePrompt(slug, resumeId?)` — Fetches default prompt, checks for resume-level override, merges (override fields take precedence over defaults when non-null)
- `executePrompt(slug, variables, resumeId?)` — Resolves prompt, substitutes `{{variables}}` in template, calls Claude API
- `listPrompts(category?)` — Lists all prompts, optionally filtered by category

**Resolution chain:** resume_prompt_overrides → ai_prompts (default)

**Variable substitution:** `{{bullet}}`, `{{job_title}}`, `{{company}}`, `{{name}}`, `{{context}}`, `{{experience_level}}`, `{{skills}}`, `{{titles}}`, `{{companies}}`, `{{length}}`, `{{text}}`

### 4. Server Actions (Resume Builder)

**File:** `src/app/admin/resume-builder/actions.ts`

Added actions:
- `executeAIPrompt(slug, variables, resumeId?)` — Generic action for inline AI buttons
- `fetchPromptsByCategory(category?)` — Returns prompts for dropdown menus
- `updateAchievementText(achievementId, text, resumeId)` — Updates single bullet + revalidates
- `updateSummaryText(resumeId, text)` — Updates summary text + revalidates
- `updateProjectDescription(projectId, description, resumeId)` — Updates project description
- `getResumePromptOverrides(resumeId)` — Gets all overrides for a resume
- `saveResumePromptOverride(resumeId, slug, overrides)` — Upserts override
- `deleteResumePromptOverride(resumeId, slug)` — Resets to default

### 5. Contact Info Portfolio Fallbacks

**Files:**
- `src/lib/resume-builder/ai/tailor-resume.ts` (~line 689) — Post-AI sanitization block
- `src/app/admin/resume-builder/actions.ts` (~line 162) — DB insert fallbacks

All contact fields now fall back to portfolio data when the AI returns empty values: `email`, `phone`, `linkedin`, `github`, `website`, `blog`, `city`, `country`. Location is split from `portfolio.location` (format: "City, Country").

### 6. PDF Page Break Improvements

**File:** `src/lib/resume-builder/pdf/generate-html.ts`

CSS changes in ALL 3 template generators (main, Parker, Experienced):
- Removed `page-break-inside: avoid` from `.resume-section` (large sections need to break)
- Added `break-inside: avoid` alongside `page-break-inside: avoid` on `.experience-entry` and `li`
- Added `h2 { page-break-after: avoid; break-after: avoid }` (headers stay with content)
- Added `ul { orphans: 2; widows: 2 }` (no lone bullets at page boundaries)

### 7. ScorePanel Component

**File:** `src/components/resume-builder/editor/ScorePanel.tsx`

Popover replacing inline score badges in the ResumeEditor header:
- **Trigger:** Clickable badges showing critical count, warning count, and grade
- **Content (396px wide):**
  - 7 score dimensions with colored progress bars (green ≥70, amber ≥40, red <40)
  - First suggestion per dimension
  - Separator
  - Issues list: critical (red card with AlertCircle) then warnings (amber with AlertTriangle)
  - Each issue has "Go to" button → `scrollToSection()` using `document.getElementById()` + `scrollIntoView()`

### 8. AIAssistButton Component

**File:** `src/components/resume-builder/editor/AIAssistButton.tsx`

Reusable inline AI dropdown placed next to every editable text field:
- **Trigger:** Ghost button with Sparkles icon (h-6 w-6), shows Loader2 when pending
- **Dropdown:** Lists prompts from DB filtered by category
- **Result:** Inline blue preview with Accept/Reject buttons
- **Performance:** Module-level `promptCache` prevents duplicate fetches across multiple instances

**Props:**
```typescript
interface AIAssistButtonProps {
  category: 'bullet' | 'summary' | 'description'
  currentText: string
  context: Record<string, string>  // job_title, company, etc.
  resumeId: string
  onAccept: (newText: string) => void
}
```

**Integrated into:**
- `WorkExperienceSection.tsx` — Each achievement bullet
- `ProjectsSection.tsx` — Description field + each achievement bullet
- `SummarySection.tsx` — Next to Save button
- `ExtracurricularsSection.tsx` — Description field

### 9. OptimizeDialog Component

**File:** `src/components/resume-builder/editor/OptimizeDialog.tsx`

Dialog triggered by "Optimize" button in ResumeEditor header:
- **Progressive flow:** Shows one fixable item at a time (not batch)
- **Item types:** weak verbs, missing metrics, missing summary
- **Per-item UX:** Shows current text → "Fix with AI" button → shows before/after → Accept/Skip
- **Progress:** Badge showing "X / Y reviewed", progress bar, fixed count
- **Empty state:** Checkmark + "No fixable issues found"
- **Done state:** Checkmark + "Done — fixed X of Y items"

`buildFixableItems()` extracts fixable issues by:
1. Scanning work experience bullets for weak opening verbs (was, did, used, worked, helped, etc.)
2. Finding bullets without any digits (missing metrics)
3. Finding project bullets without digits
4. Checking if summary is missing or under 20 characters

### 10. Prompt Engineer Admin Page

**Files:**
- `src/app/admin/prompt-engineer/page.tsx` — Server component
- `src/app/admin/prompt-engineer/actions.ts` — CRUD + test actions
- `src/app/admin/prompt-engineer/prompt-engineer-client.tsx` — Client component

**Layout:** Master-detail (left sidebar 288px + right editor)

**Left panel:**
- Category filter dropdown (All, Bullet Points, Summary, Descriptions, General)
- "New Prompt" button
- Prompt list grouped by category with "Default" badges

**Right editor:**
- Name, slug, category, description fields
- System prompt textarea (monospace, 8 rows)
- User prompt template textarea with extracted `{{variable}}` badges
- Model selector: `claude-sonnet-4-6` / `claude-haiku-4-5`
- Max tokens slider (512–8192)
- Save / Delete (with AlertDialog confirmation)
- **Test panel:** Variable input (key=value lines), "Run Test" button, output preview

**Server actions:** `listPrompts`, `getPrompt`, `createPrompt`, `updatePrompt`, `deletePrompt`, `testPrompt`

**Sidebar nav:** Added at `src/app/admin/admin-sidebar.tsx` line ~119 with Wand2 icon.

### 11. Resume-Level Prompt Overrides in Settings

**File:** `src/components/resume-builder/editor/SettingsPanel.tsx`

New "AI Prompts" section at the bottom of the Settings sheet:
- `AIPromptsOverrides` component loads all prompts + resume-specific overrides
- Each prompt shown as expandable card with Custom/Default badge
- Expanded view: system_prompt and user_prompt_template textareas (monospace, 11px)
- "Save Override" and "Reset to Default" buttons
- Changes saved to `resume_prompt_overrides` table

---

## Architecture Diagram

```
User clicks Sparkles on a bullet
       │
       ▼
AIAssistButton (dropdown of prompts from DB)
       │ user selects action
       ▼
executeAIPrompt() server action
       │
       ▼
prompt-service.ts: resolvePrompt(slug, resumeId)
       │
       ├── Check resume_prompt_overrides table
       │   (has override? merge non-null fields)
       │
       └── Fetch from ai_prompts table (default)
       │
       ▼
substituteVariables(template, {bullet, job_title, ...})
       │
       ▼
Anthropic Claude API call
       │
       ▼
Return result → AIAssistButton shows Accept/Reject
       │ user accepts
       ▼
updateAchievementText() → Supabase update → revalidatePath
```

---

## File Index

| Category | File | Purpose |
|----------|------|---------|
| **Migration** | `supabase/migrations/20260221000000_ai_prompts.sql` | Tables + seeds |
| **Types** | `src/types/ai-prompts.ts` | AIPrompt, ResumePromptOverride, ResolvedPrompt |
| **Service** | `src/lib/resume-builder/ai/prompt-service.ts` | resolvePrompt, executePrompt, listPrompts |
| **Actions** | `src/app/admin/resume-builder/actions.ts` | executeAIPrompt, fetchPromptsByCategory, update helpers, override CRUD |
| **Components** | `src/components/resume-builder/editor/ScorePanel.tsx` | Interactive score popover |
| | `src/components/resume-builder/editor/AIAssistButton.tsx` | Reusable AI dropdown with caching |
| | `src/components/resume-builder/editor/OptimizeDialog.tsx` | Progressive batch-fix dialog |
| | `src/components/resume-builder/editor/SettingsPanel.tsx` | Settings + AI prompt overrides |
| **Admin** | `src/app/admin/prompt-engineer/page.tsx` | Prompt engineer page (server) |
| | `src/app/admin/prompt-engineer/actions.ts` | Prompt CRUD + test actions |
| | `src/app/admin/prompt-engineer/prompt-engineer-client.tsx` | Prompt engineer UI (client) |
| **Modified** | `src/app/admin/admin-sidebar.tsx` | Added Prompt Engineer nav link |
| | `src/lib/resume-builder/ai/tailor-resume.ts` | Contact info fallbacks |
| | `src/lib/resume-builder/pdf/generate-html.ts` | Page break CSS |
| | `src/components/resume-builder/editor/ResumeEditor.tsx` | ScorePanel + OptimizeDialog integration |
| | `src/components/resume-builder/editor/sections/WorkExperienceSection.tsx` | AIAssistButton on bullets |
| | `src/components/resume-builder/editor/sections/ProjectsSection.tsx` | AIAssistButton on desc + bullets |
| | `src/components/resume-builder/editor/sections/SummarySection.tsx` | AIAssistButton on summary |
| | `src/components/resume-builder/editor/sections/ExtracurricularsSection.tsx` | AIAssistButton on description |

---

## Verification Checklist

These tests have NOT been run yet (no live Supabase instance during implementation):

- [ ] Run `npx supabase db reset` to apply migration — verify `ai_prompts` and `resume_prompt_overrides` tables created with 8 seed rows
- [ ] Create a new AI-tailored resume → verify contact fields populated from portfolio data
- [ ] Generate PDF → verify no orphaned section headers, no split bullets across pages
- [ ] Open resume editor → click score badges → verify ScorePanel popover with 7 dimensions
- [ ] Click "Go to" on an issue in ScorePanel → verify smooth scroll to section
- [ ] Click Sparkles icon on a work experience bullet → verify dropdown with bullet-category prompts
- [ ] Run "Improve" on a bullet → verify AI result preview with Accept/Reject
- [ ] Accept an AI suggestion → verify bullet text updated in editor
- [ ] Click "Optimize" button → verify dialog shows fixable issues
- [ ] Fix an item in Optimize → verify progressive flow (next item shown)
- [ ] Navigate to `/admin/prompt-engineer` → verify prompt list loads, grouped by category
- [ ] Create, edit, delete a prompt → verify CRUD operations
- [ ] Run a test in the test panel → verify Claude API called and output shown
- [ ] Open resume Settings → expand AI Prompts section → verify prompts listed
- [ ] Save a prompt override → verify "Custom" badge appears
- [ ] Reset override → verify reverts to "Default"
- [ ] Use inline AI on a bullet (with override active) → verify override prompt used

---

## Known Limitations & Future Work

1. **No streaming for inline AI** — `executePrompt` waits for full response. For longer generations (summaries), streaming would improve perceived performance.
2. **Prompt cache is per-page-load** — `AIAssistButton`'s module-level cache clears on navigation. Could use React context or SWR for persistent caching.
3. **OptimizeDialog heuristics are basic** — Weak verb detection uses a hardcoded set. Could integrate with the full `validateResume()` rules for richer detection.
4. **No undo for accepted AI changes** — Once a user accepts an AI suggestion, there's no undo (would need a history/versioning system).
5. **Test panel in Prompt Engineer** — Uses actual Claude API calls (costs money). Could add a "dry run" mode that shows the resolved prompt without calling the API.
6. **Prompt override UI** — Currently shows raw system/user prompts. Could add a visual diff against the default.

---

## Dependencies

- Anthropic Claude API key (`ANTHROPIC_API_KEY` env var) — required for all AI features
- Supabase with the migration applied — required for prompt storage and overrides
- All existing shadcn/ui components used: Popover, Dialog, DropdownMenu, Badge, Button, ScrollArea, Separator, Sheet, AlertDialog, Select, Switch, Label, Input, Textarea
