import type { ResumeWithRelations } from '@/types/resume-builder'
import { getDateRange, getVisibleSections, getContactLinks, getTemplateStyles, visibleExperiences, TEMPLATE_IDS } from './shared'

interface Props {
  resume: ResumeWithRelations
}

/* Sections that render in the LEFT column */
const LEFT_SECTIONS = new Set(['contact', 'skills', 'education', 'certifications'])

export function ExperiencedTemplate({ resume }: Props) {
  const ci = resume.contact_info
  const dateFormat = resume.settings?.date_format ?? 'month_year'
  const sections = getVisibleSections(resume)
  const links = getContactLinks(resume)
  const { accent, background, font, density, margin, nameSize, uppercase, sidebarColors } = getTemplateStyles(resume.settings, TEMPLATE_IDS.experienced)

  const leftBg = background

  /* ---- left column renderers ---- */
  const leftRenderers: Record<string, () => React.ReactNode> = {
    contact: () => null, // rendered in left column header area
    skills: () =>
      resume.skill_categories.length > 0 ? (
        <LeftSection title="Skills" accent={accent} uppercase={uppercase} sectionSize={density.section}>
          {resume.skill_categories.map((cat) => (
            <div key={cat.id} style={{ marginBottom: '6px' }}>
              <div style={{ fontWeight: 700, fontSize: density.heading, textTransform: 'uppercase', letterSpacing: '0.3px', color: sidebarColors.primary, marginBottom: '2px' }}>
                {cat.name}
              </div>
              <div style={{ fontSize: density.body, color: sidebarColors.secondary, lineHeight: density.lineHeight }}>
                {cat.skills.join(', ')}
              </div>
            </div>
          ))}
        </LeftSection>
      ) : null,
    education: () =>
      resume.education.length > 0 ? (
        <LeftSection title="Education" accent={accent} uppercase={uppercase} sectionSize={density.section}>
          {resume.education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 700, fontSize: density.heading, color: sidebarColors.primary }}>{edu.degree}</div>
              {edu.field_of_study && (
                <div style={{ fontSize: density.body, color: sidebarColors.secondary }}>{edu.field_of_study}</div>
              )}
              <div style={{ fontSize: density.body, color: sidebarColors.secondary }}>{edu.institution}</div>
              {edu.graduation_date && (
                <div style={{ fontSize: density.body, color: sidebarColors.muted, marginTop: '2px' }}>
                  {getDateRange(null, edu.graduation_date, dateFormat).replace('Present – ', '')}
                </div>
              )}
              {edu.gpa && <div style={{ fontSize: density.body, color: sidebarColors.muted }}>GPA: {edu.gpa}</div>}
              {edu.honors && <div style={{ fontSize: density.body, color: sidebarColors.muted }}>{edu.honors}</div>}
            </div>
          ))}
        </LeftSection>
      ) : null,
    certifications: () =>
      resume.certifications.length > 0 ? (
        <LeftSection title="Certifications" accent={accent} uppercase={uppercase} sectionSize={density.section}>
          {resume.certifications.map((cert) => (
            <div key={cert.id} style={{ marginBottom: '6px' }}>
              <div style={{ fontWeight: 700, fontSize: density.heading, color: sidebarColors.primary }}>{cert.name}</div>
              {cert.issuer && <div style={{ fontSize: density.body, color: sidebarColors.secondary }}>{cert.issuer}</div>}
              {cert.date && (
                <div style={{ fontSize: density.body, color: sidebarColors.muted }}>
                  {getDateRange(null, cert.date, dateFormat).replace('Present – ', '')}
                </div>
              )}
            </div>
          ))}
        </LeftSection>
      ) : null,
  }

  /* ---- right column renderers ---- */
  const rightRenderers: Record<string, () => React.ReactNode> = {
    summary: () =>
      resume.summary?.is_visible && resume.summary?.text ? (
        <RightSection title="Professional Summary" accent={accent} sectionSize={density.section} sectionGap={density.sectionGap} uppercase={uppercase}>
          <p style={{ lineHeight: density.lineHeight, color: '#374151', margin: 0, fontSize: density.body }}>
            {resume.summary.text}
          </p>
        </RightSection>
      ) : null,
    experience: () => {
      const exps = visibleExperiences(resume)
      return exps.length > 0 ? (
        <RightSection title="Work Experience" accent={accent} sectionSize={density.section} sectionGap={density.sectionGap} uppercase={uppercase}>
          {exps.map((exp) => (
            <div key={exp.id} style={{ marginBottom: density.sectionGap }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: density.heading, color: '#111827' }}>{exp.job_title}</span>
                  <span style={{ color: '#6b7280', fontSize: density.heading }}> | {exp.company}</span>
                </div>
                <span style={{ fontSize: density.body, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                  {getDateRange(exp.start_date, exp.end_date, dateFormat)}
                </span>
              </div>
              {exp.location && (
                <div style={{ fontSize: density.body, color: '#9ca3af' }}>{exp.location}</div>
              )}
              {exp.achievements && exp.achievements.length > 0 && (
                <ul style={{ margin: '4px 0 0', paddingLeft: '18px', listStyleType: 'disc' }}>
                  {exp.achievements.map((a) => (
                    <li key={a.id} style={{ fontSize: density.body, lineHeight: density.lineHeight, color: '#374151', marginBottom: '2px' }}>
                      {a.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </RightSection>
      ) : null
    },
    projects: () =>
      resume.projects.length > 0 ? (
        <RightSection title="Projects" accent={accent} sectionSize={density.section} sectionGap={density.sectionGap} uppercase={uppercase}>
          {resume.projects.map((proj) => (
            <div key={proj.id} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: density.heading, color: '#111827' }}>{proj.name}</span>
                {proj.project_url && (
                  <a href={proj.project_url} style={{ fontSize: '9px', color: accent, textDecoration: 'none' }}>
                    {proj.project_url.replace(/https?:\/\//, '')}
                  </a>
                )}
              </div>
              {proj.description && (
                <div style={{ fontSize: density.body, color: '#374151', marginTop: '2px' }}>{proj.description}</div>
              )}
              {proj.achievements && proj.achievements.length > 0 && (
                <ul style={{ margin: '4px 0 0', paddingLeft: '18px', listStyleType: 'disc' }}>
                  {proj.achievements.map((a) => (
                    <li key={a.id} style={{ fontSize: density.body, lineHeight: density.lineHeight, color: '#374151', marginBottom: '2px' }}>
                      {a.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </RightSection>
      ) : null,
    extracurriculars: () =>
      resume.extracurriculars.length > 0 ? (
        <RightSection title="Activities" accent={accent} sectionSize={density.section} sectionGap={density.sectionGap} uppercase={uppercase}>
          {resume.extracurriculars.map((item) => (
            <div key={item.id} style={{ marginBottom: '4px', fontSize: density.body }}>
              <span style={{ fontWeight: 700 }}>{item.title}</span>
              {item.description && <span style={{ color: '#6b7280' }}> - {item.description}</span>}
            </div>
          ))}
        </RightSection>
      ) : null,
  }

  const leftSections = sections.filter((s) => LEFT_SECTIONS.has(s) && s !== 'contact')
  const rightSections = sections.filter((s) => !LEFT_SECTIONS.has(s))

  return (
    <div
      style={{
        fontFamily: font,
        color: '#111827',
        fontSize: density.body,
        lineHeight: density.lineHeight,
        background: '#fff',
        minHeight: '11in',
      }}
    >
      {/* FULL-WIDTH HEADER */}
      <div
        style={{
          padding: `${margin} 0.7in calc(${margin} - 0.2in)`,
          borderBottom: `2px solid ${accent}`,
        }}
      >
        <h1 style={{ fontSize: `${nameSize}px`, fontWeight: 800, margin: 0, color: '#111827', letterSpacing: '-0.5px' }}>
          {ci?.full_name || 'Your Name'}
        </h1>
        {resume.target_role && (
          <div style={{ fontSize: density.section, color: accent, marginTop: '2px', fontWeight: 500 }}>
            {resume.target_role}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '6px', fontSize: density.body, color: '#6b7280' }}>
          {ci?.email && <span>{ci.email}</span>}
          {ci?.phone && <span>|  {ci.phone}</span>}
          {(ci?.city || ci?.state || ci?.country) && <span>|  {[ci?.city, ci?.state, ci?.country].filter(Boolean).join(', ')}</span>}
          {links.map((link, i) => (
            <span key={i}>
              |  <a href={link.url} style={{ color: accent, textDecoration: 'none' }}>
                {link.url.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              </a>
            </span>
          ))}
        </div>
      </div>

      {/* TWO-COLUMN BODY */}
      <div style={{ display: 'flex' }}>
        {/* LEFT COLUMN - 25% */}
        <div
          style={{
            width: '25%',
            backgroundColor: leftBg,
            padding: `0.15in 0.45in ${margin} 0.7in`,
            boxSizing: 'border-box',
            borderRight: `1px solid #d1d5db`,
            flexShrink: 0,
          }}
        >
          {leftSections.map((sectionId) => {
            const renderer = leftRenderers[sectionId]
            return renderer ? <div key={sectionId}>{renderer()}</div> : null
          })}
        </div>

        {/* RIGHT COLUMN - 75% */}
        <div
          style={{
            width: '75%',
            padding: `0.15in 0.7in ${margin} 0.55in`,
            boxSizing: 'border-box',
          }}
        >
          {rightSections.map((sectionId) => {
            const renderer = rightRenderers[sectionId]
            return renderer ? <div key={sectionId}>{renderer()}</div> : null
          })}
        </div>
      </div>
    </div>
  )
}

function LeftSection({ title, accent, uppercase, sectionSize, children }: { title: string; accent: string; uppercase?: boolean; sectionSize?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <h2 style={{
        fontSize: sectionSize ?? '10px',
        fontWeight: 700,
        textTransform: uppercase ? 'uppercase' : 'none',
        letterSpacing: '1.5px',
        color: accent,
        marginBottom: '8px',
        paddingBottom: '4px',
        borderBottom: `1px solid ${accent}`,
      }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function RightSection({ title, accent, sectionSize, sectionGap, uppercase, children }: { title: string; accent: string; sectionSize: string; sectionGap: string; uppercase?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: sectionGap }}>
      <h2 style={{
        fontSize: sectionSize,
        fontWeight: 700,
        textTransform: uppercase ? 'uppercase' : 'none',
        letterSpacing: '1px',
        marginBottom: '8px',
        color: accent,
        paddingBottom: '4px',
        borderBottom: `1px solid ${accent}`,
      }}>
        {title}
      </h2>
      {children}
    </div>
  )
}
