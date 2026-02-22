import type { ResumeWithRelations, DateFormat } from '@/types/resume-builder'

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
  if (ci.blog_url) links.push({ label: 'Blog', url: ci.blog_url })
  return links
}

export const FONT_MAP: Record<string, string> = {
  inter: '"Inter", system-ui, sans-serif',
  source_sans: '"Source Sans 3", sans-serif',
  lato: '"Lato", sans-serif',
  georgia: '"Georgia", serif',
  garamond: '"EB Garamond", serif',
  source_code: '"Source Code Pro", monospace',
}

export const DENSITY_MAP: Record<string, { body: string; heading: string; section: string; lineHeight: string; sectionGap: string }> = {
  compact:     { body: '9px',  heading: '11px', section: '13px', lineHeight: '1.3', sectionGap: '8px' },
  comfortable: { body: '10px', heading: '12px', section: '14px', lineHeight: '1.4', sectionGap: '12px' },
  spacious:    { body: '11px', heading: '13px', section: '15px', lineHeight: '1.5', sectionGap: '16px' },
}

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
