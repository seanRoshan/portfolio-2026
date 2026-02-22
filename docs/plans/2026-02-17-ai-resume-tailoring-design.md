# AI-Powered Resume Tailoring — Design

## Problem
The resume builder requires manual re-entry of all career data (experience, skills, education, etc.) that already exists in the portfolio database. This is tedious and defeats the purpose of having a centralized data source.

## Solution
AI-powered "Tailor for a Job" flow: paste a job description, AI drafts a complete tailored resume from existing portfolio data, then the user reviews and edits.

## Create Resume Dialog (Redesigned)

### Step 1 — Choose mode
- **"Tailor for a Job"** (primary, default) — large card with AI icon
- **"Start from Scratch"** — secondary option, current empty-resume behavior

### Step 2 — Job Description input (Tailor mode only)
- Resume title field (auto-suggested from JD company/role)
- Experience level selector
- Large textarea for pasting the full JD
- "Generate Resume" button with loading/progress state

## Generation Pipeline

### Data Collection
Fetch ALL portfolio data in parallel:
- `hero_section` → name
- `about_section` → bio (for summary basis)
- `site_settings` → contact email, social links
- `experience` → all published entries with achievements
- `skills` → all published, grouped by category
- `education` → all published entries
- `certifications` → all published entries
- `projects` → all published with tech_stack, highlights
- `ventures` → all published (map to extracurriculars)

### AI Call
Single Claude API call (`claude-sonnet-4-5`, ~4096 max tokens):

**System prompt** instructs the AI to:
- Analyze the JD for required skills, experience level, and key requirements
- Select the most relevant entries from each portfolio section
- Rewrite experience bullets using XYZ formula targeting the JD
- Group skills into resume-appropriate categories (Languages, Frameworks, etc.)
- Write a professional summary tailored to the role
- Select relevant projects and tailor descriptions
- Map ventures to extracurriculars where relevant
- Suggest the best template based on experience level and role type
- Return structured JSON matching the resume builder schema

**Response format** (JSON):
```json
{
  "suggested_title": "Senior Backend Engineer — Acme Corp",
  "suggested_template": "pragmatic",
  "contact_info": { "full_name", "email", "phone", "city", "country", "linkedin_url", "github_url", "portfolio_url" },
  "summary": "...",
  "work_experiences": [{ "job_title", "company", "location", "start_date", "end_date", "achievements": ["..."] }],
  "skill_categories": [{ "name": "Languages", "skills": ["Python", "Go"] }],
  "projects": [{ "name", "description", "achievements": ["..."] }],
  "education": [{ "degree", "institution", "field_of_study", "graduation_date" }],
  "certifications": [{ "name", "issuer", "date" }],
  "extracurriculars": [{ "type", "title", "description" }]
}
```

### Database Population
After AI response, insert all records into resume_builder tables:
1. Create resume record with suggested template
2. Insert contact_info, summary, settings
3. Insert work_experiences + their achievements
4. Insert skill_categories, education, projects + achievements, certifications, extracurriculars
5. `revalidatePath` and redirect to editor

## Editor Improvements

### Label spacing fix
Add `space-y-2` to all Label+Input wrapper divs across all section editors (ContactInfoSection, WorkExperienceSection, etc.) — same pattern as the create dialog fix.

### Post-generation editing
All AI-generated content is fully editable in the existing section editors. No special "locked" or "AI-only" states — the user owns the content immediately.

## Files to Create/Modify

### New files
- `src/lib/resume-builder/ai/tailor-resume.ts` — AI prompt + response parsing for tailoring
- `src/app/admin/resume-builder/actions.ts` — new `generateTailoredResume` server action
- `src/app/admin/resume-builder/resume-list.tsx` — redesigned create dialog

### Modified files
- `src/components/resume-builder/editor/sections/*.tsx` — label spacing fixes
- `src/lib/resume-builder/queries.ts` — new query to fetch all portfolio data for AI

## Error Handling
- AI API unavailable: show error, offer "Start from Scratch" fallback
- Partial AI response: populate what's available, leave rest empty for manual entry
- JD too short: validate minimum length before sending to AI
