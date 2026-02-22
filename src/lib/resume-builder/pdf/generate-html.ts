import type { ResumeWithRelations, DateFormat } from '@/types/resume-builder'
import { findFont, fontFamilyCss, googleFontUrl } from '@/lib/resume-builder/fonts'
import { MARGIN_PRESETS, TEMPLATE_IDS, DEFAULT_NAME_SIZES, DEFAULT_UPPERCASE, getContrastTextColor, deriveSidebarColors } from '@/components/resume-builder/templates/shared'

type Density = { body: string; heading: string; section: string; lineHeight: string; sectionGap: string }

const LEGACY_FONT_MAP: Record<string, string> = {
  inter: '"Inter", system-ui, sans-serif',
  source_sans: '"Source Sans 3", sans-serif',
  lato: '"Lato", sans-serif',
  georgia: '"Georgia", serif',
  garamond: '"EB Garamond", serif',
  source_code: '"Source Code Pro", monospace',
}

const DENSITY_MAP: Record<string, Density> = {
  compact:     { body: '9px',  heading: '11px', section: '13px', lineHeight: '1.3', sectionGap: '8px' },
  comfortable: { body: '10px', heading: '12px', section: '14px', lineHeight: '1.4', sectionGap: '12px' },
  spacious:    { body: '11px', heading: '13px', section: '15px', lineHeight: '1.5', sectionGap: '16px' },
}

function formatDate(dateStr: string | null | undefined, format: DateFormat = 'month_year'): string {
  if (!dateStr) return 'Present'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  switch (format) {
    case 'full': return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    case 'month_year': return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    case 'year_only': return date.getFullYear().toString()
    default: return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }
}

function dateRange(start: string | null | undefined, end: string | null | undefined, format: DateFormat): string {
  return `${formatDate(start, format)} – ${formatDate(end, format)}`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function generateResumePdfHtml(resume: ResumeWithRelations): string {
  const ci = resume.contact_info
  const df = resume.settings?.date_format ?? 'month_year'
  const templateId = resume.template_id ?? ''
  const fontValue = resume.settings?.font_family ?? 'Inter'
  const fontFamily = LEGACY_FONT_MAP[fontValue] ?? (() => {
    const f = findFont(fontValue)
    return f ? fontFamilyCss(f.family, f.category) : fontFamilyCss(fontValue)
  })()
  const fontImportUrl = googleFontUrl(fontValue)
  const baseDensity = DENSITY_MAP[resume.settings?.font_size_preset ?? 'comfortable'] ?? DENSITY_MAP.comfortable
  const accentColor = resume.settings?.accent_color ?? '#000000'
  const backgroundColor = resume.settings?.background_color ?? '#374151'
  const pageMargin = resume.settings?.page_margin ?? 'normal'
  const nameFontSize = resume.settings?.name_font_size
  const sectionTitleUppercase = resume.settings?.section_title_uppercase
  const rightPanelColor = resume.settings?.right_panel_color ?? '#f9fafb'

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

  const hiddenSections = new Set(resume.settings?.hidden_sections ?? [])
  const sectionOrder = (resume.settings?.section_order ?? [
    'contact', 'summary', 'experience', 'skills', 'projects',
    'education', 'certifications', 'extracurriculars',
  ]).filter((s) => !hiddenSections.has(s) && s !== 'contact')

  // Resolve new settings (BEFORE two-column checks so they can use them)
  const resolvedNameSize = nameFontSize ?? DEFAULT_NAME_SIZES[templateId] ?? 28
  const titleTransform = (sectionTitleUppercase ?? DEFAULT_UPPERCASE[templateId] ?? true) ? 'uppercase' : 'none'
  const margin = MARGIN_PRESETS[templateId]?.[pageMargin] ?? '0.8in'

  // Compute sidebar text colors for two-column templates
  const sidebarTextColor = resume.settings?.sidebar_text_color ?? getContrastTextColor(backgroundColor)
  const sidebarColors = deriveSidebarColors(sidebarTextColor, backgroundColor)

  // Route to template-specific generators
  if (templateId === TEMPLATE_IDS.parker) {
    return generateParkerHtml(resume, ci, df, accentColor, backgroundColor, fontFamily, fontImportUrl, density, sectionOrder, resolvedNameSize, titleTransform, rightPanelColor, sidebarColors, margin)
  }
  if (templateId === TEMPLATE_IDS.experienced) {
    return generateExperiencedHtml(resume, ci, df, accentColor, backgroundColor, fontFamily, fontImportUrl, density, sectionOrder, resolvedNameSize, titleTransform, margin, sidebarColors)
  }
  if (templateId === TEMPLATE_IDS.mono) {
    return generateMonoHtml(resume, ci, df, accentColor, fontFamily, fontImportUrl, density, sectionOrder, resolvedNameSize, titleTransform, margin)
  }
  if (templateId === TEMPLATE_IDS.smarkdown) {
    return generateSmarkdownHtml(resume, ci, df, accentColor, fontFamily, fontImportUrl, density, sectionOrder, resolvedNameSize, titleTransform, margin)
  }
  if (templateId === TEMPLATE_IDS.careercup) {
    return generateCareerCupHtml(resume, ci, df, accentColor, fontFamily, fontImportUrl, density, sectionOrder, resolvedNameSize, titleTransform, margin)
  }
  // Default: Pragmatic
  return generatePragmaticHtml(resume, ci, df, accentColor, fontFamily, fontImportUrl, density, sectionOrder, resolvedNameSize, titleTransform, margin)
}

function pageCss(fontImportUrl: string, fontFamily: string, density: Density, bodyColor: string = '#111827'): string {
  return `@import url('${fontImportUrl}');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: Letter; margin: 0; }
  body { font-family: ${fontFamily}; font-size: ${density.body}; line-height: ${density.lineHeight}; color: ${bodyColor}; }
  .resume-section { page-break-inside: avoid; break-inside: avoid; }
  .experience-entry { page-break-inside: avoid; break-inside: avoid; }
  h2 { page-break-after: avoid; break-after: avoid; }
  li { page-break-inside: avoid; break-inside: avoid; }
  ul { orphans: 3; widows: 3; }
  p { orphans: 3; widows: 3; }`
}

/* ======================== PRAGMATIC ======================== */
function generatePragmaticHtml(resume: ResumeWithRelations, ci: ResumeWithRelations['contact_info'], df: DateFormat, accentColor: string, fontFamily: string, fontImportUrl: string, density: Density, sectionOrder: string[], nameSize: number, titleTransform: string, margin: string): string {
  const contactLinks = [ci?.linkedin_url, ci?.github_url, ci?.portfolio_url].filter(Boolean).map((url) => {
    const display = (url as string).replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')
    return `<a href="${url}" style="color:${accentColor};text-decoration:none">${escapeHtml(display)}</a>`
  })
  const contactParts: string[] = [
    ci?.email, ci?.phone,
    (ci?.city || ci?.state || ci?.country) ? [ci?.city, ci?.state, ci?.country].filter(Boolean).join(', ') : null,
    ...contactLinks,
  ].filter(Boolean) as string[]
  const visibleExps = resume.work_experiences.filter(e => e.is_visible !== false)

  const sectionsHtml = sectionOrder.map((sid) => {
    switch (sid) {
      case 'summary':
        if (!resume.summary?.is_visible || !resume.summary?.text) return ''
        return pragmaticSection('SUMMARY', `<p style="line-height:${density.lineHeight};color:#374151;font-size:${density.body}">${escapeHtml(resume.summary.text)}</p>`, accentColor, density, titleTransform)
      case 'experience':
        if (!visibleExps.length) return ''
        return pragmaticSection('EXPERIENCE', visibleExps.map(exp => `<div class="experience-entry" style="margin-bottom:${density.sectionGap}"><div style="display:flex;justify-content:space-between;align-items:baseline"><div><strong style="font-size:${density.heading}">${escapeHtml(exp.job_title)}</strong> <span style="color:#6b7280;font-size:${density.heading}">· ${escapeHtml(exp.company)}</span></div><span style="font-size:${density.body};color:#6b7280;white-space:nowrap">${dateRange(exp.start_date, exp.end_date, df)}</span></div>${exp.location ? `<div style="font-size:${density.body};color:#9ca3af">${escapeHtml(exp.location)}</div>` : ''}${(exp.achievements?.length ?? 0) > 0 ? `<ul style="margin:4px 0 0;padding-left:18px;list-style:disc">${exp.achievements!.map(a => `<li style="font-size:${density.body};line-height:${density.lineHeight};color:#374151;margin-bottom:2px">${escapeHtml(a.text)}</li>`).join('')}</ul>` : ''}</div>`).join(''), accentColor, density, titleTransform)
      case 'education':
        if (!resume.education.length) return ''
        return pragmaticSection('EDUCATION', resume.education.map(edu => `<div class="experience-entry" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:baseline"><div><strong style="font-size:${density.heading}">${escapeHtml(edu.degree)}</strong>${edu.field_of_study ? ` <span style="color:#6b7280;font-size:${density.heading}">in ${escapeHtml(edu.field_of_study)}</span>` : ''}</div>${edu.graduation_date ? `<span style="font-size:${density.body};color:#6b7280;white-space:nowrap">${formatDate(edu.graduation_date, df)}</span>` : ''}</div><div style="font-size:${density.body};color:#6b7280">${escapeHtml(edu.institution)}</div>${edu.gpa ? `<div style="font-size:${density.body};color:#9ca3af">GPA: ${edu.gpa}</div>` : ''}${edu.honors ? `<div style="font-size:${density.body};color:#9ca3af">${escapeHtml(edu.honors)}</div>` : ''}</div>`).join(''), accentColor, density, titleTransform)
      case 'skills':
        if (!resume.skill_categories.length) return ''
        return pragmaticSection('SKILLS', resume.skill_categories.map(cat => `<div style="margin-bottom:4px;font-size:${density.body}"><span style="font-weight:600">${escapeHtml(cat.name)}: </span><span style="color:#374151">${cat.skills.map(escapeHtml).join(', ')}</span></div>`).join(''), accentColor, density, titleTransform)
      case 'projects':
        if (!resume.projects.length) return ''
        return pragmaticSection('PROJECTS', resume.projects.map(proj => `<div class="experience-entry" style="margin-bottom:8px"><div style="display:flex;align-items:baseline;gap:8px"><strong style="font-size:${density.heading}">${escapeHtml(proj.name)}</strong>${proj.project_url ? `<a href="${proj.project_url}" style="font-size:9px;color:${accentColor};text-decoration:none">${escapeHtml(proj.project_url.replace(/https?:\/\//, ''))}</a>` : ''}</div>${proj.description ? `<div style="font-size:${density.body};color:#374151;margin-top:2px">${escapeHtml(proj.description)}</div>` : ''}${(proj.achievements?.length ?? 0) > 0 ? `<ul style="margin:4px 0 0;padding-left:18px;list-style:disc">${proj.achievements!.map(a => `<li style="font-size:${density.body};line-height:${density.lineHeight};color:#374151;margin-bottom:2px">${escapeHtml(a.text)}</li>`).join('')}</ul>` : ''}</div>`).join(''), accentColor, density, titleTransform)
      case 'certifications':
        if (!resume.certifications.length) return ''
        return pragmaticSection('CERTIFICATIONS', resume.certifications.map(cert => `<div class="experience-entry" style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:${density.body}"><span><span style="font-weight:600">${escapeHtml(cert.name)}</span>${cert.issuer ? ` <span style="color:#6b7280">– ${escapeHtml(cert.issuer)}</span>` : ''}</span>${cert.date ? `<span style="color:#6b7280;font-size:${density.body}">${formatDate(cert.date, df)}</span>` : ''}</div>`).join(''), accentColor, density, titleTransform)
      case 'extracurriculars':
        if (!resume.extracurriculars.length) return ''
        return pragmaticSection('ACTIVITIES', resume.extracurriculars.map(item => `<div style="margin-bottom:4px;font-size:${density.body}"><span style="font-weight:600">${escapeHtml(item.title)}</span>${item.description ? ` <span style="color:#6b7280">– ${escapeHtml(item.description)}</span>` : ''}</div>`).join(''), accentColor, density, titleTransform)
      default: return ''
    }
  }).join('')

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${pageCss(fontImportUrl, fontFamily, density)}</style></head><body>
<div style="padding:${margin}">
  <div style="margin-bottom:${density.sectionGap}">
    <h1 style="font-size:${nameSize}px;font-weight:700;margin:0;letter-spacing:-0.5px">${escapeHtml(ci?.full_name || 'Your Name')}</h1>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;font-size:${density.body};color:#6b7280">${contactParts.map((p, i) => `${i > 0 ? '<span>·</span> ' : ''}${p.startsWith('<a') ? p : `<span>${escapeHtml(p)}</span>`}`).join(' ')}</div>
    <hr style="border:none;border-top:1px solid #d1d5db;margin-top:12px" />
  </div>
  ${sectionsHtml}
</div></body></html>`
}

function pragmaticSection(title: string, content: string, accent: string, density: Density, titleTransform: string): string {
  return `<div class="resume-section" style="margin-bottom:${density.sectionGap}"><h2 style="font-size:${density.section};font-weight:700;text-transform:${titleTransform};letter-spacing:1px;margin-bottom:8px;color:${accent}">${title}</h2>${content}</div>`
}

/* ======================== MONO ======================== */
function generateMonoHtml(resume: ResumeWithRelations, ci: ResumeWithRelations['contact_info'], df: DateFormat, accentColor: string, fontFamily: string, fontImportUrl: string, density: Density, sectionOrder: string[], nameSize: number, titleTransform: string, margin: string): string {
  const contactLinks = [ci?.linkedin_url, ci?.github_url, ci?.portfolio_url].filter(Boolean).map((url) => {
    const display = (url as string).replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')
    return `<a href="${url}" style="color:${accentColor};text-decoration:none">${escapeHtml(display)}</a>`
  })
  const contactParts: string[] = [
    ci?.email, ci?.phone,
    (ci?.city || ci?.state || ci?.country) ? [ci?.city, ci?.state, ci?.country].filter(Boolean).join(', ') : null,
    ...contactLinks,
  ].filter(Boolean) as string[]
  const visibleExps = resume.work_experiences.filter(e => e.is_visible !== false)
  const dashLine = '─'.repeat(80)

  const sectionsHtml = sectionOrder.map((sid) => {
    switch (sid) {
      case 'summary':
        if (!resume.summary?.is_visible || !resume.summary?.text) return ''
        return monoSection('SUMMARY', `<p style="line-height:${density.lineHeight};color:#000;margin:0;font-size:${density.body}">${escapeHtml(resume.summary.text)}</p>`, accentColor, density, titleTransform)
      case 'experience':
        if (!visibleExps.length) return ''
        return monoSection('EXPERIENCE', visibleExps.map(exp => `<div class="experience-entry" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:baseline"><div><strong style="font-size:${density.heading}">${escapeHtml(exp.job_title)}</strong> <span style="color:#000;font-size:${density.heading}">| ${escapeHtml(exp.company)}</span></div><span style="font-size:${density.body};color:#000;white-space:nowrap">${dateRange(exp.start_date, exp.end_date, df)}</span></div>${exp.location ? `<div style="font-size:${density.body};color:#555">${escapeHtml(exp.location)}</div>` : ''}${(exp.achievements?.length ?? 0) > 0 ? `<ul style="margin:3px 0 0;padding-left:16px;list-style-type:'- '">${exp.achievements!.map(a => `<li style="font-size:${density.body};line-height:${density.lineHeight};color:#000;margin-bottom:1px">${escapeHtml(a.text)}</li>`).join('')}</ul>` : ''}</div>`).join(''), accentColor, density, titleTransform)
      case 'education':
        if (!resume.education.length) return ''
        return monoSection('EDUCATION', resume.education.map(edu => `<div class="experience-entry" style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;align-items:baseline"><div><strong style="font-size:${density.heading}">${escapeHtml(edu.degree)}</strong>${edu.field_of_study ? ` <span style="font-size:${density.heading}">in ${escapeHtml(edu.field_of_study)}</span>` : ''}</div>${edu.graduation_date ? `<span style="font-size:${density.body};color:#000;white-space:nowrap">${formatDate(edu.graduation_date, df)}</span>` : ''}</div><div style="font-size:${density.body};color:#555">${escapeHtml(edu.institution)}</div>${edu.gpa ? `<div style="font-size:${density.body};color:#555">GPA: ${edu.gpa}</div>` : ''}${edu.honors ? `<div style="font-size:${density.body};color:#555">${escapeHtml(edu.honors)}</div>` : ''}</div>`).join(''), accentColor, density, titleTransform)
      case 'skills':
        if (!resume.skill_categories.length) return ''
        return monoSection('SKILLS', resume.skill_categories.map(cat => `<div style="margin-bottom:3px;font-size:${density.body}"><strong>${escapeHtml(cat.name)}: </strong><span>${cat.skills.map(escapeHtml).join(', ')}</span></div>`).join(''), accentColor, density, titleTransform)
      case 'projects':
        if (!resume.projects.length) return ''
        return monoSection('PROJECTS', resume.projects.map(proj => `<div class="experience-entry" style="margin-bottom:6px"><div style="display:flex;align-items:baseline;gap:8px"><strong style="font-size:${density.heading}">${escapeHtml(proj.name)}</strong>${proj.project_url ? `<a href="${proj.project_url}" style="font-size:9px;color:${accentColor};text-decoration:none">${escapeHtml(proj.project_url.replace(/https?:\/\//, ''))}</a>` : ''}</div>${proj.description ? `<div style="font-size:${density.body};color:#000;margin-top:1px">${escapeHtml(proj.description)}</div>` : ''}${(proj.achievements?.length ?? 0) > 0 ? `<ul style="margin:3px 0 0;padding-left:16px;list-style-type:'- '">${proj.achievements!.map(a => `<li style="font-size:${density.body};line-height:${density.lineHeight};color:#000;margin-bottom:1px">${escapeHtml(a.text)}</li>`).join('')}</ul>` : ''}</div>`).join(''), accentColor, density, titleTransform)
      case 'certifications':
        if (!resume.certifications.length) return ''
        return monoSection('CERTIFICATIONS', resume.certifications.map(cert => `<div class="experience-entry" style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:${density.body}"><span><strong>${escapeHtml(cert.name)}</strong>${cert.issuer ? ` <span style="color:#555">-- ${escapeHtml(cert.issuer)}</span>` : ''}</span>${cert.date ? `<span style="font-size:${density.body}">${formatDate(cert.date, df)}</span>` : ''}</div>`).join(''), accentColor, density, titleTransform)
      case 'extracurriculars':
        if (!resume.extracurriculars.length) return ''
        return monoSection('ACTIVITIES', resume.extracurriculars.map(item => `<div style="margin-bottom:3px;font-size:${density.body}"><strong>${escapeHtml(item.title)}</strong>${item.description ? ` <span style="color:#555">-- ${escapeHtml(item.description)}</span>` : ''}</div>`).join(''), accentColor, density, titleTransform)
      default: return ''
    }
  }).join('')

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${pageCss(fontImportUrl, fontFamily, density, '#000')}</style></head><body>
<div style="padding:${margin}">
  <div style="margin-bottom:${density.sectionGap}">
    <div style="font-size:${nameSize}px;font-weight:700;letter-spacing:-0.5px">${escapeHtml(ci?.full_name || 'Your Name')}</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;font-size:${density.body};color:#555">${contactParts.map((p, i) => `${i > 0 ? '<span>|</span> ' : ''}${p.startsWith('<a') ? p : `<span>${escapeHtml(p)}</span>`}`).join(' ')}</div>
    <div style="margin-top:8px;font-size:${density.body};color:${accentColor};letter-spacing:0.5px">${dashLine}</div>
  </div>
  ${sectionsHtml}
</div></body></html>`
}

function monoSection(title: string, content: string, accent: string, density: Density, titleTransform: string): string {
  const dashLine = '─'.repeat(80)
  return `<div class="resume-section" style="margin-bottom:${density.sectionGap}"><div style="margin-bottom:4px"><span style="font-size:${density.section};font-weight:700;text-transform:${titleTransform};letter-spacing:1px;color:${accent}">${title}</span><div style="font-size:9.5px;color:${accent};letter-spacing:0.5px;margin-top:1px">${dashLine}</div></div>${content}</div>`
}

/* ======================== SMARKDOWN ======================== */
function generateSmarkdownHtml(resume: ResumeWithRelations, ci: ResumeWithRelations['contact_info'], df: DateFormat, accentColor: string, fontFamily: string, fontImportUrl: string, density: Density, sectionOrder: string[], nameSize: number, titleTransform: string, margin: string): string {
  const contactLinks = [ci?.linkedin_url, ci?.github_url, ci?.portfolio_url].filter(Boolean).map((url) => {
    const display = (url as string).replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')
    return `<a href="${url}" style="color:${accentColor};text-decoration:none">${escapeHtml(display)}</a>`
  })
  const contactParts: string[] = [
    ci?.email ? `<a href="mailto:${escapeHtml(ci.email)}" style="color:${accentColor};text-decoration:none">${escapeHtml(ci.email)}</a>` : null,
    ci?.phone, (ci?.city || ci?.state || ci?.country) ? [ci?.city, ci?.state, ci?.country].filter(Boolean).join(', ') : null,
    ...contactLinks,
  ].filter(Boolean) as string[]
  const visibleExps = resume.work_experiences.filter(e => e.is_visible !== false)

  const sectionsHtml = sectionOrder.map((sid) => {
    switch (sid) {
      case 'summary':
        if (!resume.summary?.is_visible || !resume.summary?.text) return ''
        return smarkdownSection('Summary', `<p style="line-height:${density.lineHeight};color:#333;margin:0;font-size:${density.body}">${escapeHtml(resume.summary.text)}</p>`, accentColor, density, titleTransform)
      case 'experience':
        if (!visibleExps.length) return ''
        return smarkdownSection('Experience', visibleExps.map(exp => `<div class="experience-entry" style="margin-bottom:${density.sectionGap}"><div style="display:flex;justify-content:space-between;align-items:baseline"><div><strong style="font-size:${density.heading}">${escapeHtml(exp.job_title)}</strong> <span style="color:#555;font-size:${density.heading}">at ${escapeHtml(exp.company)}</span></div><span style="font-size:${density.body};color:#777;white-space:nowrap;font-style:italic">${dateRange(exp.start_date, exp.end_date, df)}</span></div>${exp.location ? `<div style="font-size:${density.body};color:#999">${escapeHtml(exp.location)}</div>` : ''}${(exp.achievements?.length ?? 0) > 0 ? `<ul style="margin:4px 0 0;padding-left:20px;list-style:disc">${exp.achievements!.map(a => `<li style="font-size:${density.body};line-height:${density.lineHeight};color:#333;margin-bottom:2px">${escapeHtml(a.text)}</li>`).join('')}</ul>` : ''}</div>`).join(''), accentColor, density, titleTransform)
      case 'education':
        if (!resume.education.length) return ''
        return smarkdownSection('Education', resume.education.map(edu => `<div class="experience-entry" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:baseline"><div><strong style="font-size:${density.heading}">${escapeHtml(edu.degree)}</strong>${edu.field_of_study ? ` <span style="color:#555;font-size:${density.heading}">in ${escapeHtml(edu.field_of_study)}</span>` : ''}</div>${edu.graduation_date ? `<span style="font-size:${density.body};color:#777;white-space:nowrap;font-style:italic">${formatDate(edu.graduation_date, df)}</span>` : ''}</div><div style="font-size:${density.body};color:#555">${escapeHtml(edu.institution)}</div>${edu.gpa ? `<div style="font-size:${density.body};color:#999">GPA: ${edu.gpa}</div>` : ''}${edu.honors ? `<div style="font-size:${density.body};color:#999">${escapeHtml(edu.honors)}</div>` : ''}</div>`).join(''), accentColor, density, titleTransform)
      case 'skills':
        if (!resume.skill_categories.length) return ''
        return smarkdownSection('Skills', resume.skill_categories.map(cat => `<div style="margin-bottom:4px;font-size:${density.body}"><strong>${escapeHtml(cat.name)}: </strong><span style="color:#333">${cat.skills.map(escapeHtml).join(', ')}</span></div>`).join(''), accentColor, density, titleTransform)
      case 'projects':
        if (!resume.projects.length) return ''
        return smarkdownSection('Projects', resume.projects.map(proj => `<div class="experience-entry" style="margin-bottom:8px"><div style="display:flex;align-items:baseline;gap:8px"><strong style="font-size:${density.heading}">${escapeHtml(proj.name)}</strong>${proj.project_url ? `<a href="${proj.project_url}" style="font-size:9.5px;color:${accentColor};text-decoration:none">[${escapeHtml(proj.project_url.replace(/https?:\/\//, ''))}]</a>` : ''}</div>${proj.description ? `<div style="font-size:${density.body};color:#333;margin-top:2px">${escapeHtml(proj.description)}</div>` : ''}${(proj.achievements?.length ?? 0) > 0 ? `<ul style="margin:4px 0 0;padding-left:20px;list-style:disc">${proj.achievements!.map(a => `<li style="font-size:${density.body};line-height:${density.lineHeight};color:#333;margin-bottom:2px">${escapeHtml(a.text)}</li>`).join('')}</ul>` : ''}</div>`).join(''), accentColor, density, titleTransform)
      case 'certifications':
        if (!resume.certifications.length) return ''
        return smarkdownSection('Certifications', resume.certifications.map(cert => `<div class="experience-entry" style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:${density.body}"><span><strong>${escapeHtml(cert.name)}</strong>${cert.issuer ? ` <span style="color:#555">- ${escapeHtml(cert.issuer)}</span>` : ''}</span>${cert.date ? `<span style="color:#777;font-size:${density.body};font-style:italic">${formatDate(cert.date, df)}</span>` : ''}</div>`).join(''), accentColor, density, titleTransform)
      case 'extracurriculars':
        if (!resume.extracurriculars.length) return ''
        return smarkdownSection('Activities', resume.extracurriculars.map(item => `<div style="margin-bottom:4px;font-size:${density.body}"><strong>${escapeHtml(item.title)}</strong>${item.description ? ` <span style="color:#555">- ${escapeHtml(item.description)}</span>` : ''}</div>`).join(''), accentColor, density, titleTransform)
      default: return ''
    }
  }).join('')

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${pageCss(fontImportUrl, fontFamily, density, '#222')}</style></head><body>
<div style="padding:${margin}">
  <div style="margin-bottom:${density.sectionGap}">
    <h1 style="font-size:${nameSize}px;font-weight:700;margin:0;padding-bottom:6px;border-bottom:3px solid ${accentColor};display:inline-block">${escapeHtml(ci?.full_name || 'Your Name')}</h1>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;font-size:${density.body};color:#555">${contactParts.map((p, i) => `${i > 0 ? '<span>|</span> ' : ''}${p.startsWith('<a') ? p : `<span>${escapeHtml(p)}</span>`}`).join(' ')}</div>
  </div>
  ${sectionsHtml}
</div></body></html>`
}

function smarkdownSection(title: string, content: string, accent: string, density: Density, titleTransform: string): string {
  return `<div class="resume-section" style="margin-bottom:${density.sectionGap}"><h2 style="font-size:${density.section};font-weight:700;margin-bottom:8px;color:#222;padding-bottom:3px;border-bottom:1px solid #d1d5db"><span style="color:${accent};font-weight:400;margin-right:4px">##</span><span style="text-transform:${titleTransform}">${title}</span></h2>${content}</div>`
}

/* ======================== CAREERCUP ======================== */
function generateCareerCupHtml(resume: ResumeWithRelations, ci: ResumeWithRelations['contact_info'], df: DateFormat, accentColor: string, fontFamily: string, fontImportUrl: string, density: Density, sectionOrder: string[], nameSize: number, titleTransform: string, margin: string): string {
  const contactParts: string[] = [
    ci?.email, ci?.phone,
    (ci?.city || ci?.state || ci?.country) ? [ci?.city, ci?.state, ci?.country].filter(Boolean).join(', ') : null,
    ...[ci?.linkedin_url, ci?.github_url, ci?.portfolio_url].filter(Boolean).map((url) => (url as string).replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')),
  ].filter(Boolean) as string[]
  const visibleExps = resume.work_experiences.filter(e => e.is_visible !== false)

  const sectionsHtml = sectionOrder.map((sid) => {
    switch (sid) {
      case 'summary':
        if (!resume.summary?.is_visible || !resume.summary?.text) return ''
        return careerCupSection('SUMMARY', `<p style="line-height:${density.lineHeight};color:#222;margin:0;font-size:${density.body}">${escapeHtml(resume.summary.text)}</p>`, accentColor, density, titleTransform)
      case 'experience':
        if (!visibleExps.length) return ''
        return careerCupSection('EXPERIENCE', visibleExps.map(exp => `<div class="experience-entry" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:baseline"><strong style="font-size:${density.heading}">${escapeHtml(exp.company)}</strong><span style="font-size:${density.body};color:#555;white-space:nowrap">${dateRange(exp.start_date, exp.end_date, df)}</span></div><div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-style:italic;font-size:${density.body}">${escapeHtml(exp.job_title)}</span>${exp.location ? `<span style="font-size:${density.body};color:#777">${escapeHtml(exp.location)}</span>` : ''}</div>${(exp.achievements?.length ?? 0) > 0 ? `<ul style="margin:3px 0 0;padding-left:16px;list-style:disc">${exp.achievements!.map(a => `<li style="font-size:${density.body};line-height:${density.lineHeight};color:#222;margin-bottom:1px">${escapeHtml(a.text)}</li>`).join('')}</ul>` : ''}</div>`).join(''), accentColor, density, titleTransform)
      case 'education':
        if (!resume.education.length) return ''
        return careerCupSection('EDUCATION', resume.education.map(edu => `<div class="experience-entry" style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;align-items:baseline"><strong style="font-size:${density.heading}">${escapeHtml(edu.institution)}</strong>${edu.graduation_date ? `<span style="font-size:${density.body};color:#555;white-space:nowrap">${formatDate(edu.graduation_date, df)}</span>` : ''}</div><div style="font-size:${density.body};font-style:italic">${escapeHtml(edu.degree)}${edu.field_of_study ? ` in ${escapeHtml(edu.field_of_study)}` : ''}</div>${edu.gpa ? `<div style="font-size:${density.body};color:#555">GPA: ${edu.gpa}</div>` : ''}${edu.honors ? `<div style="font-size:${density.body};color:#555">${escapeHtml(edu.honors)}</div>` : ''}</div>`).join(''), accentColor, density, titleTransform)
      case 'skills':
        if (!resume.skill_categories.length) return ''
        return careerCupSection('TECHNICAL SKILLS', resume.skill_categories.map(cat => `<div style="margin-bottom:2px;font-size:${density.body}"><strong>${escapeHtml(cat.name)}: </strong><span>${cat.skills.map(escapeHtml).join(', ')}</span></div>`).join(''), accentColor, density, titleTransform)
      case 'projects':
        if (!resume.projects.length) return ''
        return careerCupSection('PROJECTS', resume.projects.map(proj => `<div class="experience-entry" style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;align-items:baseline"><div><strong style="font-size:${density.heading}">${escapeHtml(proj.name)}</strong>${proj.project_url ? `<a href="${proj.project_url}" style="font-size:9px;color:#555;text-decoration:none;margin-left:6px">(${escapeHtml(proj.project_url.replace(/https?:\/\//, ''))})</a>` : ''}</div></div>${proj.description ? `<div style="font-size:${density.body};color:#222;margin-top:1px;font-style:italic">${escapeHtml(proj.description)}</div>` : ''}${(proj.achievements?.length ?? 0) > 0 ? `<ul style="margin:3px 0 0;padding-left:16px;list-style:disc">${proj.achievements!.map(a => `<li style="font-size:${density.body};line-height:${density.lineHeight};color:#222;margin-bottom:1px">${escapeHtml(a.text)}</li>`).join('')}</ul>` : ''}</div>`).join(''), accentColor, density, titleTransform)
      case 'certifications':
        if (!resume.certifications.length) return ''
        return careerCupSection('CERTIFICATIONS', resume.certifications.map(cert => `<div class="experience-entry" style="display:flex;justify-content:space-between;margin-bottom:2px;font-size:${density.body}"><span><strong>${escapeHtml(cert.name)}</strong>${cert.issuer ? `<span style="color:#555">, ${escapeHtml(cert.issuer)}</span>` : ''}</span>${cert.date ? `<span style="color:#555;font-size:${density.body}">${formatDate(cert.date, df)}</span>` : ''}</div>`).join(''), accentColor, density, titleTransform)
      case 'extracurriculars':
        if (!resume.extracurriculars.length) return ''
        return careerCupSection('ACTIVITIES &amp; LEADERSHIP', resume.extracurriculars.map(item => `<div style="margin-bottom:2px;font-size:${density.body}"><strong>${escapeHtml(item.title)}</strong>${item.description ? ` <span style="color:#555">- ${escapeHtml(item.description)}</span>` : ''}</div>`).join(''), accentColor, density, titleTransform)
      default: return ''
    }
  }).join('')

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${pageCss(fontImportUrl, fontFamily, density, '#000')}</style></head><body>
<div style="padding:${margin}">
  <div style="text-align:center;margin-bottom:8px">
    <h1 style="font-size:${nameSize}px;font-weight:700;margin:0 0 4px;text-transform:uppercase;letter-spacing:2px">${escapeHtml(ci?.full_name || 'Your Name')}</h1>
    <div style="font-size:${density.body};color:#333">${contactParts.map(escapeHtml).join('  |  ')}</div>
    <hr style="border:none;border-top:1.5px solid ${accentColor};margin-top:8px;margin-bottom:0" />
  </div>
  ${sectionsHtml}
</div></body></html>`
}

function careerCupSection(title: string, content: string, accent: string, density: Density, titleTransform: string): string {
  return `<div class="resume-section" style="margin-bottom:${density.sectionGap}"><h2 style="font-size:${density.section};font-weight:700;text-transform:${titleTransform};letter-spacing:1px;margin-bottom:4px;color:#000;border-bottom:1px solid ${accent};padding-bottom:2px">${title}</h2>${content}</div>`
}

function generateParkerHtml(resume: ResumeWithRelations, ci: ResumeWithRelations['contact_info'], df: DateFormat, accentColor: string, backgroundColor: string, fontFamily: string, fontImportUrl: string, density: Density, sectionOrder: string[], nameSize: number, titleTransform: string, rightPanelColor: string, sidebarColors: { primary: string; secondary: string; muted: string }, margin: string): string {
  const linkColor = accentColor === '#000000' ? '#93c5fd' : accentColor
  const contactLinks = [
    ci?.linkedin_url, ci?.github_url, ci?.portfolio_url,
  ].filter(Boolean).map((url) => {
    const display = (url as string).replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')
    return `<div><a href="${url}" style="color:${linkColor};text-decoration:none;font-size:9px;word-break:break-all">${escapeHtml(display)}</a></div>`
  })

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('${fontImportUrl}');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: Letter; margin: 0; }
  body { font-family: ${fontFamily}; font-size: ${density.body}; line-height: ${density.lineHeight}; }
  .resume-section { page-break-inside: avoid; break-inside: avoid; }
  .experience-entry { page-break-inside: avoid; break-inside: avoid; }
  h2 { page-break-after: avoid; break-after: avoid; }
  li { page-break-inside: avoid; break-inside: avoid; }
  ul { orphans: 3; widows: 3; }
  p { orphans: 3; widows: 3; }
</style>
</head>
<body>
<div style="display:flex;min-height:11in;background:#fff">
  <!-- Sidebar -->
  <div style="width:30%;background:${backgroundColor};color:${sidebarColors.primary};padding:${margin} 0.5in calc(${margin} - 0.2in);box-sizing:border-box;flex-shrink:0">
    <div style="margin-bottom:20px">
      <div style="font-size:${nameSize}px;font-weight:800;line-height:1.1;color:${accentColor};word-break:break-word">${escapeHtml(ci?.full_name || 'Your Name')}</div>
      ${resume.target_role ? `<div style="font-size:${density.body};color:${sidebarColors.muted};margin-top:6px;text-transform:uppercase;letter-spacing:1px">${escapeHtml(resume.target_role)}</div>` : ''}
    </div>
    <div style="margin-bottom:18px">
      <h2 style="font-size:${density.section};font-weight:700;text-transform:${titleTransform};letter-spacing:2px;color:${accentColor};margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid ${accentColor}">CONTACT</h2>
      <div style="font-size:${density.body};color:${sidebarColors.secondary};line-height:1.6">
        ${ci?.email ? `<div>${escapeHtml(ci.email)}</div>` : ''}
        ${ci?.phone ? `<div>${escapeHtml(ci.phone)}</div>` : ''}
        ${(ci?.city || ci?.state || ci?.country) ? `<div>${[ci?.city, ci?.state, ci?.country].filter(Boolean).map(s => escapeHtml(s!)).join(', ')}</div>` : ''}
        ${contactLinks.join('')}
      </div>
    </div>
    ${resume.skill_categories.length > 0 ? `
      <div class="resume-section" style="margin-bottom:18px">
        <h2 style="font-size:${density.section};font-weight:700;text-transform:${titleTransform};letter-spacing:2px;color:${accentColor};margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid ${accentColor}">SKILLS</h2>
        ${resume.skill_categories.map((cat) => `<div style="margin-bottom:6px"><div style="font-weight:700;font-size:${density.heading};text-transform:uppercase;letter-spacing:0.5px;color:${sidebarColors.secondary};margin-bottom:2px">${escapeHtml(cat.name)}</div><div style="font-size:${density.body};color:${sidebarColors.secondary};line-height:${density.lineHeight}">${cat.skills.map(escapeHtml).join(', ')}</div></div>`).join('')}
      </div>` : ''}
    ${resume.education.length > 0 ? `
      <div class="resume-section" style="margin-bottom:18px">
        <h2 style="font-size:${density.section};font-weight:700;text-transform:${titleTransform};letter-spacing:2px;color:${accentColor};margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid ${accentColor}">EDUCATION</h2>
        ${resume.education.map((edu) => `<div class="experience-entry" style="margin-bottom:8px"><div style="font-weight:700;font-size:${density.heading};color:${sidebarColors.primary}">${escapeHtml(edu.degree)}</div>${edu.field_of_study ? `<div style="font-size:${density.body};color:${sidebarColors.secondary}">${escapeHtml(edu.field_of_study)}</div>` : ''}<div style="font-size:${density.body};color:${sidebarColors.muted}">${escapeHtml(edu.institution)}</div>${edu.graduation_date ? `<div style="font-size:${density.body};color:${sidebarColors.muted};margin-top:2px">${formatDate(edu.graduation_date, df)}</div>` : ''}${edu.gpa ? `<div style="font-size:${density.body};color:${sidebarColors.muted}">GPA: ${edu.gpa}</div>` : ''}${edu.honors ? `<div style="font-size:${density.body};color:${sidebarColors.muted}">${escapeHtml(edu.honors)}</div>` : ''}</div>`).join('')}
      </div>` : ''}
    ${resume.certifications.length > 0 ? `
      <div class="resume-section" style="margin-bottom:18px">
        <h2 style="font-size:${density.section};font-weight:700;text-transform:${titleTransform};letter-spacing:2px;color:${accentColor};margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid ${accentColor}">CERTIFICATIONS</h2>
        ${resume.certifications.map((cert) => `<div class="experience-entry" style="margin-bottom:6px"><div style="font-weight:700;font-size:${density.heading};color:${sidebarColors.primary}">${escapeHtml(cert.name)}</div>${cert.issuer ? `<div style="font-size:${density.body};color:${sidebarColors.muted}">${escapeHtml(cert.issuer)}</div>` : ''}${cert.date ? `<div style="font-size:${density.body};color:${sidebarColors.muted}">${formatDate(cert.date, df)}</div>` : ''}</div>`).join('')}
      </div>` : ''}
    ${resume.extracurriculars.length > 0 ? `
      <div class="resume-section" style="margin-bottom:18px">
        <h2 style="font-size:${density.section};font-weight:700;text-transform:${titleTransform};letter-spacing:2px;color:${accentColor};margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid ${accentColor}">ACTIVITIES</h2>
        ${resume.extracurriculars.map((item) => `<div style="margin-bottom:4px"><div style="font-weight:700;font-size:${density.heading};color:${sidebarColors.primary}">${escapeHtml(item.title)}</div>${item.description ? `<div style="font-size:${density.body};color:${sidebarColors.muted}">${escapeHtml(item.description)}</div>` : ''}</div>`).join('')}
      </div>` : ''}
  </div>
  <!-- Main Content -->
  <div style="width:70%;padding:${margin} 0.7in calc(${margin} - 0.2in) 0.6in;box-sizing:border-box;color:#111827;background:${rightPanelColor}">
    ${resume.summary?.is_visible && resume.summary?.text ? `<div class="resume-section" style="margin-bottom:${density.sectionGap}"><h2 style="font-size:${density.section};font-weight:700;text-transform:${titleTransform};letter-spacing:1.5px;margin-bottom:8px;color:${accentColor};padding-bottom:4px;border-bottom:2px solid ${accentColor}">SUMMARY</h2><p style="font-size:${density.body};line-height:${density.lineHeight};color:#374151;margin:0">${escapeHtml(resume.summary.text)}</p></div>` : ''}
    ${(() => { const vExps = resume.work_experiences.filter(e => e.is_visible !== false); return vExps.length > 0 ? `<div class="resume-section" style="margin-bottom:${density.sectionGap}"><h2 style="font-size:${density.section};font-weight:700;text-transform:${titleTransform};letter-spacing:1.5px;margin-bottom:8px;color:${accentColor};padding-bottom:4px;border-bottom:2px solid ${accentColor}">EXPERIENCE</h2>${vExps.map((exp) => `<div class="experience-entry" style="margin-bottom:${density.sectionGap}"><div style="display:flex;justify-content:space-between;align-items:baseline"><div><span style="font-weight:700;font-size:${density.heading}">${escapeHtml(exp.job_title)}</span> <span style="color:#6b7280;font-size:${density.heading}">at ${escapeHtml(exp.company)}</span></div><span style="font-size:${density.body};color:#9ca3af;white-space:nowrap">${dateRange(exp.start_date, exp.end_date, df)}</span></div>${exp.location ? `<div style="font-size:${density.body};color:#9ca3af">${escapeHtml(exp.location)}</div>` : ''}${(exp.achievements?.length ?? 0) > 0 ? `<ul style="margin:4px 0 0;padding-left:18px;list-style:disc">${exp.achievements!.map((a) => `<li style="font-size:${density.body};line-height:${density.lineHeight};color:#374151;margin-bottom:2px">${escapeHtml(a.text)}</li>`).join('')}</ul>` : ''}</div>`).join('')}</div>` : '' })()}
    ${resume.projects.length > 0 ? `<div class="resume-section" style="margin-bottom:${density.sectionGap}"><h2 style="font-size:${density.section};font-weight:700;text-transform:${titleTransform};letter-spacing:1.5px;margin-bottom:8px;color:${accentColor};padding-bottom:4px;border-bottom:2px solid ${accentColor}">PROJECTS</h2>${resume.projects.map((proj) => `<div class="experience-entry" style="margin-bottom:8px"><div style="display:flex;align-items:baseline;gap:8px"><span style="font-weight:700;font-size:${density.heading}">${escapeHtml(proj.name)}</span>${proj.project_url ? `<a href="${proj.project_url}" style="font-size:9px;color:${accentColor};text-decoration:none">${escapeHtml(proj.project_url.replace(/https?:\/\//, ''))}</a>` : ''}</div>${proj.description ? `<div style="font-size:${density.body};color:#374151;margin-top:2px">${escapeHtml(proj.description)}</div>` : ''}${(proj.achievements?.length ?? 0) > 0 ? `<ul style="margin:4px 0 0;padding-left:18px;list-style:disc">${proj.achievements!.map((a) => `<li style="font-size:${density.body};line-height:${density.lineHeight};color:#374151;margin-bottom:2px">${escapeHtml(a.text)}</li>`).join('')}</ul>` : ''}</div>`).join('')}</div>` : ''}
  </div>
</div>
</body>
</html>`
}

function generateExperiencedHtml(resume: ResumeWithRelations, ci: ResumeWithRelations['contact_info'], df: DateFormat, accentColor: string, backgroundColor: string, fontFamily: string, fontImportUrl: string, density: Density, sectionOrder: string[], nameSize: number, titleTransform: string, margin: string, sidebarColors: { primary: string; secondary: string; muted: string }): string {
  const contactLinks = [
    ci?.linkedin_url, ci?.github_url, ci?.portfolio_url,
  ].filter(Boolean).map((url) => {
    const display = (url as string).replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')
    return `<span>|  <a href="${url}" style="color:${accentColor};text-decoration:none">${escapeHtml(display)}</a></span>`
  })

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('${fontImportUrl}');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: Letter; margin: 0; }
  body { font-family: ${fontFamily}; font-size: ${density.body}; line-height: ${density.lineHeight}; color: #111827; }
  .resume-section { page-break-inside: avoid; break-inside: avoid; }
  .experience-entry { page-break-inside: avoid; break-inside: avoid; }
  h2 { page-break-after: avoid; break-after: avoid; }
  li { page-break-inside: avoid; break-inside: avoid; }
  ul { orphans: 3; widows: 3; }
  p { orphans: 3; widows: 3; }
</style>
</head>
<body>
<div style="background:#fff;min-height:11in">
  <!-- Full-width header -->
  <div style="padding:${margin} 0.7in calc(${margin} - 0.2in);border-bottom:2px solid ${accentColor}">
    <h1 style="font-size:${nameSize}px;font-weight:800;margin:0;color:#111827;letter-spacing:-0.5px">${escapeHtml(ci?.full_name || 'Your Name')}</h1>
    ${resume.target_role ? `<div style="font-size:${density.section};color:${accentColor};margin-top:2px;font-weight:500">${escapeHtml(resume.target_role)}</div>` : ''}
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:6px;font-size:${density.body};color:#6b7280">
      ${ci?.email ? `<span>${escapeHtml(ci.email)}</span>` : ''}
      ${ci?.phone ? `<span>|  ${escapeHtml(ci.phone)}</span>` : ''}
      ${(ci?.city || ci?.state || ci?.country) ? `<span>|  ${[ci?.city, ci?.state, ci?.country].filter(Boolean).map(s => escapeHtml(s!)).join(', ')}</span>` : ''}
      ${contactLinks.join('')}
    </div>
  </div>
  <!-- Two-column body -->
  <div style="display:flex">
    <!-- Left column -->
    <div style="width:25%;background:${backgroundColor};padding:0.15in 0.45in ${margin} 0.7in;box-sizing:border-box;border-right:1px solid #d1d5db;flex-shrink:0">
      ${resume.skill_categories.length > 0 ? `<div class="resume-section" style="margin-bottom:18px"><h2 style="font-size:${density.section};font-weight:700;text-transform:${titleTransform};letter-spacing:1.5px;color:${accentColor};margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid ${accentColor}">Skills</h2>${resume.skill_categories.map((cat) => `<div style="margin-bottom:6px"><div style="font-weight:700;font-size:${density.heading};text-transform:uppercase;letter-spacing:0.3px;color:${sidebarColors.primary};margin-bottom:2px">${escapeHtml(cat.name)}</div><div style="font-size:${density.body};color:${sidebarColors.secondary};line-height:${density.lineHeight}">${cat.skills.map(escapeHtml).join(', ')}</div></div>`).join('')}</div>` : ''}
      ${resume.education.length > 0 ? `<div class="resume-section" style="margin-bottom:18px"><h2 style="font-size:${density.section};font-weight:700;text-transform:${titleTransform};letter-spacing:1.5px;color:${accentColor};margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid ${accentColor}">Education</h2>${resume.education.map((edu) => `<div class="experience-entry" style="margin-bottom:8px"><div style="font-weight:700;font-size:${density.heading};color:${sidebarColors.primary}">${escapeHtml(edu.degree)}</div>${edu.field_of_study ? `<div style="font-size:${density.body};color:${sidebarColors.secondary}">${escapeHtml(edu.field_of_study)}</div>` : ''}<div style="font-size:${density.body};color:${sidebarColors.secondary}">${escapeHtml(edu.institution)}</div>${edu.graduation_date ? `<div style="font-size:${density.body};color:${sidebarColors.muted};margin-top:2px">${formatDate(edu.graduation_date, df)}</div>` : ''}${edu.gpa ? `<div style="font-size:${density.body};color:${sidebarColors.muted}">GPA: ${edu.gpa}</div>` : ''}${edu.honors ? `<div style="font-size:${density.body};color:${sidebarColors.muted}">${escapeHtml(edu.honors)}</div>` : ''}</div>`).join('')}</div>` : ''}
      ${resume.certifications.length > 0 ? `<div class="resume-section" style="margin-bottom:18px"><h2 style="font-size:${density.section};font-weight:700;text-transform:${titleTransform};letter-spacing:1.5px;color:${accentColor};margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid ${accentColor}">Certifications</h2>${resume.certifications.map((cert) => `<div class="experience-entry" style="margin-bottom:6px"><div style="font-weight:700;font-size:${density.heading};color:${sidebarColors.primary}">${escapeHtml(cert.name)}</div>${cert.issuer ? `<div style="font-size:${density.body};color:${sidebarColors.secondary}">${escapeHtml(cert.issuer)}</div>` : ''}${cert.date ? `<div style="font-size:${density.body};color:${sidebarColors.muted}">${formatDate(cert.date, df)}</div>` : ''}</div>`).join('')}</div>` : ''}
    </div>
    <!-- Right column -->
    <div style="width:75%;padding:0.15in 0.7in ${margin} 0.55in;box-sizing:border-box">
      ${resume.summary?.is_visible && resume.summary?.text ? `<div class="resume-section" style="margin-bottom:${density.sectionGap}"><h2 style="font-size:${density.section};font-weight:700;text-transform:${titleTransform};letter-spacing:1px;color:${accentColor};margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid ${accentColor}">Professional Summary</h2><p style="font-size:${density.body};line-height:${density.lineHeight};color:#374151;margin:0">${escapeHtml(resume.summary.text)}</p></div>` : ''}
      ${(() => { const vExps = resume.work_experiences.filter(e => e.is_visible !== false); return vExps.length > 0 ? `<div class="resume-section" style="margin-bottom:${density.sectionGap}"><h2 style="font-size:${density.section};font-weight:700;text-transform:${titleTransform};letter-spacing:1px;color:${accentColor};margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid ${accentColor}">Work Experience</h2>${vExps.map((exp) => `<div class="experience-entry" style="margin-bottom:${density.sectionGap}"><div style="display:flex;justify-content:space-between;align-items:baseline"><div><span style="font-weight:700;font-size:${density.heading};color:#111827">${escapeHtml(exp.job_title)}</span> <span style="color:#6b7280;font-size:${density.heading}">| ${escapeHtml(exp.company)}</span></div><span style="font-size:${density.body};color:#9ca3af;white-space:nowrap">${dateRange(exp.start_date, exp.end_date, df)}</span></div>${exp.location ? `<div style="font-size:${density.body};color:#9ca3af">${escapeHtml(exp.location)}</div>` : ''}${(exp.achievements?.length ?? 0) > 0 ? `<ul style="margin:4px 0 0;padding-left:18px;list-style:disc">${exp.achievements!.map((a) => `<li style="font-size:${density.body};line-height:${density.lineHeight};color:#374151;margin-bottom:2px">${escapeHtml(a.text)}</li>`).join('')}</ul>` : ''}</div>`).join('')}</div>` : '' })()}
      ${resume.projects.length > 0 ? `<div class="resume-section" style="margin-bottom:${density.sectionGap}"><h2 style="font-size:${density.section};font-weight:700;text-transform:${titleTransform};letter-spacing:1px;color:${accentColor};margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid ${accentColor}">Projects</h2>${resume.projects.map((proj) => `<div class="experience-entry" style="margin-bottom:8px"><div style="display:flex;align-items:baseline;gap:8px"><span style="font-weight:700;font-size:${density.heading};color:#111827">${escapeHtml(proj.name)}</span>${proj.project_url ? `<a href="${proj.project_url}" style="font-size:9px;color:${accentColor};text-decoration:none">${escapeHtml(proj.project_url.replace(/https?:\/\//, ''))}</a>` : ''}</div>${proj.description ? `<div style="font-size:${density.body};color:#374151;margin-top:2px">${escapeHtml(proj.description)}</div>` : ''}${(proj.achievements?.length ?? 0) > 0 ? `<ul style="margin:4px 0 0;padding-left:18px;list-style:disc">${proj.achievements!.map((a) => `<li style="font-size:${density.body};line-height:${density.lineHeight};color:#374151;margin-bottom:2px">${escapeHtml(a.text)}</li>`).join('')}</ul>` : ''}</div>`).join('')}</div>` : ''}
      ${resume.extracurriculars.length > 0 ? `<div class="resume-section" style="margin-bottom:${density.sectionGap}"><h2 style="font-size:${density.section};font-weight:700;text-transform:${titleTransform};letter-spacing:1px;color:${accentColor};margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid ${accentColor}">Activities</h2>${resume.extracurriculars.map((item) => `<div style="margin-bottom:4px;font-size:${density.body}"><span style="font-weight:700">${escapeHtml(item.title)}</span>${item.description ? `<span style="color:#6b7280"> - ${escapeHtml(item.description)}</span>` : ''}</div>`).join('')}</div>` : ''}
    </div>
  </div>
</div>
</body>
</html>`
}
