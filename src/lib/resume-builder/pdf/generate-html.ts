import type { ResumeWithRelations, DateFormat } from '@/types/resume-builder'
import { findFont, fontFamilyCss, googleFontUrl } from '@/lib/resume-builder/fonts'

const LEGACY_FONT_MAP: Record<string, string> = {
  inter: '"Inter", system-ui, sans-serif',
  source_sans: '"Source Sans 3", sans-serif',
  lato: '"Lato", sans-serif',
  georgia: '"Georgia", serif',
  garamond: '"EB Garamond", serif',
  source_code: '"Source Code Pro", monospace',
}

const DENSITY_MAP: Record<string, { body: string; heading: string; section: string; lineHeight: string; sectionGap: string }> = {
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

  // Check if this is a two-column template
  const isTwoColumn = templateId === 'a1b2c3d4-0005-4000-8000-000000000005' ||
    templateId === 'a1b2c3d4-0006-4000-8000-000000000006'

  if (isTwoColumn && templateId === 'a1b2c3d4-0005-4000-8000-000000000005') {
    return generateParkerHtml(resume, ci, df, accentColor, backgroundColor, fontFamily, fontImportUrl, density, sectionOrder)
  }

  if (isTwoColumn && templateId === 'a1b2c3d4-0006-4000-8000-000000000006') {
    return generateExperiencedHtml(resume, ci, df, accentColor, backgroundColor, fontFamily, fontImportUrl, density, sectionOrder)
  }

  // Single-column templates
  const isMonoTemplate = templateId === 'a1b2c3d4-0002-4000-8000-000000000002'
  const isSmarkdownTemplate = templateId === 'a1b2c3d4-0003-4000-8000-000000000003'
  const isCareerCupTemplate = templateId === 'a1b2c3d4-0004-4000-8000-000000000004'

  const bodyFont = isMonoTemplate ? LEGACY_FONT_MAP.source_code : fontFamily
  const margin = isCareerCupTemplate ? '0.6in' : isMonoTemplate ? '0.75in' : '1in'
  const headerAlign = isCareerCupTemplate ? 'center' : 'left'
  const dividerStyle = isMonoTemplate ? 'border-top: 1px dashed #999' : isSmarkdownTemplate ? `border-top: 2px solid ${accentColor}` : 'border-top: 1px solid #d1d5db'
  const sectionHeaderColor = isSmarkdownTemplate ? accentColor : '#111827'

  const contactLinks = [
    ci?.linkedin_url, ci?.github_url, ci?.portfolio_url, ci?.blog_url,
  ].filter(Boolean).map((url) => {
    const display = (url as string).replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')
    return `<a href="${url}" style="color:${isSmarkdownTemplate ? accentColor : '#6b7280'};text-decoration:none">${escapeHtml(display)}</a>`
  })

  const contactParts = [
    ci?.email,
    ci?.phone,
    (ci?.city || ci?.country) ? [ci?.city, ci?.country].filter(Boolean).join(', ') : null,
    ...contactLinks,
  ].filter(Boolean)

  const sectionsHtml = sectionOrder.map((sid) => {
    switch (sid) {
      case 'summary':
        if (!resume.summary?.is_visible || !resume.summary?.text) return ''
        return sectionBlock('SUMMARY', `<p style="line-height:${density.lineHeight};color:#374151">${escapeHtml(resume.summary.text)}</p>`, sectionHeaderColor, dividerStyle, density)

      case 'experience':
        if (!resume.work_experiences.length) return ''
        return sectionBlock('EXPERIENCE', resume.work_experiences.map((exp) => `
          <div class="experience-entry" style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;align-items:baseline">
              <div><strong style="font-size:${density.heading}">${escapeHtml(exp.job_title)}</strong> <span style="color:#6b7280;font-size:${density.heading}">· ${escapeHtml(exp.company)}</span></div>
              <span style="font-size:${density.body};color:#6b7280;white-space:nowrap">${dateRange(exp.start_date, exp.end_date, df)}</span>
            </div>
            ${exp.location ? `<div style="font-size:${density.body};color:#9ca3af">${escapeHtml(exp.location)}</div>` : ''}
            ${(exp.achievements?.length ?? 0) > 0 ? `<ul style="margin:4px 0 0;padding-left:18px;list-style:disc">${exp.achievements!.map((a) => `<li style="font-size:${density.body};line-height:${density.lineHeight};color:#374151;margin-bottom:2px">${escapeHtml(a.text)}</li>`).join('')}</ul>` : ''}
          </div>
        `).join(''), sectionHeaderColor, dividerStyle, density)

      case 'education':
        if (!resume.education.length) return ''
        return sectionBlock('EDUCATION', resume.education.map((edu) => `
          <div class="experience-entry" style="margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;align-items:baseline">
              <div><strong style="font-size:${density.heading}">${escapeHtml(edu.degree)}</strong>${edu.field_of_study ? ` <span style="color:#6b7280;font-size:${density.heading}">in ${escapeHtml(edu.field_of_study)}</span>` : ''}</div>
              ${edu.graduation_date ? `<span style="font-size:${density.body};color:#6b7280">${formatDate(edu.graduation_date, df)}</span>` : ''}
            </div>
            <div style="font-size:${density.heading};color:#6b7280">${escapeHtml(edu.institution)}</div>
            ${edu.gpa ? `<div style="font-size:${density.body};color:#9ca3af">GPA: ${edu.gpa}</div>` : ''}
            ${edu.honors ? `<div style="font-size:${density.body};color:#9ca3af">${escapeHtml(edu.honors)}</div>` : ''}
          </div>
        `).join(''), sectionHeaderColor, dividerStyle, density)

      case 'skills':
        if (!resume.skill_categories.length) return ''
        return sectionBlock('SKILLS', resume.skill_categories.map((cat) =>
          `<div style="margin-bottom:4px;font-size:${density.body}"><strong>${escapeHtml(cat.name)}:</strong> <span style="color:#374151">${cat.skills.map(escapeHtml).join(', ')}</span></div>`
        ).join(''), sectionHeaderColor, dividerStyle, density)

      case 'projects':
        if (!resume.projects.length) return ''
        return sectionBlock('PROJECTS', resume.projects.map((proj) => `
          <div class="experience-entry" style="margin-bottom:8px">
            <div style="display:flex;align-items:baseline;gap:8px">
              <strong style="font-size:${density.heading}">${escapeHtml(proj.name)}</strong>
              ${proj.project_url ? `<a href="${proj.project_url}" style="font-size:9px;color:${accentColor};text-decoration:none">${escapeHtml(proj.project_url.replace(/https?:\/\//, ''))}</a>` : ''}
            </div>
            ${proj.description ? `<div style="font-size:${density.body};color:#374151;margin-top:2px">${escapeHtml(proj.description)}</div>` : ''}
            ${(proj.achievements?.length ?? 0) > 0 ? `<ul style="margin:4px 0 0;padding-left:18px;list-style:disc">${proj.achievements!.map((a) => `<li style="font-size:${density.body};line-height:${density.lineHeight};color:#374151;margin-bottom:2px">${escapeHtml(a.text)}</li>`).join('')}</ul>` : ''}
          </div>
        `).join(''), sectionHeaderColor, dividerStyle, density)

      case 'certifications':
        if (!resume.certifications.length) return ''
        return sectionBlock('CERTIFICATIONS', resume.certifications.map((cert) =>
          `<div class="experience-entry" style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:${density.body}"><span><strong>${escapeHtml(cert.name)}</strong>${cert.issuer ? ` <span style="color:#6b7280">– ${escapeHtml(cert.issuer)}</span>` : ''}</span>${cert.date ? `<span style="color:#6b7280;font-size:${density.body}">${formatDate(cert.date, df)}</span>` : ''}</div>`
        ).join(''), sectionHeaderColor, dividerStyle, density)

      case 'extracurriculars':
        if (!resume.extracurriculars.length) return ''
        return sectionBlock('ACTIVITIES', resume.extracurriculars.map((item) =>
          `<div style="margin-bottom:4px;font-size:${density.body}"><strong>${escapeHtml(item.title)}</strong>${item.description ? ` <span style="color:#6b7280">– ${escapeHtml(item.description)}</span>` : ''}</div>`
        ).join(''), sectionHeaderColor, dividerStyle, density)

      default:
        return ''
    }
  }).join('')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('${fontImportUrl}');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: Letter; margin: 0; }
  body { font-family: ${bodyFont}; font-size: ${density.body}; line-height: ${density.lineHeight}; color: #111827; }
  .resume-section { page-break-inside: avoid; break-inside: avoid; }
  .experience-entry { page-break-inside: avoid; break-inside: avoid; }
  h2 { page-break-after: avoid; break-after: avoid; }
  li { page-break-inside: avoid; break-inside: avoid; }
  ul { orphans: 3; widows: 3; }
  p { orphans: 3; widows: 3; }
</style>
</head>
<body>
<div style="padding:${margin}">
  <div style="text-align:${headerAlign};margin-bottom:16px">
    <h1 style="font-size:${isMonoTemplate ? '24px' : '28px'};font-weight:700;margin:0;letter-spacing:-0.5px${isSmarkdownTemplate ? `;border-bottom:3px solid ${accentColor};display:inline-block;padding-bottom:4px` : ''}">${escapeHtml(ci?.full_name || 'Your Name')}</h1>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;font-size:${density.body};color:#6b7280;${headerAlign === 'center' ? 'justify-content:center' : ''}">${contactParts.map((p, i) => `${i > 0 ? '<span>·</span> ' : ''}${typeof p === 'string' && p.startsWith('<a') ? p : `<span>${escapeHtml(p as string)}</span>`}`).join(' ')}</div>
    <hr style="${dividerStyle};margin-top:12px" />
  </div>
  ${sectionsHtml}
</div>
</body>
</html>`
}

function sectionBlock(title: string, content: string, headerColor: string, dividerStyle: string, density: { body: string; heading: string; section: string; lineHeight: string; sectionGap: string }): string {
  return `<div class="resume-section" style="margin-bottom:${density.sectionGap}">
    <h2 style="font-size:${density.section};font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;color:${headerColor}">${title}</h2>
    ${content}
  </div>`
}

function generateParkerHtml(resume: ResumeWithRelations, ci: ResumeWithRelations['contact_info'], df: DateFormat, accentColor: string, backgroundColor: string, fontFamily: string, fontImportUrl: string, density: { body: string; heading: string; section: string; lineHeight: string; sectionGap: string }, sectionOrder: string[]): string {
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
<div style="display:grid;grid-template-columns:30% 70%;min-height:11in">
  <!-- Sidebar -->
  <div style="background:${backgroundColor};color:white;padding:40px 20px">
    <h1 style="font-size:22px;font-weight:700;margin-bottom:4px">${escapeHtml(ci?.full_name || '')}</h1>
    <div style="font-size:9px;margin-bottom:24px;opacity:0.8">
      ${ci?.email ? `<div style="margin-bottom:3px">${escapeHtml(ci.email)}</div>` : ''}
      ${ci?.phone ? `<div style="margin-bottom:3px">${escapeHtml(ci.phone)}</div>` : ''}
      ${(ci?.city || ci?.country) ? `<div style="margin-bottom:3px">${[ci?.city, ci?.country].filter(Boolean).map(s => escapeHtml(s!)).join(', ')}</div>` : ''}
      ${ci?.linkedin_url ? `<div style="margin-bottom:3px"><a href="${ci.linkedin_url}" style="color:${accentColor === '#000000' ? '#93c5fd' : accentColor};text-decoration:none">${escapeHtml(ci.linkedin_url.replace(/https?:\/\/(www\.)?/, ''))}</a></div>` : ''}
      ${ci?.github_url ? `<div style="margin-bottom:3px"><a href="${ci.github_url}" style="color:${accentColor === '#000000' ? '#93c5fd' : accentColor};text-decoration:none">${escapeHtml(ci.github_url.replace(/https?:\/\/(www\.)?/, ''))}</a></div>` : ''}
    </div>
    ${resume.skill_categories.length > 0 ? `
      <div class="resume-section" style="margin-bottom:20px">
        <h2 style="font-size:${density.section};font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.3);padding-bottom:4px">SKILLS</h2>
        ${resume.skill_categories.map((cat) => `<div style="margin-bottom:6px"><div style="font-weight:600;font-size:${density.body};margin-bottom:2px">${escapeHtml(cat.name)}</div><div style="font-size:${density.body};opacity:0.85">${cat.skills.map(escapeHtml).join(', ')}</div></div>`).join('')}
      </div>` : ''}
    ${resume.education.length > 0 ? `
      <div class="resume-section" style="margin-bottom:20px">
        <h2 style="font-size:${density.section};font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.3);padding-bottom:4px">EDUCATION</h2>
        ${resume.education.map((edu) => `<div class="experience-entry" style="margin-bottom:6px"><div style="font-weight:600;font-size:${density.body}">${escapeHtml(edu.degree)}</div><div style="font-size:${density.body};opacity:0.85">${escapeHtml(edu.institution)}</div>${edu.graduation_date ? `<div style="font-size:${density.body};opacity:0.7">${formatDate(edu.graduation_date, df)}</div>` : ''}</div>`).join('')}
      </div>` : ''}
    ${resume.certifications.length > 0 ? `
      <div class="resume-section">
        <h2 style="font-size:${density.section};font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.3);padding-bottom:4px">CERTIFICATIONS</h2>
        ${resume.certifications.map((cert) => `<div class="experience-entry" style="margin-bottom:4px;font-size:${density.body}"><div style="font-weight:600">${escapeHtml(cert.name)}</div>${cert.issuer ? `<div style="opacity:0.85">${escapeHtml(cert.issuer)}</div>` : ''}</div>`).join('')}
      </div>` : ''}
  </div>
  <!-- Main Content -->
  <div style="padding:40px 30px;color:#111827">
    ${resume.summary?.is_visible && resume.summary?.text ? `<div class="resume-section" style="margin-bottom:${density.sectionGap}"><h2 style="font-size:${density.section};font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">SUMMARY</h2><p style="font-size:${density.body};line-height:${density.lineHeight};color:#374151">${escapeHtml(resume.summary.text)}</p></div>` : ''}
    ${resume.work_experiences.length > 0 ? `<div class="resume-section" style="margin-bottom:${density.sectionGap}"><h2 style="font-size:${density.section};font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">EXPERIENCE</h2>${resume.work_experiences.map((exp) => `<div class="experience-entry" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:baseline"><div><strong style="font-size:${density.heading}">${escapeHtml(exp.job_title)}</strong> <span style="color:#6b7280;font-size:${density.heading}">· ${escapeHtml(exp.company)}</span></div><span style="font-size:${density.body};color:#6b7280">${dateRange(exp.start_date, exp.end_date, df)}</span></div>${exp.location ? `<div style="font-size:${density.body};color:#9ca3af">${escapeHtml(exp.location)}</div>` : ''}${(exp.achievements?.length ?? 0) > 0 ? `<ul style="margin:4px 0 0;padding-left:16px;list-style:disc">${exp.achievements!.map((a) => `<li style="font-size:${density.body};line-height:${density.lineHeight};color:#374151;margin-bottom:2px">${escapeHtml(a.text)}</li>`).join('')}</ul>` : ''}</div>`).join('')}</div>` : ''}
    ${resume.projects.length > 0 ? `<div class="resume-section" style="margin-bottom:${density.sectionGap}"><h2 style="font-size:${density.section};font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">PROJECTS</h2>${resume.projects.map((proj) => `<div class="experience-entry" style="margin-bottom:8px"><strong style="font-size:${density.heading}">${escapeHtml(proj.name)}</strong>${proj.description ? `<div style="font-size:${density.body};color:#374151;margin-top:2px">${escapeHtml(proj.description)}</div>` : ''}${(proj.achievements?.length ?? 0) > 0 ? `<ul style="margin:4px 0 0;padding-left:16px;list-style:disc">${proj.achievements!.map((a) => `<li style="font-size:${density.body};line-height:${density.lineHeight};color:#374151;margin-bottom:2px">${escapeHtml(a.text)}</li>`).join('')}</ul>` : ''}</div>`).join('')}</div>` : ''}
  </div>
</div>
</body>
</html>`
}

function generateExperiencedHtml(resume: ResumeWithRelations, ci: ResumeWithRelations['contact_info'], df: DateFormat, accentColor: string, backgroundColor: string, fontFamily: string, fontImportUrl: string, density: { body: string; heading: string; section: string; lineHeight: string; sectionGap: string }, sectionOrder: string[]): string {
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
<div style="padding:0.5in">
  <!-- Full-width header -->
  <div style="margin-bottom:16px;border-bottom:1px solid #d1d5db;padding-bottom:12px">
    <h1 style="font-size:26px;font-weight:700">${escapeHtml(ci?.full_name || '')}</h1>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;font-size:${density.body};color:#6b7280">
      ${ci?.email ? `<span>${escapeHtml(ci.email)}</span>` : ''}
      ${ci?.phone ? `<span>· ${escapeHtml(ci.phone)}</span>` : ''}
      ${(ci?.city || ci?.country) ? `<span>· ${[ci?.city, ci?.country].filter(Boolean).map(s => escapeHtml(s!)).join(', ')}</span>` : ''}
      ${ci?.linkedin_url ? `<span>· <a href="${ci.linkedin_url}" style="color:${accentColor};text-decoration:none">${escapeHtml(ci.linkedin_url.replace(/https?:\/\/(www\.)?/, ''))}</a></span>` : ''}
    </div>
  </div>
  <!-- Two columns -->
  <div style="display:grid;grid-template-columns:25% 75%;gap:0">
    <!-- Left column -->
    <div style="border-right:1px solid #d1d5db;padding-right:16px">
      ${resume.skill_categories.length > 0 ? `<div class="resume-section" style="margin-bottom:${density.sectionGap}"><h2 style="font-size:${density.section};font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">SKILLS</h2>${resume.skill_categories.map((cat) => `<div style="margin-bottom:6px"><div style="font-weight:600;font-size:${density.body}">${escapeHtml(cat.name)}</div><div style="font-size:${density.body};color:#6b7280">${cat.skills.map(escapeHtml).join(', ')}</div></div>`).join('')}</div>` : ''}
      ${resume.education.length > 0 ? `<div class="resume-section" style="margin-bottom:${density.sectionGap}"><h2 style="font-size:${density.section};font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">EDUCATION</h2>${resume.education.map((edu) => `<div class="experience-entry" style="margin-bottom:6px"><div style="font-weight:600;font-size:${density.body}">${escapeHtml(edu.degree)}</div><div style="font-size:${density.body};color:#6b7280">${escapeHtml(edu.institution)}</div></div>`).join('')}</div>` : ''}
      ${resume.certifications.length > 0 ? `<div class="resume-section"><h2 style="font-size:${density.section};font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">CERTIFICATIONS</h2>${resume.certifications.map((cert) => `<div class="experience-entry" style="margin-bottom:4px;font-size:${density.body}"><strong>${escapeHtml(cert.name)}</strong>${cert.issuer ? `<div style="color:#6b7280">${escapeHtml(cert.issuer)}</div>` : ''}</div>`).join('')}</div>` : ''}
    </div>
    <!-- Right column -->
    <div style="padding-left:16px">
      ${resume.summary?.is_visible && resume.summary?.text ? `<div class="resume-section" style="margin-bottom:${density.sectionGap}"><h2 style="font-size:${density.section};font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">SUMMARY</h2><p style="font-size:${density.body};line-height:${density.lineHeight};color:#374151">${escapeHtml(resume.summary.text)}</p></div>` : ''}
      ${resume.work_experiences.length > 0 ? `<div class="resume-section" style="margin-bottom:${density.sectionGap}"><h2 style="font-size:${density.section};font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">EXPERIENCE</h2>${resume.work_experiences.map((exp) => `<div class="experience-entry" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between"><div><strong style="font-size:${density.heading}">${escapeHtml(exp.job_title)}</strong> · <span style="color:#6b7280;font-size:${density.heading}">${escapeHtml(exp.company)}</span></div><span style="font-size:${density.body};color:#6b7280">${dateRange(exp.start_date, exp.end_date, df)}</span></div>${(exp.achievements?.length ?? 0) > 0 ? `<ul style="margin:4px 0 0;padding-left:16px;list-style:disc">${exp.achievements!.map((a) => `<li style="font-size:${density.body};line-height:${density.lineHeight};color:#374151;margin-bottom:2px">${escapeHtml(a.text)}</li>`).join('')}</ul>` : ''}</div>`).join('')}</div>` : ''}
      ${resume.projects.length > 0 ? `<div class="resume-section"><h2 style="font-size:${density.section};font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">PROJECTS</h2>${resume.projects.map((proj) => `<div class="experience-entry" style="margin-bottom:8px"><strong style="font-size:${density.heading}">${escapeHtml(proj.name)}</strong>${proj.description ? `<div style="font-size:${density.body};color:#374151;margin-top:2px">${escapeHtml(proj.description)}</div>` : ''}${(proj.achievements?.length ?? 0) > 0 ? `<ul style="margin:4px 0 0;padding-left:16px;list-style:disc">${proj.achievements!.map((a) => `<li style="font-size:${density.body};line-height:${density.lineHeight};color:#374151;margin-bottom:2px">${escapeHtml(a.text)}</li>`).join('')}</ul>` : ''}</div>`).join('')}</div>` : ''}
    </div>
  </div>
</div>
</body>
</html>`
}
