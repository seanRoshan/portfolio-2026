import type { ResumeWithRelations } from '@/types/resume-builder'
import { getDateRange, getVisibleSections, getContactLinks, getTemplateStyles, visibleExperiences, TEMPLATE_IDS } from './shared'

interface Props {
  resume: ResumeWithRelations
}

export function MonoTemplate({ resume }: Props) {
  const ci = resume.contact_info
  const dateFormat = resume.settings?.date_format ?? 'month_year'
  const sections = getVisibleSections(resume)
  const links = getContactLinks(resume)
  const { accent, font, density, margin, nameSize, uppercase } = getTemplateStyles(resume.settings, TEMPLATE_IDS.mono)

  const sectionRenderers: Record<string, () => React.ReactNode> = {
    contact: () => null,
    summary: () =>
      resume.summary?.is_visible && resume.summary?.text ? (
        <Section title="SUMMARY" accent={accent} font={font} sectionSize={density.section} sectionGap={density.sectionGap} uppercase={uppercase}>
          <p style={{ lineHeight: density.lineHeight, color: '#000', margin: 0, fontFamily: font, fontSize: density.body }}>
            {resume.summary.text}
          </p>
        </Section>
      ) : null,
    experience: () => {
      const exps = visibleExperiences(resume)
      return exps.length > 0 ? (
        <Section title="EXPERIENCE" accent={accent} font={font} sectionSize={density.section} sectionGap={density.sectionGap} uppercase={uppercase}>
          {exps.map((exp) => (
            <div key={exp.id} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: density.heading, fontFamily: font }}>{exp.job_title}</span>
                  <span style={{ color: '#000', fontSize: density.heading, fontFamily: font }}> | {exp.company}</span>
                </div>
                <span style={{ fontSize: density.body, color: '#000', whiteSpace: 'nowrap', fontFamily: font }}>
                  {getDateRange(exp.start_date, exp.end_date, dateFormat)}
                </span>
              </div>
              {exp.location && (
                <div style={{ fontSize: density.body, color: '#555', fontFamily: font }}>{exp.location}</div>
              )}
              {exp.achievements && exp.achievements.length > 0 && (
                <ul style={{ margin: '3px 0 0', paddingLeft: '16px', listStyleType: '"- "' }}>
                  {exp.achievements.map((a) => (
                    <li key={a.id} style={{ fontSize: density.body, lineHeight: density.lineHeight, color: '#000', marginBottom: '1px', fontFamily: font }}>
                      {a.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      ) : null
    },
    education: () =>
      resume.education.length > 0 ? (
        <Section title="EDUCATION" accent={accent} font={font} sectionSize={density.section} sectionGap={density.sectionGap} uppercase={uppercase}>
          {resume.education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: density.heading, fontFamily: font }}>{edu.degree}</span>
                  {edu.field_of_study && <span style={{ fontSize: density.heading, fontFamily: font }}> in {edu.field_of_study}</span>}
                </div>
                <span style={{ fontSize: density.body, color: '#000', whiteSpace: 'nowrap', fontFamily: font }}>
                  {edu.graduation_date ? getDateRange(null, edu.graduation_date, dateFormat).replace('Present – ', '') : ''}
                </span>
              </div>
              <div style={{ fontSize: density.body, color: '#555', fontFamily: font }}>{edu.institution}</div>
              {edu.gpa && <div style={{ fontSize: density.body, color: '#555', fontFamily: font }}>GPA: {edu.gpa}</div>}
              {edu.honors && <div style={{ fontSize: density.body, color: '#555', fontFamily: font }}>{edu.honors}</div>}
            </div>
          ))}
        </Section>
      ) : null,
    skills: () =>
      resume.skill_categories.length > 0 ? (
        <Section title="SKILLS" accent={accent} font={font} sectionSize={density.section} sectionGap={density.sectionGap} uppercase={uppercase}>
          {resume.skill_categories.map((cat) => (
            <div key={cat.id} style={{ marginBottom: '3px', fontSize: density.body, fontFamily: font }}>
              <span style={{ fontWeight: 700 }}>{cat.name}: </span>
              <span>{cat.skills.join(', ')}</span>
            </div>
          ))}
        </Section>
      ) : null,
    projects: () =>
      resume.projects.length > 0 ? (
        <Section title="PROJECTS" accent={accent} font={font} sectionSize={density.section} sectionGap={density.sectionGap} uppercase={uppercase}>
          {resume.projects.map((proj) => (
            <div key={proj.id} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: density.heading, fontFamily: font }}>{proj.name}</span>
                {proj.project_url && (
                  <a href={proj.project_url} style={{ fontSize: '9px', color: accent, textDecoration: 'none', fontFamily: font }}>
                    {proj.project_url.replace(/https?:\/\//, '')}
                  </a>
                )}
              </div>
              {proj.description && (
                <div style={{ fontSize: density.body, color: '#000', marginTop: '1px', fontFamily: font }}>{proj.description}</div>
              )}
              {proj.achievements && proj.achievements.length > 0 && (
                <ul style={{ margin: '3px 0 0', paddingLeft: '16px', listStyleType: '"- "' }}>
                  {proj.achievements.map((a) => (
                    <li key={a.id} style={{ fontSize: density.body, lineHeight: density.lineHeight, color: '#000', marginBottom: '1px', fontFamily: font }}>
                      {a.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      ) : null,
    certifications: () =>
      resume.certifications.length > 0 ? (
        <Section title="CERTIFICATIONS" accent={accent} font={font} sectionSize={density.section} sectionGap={density.sectionGap} uppercase={uppercase}>
          {resume.certifications.map((cert) => (
            <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: density.body, fontFamily: font }}>
              <span>
                <span style={{ fontWeight: 700 }}>{cert.name}</span>
                {cert.issuer && <span style={{ color: '#555' }}> -- {cert.issuer}</span>}
              </span>
              {cert.date && (
                <span style={{ fontSize: density.body }}>
                  {getDateRange(null, cert.date, dateFormat).replace('Present – ', '')}
                </span>
              )}
            </div>
          ))}
        </Section>
      ) : null,
    extracurriculars: () =>
      resume.extracurriculars.length > 0 ? (
        <Section title="ACTIVITIES" accent={accent} font={font} sectionSize={density.section} sectionGap={density.sectionGap} uppercase={uppercase}>
          {resume.extracurriculars.map((item) => (
            <div key={item.id} style={{ marginBottom: '3px', fontSize: density.body, fontFamily: font }}>
              <span style={{ fontWeight: 700 }}>{item.title}</span>
              {item.description && <span style={{ color: '#555' }}> -- {item.description}</span>}
            </div>
          ))}
        </Section>
      ) : null,
  }

  return (
    <div
      style={{
        fontFamily: font,
        color: '#000',
        padding: margin,
        fontSize: density.body,
        lineHeight: density.lineHeight,
        background: '#fff',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: density.sectionGap }}>
        <div style={{ fontSize: `${nameSize}px`, fontWeight: 700, fontFamily: font, letterSpacing: '-0.5px' }}>
          {ci?.full_name || 'Your Name'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px', fontSize: density.body, color: '#555', fontFamily: font }}>
          {ci?.email && <span>{ci.email}</span>}
          {ci?.phone && <span>| {ci.phone}</span>}
          {(ci?.city || ci?.state || ci?.country) && <span>| {[ci?.city, ci?.state, ci?.country].filter(Boolean).join(', ')}</span>}
          {links.map((link, i) => (
            <span key={i}>
              | <a href={link.url} style={{ color: accent, textDecoration: 'none', fontFamily: font }}>
                {link.url.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              </a>
            </span>
          ))}
        </div>
        <div style={{ marginTop: '8px', fontSize: density.body, color: accent, fontFamily: font, letterSpacing: '0.5px' }}>
          {'─'.repeat(80)}
        </div>
      </div>

      {/* Sections */}
      {sections.filter((s) => s !== 'contact').map((sectionId) => {
        const renderer = sectionRenderers[sectionId]
        return renderer ? <div key={sectionId}>{renderer()}</div> : null
      })}
    </div>
  )
}

function Section({ title, accent, font, sectionSize, sectionGap, uppercase, children }: { title: string; accent: string; font: string; sectionSize: string; sectionGap: string; uppercase: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: sectionGap }}>
      <div style={{ marginBottom: '4px' }}>
        <span style={{
          fontSize: sectionSize,
          fontWeight: 700,
          textTransform: uppercase ? 'uppercase' : 'none',
          letterSpacing: '1px',
          fontFamily: font,
          color: accent,
        }}>
          {title}
        </span>
        <div style={{ fontSize: '9.5px', color: accent, fontFamily: font, letterSpacing: '0.5px', marginTop: '1px' }}>
          {'─'.repeat(80)}
        </div>
      </div>
      {children}
    </div>
  )
}
