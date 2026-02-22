# Resume Card Metadata Enhancement — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add structured job metadata (company name, location, work mode) to resumes with AI auto-population, impressive card design, and an editor section for manual editing.

**Architecture:** Add 3 columns to the `resumes` table, extend the AI JD analysis to extract location/work_mode, create an `updateResumeMetadata` server action, add a "Job Details" card to the editor top area, and redesign the card layout to show role+company as primary hierarchy with color-coded work mode pills.

**Tech Stack:** Supabase PostgreSQL, Next.js 16 Server Actions, React 19, Tailwind CSS v4, shadcn/ui, Anthropic Claude API

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260222230000_resume_job_metadata.sql`

**Step 1: Write the migration**

```sql
-- Add structured job metadata to resumes
ALTER TABLE resumes ADD COLUMN company_name TEXT;
ALTER TABLE resumes ADD COLUMN job_location TEXT;
ALTER TABLE resumes ADD COLUMN work_mode TEXT CHECK (work_mode IN ('remote', 'hybrid', 'onsite'));
```

**Step 2: Push migration**

Run: `npx supabase db push`
Expected: Migration applied successfully

**Step 3: Commit**

```bash
git add supabase/migrations/20260222230000_resume_job_metadata.sql
git commit -m "feat: add company_name, job_location, work_mode columns to resumes"
```

---

### Task 2: Update TypeScript Types

**Files:**
- Modify: `src/types/resume-builder.ts` (Resume interface, around line 99-111)

**Step 1: Add the 3 new fields to the Resume interface**

In `src/types/resume-builder.ts`, find the `Resume` interface and add after `target_role`:

```typescript
export interface Resume {
  id: string
  user_id: string | null
  title: string
  template_id: string | null
  experience_level: ExperienceLevel | null
  target_role: string | null
  company_name: string | null      // NEW
  job_location: string | null      // NEW
  work_mode: RemoteType | null     // NEW (reuses existing RemoteType)
  is_master: boolean
  parent_resume_id: string | null
  short_id: string | null
  created_at: string
  updated_at: string
}
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No new errors (fields are nullable so existing code won't break)

**Step 3: Commit**

```bash
git add src/types/resume-builder.ts
git commit -m "feat: add job metadata fields to Resume type"
```

---

### Task 3: Extend JD Analysis to Extract Location and Work Mode

**Files:**
- Modify: `src/lib/resume-builder/ai/tailor-resume.ts`

**Step 1: Update the JDAnalysis interface (around line 29)**

Add two new fields:

```typescript
export interface JDAnalysis {
  role_title: string
  company: string
  required_skills: string[]
  preferred_skills: string[]
  key_requirements: string[]
  years_experience: string | null
  domain: string
  location: string | null       // NEW
  work_mode: string | null      // NEW: "remote", "hybrid", or "onsite"
}
```

**Step 2: Update the JD_ANALYSIS_PROMPT (around line 136)**

Add `location` and `work_mode` to the JSON schema in the prompt. Find the JSON structure block and replace it:

```
Return ONLY valid JSON with this exact structure (no markdown fences):
{
  "role_title": "exact role title from JD",
  "company": "company name or empty string",
  "required_skills": ["skill1", "skill2"],
  "preferred_skills": ["nice-to-have skill1"],
  "key_requirements": ["requirement1", "requirement2"],
  "years_experience": "e.g. 5+ years or null",
  "domain": "e.g. fintech, healthcare, SaaS",
  "location": "city, state/country from JD or null",
  "work_mode": "remote, hybrid, or onsite (based on JD text, null if unclear)"
}
```

Add to rules section:
```
- location: The office/work location mentioned in the JD (city, state or city, country). null if not specified.
- work_mode: "remote" if fully remote, "hybrid" if hybrid/flexible, "onsite" if in-office required. null if unclear.
```

**Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS (the new fields are optional in usage since the AI may return null)

**Step 4: Commit**

```bash
git add src/lib/resume-builder/ai/tailor-resume.ts
git commit -m "feat: extend JD analysis to extract location and work mode"
```

---

### Task 4: Update Server Actions — Create, Generate, Clone

**Files:**
- Modify: `src/app/admin/resume-builder/actions.ts`

**Step 1: Add `updateResumeMetadata` server action**

Add a new action after `updateResumeTitle` (around line 1022):

```typescript
export async function updateResumeMetadata(
  resumeId: string,
  data: {
    title?: string
    target_role?: string | null
    company_name?: string | null
    job_location?: string | null
    work_mode?: string | null
  }
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('resumes')
    .update(data)
    .eq('id', resumeId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/resume-builder/${resumeId}/edit`)
  revalidatePath('/admin/resume-builder')
}
```

**Step 2: Update `generateTailoredResume` to populate new fields**

In `generateTailoredResume` (around line 166-175), find the resume insert block and add the new fields:

```typescript
const { data: resume, error: resumeError } = await supabase
  .from('resumes')
  .insert({
    user_id: user?.id,
    title: suggestedTitle,
    template_id: templateId,
    experience_level: formData.experience_level,
    target_role: targetRole,
    company_name: jdAnalysis.company || null,           // NEW
    job_location: jdAnalysis.location || null,           // NEW
    work_mode: jdAnalysis.work_mode || null,             // NEW
    is_master: false,
    short_id: generateShortId(),
  })
  .select()
  .single()
```

**Step 3: Update `cloneResume` to copy new fields**

In `cloneResume` (around line 426-439), find the new resume insert and add:

```typescript
const { data: newResume, error } = await supabase
  .from('resumes')
  .insert({
    user_id: user?.id,
    title: newTitle,
    template_id: original.template_id,
    experience_level: original.experience_level,
    target_role: original.target_role,
    company_name: original.company_name,     // NEW
    job_location: original.job_location,     // NEW
    work_mode: original.work_mode,           // NEW
    is_master: false,
    parent_resume_id: original.is_master ? original.id : original.parent_resume_id,
    short_id: generateShortId(),
  })
  .select()
  .single()
```

**Step 4: Update `createResume` to accept optional new fields**

In `createResume` (around line 37-43), extend the `formData` type:

```typescript
export async function createResume(formData: {
  title: string
  experience_level: ExperienceLevel
  target_role?: string
  is_master?: boolean
  template_id?: string
  company_name?: string       // NEW
  job_location?: string       // NEW
  work_mode?: string          // NEW
}) {
```

And add to the insert (around line 53-62):

```typescript
company_name: formData.company_name || null,
job_location: formData.job_location || null,
work_mode: formData.work_mode || null,
```

**Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 6: Commit**

```bash
git add src/app/admin/resume-builder/actions.ts
git commit -m "feat: add updateResumeMetadata action and populate job fields in create/generate/clone"
```

---

### Task 5: Redesign Resume Cards with Job Metadata

**Files:**
- Modify: `src/app/admin/resume-builder/resume-list.tsx`

**Step 1: Add work mode constants and helper**

After the `TEMPLATE_COLORS` map, add:

```typescript
const WORK_MODE_STYLES: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  remote: { label: 'Remote', dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
  hybrid: { label: 'Hybrid', dot: 'bg-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  onsite: { label: 'On-site', dot: 'bg-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
}
```

**Step 2: Update the tailored resume card layout**

Replace the card content inside the `<Link>` block (the section between `<Link href=...>` and `</Link>`) for tailored resumes. New layout:

```tsx
<Link
  href={`/admin/resume-builder/${resume.id}/edit`}
  className="block p-5"
>
  {/* Primary: Role + Company */}
  <div className="mb-2">
    <h3 className="truncate font-semibold leading-tight" title={resume.target_role || resume.title}>
      {resume.target_role || resume.title}
    </h3>
    {(resume.company_name || resume.job_location) && (
      <p className="text-muted-foreground mt-0.5 truncate text-sm">
        {[resume.company_name, resume.job_location].filter(Boolean).join(' · ')}
      </p>
    )}
  </div>

  {/* Work mode pill */}
  {resume.work_mode && WORK_MODE_STYLES[resume.work_mode] && (
    <div className="mb-3">
      <span className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        WORK_MODE_STYLES[resume.work_mode].bg,
        WORK_MODE_STYLES[resume.work_mode].text,
      )}>
        <span className={cn('h-1.5 w-1.5 rounded-full', WORK_MODE_STYLES[resume.work_mode].dot)} />
        {WORK_MODE_STYLES[resume.work_mode].label}
      </span>
    </div>
  )}

  {/* Resume title (secondary, only if target_role exists) */}
  {resume.target_role && (
    <p className="text-muted-foreground mb-2 truncate text-xs italic">
      {resume.title}
    </p>
  )}

  {/* Meta pills: template + level */}
  <div className="mb-3 flex flex-wrap gap-1.5">
    <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium">
      <FileText className="h-3 w-3" />
      {templateName}
    </span>
    {levelLabel && (
      <span className="bg-muted text-muted-foreground inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium">
        {levelLabel}
      </span>
    )}
  </div>

  {/* Footer: date + edit button */}
  <div className="flex items-center justify-between">
    <div className="text-muted-foreground/60 flex items-center gap-1.5 text-[11px]">
      <Clock className="h-3 w-3" />
      Updated {formatDate(resume.updated_at)}
    </div>
    <Button
      variant="ghost"
      size="sm"
      className="h-7 cursor-pointer gap-1 px-2 text-xs opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        router.push(`/admin/resume-builder/${resume.id}/edit`)
      }}
    >
      <Pencil className="h-3 w-3" />
      Edit
    </Button>
  </div>
</Link>
```

Note the `cursor-pointer` class on the Edit button to fix the cursor issue.

**Step 3: Update the master resume hero card similarly**

In the master resume hero card, update the metadata section to show role+company hierarchy:

- If `masterResume.target_role` exists, show it as the main heading
- Show `masterResume.company_name` + `masterResume.job_location` as a secondary line
- Add work mode pill
- Show `masterResume.title` as a smaller muted label if target_role is present

**Step 4: Update search filter**

Extend the search to also match `company_name` and `job_location`:

```typescript
const filteredTailored = tailoredResumes.filter((r) => {
  if (!searchQuery.trim()) return true
  const q = searchQuery.toLowerCase()
  return (
    r.title.toLowerCase().includes(q) ||
    (r.target_role?.toLowerCase().includes(q) ?? false) ||
    (r.company_name?.toLowerCase().includes(q) ?? false) ||
    (r.job_location?.toLowerCase().includes(q) ?? false)
  )
})
```

**Step 5: Also move the dropdown menu outside the Link**

The dropdown menu trigger currently sits inside the `<Link>`. Move it out: render the card as a `<div>` with relative positioning, put the `<Link>` covering the full card, then overlay the dropdown and edit button with `absolute` positioning and `z-10`. This eliminates all the `preventDefault/stopPropagation` hacks.

Alternative simpler approach: keep the current structure with stopPropagation (already working from previous commit). Add `cursor-pointer` to Edit button. Skip the refactor.

**Step 6: Type-check and verify**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 7: Commit**

```bash
git add src/app/admin/resume-builder/resume-list.tsx
git commit -m "feat: redesign resume cards with role+company hierarchy and work mode pills"
```

---

### Task 6: Add Job Details Section to Resume Editor

**Files:**
- Modify: `src/components/resume-builder/editor/ResumeEditor.tsx`

**Step 1: Add a Job Details card above the section list**

In ResumeEditor.tsx, import the new action and add a JobDetailsCard component. This goes above the `<DndContext>` section list, inside the editor scroll area.

Add import:
```typescript
import { updateResumeMetadata } from '@/app/admin/resume-builder/actions'
```

Add these lucide icons to the existing import:
```typescript
import { Briefcase, MapPin, Building2, Monitor } from 'lucide-react'
```

Add a `JobDetailsCard` inline component (or define above the main export):

```tsx
function JobDetailsCard({ resume }: { resume: ResumeWithRelations }) {
  const [isPending, startTransition] = useTransition()

  function handleBlur(field: string, value: string) {
    const trimmed = value.trim() || null
    startTransition(async () => {
      try {
        await updateResumeMetadata(resume.id, { [field]: trimmed })
      } catch {
        toast.error(`Failed to update ${field}`)
      }
    })
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Briefcase className="h-4 w-4" />
        Job Details
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="resume-title" className="text-xs">Resume Title</Label>
          <Input
            id="resume-title"
            defaultValue={resume.title}
            placeholder="e.g., My Google Resume"
            onBlur={(e) => handleBlur('title', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="target-role" className="text-xs">Target Role</Label>
          <Input
            id="target-role"
            defaultValue={resume.target_role ?? ''}
            placeholder="e.g., Software Engineer"
            onBlur={(e) => handleBlur('target_role', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="company-name" className="text-xs">Company</Label>
          <Input
            id="company-name"
            defaultValue={resume.company_name ?? ''}
            placeholder="e.g., Google"
            onBlur={(e) => handleBlur('company_name', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="job-location" className="text-xs">Location</Label>
          <Input
            id="job-location"
            defaultValue={resume.job_location ?? ''}
            placeholder="e.g., San Francisco, CA"
            onBlur={(e) => handleBlur('job_location', e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="work-mode" className="text-xs">Work Mode</Label>
          <Select
            defaultValue={resume.work_mode ?? ''}
            onValueChange={(v) => {
              startTransition(async () => {
                try {
                  await updateResumeMetadata(resume.id, { work_mode: v || null })
                } catch {
                  toast.error('Failed to update work mode')
                }
              })
            }}
          >
            <SelectTrigger id="work-mode" className="h-8 text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="onsite">On-site</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Place JobDetailsCard in the editor layout**

In the ResumeEditor's editor scroll area, find where the section list starts (the `<DndContext>` block) and add the card ABOVE it:

```tsx
{/* Job Details */}
<JobDetailsCard resume={resume} />

{/* Sections */}
<DndContext ...>
```

**Step 3: Update the header title to show role+company**

In the top bar, update the `<h1>` to be richer:

```tsx
<div className="min-w-0 flex-1">
  <h1 className="line-clamp-1 text-sm font-semibold">
    {resume.target_role || resume.title}
  </h1>
  {resume.company_name && (
    <p className="text-muted-foreground line-clamp-1 text-[11px]">
      {resume.company_name}
    </p>
  )}
</div>
```

**Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/resume-builder/editor/ResumeEditor.tsx
git commit -m "feat: add Job Details card to resume editor with editable metadata fields"
```

---

### Task 7: Final Verification

**Step 1: Type-check full project**

Run: `npx tsc --noEmit`
Expected: PASS with zero errors

**Step 2: Visual verification**

In the browser, check:
1. Resume list cards show role+company as primary, work mode pills with correct colors
2. Master resume hero card shows the same hierarchy
3. Search works for company name and location
4. Edit button has pointer cursor on hover
5. Editor page shows Job Details card with all 5 fields
6. Changes via Job Details card save on blur and reflect on list page
7. AI-generated resumes populate company, location, and work mode automatically

**Step 3: Final commit if needed**

```bash
git add -A
git commit -m "polish: resume card metadata final adjustments"
```
