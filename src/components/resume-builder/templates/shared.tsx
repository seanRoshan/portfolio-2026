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
