import type { ResumeWithRelations } from '@/types/resume-builder'
import { getDateRange, getVisibleSections, getContactLinks } from './shared'

interface Props {
  resume: ResumeWithRelations
}

export function MonoTemplate({ resume }: Props) {
  const ci = resume.contact_info
  const dateFormat = resume.settings?.date_format ?? 'month_year'
  const sections = getVisibleSections(resume)
  const links = getContactLinks(resume)

  const mono = "'Source Code Pro', 'Courier New', monospace"

  const sectionRenderers: Record<string, () => React.ReactNode> = {
    contact: () => null,
    summary: () =>
      resume.summary?.is_visible && resume.summary?.text ? (
        <Section title="SUMMARY" font={mono}>
          <p style={{ lineHeight: '1.2', color: '#000', margin: 0, fontFamily: mono, fontSize: '10px' }}>
            {resume.summary.text}
          </p>
        </Section>
      ) : null,
    experience: () =>
      resume.work_experiences.length > 0 ? (
        <Section title="EXPERIENCE" font={mono}>
          {resume.work_experiences.map((exp) => (
            <div key={exp.id} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '10.5px', fontFamily: mono }}>{exp.job_title}</span>
                  <span style={{ color: '#000', fontSize: '10.5px', fontFamily: mono }}> | {exp.company}</span>
                </div>
                <span style={{ fontSize: '9.5px', color: '#000', whiteSpace: 'nowrap', fontFamily: mono }}>
                  {getDateRange(exp.start_date, exp.end_date, dateFormat)}
                </span>
              </div>
              {exp.location && (
                <div style={{ fontSize: '9.5px', color: '#555', fontFamily: mono }}>{exp.location}</div>
              )}
              {exp.achievements && exp.achievements.length > 0 && (
                <ul style={{ margin: '3px 0 0', paddingLeft: '16px', listStyleType: '"- "' }}>
                  {exp.achievements.map((a) => (
                    <li key={a.id} style={{ fontSize: '10px', lineHeight: '1.2', color: '#000', marginBottom: '1px', fontFamily: mono }}>
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
        <Section title="EDUCATION" font={mono}>
          {resume.education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '10.5px', fontFamily: mono }}>{edu.degree}</span>
                  {edu.field_of_study && <span style={{ fontSize: '10.5px', fontFamily: mono }}> in {edu.field_of_study}</span>}
                </div>
                <span style={{ fontSize: '9.5px', color: '#000', whiteSpace: 'nowrap', fontFamily: mono }}>
                  {edu.graduation_date ? getDateRange(null, edu.graduation_date, dateFormat).replace('Present – ', '') : ''}
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#555', fontFamily: mono }}>{edu.institution}</div>
              {edu.gpa && <div style={{ fontSize: '9.5px', color: '#555', fontFamily: mono }}>GPA: {edu.gpa}</div>}
              {edu.honors && <div style={{ fontSize: '9.5px', color: '#555', fontFamily: mono }}>{edu.honors}</div>}
            </div>
          ))}
        </Section>
      ) : null,
    skills: () =>
      resume.skill_categories.length > 0 ? (
        <Section title="SKILLS" font={mono}>
          {resume.skill_categories.map((cat) => (
            <div key={cat.id} style={{ marginBottom: '3px', fontSize: '10px', fontFamily: mono }}>
              <span style={{ fontWeight: 700 }}>{cat.name}: </span>
              <span>{cat.skills.join(', ')}</span>
            </div>
          ))}
        </Section>
      ) : null,
    projects: () =>
      resume.projects.length > 0 ? (
        <Section title="PROJECTS" font={mono}>
          {resume.projects.map((proj) => (
            <div key={proj.id} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '10.5px', fontFamily: mono }}>{proj.name}</span>
                {proj.project_url && (
                  <a href={proj.project_url} style={{ fontSize: '9px', color: '#555', textDecoration: 'none', fontFamily: mono }}>
                    {proj.project_url.replace(/https?:\/\//, '')}
                  </a>
                )}
              </div>
              {proj.description && (
                <div style={{ fontSize: '10px', color: '#000', marginTop: '1px', fontFamily: mono }}>{proj.description}</div>
              )}
              {proj.achievements && proj.achievements.length > 0 && (
                <ul style={{ margin: '3px 0 0', paddingLeft: '16px', listStyleType: '"- "' }}>
                  {proj.achievements.map((a) => (
                    <li key={a.id} style={{ fontSize: '10px', lineHeight: '1.2', color: '#000', marginBottom: '1px', fontFamily: mono }}>
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
        <Section title="CERTIFICATIONS" font={mono}>
          {resume.certifications.map((cert) => (
            <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '10px', fontFamily: mono }}>
              <span>
                <span style={{ fontWeight: 700 }}>{cert.name}</span>
                {cert.issuer && <span style={{ color: '#555' }}> -- {cert.issuer}</span>}
              </span>
              {cert.date && (
                <span style={{ fontSize: '9.5px' }}>
                  {getDateRange(null, cert.date, dateFormat).replace('Present – ', '')}
                </span>
              )}
            </div>
          ))}
        </Section>
      ) : null,
    extracurriculars: () =>
      resume.extracurriculars.length > 0 ? (
        <Section title="ACTIVITIES" font={mono}>
          {resume.extracurriculars.map((item) => (
            <div key={item.id} style={{ marginBottom: '3px', fontSize: '10px', fontFamily: mono }}>
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
        fontFamily: mono,
        color: '#000',
        padding: '0.8in',
        fontSize: '10px',
        lineHeight: '1.2',
        background: '#fff',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: mono, letterSpacing: '-0.5px' }}>
          {ci?.full_name || 'Your Name'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px', fontSize: '9.5px', color: '#555', fontFamily: mono }}>
          {ci?.email && <span>{ci.email}</span>}
          {ci?.phone && <span>| {ci.phone}</span>}
          {ci?.city && ci?.country && <span>| {ci.city}, {ci.country}</span>}
          {links.map((link, i) => (
            <span key={i}>
              | <a href={link.url} style={{ color: '#555', textDecoration: 'none', fontFamily: mono }}>
                {link.url.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              </a>
            </span>
          ))}
        </div>
        <div style={{ marginTop: '8px', fontSize: '9.5px', color: '#999', fontFamily: mono, letterSpacing: '0.5px' }}>
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

function Section({ title, font, children }: { title: string; font: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ marginBottom: '4px' }}>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontFamily: font,
          color: '#000',
        }}>
          {title}
        </span>
        <div style={{ fontSize: '9.5px', color: '#999', fontFamily: font, letterSpacing: '0.5px', marginTop: '1px' }}>
          {'─'.repeat(80)}
        </div>
      </div>
      {children}
    </div>
  )
}
