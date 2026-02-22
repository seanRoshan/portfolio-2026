# Contact Details Section — UI Redesign

**Date:** 2026-02-22
**Status:** Approved
**File:** `src/components/resume-builder/editor/sections/ContactInfoSection.tsx`

## Problem

The current Contact Details section has flat visual hierarchy, inconsistent icon patterns, a heavy "LINKS" box, ambiguous location fields, and an orphaned save button.

## Design

### Structure: 3 Grouped Cards

Split the form into 3 visually distinct groups using subtle card backgrounds.

### Group 1: Identity
- Card: `rounded-lg bg-muted/30 p-4 space-y-3`
- Group label: "IDENTITY" — `text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70`
- **Full Name** — full width, `h-10`, `font-medium` on input (larger to signal primary field)
- **Email + Phone** — `grid-cols-2`, both with leading icons (Mail, Phone) at `left-3 top-3`

### Group 2: Location
- Same card style
- Group label: "LOCATION" with MapPin icon
- **City + State + Country** — `grid-cols-[2fr_1fr_1fr]` so City gets more space
- All fields always visible with proper labels above each

### Group 3: Online Presence
- Same card style
- Group label: "ONLINE PRESENCE" with Link icon
- **LinkedIn, GitHub, Portfolio** — always-visible input fields, stacked vertically
- Each with appropriate leading icon (Linkedin, Github, Globe)
- Display `https://` prefix in placeholder only, not in the label
- Consistent icon sizing: `h-4 w-4 text-muted-foreground/50`

### Save Button
- Right-aligned at bottom
- Slides in only when `isDirty` is true (animated with opacity + translateY)
- Includes "Discard" text button next to it (calls `reset()`)
- Hidden when form is clean

### Visual Tokens
- Group cards: `rounded-lg bg-muted/30 p-4 space-y-3`
- Group labels: `text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70`
- Icon sizing: `h-4 w-4 text-muted-foreground/50` (uniform across all inputs)
- Input height: `h-9` for all fields, `h-10` for Full Name
- Spacing between groups: `space-y-4`
- Errors: `text-destructive text-xs` below fields

## Scope

- Only modifies `ContactInfoSection.tsx`
- No schema changes, no backend changes
- No new dependencies
