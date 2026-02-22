# Global Contact Info System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Unify contact info into a global profile in `site_settings`, with per-field landing page visibility toggles, auto-populate new resumes, and redesign the admin contact page.

**Architecture:** Extend the existing `site_settings` single-row table with profile fields + visibility booleans. The admin `/admin/contact` page gets the Grouped Card redesign. `getSiteConfig()` returns the new fields for landing page components to conditionally render. New resumes auto-populate from global profile.

**Tech Stack:** Supabase (PostgreSQL migration), Next.js Server Actions, react-hook-form, shadcn/ui, Tailwind CSS

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260222210000_global_contact_info.sql`

**Step 1: Write the migration**

```sql
-- Add global profile fields to site_settings
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS github_url TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
  ADD COLUMN IF NOT EXISTS blog_url TEXT,
  -- Landing page visibility toggles
  ADD COLUMN IF NOT EXISTS landing_show_email BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS landing_show_phone BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS landing_show_location BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS landing_show_linkedin BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS landing_show_github BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS landing_show_portfolio BOOLEAN NOT NULL DEFAULT true;
```

**Step 2: Apply migration**

Run: `npx supabase db reset`
Expected: Clean migration run with no errors.

**Step 3: Commit**

```bash
git add supabase/migrations/20260222210000_global_contact_info.sql
git commit -m "feat: add global contact info columns to site_settings"
```

---

### Task 2: Update TypeScript Types

**Files:**
- Modify: `src/types/database.ts:3-17` (SiteSettings interface)

**Step 1: Add new fields to SiteSettings**

Add these fields to the `SiteSettings` interface (before `created_at`):

```typescript
export interface SiteSettings {
  id: string
  site_title: string
  site_description: string | null
  og_image_url: string | null
  favicon_url: string | null
  google_analytics_id: string | null
  social_links: Record<string, string>
  contact_email: string | null
  contact_form_enabled: boolean
  maintenance_mode: boolean
  link_animations: { header: string; footer: string } | null
  // Global profile fields
  full_name: string | null
  phone: string | null
  city: string | null
  state: string | null
  country: string | null
  linkedin_url: string | null
  github_url: string | null
  portfolio_url: string | null
  blog_url: string | null
  // Landing page visibility
  landing_show_email: boolean
  landing_show_phone: boolean
  landing_show_location: boolean
  landing_show_linkedin: boolean
  landing_show_github: boolean
  landing_show_portfolio: boolean
  created_at: string
  updated_at: string
}
```

**Step 2: Commit**

```bash
git add src/types/database.ts
git commit -m "feat: add global profile fields to SiteSettings type"
```

---

### Task 3: Update `getSiteConfig()` Query

**Files:**
- Modify: `src/lib/queries.ts:9-30` (getSiteConfig function)

**Step 1: Expand the return object**

The function already does `select("*")` on `site_settings`, so the new columns are fetched automatically. Update the return shape to include the new fields:

```typescript
export async function getSiteConfig() {
  const supabase = await createClient()
  const { data: settings } = await supabase.from("site_settings").select("*").single()
  const { data: hero } = await supabase.from("hero_section").select("name, avatar_url").single()

  if (!settings || !hero) return null

  // Build location string from parts
  const locationParts = [settings.city, settings.state, settings.country].filter(Boolean)
  const location = locationParts.join(", ")

  return {
    name: settings.full_name || hero.name,
    title: settings.site_title?.split("—")[1]?.trim() ?? "Developer",
    description: settings.site_description ?? "",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "",
    email: settings.contact_email ?? "",
    phone: settings.phone ?? "",
    location,
    availability: "Open to opportunities",
    socials: (settings.social_links as Record<string, string>) ?? {},
    linkedinUrl: settings.linkedin_url ?? "",
    githubUrl: settings.github_url ?? "",
    portfolioUrl: settings.portfolio_url ?? "",
    linkAnimations: (settings.link_animations as { header: string; footer: string }) ?? {
      header: "underline-slide",
      footer: "underline-slide",
    },
    // Visibility flags
    visibility: {
      email: settings.landing_show_email,
      phone: settings.landing_show_phone,
      location: settings.landing_show_location,
      linkedin: settings.landing_show_linkedin,
      github: settings.landing_show_github,
      portfolio: settings.landing_show_portfolio,
    },
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/queries.ts
git commit -m "feat: expand getSiteConfig with global profile and visibility flags"
```

---

### Task 4: Redesign Admin Contact Page — Actions & Schema

**Files:**
- Modify: `src/app/admin/contact/actions.ts`

**Step 1: Expand the schema and update action**

```typescript
"use server"

import { revalidateTag, revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/admin-auth"
import { z } from "zod"

const contactInfoSchema = z.object({
  // Identity
  full_name: z.string().optional().transform((v) => v?.trim() || null),
  contact_email: z
    .string()
    .email()
    .nullable()
    .or(z.literal(""))
    .transform((v) => v || null),
  phone: z.string().optional().transform((v) => v?.trim() || null),
  // Location
  city: z.string().optional().transform((v) => v?.trim() || null),
  state: z.string().optional().transform((v) => v?.trim() || null),
  country: z.string().optional().transform((v) => v?.trim() || null),
  // Online presence
  linkedin_url: z.string().url().or(z.literal("")).optional().transform((v) => v?.trim() || null),
  github_url: z.string().url().or(z.literal("")).optional().transform((v) => v?.trim() || null),
  portfolio_url: z.string().url().or(z.literal("")).optional().transform((v) => v?.trim() || null),
  blog_url: z.string().url().or(z.literal("")).optional().transform((v) => v?.trim() || null),
  // Settings
  contact_form_enabled: z.boolean(),
  social_links: z.record(z.string(), z.string()),
  // Visibility toggles
  landing_show_email: z.boolean(),
  landing_show_phone: z.boolean(),
  landing_show_location: z.boolean(),
  landing_show_linkedin: z.boolean(),
  landing_show_github: z.boolean(),
  landing_show_portfolio: z.boolean(),
})

export type ContactInfoFormValues = z.input<typeof contactInfoSchema>

export async function updateContactInfo(data: ContactInfoFormValues) {
  await requireAuth()
  const validated = contactInfoSchema.parse(data)
  const supabase = await createClient()

  const { data: current } = await supabase.from("site_settings").select("id").single()
  if (!current) return { error: "Site settings not found" }

  const { error } = await supabase
    .from("site_settings")
    .update(validated)
    .eq("id", current.id)

  if (error) return { error: error.message }

  revalidateTag("site_settings")
  revalidatePath("/")
  return { success: true }
}
```

**Step 2: Commit**

```bash
git add src/app/admin/contact/actions.ts
git commit -m "feat: expand contact actions with global profile fields and visibility"
```

---

### Task 5: Redesign Admin Contact Form Component

**Files:**
- Modify: `src/app/admin/contact/contact-form.tsx`

**Step 1: Rewrite the form with Grouped Card layout**

Reuse the `GroupCard` pattern from the resume builder's `ContactInfoSection.tsx`. The form should have these groups:

1. **Identity** — Full Name, Email, Phone (same layout as resume editor: name full-width, email+phone side-by-side with icons)
2. **Location** — City, State, Country (`grid-cols-[2fr_1fr_1fr]`)
3. **Online Presence** — LinkedIn, GitHub, Portfolio, Blog URLs (stacked with leading icons)
4. **Social Links** — Keep existing DnD social links section unchanged
5. **Landing Page Visibility** — Toggle switches for each field: email, phone, location, linkedin, github, portfolio. Each toggle in a row: `flex items-center justify-between` with label on left, Switch on right.
6. **Contact Form Toggle** — Keep existing contact_form_enabled switch

Form `defaultValues` must now include all the new fields from `data` prop.

Key implementation notes:
- Import `User, Mail, Phone, MapPin, Link, Linkedin, Github, Globe, BookOpen, Eye, Loader2` from lucide-react
- Use `FormSection` wrapper (already exists at `@/components/admin/form-section`) for top-level groups
- Inside FormSection, use the GroupCard pattern: `bg-muted/30 rounded-lg p-4 space-y-4`
- The save button should be the same style as current (always visible, disabled when pending)
- Keep the `SortableSocialRow` component unchanged

**Step 2: Verify the page loads**

Run: `npm run dev` and navigate to `/admin/contact`
Expected: All 5 groups render correctly, fields are populated from DB.

**Step 3: Test saving**

Fill in some fields, click Save. Verify toast success. Refresh page. Verify data persisted.

**Step 4: Commit**

```bash
git add src/app/admin/contact/contact-form.tsx
git commit -m "feat: redesign contact form with grouped card layout and visibility toggles"
```

---

### Task 6: Auto-Populate Resume From Global Profile

**Files:**
- Modify: `src/app/admin/resume-builder/actions.ts:72-76` (inside `createResume`)

**Step 1: Fetch global profile and use as defaults**

Replace the current empty contact info insert (line 74-76):

```typescript
// Before (current):
supabase
  .from('resume_contact_info')
  .insert({ resume_id: resume.id, full_name: '' }),

// After:
(async () => {
  // Fetch global profile for defaults
  const { data: settings } = await supabase
    .from('site_settings')
    .select('full_name, contact_email, phone, city, state, country, linkedin_url, github_url, portfolio_url, blog_url')
    .single()

  return supabase
    .from('resume_contact_info')
    .insert({
      resume_id: resume.id,
      full_name: settings?.full_name ?? '',
      email: settings?.contact_email ?? null,
      phone: settings?.phone ?? null,
      city: settings?.city ?? null,
      state: settings?.state ?? null,
      country: settings?.country ?? null,
      linkedin_url: settings?.linkedin_url ?? null,
      github_url: settings?.github_url ?? null,
      portfolio_url: settings?.portfolio_url ?? null,
      blog_url: settings?.blog_url ?? null,
    })
})(),
```

**Step 2: Test by creating a new resume**

1. Fill in global contact info at `/admin/contact`
2. Create a new resume in the resume builder
3. Open it — contact info should be pre-populated

**Step 3: Commit**

```bash
git add src/app/admin/resume-builder/actions.ts
git commit -m "feat: auto-populate new resumes from global contact profile"
```

---

### Task 7: Update Landing Page Components

**Files:**
- Modify: `src/components/sections/Hero.tsx:12-31` (HeroProps interface)
- Modify: `src/components/sections/Contact.tsx:11-22` (ContactProps interface)
- Modify: `src/components/sections/Footer.tsx:12-26` (FooterProps interface)

**Step 1: Update the siteConfig type across all three components**

All three components define their own inline `siteConfig` type. Add the new fields to each:

```typescript
siteConfig: {
  name: string
  title: string
  description: string
  url: string
  email: string
  phone: string        // NEW
  location: string
  availability: string
  socials: Record<string, string>
  linkedinUrl: string  // NEW
  githubUrl: string    // NEW
  portfolioUrl: string // NEW
  visibility: {        // NEW
    email: boolean
    phone: boolean
    location: boolean
    linkedin: boolean
    github: boolean
    portfolio: boolean
  }
  // linkAnimations only in Footer
} | null
```

Also update the `defaultSiteConfig` in each file to include the new fields with sensible defaults:
- `phone: ""`
- `linkedinUrl: ""`
- `githubUrl: ""`
- `portfolioUrl: ""`
- `visibility: { email: true, phone: false, location: true, linkedin: true, github: true, portfolio: true }`

**Step 2: Add visibility-gated rendering in Contact.tsx**

In the Contact section, the email is not currently rendered inline (it's just in the form). The social links at the bottom already render from `siteConfig.socials`. No content changes needed here unless we want to show email/phone/location below the form — for now, just update the types and defaults so the component doesn't break.

**Step 3: Add visibility-gated rendering in Footer.tsx**

The Footer currently renders social links from `siteConfig.socials`. This is fine. If email visibility is on, we could add it to the footer's bottom row. But the current Footer doesn't show email/phone/location, so no content changes needed — just update the types.

**Step 4: Verify landing page loads**

Run: `npm run dev`, navigate to `/`
Expected: Page loads without errors. No visible changes yet (new fields are empty by default).

**Step 5: Commit**

```bash
git add src/components/sections/Hero.tsx src/components/sections/Contact.tsx src/components/sections/Footer.tsx
git commit -m "feat: update landing page components with global profile types and visibility"
```

---

### Task 8: Update Admin Contact Page Server Component

**Files:**
- Modify: `src/app/admin/contact/page.tsx`

**Step 1: No changes needed**

The page already does `select("*")` which will include the new columns. The `data as SiteSettings` cast will work since we updated the type. No code changes required.

**Step 2: Verify end-to-end flow**

1. Go to `/admin/contact` — all new groups should render
2. Fill in name, email, phone, location, URLs
3. Toggle visibility switches
4. Save — verify success
5. Go to landing page — verify data flows through (socials still display, no errors)
6. Create a new resume — verify contact auto-populates

**Step 3: Commit (if any adjustments needed)**

```bash
git add -A
git commit -m "feat: complete global contact info system"
```
