# Resume Editor Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add resizable preview panel, font size slider, Google Fonts support, and multi-page preview with page break indicators to the resume editor.

**Architecture:** The editor uses a flex layout with 50/50 split — we replace it with `react-resizable-panels`. Font size becomes a continuous slider stored as `font_size_base` in DB, scaling the density preset proportionally. Google Fonts loaded via CDN link tags. Page breaks visualized with dashed lines at 11in intervals in the preview pane.

**Tech Stack:** react-resizable-panels, Google Fonts CDN, existing shadcn/ui components (Slider, Command/Combobox)

---

### Task 1: Install react-resizable-panels

**Files:**
- Modify: `package.json`

**Step 1: Install the package**

Run: `npm install react-resizable-panels`

**Step 2: Verify installation**

Run: `npm ls react-resizable-panels`
Expected: Shows the installed version

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-resizable-panels dependency"
```

---

### Task 2: Resizable preview panel

**Files:**
- Modify: `src/components/resume-builder/editor/ResumeEditor.tsx` (lines 316-343)

**Step 1: Add imports to ResumeEditor.tsx**

Add after the existing imports (after line 57):

```tsx
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
```

**Step 2: Replace the flex layout with PanelGroup**

Replace lines 316-343 (the `{/* Editor + Preview */}` block):

```tsx
{/* Editor + Preview */}
<div className="min-h-0 flex-1">
  <PanelGroup direction="horizontal" autoSaveId="resume-editor-layout">
    {/* Editor Panel */}
    <Panel defaultSize={50} minSize={30}>
      <ScrollArea className="h-full border-r">
        <div className="max-w-2xl space-y-6 p-4 md:p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedSections}
              strategy={verticalListSortingStrategy}
            >
              {orderedSections.map((sectionId) => (
                <SortableSection key={sectionId} id={sectionId}>
                  {renderSection(sectionId)}
                </SortableSection>
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </ScrollArea>
    </Panel>

    {/* Resize Handle */}
    {showPreview && (
      <>
        <PanelResizeHandle className="hover:bg-primary/10 active:bg-primary/20 flex w-1.5 items-center justify-center bg-transparent transition-colors">
          <div className="bg-border h-8 w-0.5 rounded-full" />
        </PanelResizeHandle>

        {/* Preview Panel */}
        <Panel defaultSize={50} minSize={25}>
          <div className="hidden h-full bg-gray-100 dark:bg-gray-900 md:block">
            <ResumePreviewPane resume={resume} />
          </div>
        </Panel>
      </>
    )}
  </PanelGroup>
</div>
```

Note: `autoSaveId="resume-editor-layout"` persists panel sizes to localStorage automatically.

**Step 3: Remove the old conditional className on ScrollArea**

The old code used `className={showPreview ? 'w-1/2 border-r' : 'w-full'}`. The new code uses `<Panel>` which handles sizing. The `ScrollArea` className is now just `"h-full border-r"`.

**Step 4: Run dev server and verify**

Run: `npm run dev`
- Navigate to `/admin/resume-builder/<id>/edit`
- Verify draggable handle appears between editor and preview
- Verify dragging resizes both panels
- Verify toggling preview hide/show still works
- Verify mobile Sheet preview still works (unchanged)
- Refresh page and verify panel sizes persist

**Step 5: Commit**

```bash
git add src/components/resume-builder/editor/ResumeEditor.tsx
git commit -m "feat(resume-editor): add resizable preview panel with draggable divider"
```

---

### Task 3: Database migration for font_size_base

**Files:**
- Create: `supabase/migrations/20260222000000_resume_settings_font_size_base.sql`

**Step 1: Create the migration file**

```sql
ALTER TABLE resume_settings ADD COLUMN font_size_base NUMERIC DEFAULT 10;
```

**Step 2: Apply migration to remote DB**

Run: `npx supabase db push`
Expected: Applies `20260222000000_resume_settings_font_size_base.sql`

**Step 3: Update TypeScript types**

In `src/types/resume-builder.ts`, add `font_size_base` to the `ResumeSettings` interface (after line 228, before the closing `}`):

```ts
  font_size_base: number
```

**Step 4: Commit**

```bash
git add supabase/migrations/20260222000000_resume_settings_font_size_base.sql src/types/resume-builder.ts
git commit -m "feat(resume-editor): add font_size_base column to resume_settings"
```

---

### Task 4: Font size slider in SettingsPanel

**Files:**
- Modify: `src/components/resume-builder/editor/SettingsPanel.tsx` (after line 203)

**Step 1: Add Slider import**

Add to the imports in SettingsPanel.tsx:

```tsx
import { Slider } from '@/components/ui/slider'
```

**Step 2: Add the font size slider after the Density setting**

Insert after the Density `</SettingRow>` (after line 203):

```tsx
<SettingRow icon={Type} label="Font Size" description="Base font size for body text (8-12pt)">
  <div className="flex items-center gap-3">
    <Slider
      defaultValue={[settings?.font_size_base ?? 10]}
      min={8}
      max={12}
      step={0.5}
      onValueCommit={([v]) => handleUpdate('font_size_base', v)}
      disabled={isPending}
      className="flex-1"
    />
    <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
      {settings?.font_size_base ?? 10}pt
    </span>
  </div>
</SettingRow>
```

Note: Uses `onValueCommit` (fires on release) not `onValueChange` (fires continuously) to avoid excessive DB calls.

**Step 3: Verify Slider component exists**

Run: `ls src/components/ui/slider.tsx`

If it doesn't exist, install it:
Run: `npx shadcn@latest add slider`

**Step 4: Commit**

```bash
git add src/components/resume-builder/editor/SettingsPanel.tsx
git commit -m "feat(resume-editor): add font size slider to settings panel"
```

---

### Task 5: Wire font_size_base into template rendering

**Files:**
- Modify: `src/components/resume-builder/templates/shared.tsx` (lines 60-72)
- Modify: `src/lib/resume-builder/pdf/generate-html.ts` (lines 12-16, 43-48)

**Step 1: Update getTemplateStyles in shared.tsx**

Replace the `getTemplateStyles` function (starting at line 66):

```tsx
export function getTemplateStyles(settings: { accent_color?: string; font_family?: string; font_size_preset?: string; font_size_base?: number } | null | undefined) {
  const accent = settings?.accent_color || '#000000'
  const font = FONT_MAP[settings?.font_family ?? 'inter'] ?? FONT_MAP.inter
  const baseDensity = DENSITY_MAP[settings?.font_size_preset ?? 'comfortable'] ?? DENSITY_MAP.comfortable

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
    return { accent, font, density }
  }

  return { accent, font, density: baseDensity }
}
```

**Step 2: Update generate-html.ts to use font_size_base**

At lines 43-48 in `generate-html.ts`, replace the density resolution:

```ts
const fontFamily = FONT_MAP[resume.settings?.font_family ?? 'inter'] ?? FONT_MAP.inter
const baseDensity = DENSITY_MAP[resume.settings?.font_size_preset ?? 'comfortable'] ?? DENSITY_MAP.comfortable
const accentColor = resume.settings?.accent_color ?? '#000000'

// Scale density if font_size_base is set
const fontSizeBase = resume.settings?.font_size_base
let density = baseDensity
if (fontSizeBase != null) {
  const defaultBody = parseFloat(baseDensity.body)
  const scale = fontSizeBase / defaultBody
  density = {
    body: `${fontSizeBase}px`,
    heading: `${Math.round(parseFloat(baseDensity.heading) * scale * 10) / 10}px`,
    section: `${Math.round(parseFloat(baseDensity.section) * scale * 10) / 10}px`,
    lineHeight: baseDensity.lineHeight,
    sectionGap: baseDensity.sectionGap,
  }
}
```

**Step 3: Verify in browser**

- Open resume editor, adjust font size slider
- Verify preview text scales
- Download PDF and verify PDF text matches preview

**Step 4: Commit**

```bash
git add src/components/resume-builder/templates/shared.tsx src/lib/resume-builder/pdf/generate-html.ts
git commit -m "feat(resume-editor): wire font_size_base into template rendering"
```

---

### Task 6: Google Fonts - curated font list and combobox

**Files:**
- Create: `src/lib/resume-builder/fonts.ts`
- Modify: `src/components/resume-builder/editor/SettingsPanel.tsx` (lines 163-181)
- Modify: `src/types/resume-builder.ts` (lines 14-20)

**Step 1: Create the curated font list**

Create `src/lib/resume-builder/fonts.ts`:

```ts
export interface FontOption {
  family: string
  category: 'sans-serif' | 'serif' | 'monospace' | 'display'
  weights?: string
}

export const GOOGLE_FONTS: FontOption[] = [
  // Sans-Serif
  { family: 'Inter', category: 'sans-serif' },
  { family: 'Roboto', category: 'sans-serif' },
  { family: 'Open Sans', category: 'sans-serif' },
  { family: 'Lato', category: 'sans-serif' },
  { family: 'Source Sans 3', category: 'sans-serif' },
  { family: 'Nunito', category: 'sans-serif' },
  { family: 'Poppins', category: 'sans-serif' },
  { family: 'Montserrat', category: 'sans-serif' },
  { family: 'Raleway', category: 'sans-serif' },
  { family: 'Work Sans', category: 'sans-serif' },
  { family: 'DM Sans', category: 'sans-serif' },
  { family: 'IBM Plex Sans', category: 'sans-serif' },
  { family: 'Noto Sans', category: 'sans-serif' },
  { family: 'PT Sans', category: 'sans-serif' },
  { family: 'Barlow', category: 'sans-serif' },
  { family: 'Cabin', category: 'sans-serif' },
  { family: 'Karla', category: 'sans-serif' },
  { family: 'Rubik', category: 'sans-serif' },
  { family: 'Outfit', category: 'sans-serif' },
  { family: 'Plus Jakarta Sans', category: 'sans-serif' },
  { family: 'Figtree', category: 'sans-serif' },
  { family: 'Geist', category: 'sans-serif' },

  // Serif
  { family: 'Georgia', category: 'serif' },
  { family: 'EB Garamond', category: 'serif' },
  { family: 'Merriweather', category: 'serif' },
  { family: 'Playfair Display', category: 'serif' },
  { family: 'Lora', category: 'serif' },
  { family: 'Source Serif 4', category: 'serif' },
  { family: 'Libre Baskerville', category: 'serif' },
  { family: 'PT Serif', category: 'serif' },
  { family: 'Crimson Text', category: 'serif' },
  { family: 'Bitter', category: 'serif' },
  { family: 'IBM Plex Serif', category: 'serif' },
  { family: 'Noto Serif', category: 'serif' },
  { family: 'Cormorant Garamond', category: 'serif' },

  // Monospace
  { family: 'Source Code Pro', category: 'monospace' },
  { family: 'JetBrains Mono', category: 'monospace' },
  { family: 'Fira Code', category: 'monospace' },
  { family: 'IBM Plex Mono', category: 'monospace' },
  { family: 'Roboto Mono', category: 'monospace' },
  { family: 'Inconsolata', category: 'monospace' },
  { family: 'Space Mono', category: 'monospace' },
  { family: 'Geist Mono', category: 'monospace' },
]

/** Build a Google Fonts CSS URL for a given font family */
export function googleFontUrl(family: string): string {
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@300;400;500;600;700&display=swap`
}

/** Build a CSS font-family string with fallbacks */
export function fontFamilyCss(family: string, category: string = 'sans-serif'): string {
  return `"${family}", ${category}`
}

/** Look up a font from the curated list by family name */
export function findFont(family: string): FontOption | undefined {
  return GOOGLE_FONTS.find((f) => f.family === family)
}
```

**Step 2: Update FontFamily type to accept any string**

In `src/types/resume-builder.ts`, replace lines 14-20:

```ts
export type FontFamily = string
```

And update `ResumeSettings` to use `string` (it already uses `FontFamily` which is now `string`).

**Step 3: Replace font selector in SettingsPanel with a Combobox**

First, ensure the Command component exists:
Run: `ls src/components/ui/command.tsx src/components/ui/popover.tsx`

If missing: `npx shadcn@latest add command popover`

Replace the Font Family `<SettingRow>` block (lines 163-181) in SettingsPanel.tsx:

```tsx
<SettingRow icon={Type} label="Font Family" description="Typography used throughout the resume">
  <FontFamilyPicker
    value={settings?.font_family ?? 'Inter'}
    onSelect={(family) => handleUpdate('font_family', family)}
    disabled={isPending}
  />
</SettingRow>
```

Add the `FontFamilyPicker` component at the bottom of SettingsPanel.tsx (before the final export, or as a separate small component within the file):

```tsx
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { ChevronsUpDown, Check } from 'lucide-react'
import { GOOGLE_FONTS, googleFontUrl } from '@/lib/resume-builder/fonts'
import { cn } from '@/lib/utils'

function FontFamilyPicker({ value, onSelect, disabled }: { value: string; onSelect: (v: string) => void; disabled: boolean }) {
  const [open, setOpen] = useState(false)

  const categories = ['sans-serif', 'serif', 'monospace'] as const

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} disabled={disabled} className="h-9 w-full justify-between">
          <span style={{ fontFamily: `"${value}", sans-serif` }}>{value}</span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search fonts..." />
          <CommandList>
            <CommandEmpty>No font found.</CommandEmpty>
            {categories.map((cat) => (
              <CommandGroup key={cat} heading={cat.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}>
                {GOOGLE_FONTS.filter((f) => f.category === cat).map((f) => (
                  <CommandItem
                    key={f.family}
                    value={f.family}
                    onSelect={() => { onSelect(f.family); setOpen(false) }}
                  >
                    <Check className={cn('mr-2 h-3.5 w-3.5', value === f.family ? 'opacity-100' : 'opacity-0')} />
                    <link rel="stylesheet" href={googleFontUrl(f.family)} />
                    <span style={{ fontFamily: `"${f.family}", ${cat}` }}>{f.family}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

**Step 4: Remove the old fontOptions array** (lines 34-41 in SettingsPanel.tsx) — no longer needed.

**Step 5: Commit**

```bash
git add src/lib/resume-builder/fonts.ts src/components/resume-builder/editor/SettingsPanel.tsx src/types/resume-builder.ts
git commit -m "feat(resume-editor): add Google Fonts searchable picker with 45+ fonts"
```

---

### Task 7: Wire Google Fonts into preview and PDF

**Files:**
- Modify: `src/components/resume-builder/templates/shared.tsx`
- Modify: `src/components/resume-builder/templates/ResumePreviewPane.tsx`
- Modify: `src/lib/resume-builder/pdf/generate-html.ts`

**Step 1: Update FONT_MAP in shared.tsx**

Replace the static `FONT_MAP` and `getTemplateStyles` to use the new fonts module:

```tsx
import { findFont, fontFamilyCss } from '@/lib/resume-builder/fonts'

// Keep legacy FONT_MAP for backwards compatibility with old enum values
const LEGACY_FONT_MAP: Record<string, string> = {
  inter: '"Inter", sans-serif',
  source_sans: '"Source Sans 3", sans-serif',
  lato: '"Lato", sans-serif',
  georgia: '"Georgia", serif',
  garamond: '"EB Garamond", serif',
  source_code: '"Source Code Pro", monospace',
}

function resolveFontFamily(value: string): string {
  // Check legacy enum values first
  if (LEGACY_FONT_MAP[value]) return LEGACY_FONT_MAP[value]
  // Otherwise treat as a Google Font family name
  const font = findFont(value)
  return font ? fontFamilyCss(font.family, font.category) : fontFamilyCss(value)
}
```

Update `getTemplateStyles` to use `resolveFontFamily`:

```tsx
const font = resolveFontFamily(settings?.font_family ?? 'Inter')
```

**Step 2: Load Google Font in ResumePreviewPane**

In `ResumePreviewPane.tsx`, add a `<link>` to load the selected font. After the TemplateComponent render (inside the paper div wrapper):

```tsx
import { googleFontUrl, findFont } from '@/lib/resume-builder/fonts'

// Inside the component, before the return:
const fontFamily = resume.settings?.font_family ?? 'Inter'
const fontUrl = googleFontUrl(fontFamily)
```

Add inside the return, before the paper div:

```tsx
<link rel="stylesheet" href={fontUrl} />
```

**Step 3: Update generate-html.ts for Google Fonts**

In `generate-html.ts`, add a Google Fonts `@import` at the top of the `<style>` block. After line 43, add:

```ts
import { findFont, fontFamilyCss, googleFontUrl } from '@/lib/resume-builder/fonts'

// Resolve font family (support both legacy enum values and Google Font names)
const LEGACY_FONT_MAP: Record<string, string> = {
  inter: '"Inter", sans-serif',
  source_sans: '"Source Sans 3", sans-serif',
  lato: '"Lato", sans-serif',
  georgia: '"Georgia", serif',
  garamond: '"EB Garamond", serif',
  source_code: '"Source Code Pro", monospace',
}

const fontValue = resume.settings?.font_family ?? 'Inter'
const fontFamily = LEGACY_FONT_MAP[fontValue] ?? (() => {
  const f = findFont(fontValue)
  return f ? fontFamilyCss(f.family, f.category) : fontFamilyCss(fontValue)
})()
const fontImportUrl = googleFontUrl(fontValue)
```

Then in the `<style>` block, add at the very top:

```ts
@import url('${fontImportUrl}');
```

**Step 4: Test**

- Change font in settings panel to a Google Font (e.g., "Playfair Display")
- Verify preview renders in the selected font
- Download PDF and verify it also uses the selected font
- Test with a legacy value (e.g., existing resumes with `font_family: 'inter'`)

**Step 5: Commit**

```bash
git add src/components/resume-builder/templates/shared.tsx src/components/resume-builder/templates/ResumePreviewPane.tsx src/lib/resume-builder/pdf/generate-html.ts
git commit -m "feat(resume-editor): wire Google Fonts into preview and PDF rendering"
```

---

### Task 8: Multi-page preview with page break indicators

**Files:**
- Modify: `src/components/resume-builder/templates/ResumePreviewPane.tsx`

**Step 1: Replace the preview pane with page-break-aware version**

Rewrite `ResumePreviewPane.tsx`:

```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PragmaticTemplate } from './PragmaticTemplate'
import { MonoTemplate } from './MonoTemplate'
import { SmarkdownTemplate } from './SmarkdownTemplate'
import { CareerCupTemplate } from './CareerCupTemplate'
import { ParkerTemplate } from './ParkerTemplate'
import { ExperiencedTemplate } from './ExperiencedTemplate'
import { googleFontUrl } from '@/lib/resume-builder/fonts'
import type { ResumeWithRelations } from '@/types/resume-builder'

interface Props {
  resume: ResumeWithRelations
}

const templateMap: Record<string, React.ComponentType<{ resume: ResumeWithRelations }>> = {
  'a1b2c3d4-0001-4000-8000-000000000001': PragmaticTemplate,
  'a1b2c3d4-0002-4000-8000-000000000002': MonoTemplate,
  'a1b2c3d4-0003-4000-8000-000000000003': SmarkdownTemplate,
  'a1b2c3d4-0004-4000-8000-000000000004': CareerCupTemplate,
  'a1b2c3d4-0005-4000-8000-000000000005': ParkerTemplate,
  'a1b2c3d4-0006-4000-8000-000000000006': ExperiencedTemplate,
}

const ZOOM_LEVELS = [0.4, 0.5, 0.6, 0.75, 0.85, 1.0]
const DEFAULT_ZOOM_INDEX = 2
const PAGE_HEIGHT_IN = 11 // US Letter height in inches
const PAGE_GAP_PX = 16

export function ResumePreviewPane({ resume }: Props) {
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX)
  const zoom = ZOOM_LEVELS[zoomIndex]
  const paperRef = useRef<HTMLDivElement>(null)
  const [pageCount, setPageCount] = useState(1)

  const TemplateComponent =
    templateMap[resume.template_id ?? ''] ?? PragmaticTemplate

  const fontFamily = resume.settings?.font_family ?? 'Inter'
  const fontUrl = googleFontUrl(fontFamily)

  // Measure content height and calculate page count
  useEffect(() => {
    if (!paperRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const heightPx = entry.contentRect.height
        // 1in = 96px in CSS
        const pages = Math.max(1, Math.ceil(heightPx / (PAGE_HEIGHT_IN * 96)))
        setPageCount(pages)
      }
    })
    observer.observe(paperRef.current)
    return () => observer.disconnect()
  }, [])

  // Calculate total height including gaps between pages
  const totalGapPx = (pageCount - 1) * PAGE_GAP_PX

  return (
    <div className="relative h-full">
      <link rel="stylesheet" href={fontUrl} />
      <ScrollArea className="h-full">
        <div className="flex justify-center p-6">
          <div
            style={{
              width: `${8.5 * zoom}in`,
              position: 'relative',
            }}
          >
            {/* Scaled paper */}
            <div
              ref={paperRef}
              className="origin-top bg-white shadow-lg"
              style={{
                width: '8.5in',
                minHeight: `${PAGE_HEIGHT_IN}in`,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
              }}
            >
              <TemplateComponent resume={resume} />
            </div>

            {/* Page break indicators (overlaid) */}
            {Array.from({ length: pageCount - 1 }, (_, i) => {
              const topPx = (i + 1) * PAGE_HEIGHT_IN * 96 * zoom
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    top: `${topPx}px`,
                    left: 0,
                    right: 0,
                    height: `${PAGE_GAP_PX}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: 0,
                      right: 0,
                      borderTop: '1.5px dashed #d1d5db',
                    }}
                  />
                  <span
                    className="relative rounded bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  >
                    Page {i + 2}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </ScrollArea>

      {/* Page count indicator */}
      {pageCount > 1 && (
        <div className="bg-background/90 absolute top-3 right-3 rounded-md border px-2 py-1 text-xs font-medium shadow-sm backdrop-blur-sm">
          {pageCount} pages
        </div>
      )}

      {/* Zoom Controls */}
      <div className="bg-background/90 absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg border px-2 py-1 shadow-md backdrop-blur-sm">
        <Button variant="ghost" size="icon" className="h-7 w-7"
          onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
          disabled={zoomIndex === 0} aria-label="Zoom out">
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <span className="min-w-[3rem] text-center text-xs font-medium tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7"
          onClick={() => setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
          disabled={zoomIndex === ZOOM_LEVELS.length - 1} aria-label="Zoom in">
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <div className="bg-border mx-1 h-4 w-px" />
        <Button variant="ghost" size="icon" className="h-7 w-7"
          onClick={() => setZoomIndex(DEFAULT_ZOOM_INDEX)}
          disabled={zoomIndex === DEFAULT_ZOOM_INDEX} aria-label="Reset zoom">
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
```

Key changes from original:
- Added `ResizeObserver` to measure content height and calculate page count
- Changed `transformOrigin` from `'top center'` to `'top left'` with a wrapper div that handles centering via `width: 8.5 * zoom`
- Overlay page break indicator divs at each `PAGE_HEIGHT_IN * 96 * zoom` interval
- Added page count badge in top-right when content exceeds 1 page
- Removed `minHeight: '11in'` cap — content flows naturally

**Step 2: Test multi-page**

- Open a resume with lots of content (or use "spacious" density to force overflow)
- Verify dashed page break line appears at the 11in mark
- Verify "Page 2" label shows in the gap
- Verify page count badge appears (e.g., "2 pages")
- Test at different zoom levels — breaks should stay aligned
- Verify single-page resumes show no break indicators

**Step 3: Commit**

```bash
git add src/components/resume-builder/templates/ResumePreviewPane.tsx
git commit -m "feat(resume-editor): add multi-page preview with page break indicators"
```

---

### Task 9: Final integration test and cleanup

**Step 1: Full integration test**

Test all features together:
1. Open `/admin/resume-builder/<id>/edit`
2. Drag the resize handle between editor and preview — verify smooth resizing
3. Open Settings → change Font Family to a Google Font → verify preview updates
4. Adjust Font Size slider → verify text scales in preview
5. Switch to "spacious" density + large font → verify multi-page break lines appear
6. Download PDF → verify font, size, and page breaks match preview
7. Refresh page → verify panel size persists (localStorage)
8. Test on mobile viewport → verify Sheet preview still works

**Step 2: Final commit**

If any cleanup needed, commit with:
```bash
git commit -m "fix(resume-editor): polish editor enhancement integration"
```
