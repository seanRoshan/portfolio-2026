# Resume Builder Overhaul — Design Document

> Date: 2026-02-21 | Status: Approved | Approach: Bottom-Up Data Fix

## Problem Statement

The resume builder has systemic issues across all layers:

1. **Data loss during AI generation** — experiences dropped, bullets empty/weak, entire sections missing
2. **Settings disconnected from templates** — font_family, accent_color, font_size_preset stored but ignored by all 6 templates
3. **No resume scoring** — no way to evaluate resume quality against best practices
4. **Editor UX gaps** — no section reordering, no visibility controls, no delete confirmations, no mobile preview
5. **PDF quality issues** — no page break handling, CDN font loading, flex layout breaks in PDF
6. **Master resume lacks template selection** — existing /resume tab needs preview and template picker

## Architecture

```
Bottom-Up Fix Order:

Layer 1: Data Collection (portfolio-data.ts)
   ↓ feeds complete data to
Layer 2: AI Pipeline (tailor-resume.ts + actions.ts)
   ↓ generates resume stored in
Layer 3: Database (resume_builder tables)
   ↓ rendered by
Layer 4: Templates (6 template components + generate-html.ts)
   ↓ displayed in
Layer 5: Editor UX (ResumeEditor + sections + SettingsPanel)
   ↓ exported as
Layer 6: PDF (Puppeteer pipeline)
```

---

## Layer 1: Data Collection Fix

### File: `src/lib/resume-builder/ai/portfolio-data.ts`

### Current Gaps
- `resume_achievements` field on experience table is ignored (curated bullets for resume)
- `employment_type`, `via_company` not included (contract vs direct not distinguished)
- Project `highlights` (JSONB {metric, value}), `project_role`, `long_description` not fetched
- Education `details` field not included
- Junction tables (`project_experiences`, `project_skills`) never fetched
- `show_on_resume` filter not applied
- Uses `Promise.all` (one failure kills everything)

### Fix

**Enhanced PortfolioData interface:**
```typescript
export interface PortfolioData {
  // Contact (unchanged)
  name: string
  email: string | null
  phone: string | null
  location: string | null
  linkedin: string | null
  github: string | null
  website: string | null
  blog: string | null
  bio: string | null

  // Enhanced experiences
  experiences: Array<{
    company: string
    role: string
    location: string | null
    start_date: string
    end_date: string | null
    achievements: string[]
    resume_achievements: string[] | null  // NEW: curated subset
    employment_type: string               // NEW: direct/contract/freelance
    via_company: string | null            // NEW: contracting company
  }>

  // Enhanced skills (unchanged shape, but filtered by show_on_resume)
  skills: Array<{ name: string; category: string }>

  // Enhanced education
  education: Array<{
    school: string
    degree: string
    field: string | null
    year: string | null
    details: string | null  // NEW: GPA, honors, coursework
  }>

  certifications: Array<{
    name: string
    issuer: string
    year: string | null
  }>

  // Enhanced projects
  projects: Array<{
    title: string
    short_description: string
    long_description: string | null       // NEW
    tech_stack: string[]
    live_url: string | null
    github_url: string | null
    highlights: { metric: string; value: string }[]
    project_role: string | null           // NEW: specific contribution
    related_experience_ids: string[]      // NEW: from junction table
  }>

  ventures: Array<{
    name: string
    role: string
    description: string | null
    founded_year: string | null
    url: string | null
  }>
}
```

**Key changes:**
1. Add `resume_achievements`, `employment_type`, `via_company` to experience SELECT
2. Add `long_description`, `project_role` to projects SELECT
3. Add `details` to education SELECT
4. Filter by `show_on_resume = true` where available
5. Fetch `project_experiences` junction table for context
6. Use `Promise.allSettled` for resilience
7. Order experiences by `start_date DESC` (reverse chronological)

### New: Comprehensive Source File Generator

Create `src/lib/resume-builder/ai/generate-source-file.ts` — produces a structured text document of ALL portfolio data. This is the "truth document" that AI works from.

```typescript
export async function generateResumeSourceFile(): Promise<string>
```

Output format: Markdown document with all sections, including metadata (employment type, project roles, highlights with metrics). This ensures nothing is lost in translation.

---

## Layer 2: AI Pipeline Fix

### File: `src/lib/resume-builder/ai/tailor-resume.ts`

### Current Issues
- `max_tokens: 16384` causes output truncation for large portfolios
- AI silently drops experiences (warns in console but doesn't fix)
- No completeness validation after AI response
- Prompt includes "Projects: 0 entries" for empty sections (wasted tokens)
- `resume_achievements` not respected as source material

### Fixes

1. **Increase max_tokens to 32,768**
2. **Add post-generation completeness check:**
   ```typescript
   function validateAndFillGaps(
     aiOutput: TailoredResumeData,
     portfolio: PortfolioData
   ): TailoredResumeData
   ```
   - Compare AI experience count vs portfolio count
   - For any missing experience, insert it with `resume_achievements ?? achievements`
   - For experiences with 0 bullets, insert original bullets
   - For missing sections, populate from portfolio data directly
   - Log all corrections for debugging

3. **Conditional prompt building** — skip sections with 0 items
4. **Respect resume_achievements:**
   ```
   If resume_achievements is not null → use ONLY those as source bullets
   If resume_achievements is null → use all achievements
   ```
5. **Batch DB inserts with transaction** in `actions.ts`:
   - Insert all experiences first, collect IDs
   - Batch insert all achievements
   - Wrap in Supabase `.rpc()` transaction or sequential with rollback

### File: `src/app/admin/resume-builder/actions.ts`

- Refactor `generateTailoredResume` from monolithic 300+ lines into:
  - `fetchAndPrepareData()` — data collection
  - `callAITailoring()` — AI pipeline
  - `persistTailoredResume()` — database inserts
  - `validateAndCorrect()` — post-insert validation
- Add rollback logic: if any insert fails, delete the resume record
- Batch inserts where possible

---

## Layer 3: Resume Scoring System

### New File: `src/lib/resume-builder/scoring/score-resume.ts`

### Scoring Dimensions (from docs/resume builder/ guide)

| Dimension | Weight | Criteria |
|-----------|--------|----------|
| Content Completeness | 20% | All sections populated, 3-5 bullets per experience, summary present |
| Metric Coverage | 20% | % of bullets containing quantifiable metrics (numbers, percentages) |
| Action Verb Quality | 15% | Strong verbs (Led, Built, Designed) vs weak (Worked on, Responsible for) |
| ATS Keyword Match | 15% | JD keyword density in resume (requires JD context) |
| Length Appropriateness | 10% | Page count matches experience level (1 page for <5yr, 2 for 5-15yr) |
| Buzzword-Free | 10% | No cliches, filler, or passive voice |
| Formatting Quality | 10% | Consistent dates, no orphan sections, balanced page fill |

### Output Interface
```typescript
export interface ResumeScore {
  overall: number  // 0-100
  dimensions: {
    name: string
    score: number  // 0-100
    weight: number
    feedback: string  // e.g., "3 of 8 bullets lack metrics"
    suggestions: string[]
  }[]
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
}
```

### UI Integration
- Score badge in ResumeEditor toolbar (colored by grade)
- Expandable scorecard in settings sidebar
- Per-dimension feedback with actionable suggestions
- Re-score button after edits

---

## Layer 4: Template Rendering Fix

### Files: All 6 template components + `generate-html.ts`

### Current Issue
Templates use hardcoded colors, fonts, and spacing. Settings panel changes have no effect.

### Fix: Wire Settings to Templates

**Font family mapping:**
```typescript
const FONT_MAP = {
  inter: '"Inter", sans-serif',
  source_sans: '"Source Sans 3", sans-serif',
  lato: '"Lato", sans-serif',
  georgia: '"Georgia", serif',
  garamond: '"EB Garamond", serif',
  source_code: '"Source Code Pro", monospace',
}
```

**Density/font size presets:**
```typescript
const DENSITY_MAP = {
  compact:     { body: '9px',  heading: '11px', section: '13px', lineHeight: '1.3', sectionGap: '8px' },
  comfortable: { body: '10px', heading: '12px', section: '14px', lineHeight: '1.4', sectionGap: '12px' },
  spacious:    { body: '11px', heading: '13px', section: '15px', lineHeight: '1.5', sectionGap: '16px' },
}
```

**Changes per template:**
1. Replace hardcoded `color: '#...'` with `settings.accent_color` where applicable
2. Replace hardcoded font-family with `FONT_MAP[settings.font_family]`
3. Replace hardcoded font sizes with `DENSITY_MAP[settings.font_size_preset]`
4. Ensure date formatting uses `settings.date_format`

**Apply same changes to `generate-html.ts`** so PDF matches preview exactly.

---

## Layer 5: Editor UX Improvements

### Files: `ResumeEditor.tsx`, `SettingsPanel.tsx`, section components

### 5.1 Section Drag-and-Drop Reordering
- Use `@dnd-kit` (already in deps) in `ResumeEditor.tsx`
- Wrap section list in `DndContext` + `SortableContext`
- Each `EditorSection` becomes draggable
- On reorder → update `resume_settings.section_order` via server action
- Preview updates in real-time

### 5.2 Section Visibility Controls
- Add toggle switch per section in `SettingsPanel.tsx`
- Maps to `resume_settings.hidden_sections`
- Hidden sections show as dimmed/collapsed in editor
- Hidden sections don't render in preview or PDF

### 5.3 Delete Confirmations
- Add `AlertDialog` (shadcn/ui) before all destructive actions
- Work experience delete, education delete, skill category delete, etc.

### 5.4 Auto-Save Indicator
- Add save status to editor toolbar: "All changes saved" / "Saving..." / "Unsaved changes"
- Use `useTransition` isPending state to show status

### 5.5 Mobile Preview
- Add full-screen preview sheet on mobile (triggered by preview button)
- Uses same `ResumePreviewPane` component in a `Sheet` (shadcn/ui)

---

## Layer 6: PDF Generation Fix

### File: `src/lib/resume-builder/pdf/generate-html.ts`

### Fixes

1. **Page break control:**
   ```css
   .resume-section { page-break-inside: avoid; }
   .experience-entry { page-break-inside: avoid; }
   ```

2. **Self-hosted fonts:** Embed font data as base64 `@font-face` instead of Google Fonts CDN link. Prevents Puppeteer timeout on font loading.

3. **Two-column layout fix:** Replace `display: flex` with CSS Grid for Parker and Experienced templates:
   ```css
   .two-column { display: grid; grid-template-columns: 30% 70%; }
   ```

4. **Page count indicator:** Add hidden element that Puppeteer reads to report actual page count.

---

## Layer 7: Master Resume Enhancement

### Existing: `/resume` tab already displays resume data

### Enhancement:
- Add template preview selector (visual grid of 6 templates)
- Add section visibility checkboxes
- Preview resume with selected template before PDF download
- Reuse `ResumePreviewPane` component from editor

---

## Layer 8: Career Coach Validation

### Post-build validation against `docs/resume builder/` guide

Run automated checks:
1. XYZ formula compliance for achievement bullets
2. No cliches/buzzwords (from validation rules)
3. Length appropriate for experience level
4. ATS optimization (keyword density)
5. Resume score > 70 before allowing export (warning, not blocking)

---

## GitHub Issues Breakdown

The implementation will be tracked as GitHub issues:

1. **Fix portfolio data collection completeness** — Layer 1
2. **Fix AI pipeline token limits and completeness validation** — Layer 2
3. **Refactor generateTailoredResume server action** — Layer 2
4. **Implement resume scoring system** — Layer 3
5. **Wire settings to template rendering** — Layer 4
6. **Wire settings to PDF generation** — Layer 4
7. **Add section drag-and-drop reordering** — Layer 5
8. **Add section visibility controls** — Layer 5
9. **Add delete confirmations and auto-save indicator** — Layer 5
10. **Add mobile preview** — Layer 5
11. **Fix PDF page breaks and font loading** — Layer 6
12. **Enhance master resume with template selection** — Layer 7
13. **Add career coach validation checks** — Layer 8
14. **Playwright E2E tests for resume builder** — Testing

## Files Changed

### New Files
- `src/lib/resume-builder/ai/generate-source-file.ts`
- `src/lib/resume-builder/scoring/score-resume.ts`

### Modified Files
- `src/lib/resume-builder/ai/portfolio-data.ts`
- `src/lib/resume-builder/ai/tailor-resume.ts`
- `src/app/admin/resume-builder/actions.ts`
- `src/components/resume-builder/editor/ResumeEditor.tsx`
- `src/components/resume-builder/editor/SettingsPanel.tsx`
- `src/components/resume-builder/templates/PragmaticTemplate.tsx`
- `src/components/resume-builder/templates/MonoTemplate.tsx`
- `src/components/resume-builder/templates/SmarkdownTemplate.tsx`
- `src/components/resume-builder/templates/CareerCupTemplate.tsx`
- `src/components/resume-builder/templates/ParkerTemplate.tsx`
- `src/components/resume-builder/templates/ExperiencedTemplate.tsx`
- `src/components/resume-builder/templates/ResumePreviewPane.tsx`
- `src/lib/resume-builder/pdf/generate-html.ts`
- `src/lib/resume-builder/validation/rules.ts`

## Success Criteria

1. AI-generated resume includes ALL portfolio experiences with 3-5 bullets each
2. No section is empty after AI generation
3. Settings panel changes (font, color, density) visually update templates
4. Resume score system provides actionable feedback
5. Section reordering works via drag-and-drop
6. PDF has proper page breaks, fonts load reliably
7. Playwright tests pass for complete generation flow
8. Career coach validation checks all pass on generated resume
