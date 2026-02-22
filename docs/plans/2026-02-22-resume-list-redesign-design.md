# Resume List Page Redesign

**Date:** 2026-02-22
**Status:** Approved

## Problem

The current "Your Resumes" page wastes screen real estate (`max-w-5xl` constraint), has no visual hierarchy between master and tailored resumes, lacks search/filter, and uses bland card design. The master resume deserves prominence since it powers the public resume page and downloads.

## Design: Hero + Grid Layout

### Page Layout

- Remove `AdminHeader` — integrate title and mobile menu into the page content
- Remove `max-w-5xl` — use full available width with `px-6` padding
- Two main sections: Master Resume Hero, then Tailored Resumes Grid

### 1. Master Resume Hero Card

Full-width card at the top. Distinguished by:
- Crown badge + "Master Resume" label
- Subtle gradient left border or top accent line (primary color)
- Two-column layout inside:
  - **Left:** Mini PDF thumbnail preview (placeholder skeleton if unavailable)
  - **Right:** Full metadata (title, template, experience level, target role, dates) + action buttons (Edit, Download PDF, Share Link) + public URL display

If no master resume exists, show an invitation card: "Create your master resume — this powers your public resume page and downloads." with CTA button.

### 2. Tailored Resumes Section

**Header row:** Section title with count badge, search input (filters by title/target_role), and "+ New Resume" button.

**Card grid:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`

Each card features:
- Template color accent strip (left edge, unique color per template)
- Title (truncated), target role subtitle
- Template name badge + experience level badge
- Updated date
- Visible Edit button + overflow menu (Clone, Delete)
- Entire card is clickable (links to editor)

**Empty state:** "Tailor a resume for a specific job to increase your match rate."

### 3. Template Color Map

Each template gets a unique accent color for the card left-border:
- Pragmatic: blue
- Mono: gray
- Smarkdown: green
- CareerCup: orange
- Parker: purple
- Experienced: teal

### 4. Create Resume Dialog

Keep existing 3-step dialog (choose mode → tailor with JD / start from scratch). No changes.

### 5. Mobile Considerations

- Hero card stacks vertically (thumbnail above metadata)
- Grid collapses to single column
- Mobile hamburger menu rendered inside the page header area (Sheet trigger)

## Files to Modify

- `src/app/admin/resume-builder/page.tsx` — remove AdminHeader, add mobile menu trigger
- `src/app/admin/resume-builder/resume-list.tsx` — complete redesign of the component

## Out of Scope

- PDF thumbnail generation (use placeholder for now)
- Actual PDF download from list page (link to editor instead)
