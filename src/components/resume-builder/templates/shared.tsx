import type { ResumeWithRelations, DateFormat } from '@/types/resume-builder'
import { findFont, fontFamilyCss } from '@/lib/resume-builder/fonts'

export function formatResumeDate(
  dateStr: string | null | undefined,
  format: DateFormat = 'month_year'
): string {
  if (!dateStr) return 'Present'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr

  switch (format) {
    case 'full':
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    case 'month_year':
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    case 'year_only':
      return date.getFullYear().toString()
    default:
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }
}

export function getDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  format: DateFormat = 'month_year'
): string {
  return `${formatResumeDate(startDate, format)} – ${formatResumeDate(endDate, format)}`
}

export function visibleExperiences(resume: ResumeWithRelations) {
  return resume.work_experiences.filter((exp) => exp.is_visible !== false)
}

export function getVisibleSections(resume: ResumeWithRelations): string[] {
  const order = resume.settings?.section_order ?? [
    'contact', 'summary', 'experience', 'skills', 'projects',
    'education', 'certifications', 'extracurriculars',
  ]
  const hidden = new Set(resume.settings?.hidden_sections ?? [])
  return order.filter((s) => !hidden.has(s))
}

export function getContactLinks(resume: ResumeWithRelations) {
  const ci = resume.contact_info
  if (!ci) return []
  const links: { label: string; url: string }[] = []
  if (ci.linkedin_url) links.push({ label: 'LinkedIn', url: ci.linkedin_url })
  if (ci.github_url) links.push({ label: 'GitHub', url: ci.github_url })
  if (ci.portfolio_url) links.push({ label: 'Portfolio', url: ci.portfolio_url })
  // blog_url kept in DB for backwards compat but no longer shown
  return links
}

const LEGACY_FONT_MAP: Record<string, string> = {
  inter: '"Inter", sans-serif',
  source_sans: '"Source Sans 3", sans-serif',
  lato: '"Lato", sans-serif',
  georgia: '"Georgia", serif',
  garamond: '"EB Garamond", serif',
  source_code: '"Source Code Pro", monospace',
}

// Keep export for backwards compatibility
export const FONT_MAP = LEGACY_FONT_MAP

function resolveFontFamily(value: string): string {
  if (LEGACY_FONT_MAP[value]) return LEGACY_FONT_MAP[value]
  const font = findFont(value)
  return font ? fontFamilyCss(font.family, font.category) : fontFamilyCss(value)
}

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

export const DENSITY_MAP: Record<string, { body: string; heading: string; section: string; lineHeight: string; sectionGap: string }> = {
  compact:     { body: '9px',  heading: '11px', section: '13px', lineHeight: '1.3', sectionGap: '8px' },
  comfortable: { body: '10px', heading: '12px', section: '14px', lineHeight: '1.4', sectionGap: '12px' },
  spacious:    { body: '11px', heading: '13px', section: '15px', lineHeight: '1.5', sectionGap: '16px' },
}

// ===== Color utilities =====

/** Parse hex to RGB tuple */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** RGB to hex */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
}

/** WCAG relative luminance */
function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/** WCAG contrast ratio between two hex colors (1:1 to 21:1) */
export function getContrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(hexToRgb(fg))
  const l2 = relativeLuminance(hexToRgb(bg))
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Pick optimal text color for a given background */
export function getContrastTextColor(bgHex: string): string {
  const lum = relativeLuminance(hexToRgb(bgHex))
  return lum > 0.179 ? '#111827' : '#ffffff'
}

/** Blend a color toward a target at given ratio (0-1) */
function blendColors(fg: string, bg: string, ratio: number): string {
  const [r1, g1, b1] = hexToRgb(fg)
  const [r2, g2, b2] = hexToRgb(bg)
  return rgbToHex(
    r1 + (r2 - r1) * ratio,
    g1 + (g2 - g1) * ratio,
    b1 + (b2 - b1) * ratio,
  )
}

/** Derive 3-tier sidebar color palette from primary text color + background */
export function deriveSidebarColors(primaryText: string, bgHex: string) {
  return {
    primary: primaryText,
    secondary: blendColors(primaryText, bgHex, 0.15),
    muted: blendColors(primaryText, bgHex, 0.4),
  }
}

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
    sidebar_text_color?: string
  } | null | undefined,
  templateId?: string,
) {
  const accent = settings?.accent_color || '#000000'
  const background = settings?.background_color || '#374151'
  const font = resolveFontFamily(settings?.font_family ?? 'Inter')
  const baseDensity = DENSITY_MAP[settings?.font_size_preset ?? 'comfortable'] ?? DENSITY_MAP.comfortable

  // Resolve margin from MARGIN_PRESETS using templateId + page_margin setting
  const tid = templateId ?? TEMPLATE_IDS.pragmatic
  const presetKey = settings?.page_margin ?? 'normal'
  const templatePresets = MARGIN_PRESETS[tid] ?? MARGIN_PRESETS[TEMPLATE_IDS.pragmatic]
  const margin = templatePresets[presetKey] ?? templatePresets.normal

  // Resolve name font size from settings or template default
  const nameSize = settings?.name_font_size ?? DEFAULT_NAME_SIZES[tid] ?? 28

  // Resolve section title uppercase from settings or template default
  const uppercase = settings?.section_title_uppercase ?? DEFAULT_UPPERCASE[tid] ?? true

  // Resolve right panel color from settings or default
  const rightPanelColor = settings?.right_panel_color ?? '#f9fafb'

  // Resolve sidebar text colors (auto-computed or user override)
  const sidebarTextColor = settings?.sidebar_text_color ?? getContrastTextColor(background)
  const sidebarColors = deriveSidebarColors(sidebarTextColor, background)

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
    return { accent, background, font, density, margin, nameSize, uppercase, rightPanelColor, sidebarTextColor, sidebarColors }
  }

  return { accent, background, font, density: baseDensity, margin, nameSize, uppercase, rightPanelColor, sidebarTextColor, sidebarColors }
}
