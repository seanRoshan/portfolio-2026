import type { ResumeWithRelations } from '@/types/resume-builder'
import { getDateRange, getVisibleSections, getContactLinks, getTemplateStyles } from './shared'

interface Props {
  resume: ResumeWithRelations
}

export function PragmaticTemplate({ resume }: Props) {
  const ci = resume.contact_info
  const dateFormat = resume.settings?.date_format ?? 'month_year'
  const sections = getVisibleSections(resume)
  const links = getContactLinks(resume)
  const { accent, font, density } = getTemplateStyles(resume.settings)

  const sectionRenderers: Record<string, () => React.ReactNode> = {
    contact: () => null, // Rendered in header
    summary: () =>
      resume.summary?.is_visible && resume.summary?.text ? (
        <Section title="SUMMARY" accent={accent} sectionSize={density.section} sectionGap={density.sectionGap}>
          <p style={{ lineHeight: density.lineHeight, color: '#374151', fontSize: density.body }}>
            {resume.summary.text}
          </p>
        </Section>
      ) : null,
    experience: () =>
      resume.work_experiences.length > 0 ? (
        <Section title="EXPERIENCE" accent={accent} sectionSize={density.section} sectionGap={density.sectionGap}>
          {resume.work_experiences.map((exp) => (
            <div key={exp.id} style={{ marginBottom: density.sectionGap }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: density.heading }}>{exp.job_title}</span>
                  <span style={{ color: '#6b7280', fontSize: density.heading }}> · {exp.company}</span>
                </div>
                <span style={{ fontSize: density.body, color: '#6b7280', whiteSpace: 'nowrap' }}>
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
        </Section>
      ) : null,
    education: () =>
      resume.education.length > 0 ? (
        <Section title="EDUCATION" accent={accent} sectionSize={density.section} sectionGap={density.sectionGap}>
          {resume.education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: density.heading }}>{edu.degree}</span>
                  {edu.field_of_study && <span style={{ color: '#6b7280', fontSize: density.heading }}> in {edu.field_of_study}</span>}
                </div>
                <span style={{ fontSize: density.body, color: '#6b7280', whiteSpace: 'nowrap' }}>
                  {edu.graduation_date ? getDateRange(null, edu.graduation_date, dateFormat).replace('Present – ', '') : ''}
                </span>
              </div>
              <div style={{ fontSize: density.body, color: '#6b7280' }}>{edu.institution}</div>
              {edu.gpa && <div style={{ fontSize: density.body, color: '#9ca3af' }}>GPA: {edu.gpa}</div>}
              {edu.honors && <div style={{ fontSize: density.body, color: '#9ca3af' }}>{edu.honors}</div>}
            </div>
          ))}
        </Section>
      ) : null,
    skills: () =>
      resume.skill_categories.length > 0 ? (
        <Section title="SKILLS" accent={accent} sectionSize={density.section} sectionGap={density.sectionGap}>
          {resume.skill_categories.map((cat) => (
            <div key={cat.id} style={{ marginBottom: '4px', fontSize: density.body }}>
              <span style={{ fontWeight: 600 }}>{cat.name}: </span>
              <span style={{ color: '#374151' }}>{cat.skills.join(', ')}</span>
            </div>
          ))}
        </Section>
      ) : null,
    projects: () =>
      resume.projects.length > 0 ? (
        <Section title="PROJECTS" accent={accent} sectionSize={density.section} sectionGap={density.sectionGap}>
          {resume.projects.map((proj) => (
            <div key={proj.id} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: density.heading }}>{proj.name}</span>
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
        </Section>
      ) : null,
    certifications: () =>
      resume.certifications.length > 0 ? (
        <Section title="CERTIFICATIONS" accent={accent} sectionSize={density.section} sectionGap={density.sectionGap}>
          {resume.certifications.map((cert) => (
            <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: density.body }}>
              <span>
                <span style={{ fontWeight: 600 }}>{cert.name}</span>
                {cert.issuer && <span style={{ color: '#6b7280' }}> – {cert.issuer}</span>}
              </span>
              {cert.date && (
                <span style={{ color: '#6b7280', fontSize: density.body }}>
                  {getDateRange(null, cert.date, dateFormat).replace('Present – ', '')}
                </span>
              )}
            </div>
          ))}
        </Section>
      ) : null,
    extracurriculars: () =>
      resume.extracurriculars.length > 0 ? (
        <Section title="ACTIVITIES" accent={accent} sectionSize={density.section} sectionGap={density.sectionGap}>
          {resume.extracurriculars.map((item) => (
            <div key={item.id} style={{ marginBottom: '4px', fontSize: density.body }}>
              <span style={{ fontWeight: 600 }}>{item.title}</span>
              {item.description && <span style={{ color: '#6b7280' }}> – {item.description}</span>}
            </div>
          ))}
        </Section>
      ) : null,
  }

  return (
    <div
      style={{
        fontFamily: font,
        color: '#111827',
        padding: '1in',
        fontSize: density.body,
        lineHeight: density.lineHeight,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: density.sectionGap }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
          {ci?.full_name || 'Your Name'}
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px', fontSize: density.body, color: '#6b7280' }}>
          {ci?.email && <span>{ci.email}</span>}
          {ci?.phone && <span>· {ci.phone}</span>}
          {(ci?.city || ci?.country) && <span>· {[ci?.city, ci?.country].filter(Boolean).join(', ')}</span>}
          {links.map((link, i) => (
            <span key={i}>
              · <a href={link.url} style={{ color: accent, textDecoration: 'none' }}>
                {link.url.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              </a>
            </span>
          ))}
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #d1d5db', marginTop: '12px' }} />
      </div>

      {/* Sections */}
      {sections.filter((s) => s !== 'contact').map((sectionId) => {
        const renderer = sectionRenderers[sectionId]
        return renderer ? <div key={sectionId}>{renderer()}</div> : null
      })}
    </div>
  )
}

function Section({ title, accent, sectionSize, sectionGap, children }: { title: string; accent: string; sectionSize: string; sectionGap: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: sectionGap }}>
      <h2 style={{
        fontSize: sectionSize,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginBottom: '8px',
        color: accent,
      }}>
        {title}
      </h2>
      {children}
    </div>
  )
}
