# Global Contact Info System — Design

**Date:** 2026-02-22
**Status:** Approved

## Problem

Contact info is fragmented across 3 sources: `site_settings` (email + socials for landing page), `resume_contact_info` (per-resume), and legacy `resume` table (AI fallback). There's no single global profile, no way to control what appears on the landing page, and new resumes start empty instead of inheriting defaults.

## Design

### Database: Extend `site_settings`

Add profile fields to `site_settings` (single-row config table):

```sql
ALTER TABLE site_settings
  ADD COLUMN full_name TEXT,
  ADD COLUMN phone TEXT,
  ADD COLUMN city TEXT,
  ADD COLUMN state TEXT,
  ADD COLUMN country TEXT,
  ADD COLUMN linkedin_url TEXT,
  ADD COLUMN github_url TEXT,
  ADD COLUMN portfolio_url TEXT,
  ADD COLUMN blog_url TEXT,
  -- Landing page visibility toggles
  ADD COLUMN landing_show_email BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN landing_show_phone BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN landing_show_location BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN landing_show_linkedin BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN landing_show_github BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN landing_show_portfolio BOOLEAN NOT NULL DEFAULT true;
```

### Admin `/admin/contact` Page

Redesign the existing contact form with Grouped Card layout:

1. **Identity** — Full Name, Email (existing `contact_email`), Phone
2. **Location** — City, State, Country
3. **Online Presence** — LinkedIn, GitHub, Portfolio, Blog URLs
4. **Social Links** — Existing drag-and-drop social links (Twitter, YouTube, etc.)
5. **Landing Page Visibility** — Toggle switches for: email, phone, location, linkedin, github, portfolio

Each toggle controls whether that field renders on the public landing page.

### Resume Builder Auto-Populate

`createResume()` in `actions.ts` fetches global profile from `site_settings` and uses it as default values for new `resume_contact_info` rows. Per-resume overrides work unchanged.

### Landing Page

Expand `getSiteConfig()` to return new fields + visibility flags. Hero, Contact, and Footer sections conditionally render fields based on `landing_show_*` booleans.

### Files Changed

- `supabase/migrations/` — New migration for schema changes
- `src/types/` — Update SiteSettings type
- `src/lib/queries.ts` — Expand getSiteConfig
- `src/app/admin/contact/` — Redesign page, form, actions, schema
- `src/app/admin/resume-builder/actions.ts` — Auto-populate from global profile
- `src/components/sections/Hero.tsx` — Respect visibility flags
- `src/components/sections/Contact.tsx` — Respect visibility flags
- `src/components/sections/Footer.tsx` — Respect visibility flags
