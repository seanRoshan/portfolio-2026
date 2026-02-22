# AI-Powered Resume Tailoring — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable "Tailor for a Job" flow — paste a JD, AI drafts a complete tailored resume from existing portfolio data, user reviews and edits.

**Architecture:** New server action `generateTailoredResume` fetches all portfolio data, sends it with the JD to Claude, parses the structured JSON response, and populates all resume_builder tables. The create dialog is redesigned with two modes. Existing editor sections get label spacing fixes.

**Tech Stack:** Next.js server actions, Anthropic Claude API (`claude-sonnet-4-5`), Supabase, React, shadcn/ui

---

### Task 1: Add portfolio data fetcher for AI

**Files:**
- Create: `src/lib/resume-builder/ai/portfolio-data.ts`

**Step 1: Create the portfolio data fetcher**

This function fetches ALL portfolio data needed by the AI in a single parallel call.

```typescript
import { createClient } from '@/lib/supabase/server'

export interface PortfolioData {
  name: string
  email: string | null
  phone: string | null
  location: string | null
  linkedin: string | null
  github: string | null
  website: string | null
  blog: string | null
  bio: string | null
  experiences: Array<{
    company: string
    role: string
    location: string | null
    start_date: string
    end_date: string | null
    achievements: string[]
    employment_type: string
    via_company: string | null
  }>
  skills: Array<{ name: string; category: string }>
  education: Array<{
    school: string
    degree: string
    field: string | null
    year: string | null
    details: string | null
  }>
  certifications: Array<{
    name: string
    issuer: string
    year: string | null
  }>
  projects: Array<{
    title: string
    short_description: string
    tech_stack: string[]
    live_url: string | null
    github_url: string | null
    highlights: { metric: string; value: string }[]
  }>
  ventures: Array<{
    name: string
    role: string
    description: string | null
    founded_year: string | null
    url: string | null
  }>
}

export async function fetchPortfolioData(): Promise<PortfolioData> {
  const supabase = await createClient()

  const [
    { data: hero },
    { data: about },
    { data: settings },
    { data: resume },
    { data: experience },
    { data: skills },
    { data: education },
    { data: certifications },
    { data: projects },
    { data: ventures },
  ] = await Promise.all([
    supabase.from('hero_section').select('name').single(),
    supabase.from('about_section').select('bio').single(),
    supabase.from('site_settings').select('contact_email, social_links').single(),
    supabase.from('resume').select('full_name, email, phone, location, website, linkedin, github').single(),
    supabase.from('experience').select('company, role, location, start_date, end_date, achievements, employment_type, via_company').eq('published', true).order('sort_order'),
    supabase.from('skills').select('name, category').eq('published', true).order('sort_order'),
    supabase.from('education').select('school, degree, field, year, details').eq('published', true).order('sort_order'),
    supabase.from('certifications').select('name, issuer, year').eq('published', true).order('sort_order'),
    supabase.from('projects').select('title, short_description, tech_stack, live_url, github_url, highlights').eq('published', true).order('sort_order'),
    supabase.from('ventures').select('name, role, description, founded_year, url').eq('published', true).order('sort_order'),
  ])

  return {
    name: resume?.full_name ?? hero?.name ?? '',
    email: resume?.email ?? settings?.contact_email ?? null,
    phone: resume?.phone ?? null,
    location: resume?.location ?? null,
    linkedin: resume?.linkedin ?? (settings?.social_links as Record<string, string>)?.linkedin ?? null,
    github: resume?.github ?? (settings?.social_links as Record<string, string>)?.github ?? null,
    website: resume?.website ?? null,
    blog: null,
    bio: about?.bio ?? null,
    experiences: (experience ?? []) as PortfolioData['experiences'],
    skills: (skills ?? []) as PortfolioData['skills'],
    education: (education ?? []) as PortfolioData['education'],
    certifications: (certifications ?? []) as PortfolioData['certifications'],
    projects: (projects ?? []) as PortfolioData['projects'],
    ventures: (ventures ?? []) as PortfolioData['ventures'],
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/resume-builder/ai/portfolio-data.ts
git commit -m "feat(resume-builder): add portfolio data fetcher for AI tailoring"
```

---

### Task 2: Create the AI tailoring service

**Files:**
- Create: `src/lib/resume-builder/ai/tailor-resume.ts`

**Step 1: Create the tailoring function**

This sends portfolio data + JD to Claude and returns structured resume content.

```typescript
import { getAnthropicClient } from './client'
import type { PortfolioData } from './portfolio-data'

export interface TailoredResumeData {
  suggested_title: string
  suggested_template: string
  contact_info: {
    full_name: string
    email: string
    phone: string
    city: string
    country: string
    linkedin_url: string
    github_url: string
    portfolio_url: string
  }
  summary: string
  work_experiences: Array<{
    job_title: string
    company: string
    location: string
    start_date: string
    end_date: string | null
    achievements: string[]
  }>
  skill_categories: Array<{
    name: string
    skills: string[]
  }>
  projects: Array<{
    name: string
    description: string
    url: string | null
    source_url: string | null
    achievements: string[]
  }>
  education: Array<{
    degree: string
    institution: string
    field_of_study: string
    graduation_date: string
  }>
  certifications: Array<{
    name: string
    issuer: string
    date: string
  }>
  extracurriculars: Array<{
    type: 'patent' | 'publication' | 'talk' | 'open_source' | 'community' | 'other'
    title: string
    description: string
    url: string | null
  }>
  section_order: string[]
}

const TEMPLATE_MAP: Record<string, string> = {
  pragmatic: 'a1b2c3d4-0001-4000-8000-000000000001',
  mono: 'a1b2c3d4-0002-4000-8000-000000000002',
  smarkdown: 'a1b2c3d4-0003-4000-8000-000000000003',
  careercup: 'a1b2c3d4-0004-4000-8000-000000000004',
  parker: 'a1b2c3d4-0005-4000-8000-000000000005',
  experienced: 'a1b2c3d4-0006-4000-8000-000000000006',
}

export function getTemplateId(name: string): string {
  return TEMPLATE_MAP[name.toLowerCase()] ?? TEMPLATE_MAP.pragmatic
}

export async function tailorResume(
  portfolio: PortfolioData,
  jobDescription: string,
  experienceLevel: string
): Promise<TailoredResumeData> {
  const client = getAnthropicClient()
  if (!client) throw new Error('AI not available: ANTHROPIC_API_KEY not set')

  const systemPrompt = `You are an expert resume writer and career strategist. Given a job description and a candidate's complete career data, create a tailored resume that maximizes their chances of getting an interview.

## Instructions

1. **Analyze the JD** for required skills, experience level, key responsibilities, and must-have qualifications.
2. **Select the most relevant** entries from each portfolio section. Do NOT include everything — only what strengthens this specific application.
3. **Rewrite experience bullets** using the XYZ formula: "Accomplished [X impact] as measured by [Y metric] by doing [Z action]". Start each with a strong action verb. Include quantifiable metrics where possible.
4. **Group skills** into resume-appropriate categories (e.g., "Languages", "Frameworks & Libraries", "Cloud & Infrastructure", "Tools").
5. **Write a professional summary** (2-3 sentences) tailored to the target role.
6. **Select relevant projects** and write achievement bullets highlighting impact.
7. **Map ventures** to extracurriculars where relevant (type: "open_source", "community", or "other").
8. **Suggest a template**: "pragmatic" (safe default), "mono" (technical roles), "smarkdown" (docs-heavy), "careercup" (FAANG), "parker" (startups), "experienced" (senior+).
9. **Suggest section order** optimized for this role and experience level.
10. **Suggest a resume title** in format "[Role] — [Company]".

## Rules
- Max 4-6 bullet points per experience entry
- Max 150 characters per bullet
- No buzzwords, clichés, or filler
- Be specific about technologies
- Prioritize recency — recent experience is more important
- For ${experienceLevel} level: ${experienceLevel === 'senior' || experienceLevel === 'staff_plus' || experienceLevel === 'tech_lead' || experienceLevel === 'eng_manager' ? 'emphasize leadership, architecture, and impact at scale' : 'emphasize technical skills, projects, and growth'}

## Response Format
Respond with ONLY valid JSON matching this exact structure (no markdown, no explanation):
{
  "suggested_title": "string",
  "suggested_template": "pragmatic|mono|smarkdown|careercup|parker|experienced",
  "contact_info": { "full_name": "", "email": "", "phone": "", "city": "", "country": "", "linkedin_url": "", "github_url": "", "portfolio_url": "" },
  "summary": "string",
  "work_experiences": [{ "job_title": "", "company": "", "location": "", "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD or null", "achievements": ["bullet1"] }],
  "skill_categories": [{ "name": "Category", "skills": ["skill1"] }],
  "projects": [{ "name": "", "description": "", "url": "or null", "source_url": "or null", "achievements": ["bullet1"] }],
  "education": [{ "degree": "", "institution": "", "field_of_study": "", "graduation_date": "YYYY-MM-DD" }],
  "certifications": [{ "name": "", "issuer": "", "date": "YYYY-MM-DD" }],
  "extracurriculars": [{ "type": "open_source|community|other|patent|publication|talk", "title": "", "description": "", "url": "or null" }],
  "section_order": ["contact", "summary", "experience", "skills", "projects", "education", "certifications", "extracurriculars"]
}`

  const userMessage = `## Job Description
${jobDescription.slice(0, 4000)}

## Candidate Portfolio Data

### Contact Info
- Name: ${portfolio.name}
- Email: ${portfolio.email ?? 'N/A'}
- Phone: ${portfolio.phone ?? 'N/A'}
- Location: ${portfolio.location ?? 'N/A'}
- LinkedIn: ${portfolio.linkedin ?? 'N/A'}
- GitHub: ${portfolio.github ?? 'N/A'}
- Website: ${portfolio.website ?? 'N/A'}

### Bio
${portfolio.bio ?? 'N/A'}

### Work Experience
${portfolio.experiences.map((e, i) => `${i + 1}. ${e.role} at ${e.company}${e.via_company ? ` (via ${e.via_company})` : ''} | ${e.location ?? ''} | ${e.start_date} — ${e.end_date ?? 'Present'}
   Achievements: ${e.achievements.join(' | ')}`).join('\n')}

### Skills
${portfolio.skills.map((s) => `- ${s.name} (${s.category})`).join('\n')}

### Education
${portfolio.education.map((e) => `- ${e.degree} in ${e.field ?? 'N/A'} from ${e.school} (${e.year ?? 'N/A'})`).join('\n')}

### Certifications
${portfolio.certifications.map((c) => `- ${c.name} by ${c.issuer} (${c.year ?? 'N/A'})`).join('\n')}

### Projects
${portfolio.projects.map((p) => `- ${p.title}: ${p.short_description} | Tech: ${p.tech_stack.join(', ')}${p.highlights?.length ? ` | Highlights: ${p.highlights.map((h) => `${h.metric}: ${h.value}`).join(', ')}` : ''}`).join('\n')}

### Ventures / Side Projects
${portfolio.ventures.map((v) => `- ${v.name} (${v.role}): ${v.description ?? 'N/A'} | Founded: ${v.founded_year ?? 'N/A'}`).join('\n')}

Create a tailored resume for this candidate targeting the job description above. Experience level: ${experienceLevel}.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  const text = textBlock?.text ?? ''

  // Extract JSON from response (handle potential markdown wrapping)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI did not return valid JSON')

  return JSON.parse(jsonMatch[0]) as TailoredResumeData
}
```

**Step 2: Commit**

```bash
git add src/lib/resume-builder/ai/tailor-resume.ts
git commit -m "feat(resume-builder): add AI tailoring service with Claude integration"
```

---

### Task 3: Create the server action for tailored resume generation

**Files:**
- Modify: `src/app/admin/resume-builder/actions.ts` — add `generateTailoredResume` action

**Step 1: Add the server action**

Add this new action to the existing `actions.ts` file, after the `createResume` function. It orchestrates: fetch portfolio → call AI → insert all records.

```typescript
// Add these imports at the top:
import { fetchPortfolioData } from '@/lib/resume-builder/ai/portfolio-data'
import { tailorResume, getTemplateId } from '@/lib/resume-builder/ai/tailor-resume'

// Add this action after createResume:
export async function generateTailoredResume(formData: {
  experience_level: ExperienceLevel
  job_description: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 1. Fetch all portfolio data
  const portfolio = await fetchPortfolioData()

  // 2. Call AI to tailor resume
  const tailored = await tailorResume(
    portfolio,
    formData.job_description,
    formData.experience_level
  )

  // 3. Create resume record
  const templateId = getTemplateId(tailored.suggested_template)
  const { data: resume, error } = await supabase
    .from('resumes')
    .insert({
      user_id: user?.id,
      title: tailored.suggested_title,
      template_id: templateId,
      experience_level: formData.experience_level,
      target_role: tailored.suggested_title.split('—')[0]?.trim() || null,
      is_master: false,
      short_id: generateShortId(),
    })
    .select()
    .single()

  if (error) {
    console.error('[generateTailoredResume] Resume insert error:', error)
    throw new Error(error.message)
  }

  // 4. Parse city/country from contact info
  const city = tailored.contact_info.city || ''
  const country = tailored.contact_info.country || ''

  // 5. Insert all related records
  await Promise.all([
    supabase.from('resume_contact_info').insert({
      resume_id: resume.id,
      full_name: tailored.contact_info.full_name,
      email: tailored.contact_info.email || null,
      phone: tailored.contact_info.phone || null,
      city,
      country,
      linkedin_url: tailored.contact_info.linkedin_url || null,
      github_url: tailored.contact_info.github_url || null,
      portfolio_url: tailored.contact_info.portfolio_url || null,
    }),
    supabase.from('resume_summaries').insert({
      resume_id: resume.id,
      text: tailored.summary,
      is_visible: true,
    }),
    supabase.from('resume_settings').insert({
      resume_id: resume.id,
      section_order: tailored.section_order,
      page_limit: getDefaultPageLimit(formData.experience_level),
    }),
  ])

  // 6. Insert work experiences + achievements
  for (let i = 0; i < tailored.work_experiences.length; i++) {
    const exp = tailored.work_experiences[i]
    const { data: newExp } = await supabase
      .from('resume_work_experiences')
      .insert({
        resume_id: resume.id,
        job_title: exp.job_title,
        company: exp.company,
        location: exp.location || null,
        start_date: exp.start_date || null,
        end_date: exp.end_date || null,
        sort_order: i,
      })
      .select()
      .single()

    if (newExp && exp.achievements?.length) {
      await supabase.from('resume_achievements').insert(
        exp.achievements.map((text, j) => ({
          parent_id: newExp.id,
          parent_type: 'work' as const,
          text,
          has_metric: /\d/.test(text),
          sort_order: j,
        }))
      )
    }
  }

  // 7. Insert skill categories
  if (tailored.skill_categories?.length) {
    await supabase.from('resume_skill_categories').insert(
      tailored.skill_categories.map((cat, i) => ({
        resume_id: resume.id,
        name: cat.name,
        skills: cat.skills,
        sort_order: i,
      }))
    )
  }

  // 8. Insert projects + achievements
  for (let i = 0; i < (tailored.projects?.length ?? 0); i++) {
    const proj = tailored.projects[i]
    const { data: newProj } = await supabase
      .from('resume_projects')
      .insert({
        resume_id: resume.id,
        name: proj.name,
        description: proj.description || null,
        project_url: proj.url || null,
        source_url: proj.source_url || null,
        sort_order: i,
      })
      .select()
      .single()

    if (newProj && proj.achievements?.length) {
      await supabase.from('resume_achievements').insert(
        proj.achievements.map((text, j) => ({
          parent_id: newProj.id,
          parent_type: 'project' as const,
          text,
          has_metric: /\d/.test(text),
          sort_order: j,
        }))
      )
    }
  }

  // 9. Insert education
  if (tailored.education?.length) {
    await supabase.from('resume_education').insert(
      tailored.education.map((edu, i) => ({
        resume_id: resume.id,
        degree: edu.degree,
        institution: edu.institution,
        field_of_study: edu.field_of_study || null,
        graduation_date: edu.graduation_date || null,
        sort_order: i,
      }))
    )
  }

  // 10. Insert certifications
  if (tailored.certifications?.length) {
    await supabase.from('resume_certifications').insert(
      tailored.certifications.map((cert, i) => ({
        resume_id: resume.id,
        name: cert.name,
        issuer: cert.issuer || null,
        date: cert.date || null,
        sort_order: i,
      }))
    )
  }

  // 11. Insert extracurriculars (ventures)
  if (tailored.extracurriculars?.length) {
    await supabase.from('resume_extracurriculars').insert(
      tailored.extracurriculars.map((extra, i) => ({
        resume_id: resume.id,
        type: extra.type,
        title: extra.title,
        description: extra.description || null,
        url: extra.url || null,
        sort_order: i,
      }))
    )
  }

  revalidatePath('/admin/resume-builder')
  return resume.id as string
}
```

**Step 2: Commit**

```bash
git add src/app/admin/resume-builder/actions.ts
git commit -m "feat(resume-builder): add generateTailoredResume server action"
```

---

### Task 4: Redesign the Create Resume dialog

**Files:**
- Modify: `src/app/admin/resume-builder/resume-list.tsx` — replace create dialog with two-mode flow

**Step 1: Redesign the dialog**

Replace the existing create dialog with a two-step flow:
- Step 1: Choose "Tailor for a Job" (default) or "Start from Scratch"
- Step 2a (Tailor): JD textarea + experience level + generate button with loading state
- Step 2b (Scratch): Current form (title + level + target role)

Key implementation details:
- Add `mode` state: `'choose' | 'tailor' | 'scratch'`
- Add `jobDescription` state for the textarea
- Add `isGenerating` state for the AI loading indicator
- Import `generateTailoredResume` from actions
- On generate: call `generateTailoredResume`, navigate to editor on success
- On dialog close: reset mode back to `'choose'`
- Tailor card shows `Sparkles` icon and emphasizes it as primary option
- Scratch card shows `FileText` icon as secondary option
- JD textarea should have `min-h-[200px]` and placeholder text explaining what to paste

**Step 2: Commit**

```bash
git add src/app/admin/resume-builder/resume-list.tsx
git commit -m "feat(resume-builder): redesign create dialog with AI tailor mode"
```

---

### Task 5: Fix label spacing in all editor sections

**Files:**
- Modify: `src/components/resume-builder/editor/sections/ContactInfoSection.tsx`
- Modify: `src/components/resume-builder/editor/sections/WorkExperienceSection.tsx`
- Modify: `src/components/resume-builder/editor/sections/EducationSection.tsx`
- Modify: `src/components/resume-builder/editor/sections/SummarySection.tsx`
- Modify: `src/components/resume-builder/editor/sections/ProjectsSection.tsx`

**Step 1: Fix label spacing**

In all 5 section files, find every `<div>` that contains a `<Label>` followed by an `<Input>`, `<Textarea>`, or `<Select>` and add `space-y-2` class to the parent wrapper div. This adds proper gap between labels and their inputs.

Pattern to find:
```tsx
// Before (broken):
<div>
  <Label ...>...</Label>
  <Input ... />
</div>

// After (fixed):
<div className="space-y-2">
  <Label ...>...</Label>
  <Input ... />
</div>
```

For divs that already have a `className`, append `space-y-2` to the existing classes.

Exception: Don't add `space-y-2` to grid container divs (like `grid grid-cols-2 gap-2`) — only to the innermost wrapper around each individual label+input pair.

**Step 2: Commit**

```bash
git add src/components/resume-builder/editor/sections/
git commit -m "fix(resume-builder): add label spacing in all editor sections"
```

---

### Task 6: TypeScript verification and integration test

**Step 1: Run type check**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 2: Test the full flow manually**

1. Navigate to `/admin/resume-builder`
2. Click "New Resume"
3. Select "Tailor for a Job"
4. Paste a sample JD, select experience level
5. Click "Generate Resume"
6. Verify: loading state shows, then redirects to editor
7. Verify: all sections populated with AI-generated content
8. Verify: labels have proper spacing
9. Edit some content and save — verify saves work

**Step 3: Test scratch mode**

1. Navigate to `/admin/resume-builder`
2. Click "New Resume"
3. Select "Start from Scratch"
4. Fill title, level, role
5. Click "Create Resume"
6. Verify: redirects to editor with empty sections

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(resume-builder): AI-powered resume tailoring from portfolio data"
```
