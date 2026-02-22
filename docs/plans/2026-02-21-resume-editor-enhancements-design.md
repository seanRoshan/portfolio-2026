# Resume Editor Enhancements Design

**Date:** 2026-02-21
**Status:** Approved

## Overview

Enhance the resume editor at `/admin/resume-builder/[id]/edit` with a resizable preview panel, font size control, Google Fonts support, and multi-page preview with page break indicators.

## 1. Resizable Preview Panel

Replace the fixed 50/50 split in `ResumeEditor.tsx` with `react-resizable-panels`.

- Draggable vertical divider between editor and preview
- Min editor width: 30%, min preview width: 25%
- Default: 50/50
- Persist split ratio to localStorage
- Mobile behavior unchanged (Sheet-based preview)

**Files:** `ResumeEditor.tsx`
**Dependencies:** `react-resizable-panels`

## 2. Font Size Slider

Add a continuous font size scale on top of the existing density preset.

- Slider range: 8pt to 12pt (body text), step 0.5pt
- Heading and section header sizes scale proportionally from the body size
- New DB field: `font_size_base` (decimal, default 10) on `resume_settings`
- Both React templates and `generate-html.ts` consume this value
- Density preset sets base ratios; font size slider overrides the absolute body size

**Files:** `SettingsPanel.tsx`, `shared.tsx`, `generate-html.ts`, `actions.ts`
**Schema:** `ALTER TABLE resume_settings ADD COLUMN font_size_base NUMERIC DEFAULT 10`

## 3. Google Fonts Integration

Replace the 6-font dropdown with a searchable combobox from a curated list of ~50 popular Google Fonts.

- Static array of popular fonts (no API calls needed)
- Searchable combobox, each option rendered in its own font via Google Fonts CDN
- Load selected font via `<link>` tag in preview
- For PDF, inject `@import url(...)` into Puppeteer HTML
- `font_family` field changes from enum to free-text string
- No schema migration needed (`font_family` is already TEXT type)

**Files:** `SettingsPanel.tsx`, `shared.tsx`, `generate-html.ts`, `ResumePreviewPane.tsx`

## 4. Accent Color

No changes needed. Current color picker + hex input already works across all templates and PDF generation.

## 5. Multi-Page Preview with Page Break Indicators

Visualize page boundaries in the live preview.

- Remove `minHeight: 11in` cap; let content flow to natural height
- Draw dashed line at every 11-inch interval
- Add 16px gap with "Page N" label at each boundary
- Overlay positioned divs at multiples of page height
- Zoom scale factor applied to page height calculation
- PDF generation unchanged (Puppeteer `@page { size: Letter }` handles real breaks)

**Files:** `ResumePreviewPane.tsx`

## Schema Changes

| Change | Table | Details |
|--------|-------|---------|
| Add `font_size_base` | `resume_settings` | `NUMERIC DEFAULT 10` |

## Files Modified Summary

| File | Changes |
|------|---------|
| `ResumeEditor.tsx` | Resizable panel layout |
| `SettingsPanel.tsx` | Font size slider, Google Fonts combobox |
| `ResumePreviewPane.tsx` | Page break indicators, Google Font loading |
| `shared.tsx` | Font size calculation, expanded font map |
| `generate-html.ts` | Font size support, Google Font import |
| `actions.ts` | `font_size_base` in settings update |
| New migration | `font_size_base` column |

## New Dependencies

- `react-resizable-panels` (~4KB)
