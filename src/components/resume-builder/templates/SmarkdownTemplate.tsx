import type { ResumeWithRelations } from '@/types/resume-builder'
import { getDateRange, getVisibleSections, getContactLinks, getTemplateStyles, visibleExperiences, TEMPLATE_IDS } from './shared'

interface Props {
  resume: ResumeWithRelations
}

export function SmarkdownTemplate({ resume }: Props) {
  const ci = resume.contact_info
  const dateFormat = resume.settings?.date_format ?? 'month_year'
  const sections = getVisibleSections(resume)
  const links = getContactLinks(resume)
  const { accent, font, density, margin, nameSize, uppercase } = getTemplateStyles(resume.settings, TEMPLATE_IDS.smarkdown)

  const sectionRenderers: Record<string, () => React.ReactNode> = {
    contact: () => null,
    summary: () =>
      resume.summary?.is_visible && resume.summary?.text ? (
        <Section title="Summary" accent={accent} sectionSize={density.section} sectionGap={density.sectionGap} uppercase={uppercase}>
          <p style={{ lineHeight: density.lineHeight, color: '#333', margin: 0, fontSize: density.body }}>
            {resume.summary.text}
          </p>
        </Section>
      ) : null,
    experience: () => {
      const exps = visibleExperiences(resume)
      return exps.length > 0 ? (
        <Section title="Experience" accent={accent} sectionSize={density.section} sectionGap={density.sectionGap} uppercase={uppercase}>
          {exps.map((exp) => (
            <div key={exp.id} style={{ marginBottom: density.sectionGap }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: density.heading }}>{exp.job_title}</span>
                  <span style={{ color: '#555', fontSize: density.heading }}> at {exp.company}</span>
                </div>
                <span style={{ fontSize: density.body, color: '#777', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                  {getDateRange(exp.start_date, exp.end_date, dateFormat)}
                </span>
              </div>
              {exp.location && (
                <div style={{ fontSize: density.body, color: '#999' }}>{exp.location}</div>
              )}
              {exp.achievements && exp.achievements.length > 0 && (
                <ul style={{ margin: '4px 0 0', paddingLeft: '20px', listStyleType: 'disc' }}>
                  {exp.achievements.map((a) => (
                    <li key={a.id} style={{ fontSize: density.body, lineHeight: density.lineHeight, color: '#333', marginBottom: '2px' }}>
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
        <Section title="Education" accent={accent} sectionSize={density.section} sectionGap={density.sectionGap} uppercase={uppercase}>
          {resume.education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: density.heading }}>{edu.degree}</span>
                  {edu.field_of_study && <span style={{ color: '#555', fontSize: density.heading }}> in {edu.field_of_study}</span>}
                </div>
                <span style={{ fontSize: density.body, color: '#777', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                  {edu.graduation_date ? getDateRange(null, edu.graduation_date, dateFormat).replace('Present – ', '') : ''}
                </span>
              </div>
              <div style={{ fontSize: density.body, color: '#555' }}>{edu.institution}</div>
              {edu.gpa && <div style={{ fontSize: density.body, color: '#999' }}>GPA: {edu.gpa}</div>}
              {edu.honors && <div style={{ fontSize: density.body, color: '#999' }}>{edu.honors}</div>}
            </div>
          ))}
        </Section>
      ) : null,
    skills: () =>
      resume.skill_categories.length > 0 ? (
        <Section title="Skills" accent={accent} sectionSize={density.section} sectionGap={density.sectionGap} uppercase={uppercase}>
          {resume.skill_categories.map((cat) => (
            <div key={cat.id} style={{ marginBottom: '4px', fontSize: density.body }}>
              <span style={{ fontWeight: 700 }}>{cat.name}: </span>
              <span style={{ color: '#333' }}>{cat.skills.join(', ')}</span>
            </div>
          ))}
        </Section>
      ) : null,
    projects: () =>
      resume.projects.length > 0 ? (
        <Section title="Projects" accent={accent} sectionSize={density.section} sectionGap={density.sectionGap} uppercase={uppercase}>
          {resume.projects.map((proj) => (
            <div key={proj.id} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: density.heading }}>{proj.name}</span>
                {proj.project_url && (
                  <a href={proj.project_url} style={{ fontSize: '9.5px', color: accent, textDecoration: 'none' }}>
                    [{proj.project_url.replace(/https?:\/\//, '')}]
                  </a>
                )}
              </div>
              {proj.description && (
                <div style={{ fontSize: density.body, color: '#333', marginTop: '2px' }}>{proj.description}</div>
              )}
              {proj.achievements && proj.achievements.length > 0 && (
                <ul style={{ margin: '4px 0 0', paddingLeft: '20px', listStyleType: 'disc' }}>
                  {proj.achievements.map((a) => (
                    <li key={a.id} style={{ fontSize: density.body, lineHeight: density.lineHeight, color: '#333', marginBottom: '2px' }}>
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
        <Section title="Certifications" accent={accent} sectionSize={density.section} sectionGap={density.sectionGap} uppercase={uppercase}>
          {resume.certifications.map((cert) => (
            <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: density.body }}>
              <span>
                <span style={{ fontWeight: 700 }}>{cert.name}</span>
                {cert.issuer && <span style={{ color: '#555' }}> - {cert.issuer}</span>}
              </span>
              {cert.date && (
                <span style={{ color: '#777', fontSize: density.body, fontStyle: 'italic' }}>
                  {getDateRange(null, cert.date, dateFormat).replace('Present – ', '')}
                </span>
              )}
            </div>
          ))}
        </Section>
      ) : null,
    extracurriculars: () =>
      resume.extracurriculars.length > 0 ? (
        <Section title="Activities" accent={accent} sectionSize={density.section} sectionGap={density.sectionGap} uppercase={uppercase}>
          {resume.extracurriculars.map((item) => (
            <div key={item.id} style={{ marginBottom: '4px', fontSize: density.body }}>
              <span style={{ fontWeight: 700 }}>{item.title}</span>
              {item.description && <span style={{ color: '#555' }}> - {item.description}</span>}
            </div>
          ))}
        </Section>
      ) : null,
  }

  return (
    <div
      style={{
        fontFamily: font,
        color: '#222',
        padding: margin,
        fontSize: density.body,
        lineHeight: density.lineHeight,
        background: '#fff',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: density.sectionGap }}>
        <h1 style={{
          fontSize: `${nameSize}px`,
          fontWeight: 700,
          margin: 0,
          paddingBottom: '6px',
          borderBottom: `3px solid ${accent}`,
          display: 'inline-block',
        }}>
          {ci?.full_name || 'Your Name'}
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', fontSize: density.body, color: '#555' }}>
          {ci?.email && (
            <a href={`mailto:${ci.email}`} style={{ color: accent, textDecoration: 'none' }}>{ci.email}</a>
          )}
          {ci?.phone && <span>| {ci.phone}</span>}
          {(ci?.city || ci?.state || ci?.country) && <span>| {[ci?.city, ci?.state, ci?.country].filter(Boolean).join(', ')}</span>}
          {links.map((link, i) => (
            <span key={i}>
              | <a href={link.url} style={{ color: accent, textDecoration: 'none' }}>
                {link.url.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              </a>
            </span>
          ))}
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

function Section({ title, accent, sectionSize, sectionGap, uppercase, children }: { title: string; accent: string; sectionSize: string; sectionGap: string; uppercase: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: sectionGap }}>
      <h2 style={{
        fontSize: sectionSize,
        fontWeight: 700,
        marginBottom: '8px',
        color: '#222',
        paddingBottom: '3px',
        borderBottom: '1px solid #d1d5db',
      }}>
        <span style={{ color: accent, fontWeight: 400, marginRight: '4px' }}>##</span>
        <span style={{ textTransform: uppercase ? 'uppercase' : 'none' }}>{title}</span>
      </h2>
      {children}
    </div>
  )
}
