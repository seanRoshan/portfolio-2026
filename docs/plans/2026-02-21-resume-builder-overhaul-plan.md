# Resume Builder Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix systemic data loss, wire settings to templates, add resume scoring, improve editor UX, fix PDF generation, and add career coach validation — making the resume builder produce complete, polished resumes.

**Architecture:** Bottom-up fix: data collection → AI pipeline → scoring → templates → editor UX → PDF → master resume → validation. Each layer builds on the previous. Every task is independently testable.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Supabase, Anthropic Claude API, @dnd-kit, shadcn/ui, Puppeteer, Playwright

---

### Task 1: Fix portfolio data collection completeness

**Files:**
- Modify: `src/lib/resume-builder/ai/portfolio-data.ts`

**Step 1: Add `resume_achievements` to experience query**

In `portfolio-data.ts:78-79`, add `resume_achievements` to the experience SELECT:

```typescript
.select(
  'company, role, location, start_date, end_date, achievements, resume_achievements, employment_type, via_company'
)
```

Update the `PortfolioData` interface (line 18-27) to include `resume_achievements`:

```typescript
experiences: Array<{
  company: string
  role: string
  location: string | null
  start_date: string
  end_date: string | null
  achievements: string[]
  resume_achievements: string[] | null  // curated subset for resume
  employment_type: string
  via_company: string | null
}>
```

Update the mapping (line 143-152) to include the new field:

```typescript
resume_achievements: (e.resume_achievements as string[] | null) ?? null,
```

**Step 2: Add `project_role` and `long_description` to projects query**

In `portfolio-data.ts:99-100`, update projects SELECT:

```typescript
.select('title, short_description, long_description, tech_stack, live_url, github_url, highlights, project_role')
```

Update the projects interface (line 41-48):

```typescript
projects: Array<{
  title: string
  short_description: string
  long_description: string | null
  tech_stack: string[]
  live_url: string | null
  github_url: string | null
  highlights: { metric: string; value: string }[]
  project_role: string | null
}>
```

Update the mapping (line 169-176) to include new fields:

```typescript
long_description: (p.long_description as string | null) ?? null,
project_role: (p.project_role as string | null) ?? null,
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/lib/resume-builder/ai/portfolio-data.ts
git commit -m "fix(resume-builder): add resume_achievements and project metadata to portfolio data fetch"
```

---

### Task 2: Fix AI pipeline — increase token limit and add completeness validation

**Files:**
- Modify: `src/lib/resume-builder/ai/tailor-resume.ts`

**Step 1: Increase max_tokens**

In `tailor-resume.ts:601`, change:

```typescript
max_tokens: 16384,
```

to:

```typescript
max_tokens: 32768,
```

**Step 2: Update formatPortfolioForPrompt to prefer resume_achievements**

In `tailor-resume.ts:369-382`, update the experience formatting to prefer `resume_achievements`:

```typescript
if (portfolio.experiences.length > 0) {
  const expLines = portfolio.experiences.map((e) => {
    const dateRange = `${e.start_date} — ${e.end_date ?? 'Present'}`
    const via = e.via_company ? ` (via ${e.via_company})` : ''
    const type =
      e.employment_type !== 'direct' ? ` [${e.employment_type}]` : ''
    // Prefer curated resume_achievements over full achievements list
    const bullets = e.resume_achievements ?? e.achievements ?? []
    const bulletText =
      bullets.length > 0
        ? '\n' + bullets.map((a) => `  - ${a}`).join('\n')
        : ''
    return `### ${e.role} at ${e.company}${via}${type}\n${e.location ?? 'Remote'} | ${dateRange}${bulletText}`
  })
  sections.push(`## Work Experience\n${expLines.join('\n\n')}`)
}
```

**Step 3: Update project formatting to include role and long_description**

In `tailor-resume.ts:415-432`, update project formatting:

```typescript
if (portfolio.projects.length > 0) {
  const projLines = portfolio.projects.map((p) => {
    const urls: string[] = []
    if (p.live_url) urls.push(`Live: ${p.live_url}`)
    if (p.github_url) urls.push(`GitHub: ${p.github_url}`)
    const urlLine = urls.length > 0 ? `\n  ${urls.join(' | ')}` : ''
    const tech =
      (p.tech_stack ?? []).length > 0
        ? `\n  Tech: ${p.tech_stack.join(', ')}`
        : ''
    const role = p.project_role ? `\n  Role: ${p.project_role}` : ''
    const highlights =
      (p.highlights ?? []).length > 0
        ? '\n' +
          p.highlights.map((h) => `  - ${h.metric}: ${h.value}`).join('\n')
        : ''
    const desc = p.long_description ?? p.short_description
    return `### ${p.title}\n  ${desc}${role}${tech}${urlLine}${highlights}`
  })
  sections.push(`## Projects\n${projLines.join('\n\n')}`)
}
```

**Step 4: Skip empty sections in prompt counts**

In `tailor-resume.ts:300-307`, wrap each count line conditionally:

```typescript
const countLines: string[] = []
if (expCount > 0) countLines.push(`- Work Experiences: ${expCount} entries — include ALL ${expCount} in work_experiences`)
if (skillCount > 0) countLines.push(`- Skills: ${skillCount} skills — group ALL relevant ones into skill_categories`)
if (eduCount > 0) countLines.push(`- Education: ${eduCount} entries — include ALL ${eduCount} in education`)
if (certCount > 0) countLines.push(`- Certifications: ${certCount} entries — include ALL ${certCount} in certifications`)
if (projCount > 0) countLines.push(`- Projects: ${projCount} entries — include ALL ${projCount} in projects`)
if (ventureCount > 0) countLines.push(`- Ventures: ${ventureCount} entries — map ALL ${ventureCount} as extracurriculars`)
```

Then use `countLines.join('\n')` instead of the existing block in the prompt template.

**Step 5: Add post-generation gap-filling function**

After line 648 (after the validation warnings), add a function that fills gaps when AI drops data:

```typescript
// Fill gaps: re-insert any experiences the AI dropped
if (actualExps < expectedExps) {
  const aiCompanies = new Set(
    (parsed.work_experiences ?? []).map((e) =>
      `${e.job_title}|${e.company}`.toLowerCase()
    )
  )
  for (const pe of portfolio.experiences) {
    const key = `${pe.role}|${pe.company}`.toLowerCase()
    if (!aiCompanies.has(key)) {
      const bullets = pe.resume_achievements ?? pe.achievements ?? []
      parsed.work_experiences.push({
        job_title: pe.role,
        company: pe.company,
        location: pe.location ?? '',
        start_date: pe.start_date,
        end_date: pe.end_date,
        achievements: bullets.slice(0, 5),
      })
    }
  }
  // Re-sort by start_date descending
  parsed.work_experiences.sort((a, b) =>
    (b.start_date ?? '').localeCompare(a.start_date ?? '')
  )
}

// Fill gaps: ensure every experience has at least 1 bullet
for (let i = 0; i < parsed.work_experiences.length; i++) {
  const exp = parsed.work_experiences[i]
  if (!exp.achievements || exp.achievements.length === 0) {
    const match = portfolio.experiences.find(
      (pe) => pe.company.toLowerCase() === exp.company.toLowerCase()
    )
    if (match) {
      const bullets = match.resume_achievements ?? match.achievements ?? []
      exp.achievements = bullets.slice(0, 4)
    }
  }
}

// Fill gaps: re-insert any projects the AI dropped
const expectedProjs = portfolio.projects.length
const actualProjs = parsed.projects?.length ?? 0
if (actualProjs < expectedProjs) {
  const aiProjects = new Set(
    (parsed.projects ?? []).map((p) => p.name.toLowerCase())
  )
  for (const pp of portfolio.projects) {
    if (!aiProjects.has(pp.title.toLowerCase())) {
      parsed.projects.push({
        name: pp.title,
        description: pp.short_description,
        url: pp.live_url,
        source_url: pp.github_url,
        achievements: pp.highlights?.map((h) => `${h.metric}: ${h.value}`) ?? [],
      })
    }
  }
}
```

**Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```bash
git add src/lib/resume-builder/ai/tailor-resume.ts
git commit -m "fix(resume-builder): increase AI token limit, add gap-filling for dropped data"
```

---

### Task 3: Refactor generateTailoredResume server action

**Files:**
- Modify: `src/app/admin/resume-builder/actions.ts`

**Step 1: Add rollback logic**

Wrap the database insertion in `generateTailoredResume` with error handling that deletes the resume record on failure. After the resume insert (around line 136), wrap all subsequent inserts in try/catch:

```typescript
try {
  // ... all the insert operations ...
} catch (insertErr) {
  // Rollback: delete the partially created resume
  await supabase.from('resumes').delete().eq('id', resume.id)
  throw new Error(
    `Failed to populate resume data: ${insertErr instanceof Error ? insertErr.message : String(insertErr)}`
  )
}
```

**Step 2: Batch experience inserts**

Replace the sequential for-loop (lines 195-241) with batch inserts:

```typescript
// Batch insert all work experiences
const expInserts = tailored.data.work_experiences.map((exp, i) => ({
  resume_id: resume.id,
  job_title: exp.job_title,
  company: exp.company,
  location: exp.location || null,
  start_date: normalizeDate(exp.start_date),
  end_date: normalizeDate(exp.end_date),
  sort_order: i,
}))

const { data: newExperiences, error: expError } = await supabase
  .from('resume_work_experiences')
  .insert(expInserts)
  .select('id')

if (expError) throw expError

// Batch insert all achievements for all experiences
if (newExperiences?.length) {
  const allAchievements = newExperiences.flatMap((newExp, i) => {
    const achievements = tailored.data.work_experiences[i]?.achievements ?? []
    return achievements.map((text, j) => ({
      parent_id: newExp.id,
      parent_type: 'work' as const,
      text,
      has_metric: /\d/.test(text),
      sort_order: j,
    }))
  })
  if (allAchievements.length > 0) {
    const { error: achError } = await supabase
      .from('resume_achievements')
      .insert(allAchievements)
    if (achError) throw achError
  }
}
```

Apply same batch pattern for projects + their achievements.

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/app/admin/resume-builder/actions.ts
git commit -m "refactor(resume-builder): batch DB inserts and add rollback on failure"
```

---

### Task 4: Implement resume scoring system

**Files:**
- Modify: `src/lib/resume-builder/ai/services.ts` (enhance existing `scoreResume`)

**Step 1: Enhance the scoring function**

Replace the existing `scoreResume` function (line 133+) with an enhanced version that scores across all dimensions from the design doc. The existing function already does metric coverage and verb quality — expand it to include:

- Content completeness (all sections populated, 3-5 bullets per experience)
- Buzzword detection (check for cliches in bullets)
- Length appropriateness (match page estimate to experience level)
- Formatting quality (consistent dates, no orphan sections)

Update the `ResumeScore` type to include per-dimension feedback:

```typescript
export interface ResumeScore {
  overall: number
  dimensions: {
    name: string
    score: number
    weight: number
    feedback: string
    suggestions: string[]
  }[]
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
}
```

Update the score calculation to return dimension-level feedback with actionable suggestions like "3 of 8 bullets lack metrics — add numbers to quantify impact".

**Step 2: Add score badge to ResumeEditor**

In `src/components/resume-builder/editor/ResumeEditor.tsx`, import `scoreResume` and add a score badge in the toolbar next to the validation badges:

```tsx
const score = scoreResume(resume)
// In the toolbar:
<Badge variant={score.grade === 'A' ? 'default' : score.grade === 'B' ? 'secondary' : 'destructive'}>
  Score: {score.overall}/100
</Badge>
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/lib/resume-builder/ai/services.ts src/components/resume-builder/editor/ResumeEditor.tsx
git commit -m "feat(resume-builder): enhanced resume scoring with per-dimension feedback"
```

---

### Task 5: Wire settings to template rendering (preview)

**Files:**
- Modify: `src/components/resume-builder/templates/shared.tsx` (add settings helpers)
- Modify: All 6 template files

**Step 1: Add settings constants to shared.tsx**

In `src/components/resume-builder/templates/shared.tsx`, add font and density maps:

```typescript
export const FONT_MAP: Record<string, string> = {
  inter: '"Inter", system-ui, sans-serif',
  source_sans: '"Source Sans 3", sans-serif',
  lato: '"Lato", sans-serif',
  georgia: '"Georgia", serif',
  garamond: '"EB Garamond", serif',
  source_code: '"Source Code Pro", monospace',
}

export const DENSITY_MAP: Record<string, { body: string; heading: string; section: string; lineHeight: string; sectionGap: string }> = {
  compact:     { body: '9px',  heading: '11px', section: '13px', lineHeight: '1.3', sectionGap: '8px' },
  comfortable: { body: '10px', heading: '12px', section: '14px', lineHeight: '1.4', sectionGap: '12px' },
  spacious:    { body: '11px', heading: '13px', section: '15px', lineHeight: '1.5', sectionGap: '16px' },
}

export function getTemplateStyles(settings: { accent_color?: string; font_family?: string; font_size_preset?: string } | null) {
  const accent = settings?.accent_color ?? '#000000'
  const font = FONT_MAP[settings?.font_family ?? 'inter'] ?? FONT_MAP.inter
  const density = DENSITY_MAP[settings?.font_size_preset ?? 'comfortable'] ?? DENSITY_MAP.comfortable
  return { accent, font, density }
}
```

**Step 2: Update PragmaticTemplate to use settings**

In `src/components/resume-builder/templates/PragmaticTemplate.tsx`:

1. Import `getTemplateStyles` from `./shared`
2. At top of component: `const { accent, font, density } = getTemplateStyles(resume.settings)`
3. Replace hardcoded font sizes with `density.body`, `density.heading`, etc.
4. Replace hardcoded colors (section headers, links) with `accent`
5. Replace hardcoded font-family with `font`

**Step 3: Repeat for MonoTemplate, SmarkdownTemplate, CareerCupTemplate**

Same pattern: import `getTemplateStyles`, extract values, replace hardcoded styles.

**Step 4: Update ParkerTemplate and ExperiencedTemplate (two-column)**

Same pattern but also apply accent color to sidebar/divider elements.

**Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/components/resume-builder/templates/
git commit -m "feat(resume-builder): wire settings (font, color, density) to all 6 templates"
```

---

### Task 6: Wire settings to PDF generation

**Files:**
- Modify: `src/lib/resume-builder/pdf/generate-html.ts`

**Step 1: Import shared constants and apply to HTML generation**

Add the same `FONT_MAP` and `DENSITY_MAP` logic to the HTML generation pipeline. Use the resume's settings to determine font family, font sizes, accent color, and line height in the generated HTML string.

Replace hardcoded `font-family` in the HTML style block with the mapped value.
Replace hardcoded font sizes with density-based values.
Replace hardcoded accent colors with `settings.accent_color`.

**Step 2: Add page break CSS**

Add to the global CSS block in the HTML:

```css
.resume-section { page-break-inside: avoid; }
.experience-entry { page-break-inside: avoid; }
```

Apply the class to each section wrapper and each experience entry in the HTML output.

**Step 3: Replace Google Fonts CDN with self-hosted @font-face**

Replace the Google Fonts `<link>` tag with embedded `@font-face` declarations that use locally available system fonts. This prevents Puppeteer timeout on font loading.

Map to system fonts as fallback:
- inter → system-ui, -apple-system
- georgia → Georgia (system font, no CDN needed)
- garamond → Palatino Linotype, Book Antiqua (system fallback)
- source_code → SFMono-Regular, Menlo, Monaco

**Step 4: Fix two-column layout for PDF**

In the Parker and Experienced template sections, replace `display: flex` with CSS Grid:

```css
display: grid; grid-template-columns: 30% 70%;
```

This renders more reliably in Puppeteer.

**Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/lib/resume-builder/pdf/generate-html.ts
git commit -m "fix(resume-builder): wire settings to PDF, add page breaks, fix font loading"
```

---

### Task 7: Add section drag-and-drop reordering

**Files:**
- Modify: `src/components/resume-builder/editor/ResumeEditor.tsx`
- Modify: `src/app/admin/resume-builder/actions.ts` (if `updateResumeSettings` doesn't already handle `section_order`)

**Step 1: Add @dnd-kit imports and wrap sections**

In `ResumeEditor.tsx`, import DnD components:

```typescript
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
```

**Step 2: Create SortableSection wrapper**

Create a small wrapper component that uses `useSortable` hook from @dnd-kit:

```tsx
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

function SortableSection({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-start gap-1">
        <button {...attributes} {...listeners} className="mt-3 cursor-grab text-muted-foreground hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
```

**Step 3: Wrap the section rendering in DndContext**

Replace the direct section mapping with DndContext + SortableContext. On drag end, call `updateResumeSettings` with the new `section_order`.

**Step 4: Verify drag-and-drop works with `npx tsc --noEmit`**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/components/resume-builder/editor/ResumeEditor.tsx
git commit -m "feat(resume-builder): add section drag-and-drop reordering"
```

---

### Task 8: Add section visibility controls

**Files:**
- Modify: `src/components/resume-builder/editor/SettingsPanel.tsx`

**Step 1: Add visibility toggles**

Add a new "Sections" header in SettingsPanel after the Layout section. For each section in the section order, render a Switch (shadcn/ui) that toggles visibility:

```tsx
import { Switch } from '@/components/ui/switch'

// In the component:
const sectionNames: Record<string, string> = {
  contact: 'Contact Info',
  summary: 'Summary',
  experience: 'Work Experience',
  skills: 'Skills',
  education: 'Education',
  projects: 'Projects',
  certifications: 'Certifications',
  extracurriculars: 'Activities',
}

const hiddenSet = new Set(settings?.hidden_sections ?? [])
const order = settings?.section_order ?? ['contact', 'summary', 'experience', 'skills', 'education', 'projects', 'certifications', 'extracurriculars']

// Render:
<SectionHeader title="Sections" />
{order.map((section) => (
  <div key={section} className="flex items-center justify-between">
    <Label className="text-sm">{sectionNames[section] ?? section}</Label>
    <Switch
      checked={!hiddenSet.has(section)}
      onCheckedChange={(checked) => {
        const newHidden = checked
          ? (settings?.hidden_sections ?? []).filter((s) => s !== section)
          : [...(settings?.hidden_sections ?? []), section]
        handleUpdate('hidden_sections', newHidden)
      }}
      disabled={section === 'contact'}  // Contact always visible
    />
  </div>
))}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/resume-builder/editor/SettingsPanel.tsx
git commit -m "feat(resume-builder): add section visibility toggles in settings panel"
```

---

### Task 9: Add delete confirmations and auto-save indicator

**Files:**
- Modify: `src/components/resume-builder/editor/sections/WorkExperienceSection.tsx`
- Modify: `src/components/resume-builder/editor/sections/EducationSection.tsx`
- Modify: `src/components/resume-builder/editor/sections/ProjectsSection.tsx`
- Modify: `src/components/resume-builder/editor/sections/SkillsSection.tsx`
- Modify: `src/components/resume-builder/editor/sections/CertificationsSection.tsx`
- Modify: `src/components/resume-builder/editor/sections/ExtracurricularsSection.tsx`
- Modify: `src/components/resume-builder/editor/ResumeEditor.tsx`

**Step 1: Add AlertDialog to delete actions**

In each section component that has delete buttons, wrap the delete handler with an `AlertDialog`:

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

// Replace direct delete buttons with:
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Step 2: Add auto-save indicator to ResumeEditor toolbar**

Add a save status indicator next to the existing badges:

```tsx
// Track global saving state
const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved')

// In toolbar:
<span className="text-muted-foreground text-xs">
  {saveStatus === 'saving' ? 'Saving...' : 'All changes saved'}
</span>
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/resume-builder/editor/
git commit -m "feat(resume-builder): add delete confirmations and auto-save status indicator"
```

---

### Task 10: Add mobile preview

**Files:**
- Modify: `src/components/resume-builder/editor/ResumeEditor.tsx`

**Step 1: Add mobile preview sheet**

Import `Sheet` from shadcn/ui (already imported). Add a mobile-only preview button that opens the preview in a full-screen sheet:

```tsx
{/* Mobile preview button - shown only on small screens */}
<div className="md:hidden">
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="outline" size="sm">
        <Eye className="mr-1.5 h-3.5 w-3.5" />
        Preview
      </Button>
    </SheetTrigger>
    <SheetContent side="bottom" className="h-[90vh] p-0">
      <SheetTitle className="sr-only">Resume Preview</SheetTitle>
      <div className="h-full overflow-auto bg-gray-100 p-4">
        <ResumePreviewPane resume={resume} />
      </div>
    </SheetContent>
  </Sheet>
</div>
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/resume-builder/editor/ResumeEditor.tsx
git commit -m "feat(resume-builder): add mobile preview via bottom sheet"
```

---

### Task 11: Enhance master resume with template selection

**Files:**
- Explore: `src/app/(public)/resume/` or equivalent public resume route
- Modify: The public resume page to add template preview and selection

**Step 1: Investigate the existing /resume route**

Read the existing public resume page files. The user mentioned it's already implemented — find where it lives and how it currently renders.

**Step 2: Add template selection UI**

Add a visual template picker (grid of 6 template thumbnails) above the resume content. When a template is selected, re-render the preview with that template.

**Step 3: Add section visibility controls**

Add checkboxes for each section (experience, education, skills, projects, certifications) that toggle what's shown in the download.

**Step 4: Add PDF download with selected template**

Use the existing PDF generation pipeline but pass the selected template and visible sections.

**Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/app/
git commit -m "feat(resume-builder): add template selection and section controls to public resume"
```

---

### Task 12: Add career coach validation checks

**Files:**
- Modify: `src/lib/resume-builder/validation/rules.ts`

**Step 1: Add career coach validation rules**

Reference the `docs/resume builder/` documentation to add these validation checks:

1. **XYZ formula check**: Verify bullets follow "Accomplished [X] measured by [Y] by doing [Z]" structure
2. **Buzzword list expansion**: Add comprehensive buzzword list from the guide (Chapter 9 common mistakes)
3. **Section completeness by experience level**: Validate that section depth matches career stage
4. **Contact info completeness**: Warn if missing LinkedIn (critical for tech resumes per guide)
5. **Bullet count per experience**: Warn if fewer than 3 or more than 6 bullets per experience

Add these as new warning-level rules in `validateResume()`.

**Step 2: Integrate with scoring**

Update `scoreResume()` to incorporate career coach validation results — deduct points for validation failures.

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/lib/resume-builder/validation/rules.ts src/lib/resume-builder/ai/services.ts
git commit -m "feat(resume-builder): add career coach validation rules from resume guide"
```

---

### Task 13: Create comprehensive source file generator

**Files:**
- Create: `src/lib/resume-builder/ai/generate-source-file.ts`

**Step 1: Create the source file generator**

This function generates a comprehensive markdown document containing ALL portfolio data in a structured format suitable for AI consumption:

```typescript
import { fetchPortfolioData } from './portfolio-data'

/**
 * Generates a comprehensive source file containing ALL portfolio data.
 * This serves as the "truth document" that AI works from during resume tailoring.
 * Every piece of data from the database is included — nothing is lost.
 */
export async function generateResumeSourceFile(): Promise<string> {
  const portfolio = await fetchPortfolioData()

  const sections: string[] = []

  // Header
  sections.push(`# Complete Portfolio Data — Resume Source File
Generated: ${new Date().toISOString()}
`)

  // Contact Info (with all fields)
  sections.push(`## Contact Information
| Field | Value |
|-------|-------|
| Name | ${portfolio.name} |
| Email | ${portfolio.email ?? 'N/A'} |
| Phone | ${portfolio.phone ?? 'N/A'} |
| Location | ${portfolio.location ?? 'N/A'} |
| LinkedIn | ${portfolio.linkedin ?? 'N/A'} |
| GitHub | ${portfolio.github ?? 'N/A'} |
| Website | ${portfolio.website ?? 'N/A'} |
| Blog | ${portfolio.blog ?? 'N/A'} |`)

  // Bio
  if (portfolio.bio) {
    sections.push(`## Professional Bio\n${portfolio.bio}`)
  }

  // Work Experience with ALL detail
  if (portfolio.experiences.length > 0) {
    const expLines = portfolio.experiences.map((e, i) => {
      const dateRange = `${e.start_date} — ${e.end_date ?? 'Present'}`
      const meta: string[] = []
      if (e.employment_type !== 'direct') meta.push(`Type: ${e.employment_type}`)
      if (e.via_company) meta.push(`Via: ${e.via_company}`)
      const metaLine = meta.length > 0 ? `\n  _${meta.join(' | ')}_` : ''

      const curatedBullets = e.resume_achievements?.length
        ? `\n  **Curated Resume Bullets:**\n${e.resume_achievements.map((a) => `  - ${a}`).join('\n')}`
        : ''
      const allBullets = e.achievements.length > 0
        ? `\n  **All Achievements:**\n${e.achievements.map((a) => `  - ${a}`).join('\n')}`
        : ''

      return `### ${i + 1}. ${e.role} at ${e.company}
  ${e.location ?? 'Remote'} | ${dateRange}${metaLine}${curatedBullets}${allBullets}`
    })
    sections.push(`## Work Experience (${portfolio.experiences.length} entries)\n${expLines.join('\n\n')}`)
  }

  // Skills (grouped by category)
  if (portfolio.skills.length > 0) {
    const byCategory = new Map<string, string[]>()
    for (const skill of portfolio.skills) {
      const cat = skill.category || 'Other'
      if (!byCategory.has(cat)) byCategory.set(cat, [])
      byCategory.get(cat)!.push(skill.name)
    }
    const skillLines = Array.from(byCategory.entries())
      .map(([cat, names]) => `- **${cat}:** ${names.join(', ')}`)
      .join('\n')
    sections.push(`## Skills (${portfolio.skills.length} total)\n${skillLines}`)
  }

  // Education
  if (portfolio.education.length > 0) {
    const eduLines = portfolio.education.map((e) => {
      const field = e.field ? ` in ${e.field}` : ''
      const year = e.year ? ` (${e.year})` : ''
      const details = e.details ? `\n  ${e.details}` : ''
      return `- **${e.degree}${field}** — ${e.school}${year}${details}`
    })
    sections.push(`## Education (${portfolio.education.length} entries)\n${eduLines.join('\n')}`)
  }

  // Certifications
  if (portfolio.certifications.length > 0) {
    const certLines = portfolio.certifications.map((c) => {
      const year = c.year ? ` (${c.year})` : ''
      return `- **${c.name}** — ${c.issuer}${year}`
    })
    sections.push(`## Certifications (${portfolio.certifications.length} entries)\n${certLines.join('\n')}`)
  }

  // Projects (with full detail)
  if (portfolio.projects.length > 0) {
    const projLines = portfolio.projects.map((p) => {
      const urls: string[] = []
      if (p.live_url) urls.push(`Live: ${p.live_url}`)
      if (p.github_url) urls.push(`GitHub: ${p.github_url}`)
      const urlLine = urls.length > 0 ? `\n  ${urls.join(' | ')}` : ''
      const tech = p.tech_stack.length > 0 ? `\n  Tech: ${p.tech_stack.join(', ')}` : ''
      const role = p.project_role ? `\n  Role: ${p.project_role}` : ''
      const desc = p.long_description ?? p.short_description
      const highlights = p.highlights?.length
        ? '\n  Highlights:\n' + p.highlights.map((h) => `  - ${h.metric}: ${h.value}`).join('\n')
        : ''
      return `### ${p.title}\n  ${desc}${role}${tech}${urlLine}${highlights}`
    })
    sections.push(`## Projects (${portfolio.projects.length} entries)\n${projLines.join('\n\n')}`)
  }

  // Ventures
  if (portfolio.ventures.length > 0) {
    const ventureLines = portfolio.ventures.map((v) => {
      const year = v.founded_year ? ` (Founded ${v.founded_year})` : ''
      const url = v.url ? ` — ${v.url}` : ''
      const desc = v.description ? `\n  ${v.description}` : ''
      return `- **${v.name}** — ${v.role}${year}${url}${desc}`
    })
    sections.push(`## Ventures & Side Projects (${portfolio.ventures.length} entries)\n${ventureLines.join('\n')}`)
  }

  return sections.join('\n\n---\n\n')
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/resume-builder/ai/generate-source-file.ts
git commit -m "feat(resume-builder): add comprehensive portfolio source file generator"
```

---

### Task 14: Playwright E2E tests for resume builder

**Files:**
- Create: `tests/resume-builder.spec.ts` (or appropriate test directory)

**Step 1: Write test for resume creation flow**

```typescript
import { test, expect } from '@playwright/test'

test.describe('Resume Builder', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    // ... login steps
  })

  test('create resume from scratch', async ({ page }) => {
    await page.goto('/admin/resume-builder')
    await page.click('text=New Resume')
    await page.click('text=Start from Scratch')
    await page.fill('[name="title"]', 'Test Resume')
    await page.click('text=Create Resume')
    await expect(page).toHaveURL(/\/admin\/resume-builder\/.*\/edit/)
  })

  test('editor loads all sections', async ({ page }) => {
    // Navigate to an existing resume
    await page.goto('/admin/resume-builder')
    await page.click('.resume-card >> nth=0')
    // Verify all section headers are visible
    await expect(page.locator('text=Contact Information')).toBeVisible()
    await expect(page.locator('text=Summary')).toBeVisible()
    await expect(page.locator('text=Work Experience')).toBeVisible()
    await expect(page.locator('text=Skills')).toBeVisible()
  })

  test('settings changes update preview', async ({ page }) => {
    // Open settings, change font, verify preview updates
    await page.goto('/admin/resume-builder')
    await page.click('.resume-card >> nth=0')
    await page.click('[aria-label="Settings"]')
    // Change accent color
    // Verify preview pane reflects the change
  })

  test('section reordering works', async ({ page }) => {
    // Test drag-and-drop reordering
  })

  test('PDF downloads successfully', async ({ page }) => {
    // Click download, verify PDF response
  })

  test('score badge shows', async ({ page }) => {
    // Verify score badge is visible in toolbar
  })
})
```

**Step 2: Run tests**

Run: `npx playwright test tests/resume-builder.spec.ts`
Expected: Tests discover the pages and run (some may need auth setup)

**Step 3: Commit**

```bash
git add tests/
git commit -m "test(resume-builder): add Playwright E2E tests for editor and generation flow"
```

---

## Execution Order

Tasks must be executed in this order (dependencies):

```
Task 1 (data collection) → Task 2 (AI pipeline) → Task 3 (server action refactor)
                                                        ↓
                                              Task 4 (scoring) → Task 12 (career coach)
                                                        ↓
                              Task 5 (template preview) → Task 6 (template PDF)
                                                        ↓
                              Task 7 (drag-drop) → Task 8 (visibility) → Task 9 (delete/save)
                                                        ↓
                                              Task 10 (mobile) → Task 11 (master resume)
                                                        ↓
                                              Task 13 (source file) → Task 14 (E2E tests)
```

Tasks within each row can potentially be parallelized.
