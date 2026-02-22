# Resume Card Metadata Enhancement

**Date:** 2026-02-22
**Status:** Approved

## Problem

Resume cards only show `title` and `target_role`. There's no structured company name, location, or work mode (remote/hybrid/onsite). The AI tailoring already extracts this data from job descriptions but doesn't store it. Cards lack visual richness and hierarchy.

## Design

### Database — New Columns on `resumes` Table

```sql
ALTER TABLE resumes ADD COLUMN company_name TEXT;
ALTER TABLE resumes ADD COLUMN job_location TEXT;
ALTER TABLE resumes ADD COLUMN work_mode TEXT CHECK (work_mode IN ('remote', 'hybrid', 'onsite'));
```

### TypeScript — Updated Resume Interface

Add `company_name: string | null`, `job_location: string | null`, `work_mode: RemoteType | null` to the `Resume` interface.

### AI Auto-Population

Extend `JDAnalysis` to extract `location` and `work_mode` from job descriptions. In `generateTailoredResume`, populate the new columns from `jdAnalysis`.

### Card Layout — Tailored Resumes

Role + Company as primary hierarchy:

```
┌──────────────────────────────────┐
│ ┃  Software Engineer              │  target_role (bold)
│ ┃  Google · San Francisco, CA     │  company · location
│ ┃  🟢 Remote                      │  work_mode pill
│ ┃                                 │
│ ┃  "My Google Resume"             │  title (muted, italic)
│ ┃  ◻ Parker · Senior · Feb 22     │  template · level · date
│ ┃                       [Edit] [⋯]│
└──────────────────────────────────┘
```

Work mode color pills:
- Remote: emerald (green dot + green text)
- Hybrid: amber (amber dot + amber text)
- On-site: blue (blue dot + blue text)

Fallback: if no `target_role`, show `title` as heading (backward compatible).

### Card Layout — Master Resume Hero

Same treatment: target_role + company_name prominent, work_mode pill beside location.

### Edit Page — Job Details Fields

Group at top of edit page or settings panel:
- Resume Title (existing)
- Target Role (existing, moved)
- Company Name (new Input)
- Job Location (new Input)
- Work Mode (new Select: Remote / Hybrid / On-site)

### Cursor Fix

Add `cursor-pointer` to the Edit button on tailored cards.

## Files to Modify

- New migration: `supabase/migrations/YYYYMMDD_resume_job_metadata.sql`
- `src/types/resume-builder.ts`
- `src/lib/resume-builder/ai/tailor-resume.ts`
- `src/app/admin/resume-builder/actions.ts`
- `src/app/admin/resume-builder/resume-list.tsx`
- Resume editor page (job details fields)
