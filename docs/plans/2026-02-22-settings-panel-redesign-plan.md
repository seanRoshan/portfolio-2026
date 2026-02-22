# Settings Panel Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the settings panel template-aware with conditional visibility and add new customization options (page margins, name font size, section title uppercase, right panel color).

**Architecture:** Add 4 new columns to `resume_settings`, extend the TypeScript type, add a template capabilities map to `SettingsPanel` that conditionally shows/hides controls, update `getTemplateStyles` in shared.tsx to return the new settings, and update all 6 templates + PDF generation to consume them.

**Tech Stack:** Supabase (migration), TypeScript, React, Tailwind CSS, shadcn/ui

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260222260000_settings_new_columns.sql`

**Step 1: Write the migration**

```sql
-- Add new customization columns to resume_settings
ALTER TABLE resume_settings
  ADD COLUMN IF NOT EXISTS page_margin text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS name_font_size integer,
  ADD COLUMN IF NOT EXISTS section_title_uppercase boolean,
  ADD COLUMN IF NOT EXISTS right_panel_color text;
```

**Step 2: Push migration**

Run: `npx supabase db push`
Expected: Migration applied successfully.

**Step 3: Commit**

```
feat: add settings columns for margin, name size, uppercase, panel color
```

---

### Task 2: Update TypeScript Types

**Files:**
- Modify: `src/types/resume-builder.ts:16-17,219-231`

**Step 1: Add PageMargin type**

After line 17 (`export type DateFormat = ...`), add:

```typescript
export type PageMargin = 'compact' | 'normal' | 'wide'
```

**Step 2: Extend ResumeSettings interface**

Add these 4 fields after `background_color` (line 230):

```typescript
  page_margin?: PageMargin
  name_font_size?: number
  section_title_uppercase?: boolean
  right_panel_color?: string
```

**Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: Clean compile.

**Step 4: Commit**

```
feat: add new settings types for template customization
```

---

### Task 3: Update shared.tsx — getTemplateStyles

**Files:**
- Modify: `src/components/resume-builder/templates/shared.tsx:74-102`

**Step 1: Add template ID constants and margin presets**

Before `DENSITY_MAP` (line 74), add:

```typescript
// Template ID constants
export const TEMPLATE_IDS = {
  pragmatic:   'a1b2c3d4-0001-4000-8000-000000000001',
  mono:        'a1b2c3d4-0002-4000-8000-000000000002',
  smarkdown:   'a1b2c3d4-0003-4000-8000-000000000003',
  careercup:   'a1b2c3d4-0004-4000-8000-000000000004',
  parker:      'a1b2c3d4-0005-4000-8000-000000000005',
  experienced: 'a1b2c3d4-0006-4000-8000-000000000006',
} as const

// Default name font sizes per template (when name_font_size is null)
export const DEFAULT_NAME_SIZES: Record<string, number> = {
  [TEMPLATE_IDS.pragmatic]:   28,
  [TEMPLATE_IDS.mono]:        24,
  [TEMPLATE_IDS.smarkdown]:   28,
  [TEMPLATE_IDS.careercup]:   22,
  [TEMPLATE_IDS.parker]:      20,
  [TEMPLATE_IDS.experienced]: 22,
}

// Default section title uppercase per template (when section_title_uppercase is null)
export const DEFAULT_UPPERCASE: Record<string, boolean> = {
  [TEMPLATE_IDS.pragmatic]:   true,
  [TEMPLATE_IDS.mono]:        true,
  [TEMPLATE_IDS.smarkdown]:   false,
  [TEMPLATE_IDS.careercup]:   true,
  [TEMPLATE_IDS.parker]:      true,
  [TEMPLATE_IDS.experienced]: false,
}

// Margin presets per template (compact / normal / wide)
export const MARGIN_PRESETS: Record<string, Record<string, string>> = {
  [TEMPLATE_IDS.pragmatic]:   { compact: '0.6in', normal: '0.8in', wide: '1in' },
  [TEMPLATE_IDS.mono]:        { compact: '0.5in', normal: '0.65in', wide: '0.8in' },
  [TEMPLATE_IDS.smarkdown]:   { compact: '0.6in', normal: '0.8in', wide: '1in' },
  [TEMPLATE_IDS.careercup]:   { compact: '0.4in', normal: '0.6in', wide: '0.8in' },
  [TEMPLATE_IDS.parker]:      { compact: '0.4in', normal: '0.5in', wide: '0.7in' },
  [TEMPLATE_IDS.experienced]: { compact: '0.4in', normal: '0.5in', wide: '0.7in' },
}
```

**Step 2: Extend getTemplateStyles to return new settings**

Update the `getTemplateStyles` function signature and return value. Add a `templateId` parameter:

```typescript
export function getTemplateStyles(
  settings: {
    accent_color?: string
    font_family?: string
    font_size_preset?: string
    font_size_base?: number
    background_color?: string
    page_margin?: string
    name_font_size?: number
    section_title_uppercase?: boolean
    right_panel_color?: string
  } | null | undefined,
  templateId?: string
) {
  const accent = settings?.accent_color || '#000000'
  const background = settings?.background_color || '#374151'
  const font = resolveFontFamily(settings?.font_family ?? 'Inter')
  const baseDensity = DENSITY_MAP[settings?.font_size_preset ?? 'comfortable'] ?? DENSITY_MAP.comfortable

  // New settings
  const tid = templateId ?? ''
  const margin = MARGIN_PRESETS[tid]?.[settings?.page_margin ?? 'normal'] ?? MARGIN_PRESETS[TEMPLATE_IDS.pragmatic].normal
  const nameSize = settings?.name_font_size ?? DEFAULT_NAME_SIZES[tid] ?? 28
  const uppercase = settings?.section_title_uppercase ?? DEFAULT_UPPERCASE[tid] ?? true
  const rightPanelColor = settings?.right_panel_color ?? '#f9fafb'

  // If font_size_base is set, scale all sizes proportionally from the density preset
  const fontSizeBase = settings?.font_size_base
  if (fontSizeBase != null) {
    const defaultBody = parseFloat(baseDensity.body)
    const scale = fontSizeBase / defaultBody
    const density = {
      body: `${fontSizeBase}px`,
      heading: `${Math.round(parseFloat(baseDensity.heading) * scale * 10) / 10}px`,
      section: `${Math.round(parseFloat(baseDensity.section) * scale * 10) / 10}px`,
      lineHeight: baseDensity.lineHeight,
      sectionGap: baseDensity.sectionGap,
    }
    return { accent, background, font, density, margin, nameSize, uppercase, rightPanelColor }
  }

  return { accent, background, font, density: baseDensity, margin, nameSize, uppercase, rightPanelColor }
}
```

**Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: Compile errors in template files (they now need to handle new return values) — that's expected and fixed in Tasks 5-7.

**Step 4: Commit**

```
feat: extend getTemplateStyles with margin, name size, uppercase, panel color
```

---

### Task 4: Update SettingsPanel — Template-Aware UI

**Files:**
- Modify: `src/components/resume-builder/editor/SettingsPanel.tsx`
- Modify: `src/components/resume-builder/editor/ResumeEditor.tsx` (pass templateId prop)

**Step 1: Add templateId prop and capabilities map to SettingsPanel**

Update the Props interface (line 53-57):

```typescript
interface Props {
  resumeId: string
  settings: ResumeSettings | null
  sectionOrder: string[]
  templateId: string | null
}
```

Add the capabilities map and margin options after the existing `dateFormatOptions` constant (after line 51):

```typescript
const marginOptions = [
  { value: 'compact', label: 'Compact' },
  { value: 'normal', label: 'Normal' },
  { value: 'wide', label: 'Wide' },
]

// Templates that support background_color (two-column with colored sidebar/panel)
const TEMPLATES_WITH_BACKGROUND = new Set([
  'a1b2c3d4-0005-4000-8000-000000000005', // Parker
  'a1b2c3d4-0006-4000-8000-000000000006', // Experienced
])

// Templates that support right_panel_color
const TEMPLATES_WITH_RIGHT_PANEL = new Set([
  'a1b2c3d4-0005-4000-8000-000000000005', // Parker
])
```

**Step 2: Update function signature to destructure templateId**

```typescript
export function SettingsPanel({ resumeId, settings, sectionOrder, templateId }: Props) {
```

Add local variables after `hiddenSet` (line 163):

```typescript
  const showBackground = TEMPLATES_WITH_BACKGROUND.has(templateId ?? '')
  const showRightPanel = TEMPLATES_WITH_RIGHT_PANEL.has(templateId ?? '')
```

**Step 3: Conditionally wrap Background Color setting**

Wrap the existing Background Color `<SettingRow>` (lines 199-226) with:

```tsx
{showBackground && (
  <SettingRow icon={Palette} label="Background Color" description="Sidebar or column background">
    {/* ... existing color picker ... */}
  </SettingRow>
)}
```

**Step 4: Add Right Panel Color setting after Background Color**

```tsx
{showRightPanel && (
  <SettingRow icon={Palette} label="Panel Color" description="Main content area background (Parker)">
    <div className="flex items-center gap-2">
      <div className="relative">
        <Input
          type="color"
          defaultValue={settings?.right_panel_color ?? '#f9fafb'}
          onChange={(e) => handleUpdate('right_panel_color', e.target.value)}
          className="h-9 w-12 cursor-pointer border-2 p-0.5"
        />
      </div>
      <Input
        key={settings?.right_panel_color ?? '#f9fafb'}
        defaultValue={settings?.right_panel_color ?? '#f9fafb'}
        onBlur={(e) => {
          const val = e.target.value.trim()
          if (/^#[0-9a-fA-F]{6}$/.test(val)) {
            handleUpdate('right_panel_color', val)
          }
        }}
        className="h-9 w-24 font-mono text-xs uppercase"
        placeholder="#f9fafb"
      />
      <div
        className="h-9 w-9 shrink-0 rounded-md border"
        style={{ backgroundColor: settings?.right_panel_color ?? '#f9fafb' }}
      />
    </div>
  </SettingRow>
)}
```

**Step 5: Add new Layout settings**

Add these 3 new settings in the Layout section, after the existing Page Limit setting (after line 307):

Import `Maximize, Heading1, CaseSensitive` from lucide-react at the top.

**Page Margins** (after Page Limit):

```tsx
<SettingRow icon={Maximize} label="Page Margins" description="Controls padding around the page edges">
  <Select
    defaultValue={settings?.page_margin ?? 'normal'}
    onValueChange={(v) => handleUpdate('page_margin', v)}
    disabled={isPending}
  >
    <SelectTrigger className="h-9">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {marginOptions.map((m) => (
        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</SettingRow>
```

**Name Font Size** (after Page Margins):

```tsx
<SettingRow icon={Heading1} label="Name Size" description="Font size for your name in the header (18-36px)">
  <div className="flex items-center gap-3">
    <Slider
      defaultValue={[settings?.name_font_size ?? 28]}
      min={18}
      max={36}
      step={1}
      onValueCommit={([v]) => handleUpdate('name_font_size', v)}
      disabled={isPending}
      className="flex-1"
    />
    <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
      {settings?.name_font_size ?? 28}px
    </span>
  </div>
</SettingRow>
```

**Section Title Uppercase** (after Name Font Size):

```tsx
<SettingRow icon={CaseSensitive} label="Uppercase Titles" description="Force section titles to ALL CAPS">
  <Switch
    checked={settings?.section_title_uppercase ?? true}
    onCheckedChange={(v) => handleUpdate('section_title_uppercase', v)}
    disabled={isPending}
  />
</SettingRow>
```

**Step 6: Visual polish — tighten spacing**

Change the outer container `space-y-5` (line 166) to `space-y-4`.

**Step 7: Pass templateId from ResumeEditor**

In `src/components/resume-builder/editor/ResumeEditor.tsx`, find the `<SettingsPanel>` component (around line 558) and add the `templateId` prop:

```tsx
<SettingsPanel
  resumeId={resume.id}
  settings={resume.settings}
  sectionOrder={sectionOrder}
  templateId={resume.template_id}
/>
```

**Step 8: Verify types compile**

Run: `npx tsc --noEmit`

**Step 9: Commit**

```
feat: template-aware settings panel with conditional options
```

---

### Task 5: Update Single-Column Templates (Pragmatic, Mono, Smarkdown, CareerCup)

**Files:**
- Modify: `src/components/resume-builder/templates/PragmaticTemplate.tsx`
- Modify: `src/components/resume-builder/templates/MonoTemplate.tsx`
- Modify: `src/components/resume-builder/templates/SmarkdownTemplate.tsx`
- Modify: `src/components/resume-builder/templates/CareerCupTemplate.tsx`

All 4 follow the same pattern. For each template:

**Step 1: Pass templateId to getTemplateStyles**

Each template currently calls:
```typescript
const { accent, font, density } = getTemplateStyles(resume.settings)
```

Change to (also import `TEMPLATE_IDS` from shared):
```typescript
const { accent, font, density, margin, nameSize, uppercase } = getTemplateStyles(resume.settings, TEMPLATE_IDS.<name>)
```

Where `<name>` is `pragmatic`, `mono`, `smarkdown`, or `careercup`.

Also update the import:
```typescript
import { getDateRange, getVisibleSections, getContactLinks, getTemplateStyles, visibleExperiences, TEMPLATE_IDS } from './shared'
```

**Step 2: Replace hardcoded padding with `margin`**

In each template's root `<div>`, replace the hardcoded `padding`:
- Pragmatic: `padding: '1in'` → `padding: margin`
- Mono: `padding: '0.8in'` → `padding: margin`
- Smarkdown: `padding: '1in'` → `padding: margin`
- CareerCup: `padding: '0.6in'` → `padding: margin`

**Step 3: Replace hardcoded name font size with `nameSize`**

In each template's name `<h1>` or `<div>`, replace the hardcoded `fontSize`:
- Pragmatic line ~161: `fontSize: '28px'` → `fontSize: \`${nameSize}px\``
- Mono line ~162: `fontSize: '24px'` → `fontSize: \`${nameSize}px\``
- Smarkdown line ~163: `fontSize: '28px'` → `fontSize: \`${nameSize}px\``
- CareerCup line ~163: `fontSize: '22px'` → `fontSize: \`${nameSize}px\``

**Step 4: Replace hardcoded textTransform with `uppercase`**

In each template's `Section` component, change the `<h2>` or section title `textTransform`:
- Pragmatic `Section` component: `textTransform: 'uppercase'` → `textTransform: uppercase ? 'uppercase' : 'none'`
  - The `Section` component needs the `uppercase` prop added: `function Section({ title, accent, sectionSize, sectionGap, uppercase }: { ... uppercase: boolean })`
  - Pass `uppercase={uppercase}` from each `<Section>` usage
- Same pattern for Mono, CareerCup
- Smarkdown: currently uses `textTransform: 'uppercase'` on its section headings too — apply same pattern

**Step 5: Verify types compile**

Run: `npx tsc --noEmit`

**Step 6: Commit**

```
feat: single-column templates use margin, name size, uppercase settings
```

---

### Task 6: Update Two-Column Templates (Parker, Experienced)

**Files:**
- Modify: `src/components/resume-builder/templates/ParkerTemplate.tsx`
- Modify: `src/components/resume-builder/templates/ExperiencedTemplate.tsx`

**Step 1: Update getTemplateStyles call in ParkerTemplate**

```typescript
const { accent, background, font, density, margin, nameSize, uppercase, rightPanelColor } = getTemplateStyles(resume.settings, TEMPLATE_IDS.parker)
const dark = background
const light = rightPanelColor
```

Remove the hardcoded `const light = '#f9fafb'`.

Import `TEMPLATE_IDS` from shared.

**Step 2: Use margin in Parker**

Parker has asymmetric padding on sidebar and main column. Use `margin` as a base:
- Sidebar padding (line ~185): `padding: '0.8in 0.5in 0.6in'` → `padding: \`${margin} calc(${margin} - 0.3in) calc(${margin} - 0.2in)\``

  Actually this gets complex with asymmetric padding. Simpler approach: the margin preset controls horizontal padding proportionally. Replace:
  - Sidebar: `padding: margin` (let the template handle the rest with its natural flow)

  **Revised approach:** For two-column templates, apply margin as the outer wrapper padding instead of per-column. This is simpler and more predictable:
  - Parker root div (line ~176): add `padding: margin` to the outermost wrapper
  - Remove per-column padding values and use consistent smaller inner padding

  Actually, let's keep it simple. For two-column templates, the margin setting is less impactful since they have complex internal padding. **Just apply `margin` to the overall wrapper and let each column use its existing relative padding.** The wrapper currently has no padding — add `padding: margin`.

  Wait, looking at Parker more carefully: the root wrapper (line ~170) sets up a flex container with 30/70 split. The sidebar and main each have their own padding. The cleanest approach:

  Set the root wrapper's `padding` to `0` and each column's padding scales with margin:
  - Sidebar: `padding: \`${margin} calc(${margin} * 0.7)\``
  - Main: `padding: \`${margin} calc(${margin} * 0.9)\``

  This is getting over-engineered. **Simplest approach: set the root `<div>` padding to `margin` and remove per-column top/bottom padding, keeping only horizontal padding on the columns.** But this would break the two-column layout.

  **Final decision:** For Parker and Experienced, apply `margin` as a scaling factor to their existing paddings. Use a simple multiplier approach:

```typescript
// In Parker, before the return JSX
const m = parseFloat(margin) // e.g., 0.5 from "0.5in"
const unit = margin.replace(/[\d.]/g, '') // "in"
```

This is too complex. **Let's use the simplest viable approach:**
- For two-column templates, `margin` applies only to the outer padding of the entire document (like a page margin in a word processor).
- Replace the root wrapper with `padding: margin` and adjust column inner padding to be relative.

Looking at the actual code more carefully:

Parker root div (line ~170-178) is just `display: flex` with `width: 8.5in; minHeight: 11in`. It has NO padding. The padding is on each column div.

So the simplest approach: **Add `padding: margin` to the root container, and reduce each column's padding accordingly.** But this creates a white border around the sidebar, which might not look right.

**Revised final approach for two-column templates:** Don't apply page_margin to two-column templates' internal layout. Just skip margin for Parker/Experienced — their layouts are too complex. The margin setting's description can note "Adjusts page margins (single-column templates)". OR: treat margin as controlling the vertical top/bottom padding and let the columns handle horizontal.

**Actual final decision:** Apply margin to all templates consistently:
- Single-column: `padding: margin` (uniform)
- Parker sidebar: `padding: \`${margin} 0.5in\`` (top/bottom from margin, horizontal fixed)
- Parker main: `padding: \`${margin} 0.7in\`` (top/bottom from margin, horizontal fixed)
- Experienced header: `padding: \`${margin} 0.7in calc(${margin} * 0.7)\``
- Experienced left: `padding: \`0.15in 0.45in ${margin} 0.7in\``
- Experienced right: `padding: \`0.15in 0.7in ${margin} 0.55in\``

This keeps it clean. The margin controls vertical (top/bottom) page margin while horizontal stays template-specific.

**Step 3: Use nameSize in Parker**

Parker name (line ~192): `fontSize: '20px'` or similar → `fontSize: \`${nameSize}px\``

**Step 4: Use uppercase in Parker**

Parker `SidebarSection` and `MainSection` both use `textTransform: 'uppercase'`. Change to:
```typescript
textTransform: uppercase ? 'uppercase' : 'none' as const
```

Both section components need `uppercase` prop.

**Step 5: Fix Parker sidebar color consistency**

Change skill list text color from `'#e5e7eb'` to `'#d1d5db'` (line ~32) to consolidate the secondary tier.

**Step 6: Repeat for ExperiencedTemplate**

Same pattern:
```typescript
const { accent, background, font, density, margin, nameSize, uppercase } = getTemplateStyles(resume.settings, TEMPLATE_IDS.experienced)
const leftBg = background
```
- Apply `nameSize` to header name
- Apply `uppercase` to `LeftSection` and `RightSection`
- Apply `margin` for vertical padding on header/columns

**Step 7: Verify types compile**

Run: `npx tsc --noEmit`

**Step 8: Commit**

```
feat: two-column templates use new settings, fix Parker sidebar colors
```

---

### Task 7: Update PDF Generation

**Files:**
- Modify: `src/lib/resume-builder/pdf/generate-html.ts`

**Step 1: Read new settings and pass to HTML generators**

In the main `generateResumeHtml` function, after reading existing settings, also read:

```typescript
const pageMargin = resume.settings?.page_margin ?? 'normal'
const nameFontSize = resume.settings?.name_font_size
const sectionTitleUppercase = resume.settings?.section_title_uppercase
const rightPanelColor = resume.settings?.right_panel_color ?? '#f9fafb'
```

Import `MARGIN_PRESETS, TEMPLATE_IDS, DEFAULT_NAME_SIZES, DEFAULT_UPPERCASE` from shared.

**Step 2: Replace hardcoded margin**

Replace line ~98:
```typescript
const margin = isCareerCupTemplate ? '0.6in' : isMonoTemplate ? '0.75in' : '1in'
```
With:
```typescript
const margin = MARGIN_PRESETS[templateId]?.[pageMargin] ?? '0.8in'
```

**Step 3: Replace hardcoded name sizes in HTML generation**

Find all `font-size:28px` / `font-size:24px` / `font-size:22px` for name elements and replace with the resolved `nameFontSize` value:
```typescript
const resolvedNameSize = nameFontSize ?? DEFAULT_NAME_SIZES[templateId] ?? 28
```

**Step 4: Replace hardcoded textTransform in HTML generation**

Find all `text-transform:uppercase` for section headings and make conditional:
```typescript
const resolvedUppercase = sectionTitleUppercase ?? DEFAULT_UPPERCASE[templateId] ?? true
const titleTransform = resolvedUppercase ? 'uppercase' : 'none'
```

**Step 5: Pass rightPanelColor to Parker HTML generator**

The `generateParkerHtml` function needs to receive and use `rightPanelColor` instead of hardcoded `#f9fafb`.

**Step 6: Verify compile**

Run: `npx tsc --noEmit`

**Step 7: Commit**

```
feat: PDF generation uses new template settings
```

---

### Task 8: Final Verification

**Step 1: Type check**

Run: `npx tsc --noEmit`
Expected: Clean compile.

**Step 2: Build**

Run: `npx next build`
Expected: Clean build, no errors.

**Step 3: Manual verification checklist**

1. Open resume editor with Pragmatic template → Settings gear → should NOT show Background Color or Panel Color
2. Switch to Parker template → Settings gear → should show Background Color AND Panel Color
3. Switch to Experienced → should show Background Color but NOT Panel Color
4. Page Margins dropdown → change to Compact/Wide → preview should update
5. Name Size slider → drag → name in preview should resize
6. Uppercase Titles toggle → off → section titles should change to title case
7. Download PDF → verify margins, name size, uppercase settings are reflected

**Step 4: Commit all remaining changes**

```
feat: complete template-aware settings panel redesign
```
