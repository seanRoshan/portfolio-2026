# Settings Panel Redesign — Template-Aware Customization

## Context

The Resume Settings panel currently shows all settings for all templates, even when some settings (like Background Color) have no effect on single-column templates. Users also lack control over common visual properties like page margins, name font size, and section title casing.

## Design

### 1. Conditional Settings Visibility

Pass `templateId` to `SettingsPanel`. A capabilities map determines which settings appear:

```
TEMPLATE_CAPABILITIES = {
  pragmatic:   { background: false, rightPanelColor: false },
  mono:        { background: false, rightPanelColor: false },
  smarkdown:   { background: false, rightPanelColor: false },
  careercup:   { background: false, rightPanelColor: false },
  parker:      { background: true,  rightPanelColor: true },
  experienced: { background: true,  rightPanelColor: false },
}
```

- **Background Color** — only Parker & Experienced (two-column templates)
- **Right Panel Color** — Parker only (its main column background)
- All other settings (accent, font, density, date format, page limit, sections, AI prompts) shown for all templates

### 2. New Template-Specific Settings

| Setting | Type | Default | Shown for | UI |
|---------|------|---------|-----------|-----|
| `page_margin` | `'compact' \| 'normal' \| 'wide'` | `'normal'` | All | Select |
| `name_font_size` | `number` (18–36) | null (template default) | All | Slider |
| `section_title_uppercase` | `boolean` | null (template default) | All | Switch |
| `right_panel_color` | `string` (hex) | `'#f9fafb'` | Parker | Color picker |

Margin presets per template:

| Template | compact | normal | wide |
|----------|---------|--------|------|
| Pragmatic | 0.6in | 0.8in (was 1in) | 1in |
| Mono | 0.5in | 0.65in (was 0.8in) | 0.8in |
| Smarkdown | 0.6in | 0.8in (was 1in) | 1in |
| CareerCup | 0.4in | 0.6in | 0.8in |
| Parker | sidebar: auto-scale | default paddings | wider paddings |
| Experienced | header/cols: auto-scale | default paddings | wider paddings |

### 3. Parker Sidebar Color Cleanup

Consolidate 4 text tiers to 3 consistent tiers:
- **Primary** (`#fff`): headings, degree, cert names, activity titles
- **Secondary** (`#d1d5db`): field of study, skill list, descriptions (was `#e5e7eb` for skills)
- **Muted** (`#9ca3af`): institution, dates, GPA, honors

### 4. Settings Panel Visual Polish

- Tighter spacing between setting rows
- Better section header visual hierarchy
- Cleaner color picker row layout

### 5. Schema Changes

New columns on `resume_settings`:

```sql
ALTER TABLE resume_settings
  ADD COLUMN page_margin text DEFAULT 'normal',
  ADD COLUMN name_font_size integer,
  ADD COLUMN section_title_uppercase boolean,
  ADD COLUMN right_panel_color text;
```

TypeScript type additions to `ResumeSettings`:

```typescript
page_margin?: 'compact' | 'normal' | 'wide'
name_font_size?: number
section_title_uppercase?: boolean
right_panel_color?: string
```

## Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/2026XXXX_settings_new_columns.sql` | Add 4 new columns |
| `src/types/resume-builder.ts` | Add new fields to ResumeSettings, add PageMargin type |
| `src/components/resume-builder/editor/SettingsPanel.tsx` | Accept templateId prop, add capabilities map, conditionally show/hide settings, add new setting controls, visual polish |
| `src/components/resume-builder/editor/ResumeEditor.tsx` | Pass templateId to SettingsPanel |
| `src/components/resume-builder/templates/shared.tsx` | Read new settings in getTemplateStyles, add margin presets map |
| `src/components/resume-builder/templates/PragmaticTemplate.tsx` | Use margin/name-size/uppercase from settings |
| `src/components/resume-builder/templates/MonoTemplate.tsx` | Same |
| `src/components/resume-builder/templates/SmarkdownTemplate.tsx` | Same |
| `src/components/resume-builder/templates/CareerCupTemplate.tsx` | Same |
| `src/components/resume-builder/templates/ParkerTemplate.tsx` | Same + right_panel_color + sidebar color cleanup |
| `src/components/resume-builder/templates/ExperiencedTemplate.tsx` | Same |
| `src/lib/resume-builder/pdf/generate-html.ts` | Ensure new settings flow through to PDF |
