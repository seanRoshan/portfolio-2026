import type { ResumeWithRelations } from '@/types/resume-builder'
import { getDateRange, getVisibleSections, getContactLinks } from './shared'

interface Props {
  resume: ResumeWithRelations
}

export function SmarkdownTemplate({ resume }: Props) {
  const ci = resume.contact_info
  const dateFormat = resume.settings?.date_format ?? 'month_year'
  const sections = getVisibleSections(resume)
  const links = getContactLinks(resume)

  const accent = '#2563eb'

  const sectionRenderers: Record<string, () => React.ReactNode> = {
    contact: () => null,
    summary: () =>
      resume.summary?.is_visible && resume.summary?.text ? (
        <Section title="Summary">
          <p style={{ lineHeight: '1.55', color: '#333', margin: 0, fontSize: '10.5px' }}>
            {resume.summary.text}
          </p>
        </Section>
      ) : null,
    experience: () =>
      resume.work_experiences.length > 0 ? (
        <Section title="Experience">
          {resume.work_experiences.map((exp) => (
            <div key={exp.id} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '12px' }}>{exp.job_title}</span>
                  <span style={{ color: '#555', fontSize: '12px' }}> at {exp.company}</span>
                </div>
                <span style={{ fontSize: '10px', color: '#777', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                  {getDateRange(exp.start_date, exp.end_date, dateFormat)}
                </span>
              </div>
              {exp.location && (
                <div style={{ fontSize: '10px', color: '#999' }}>{exp.location}</div>
              )}
              {exp.achievements && exp.achievements.length > 0 && (
                <ul style={{ margin: '4px 0 0', paddingLeft: '20px', listStyleType: 'disc' }}>
                  {exp.achievements.map((a) => (
                    <li key={a.id} style={{ fontSize: '10.5px', lineHeight: '1.55', color: '#333', marginBottom: '2px' }}>
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
        <Section title="Education">
          {resume.education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '12px' }}>{edu.degree}</span>
                  {edu.field_of_study && <span style={{ color: '#555', fontSize: '12px' }}> in {edu.field_of_study}</span>}
                </div>
                <span style={{ fontSize: '10px', color: '#777', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                  {edu.graduation_date ? getDateRange(null, edu.graduation_date, dateFormat).replace('Present – ', '') : ''}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#555' }}>{edu.institution}</div>
              {edu.gpa && <div style={{ fontSize: '10px', color: '#999' }}>GPA: {edu.gpa}</div>}
              {edu.honors && <div style={{ fontSize: '10px', color: '#999' }}>{edu.honors}</div>}
            </div>
          ))}
        </Section>
      ) : null,
    skills: () =>
      resume.skill_categories.length > 0 ? (
        <Section title="Skills">
          {resume.skill_categories.map((cat) => (
            <div key={cat.id} style={{ marginBottom: '4px', fontSize: '10.5px' }}>
              <span style={{ fontWeight: 700 }}>{cat.name}: </span>
              <span style={{ color: '#333' }}>{cat.skills.join(', ')}</span>
            </div>
          ))}
        </Section>
      ) : null,
    projects: () =>
      resume.projects.length > 0 ? (
        <Section title="Projects">
          {resume.projects.map((proj) => (
            <div key={proj.id} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '12px' }}>{proj.name}</span>
                {proj.project_url && (
                  <a href={proj.project_url} style={{ fontSize: '9.5px', color: accent, textDecoration: 'none' }}>
                    [{proj.project_url.replace(/https?:\/\//, '')}]
                  </a>
                )}
              </div>
              {proj.description && (
                <div style={{ fontSize: '10.5px', color: '#333', marginTop: '2px' }}>{proj.description}</div>
              )}
              {proj.achievements && proj.achievements.length > 0 && (
                <ul style={{ margin: '4px 0 0', paddingLeft: '20px', listStyleType: 'disc' }}>
                  {proj.achievements.map((a) => (
                    <li key={a.id} style={{ fontSize: '10.5px', lineHeight: '1.55', color: '#333', marginBottom: '2px' }}>
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
        <Section title="Certifications">
          {resume.certifications.map((cert) => (
            <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10.5px' }}>
              <span>
                <span style={{ fontWeight: 700 }}>{cert.name}</span>
                {cert.issuer && <span style={{ color: '#555' }}> - {cert.issuer}</span>}
              </span>
              {cert.date && (
                <span style={{ color: '#777', fontSize: '10px', fontStyle: 'italic' }}>
                  {getDateRange(null, cert.date, dateFormat).replace('Present – ', '')}
                </span>
              )}
            </div>
          ))}
        </Section>
      ) : null,
    extracurriculars: () =>
      resume.extracurriculars.length > 0 ? (
        <Section title="Activities">
          {resume.extracurriculars.map((item) => (
            <div key={item.id} style={{ marginBottom: '4px', fontSize: '10.5px' }}>
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
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: '#222',
        padding: '1in',
        fontSize: '10.5px',
        lineHeight: '1.55',
        background: '#fff',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          margin: 0,
          paddingBottom: '6px',
          borderBottom: `3px solid ${accent}`,
          display: 'inline-block',
        }}>
          {ci?.full_name || 'Your Name'}
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', fontSize: '10px', color: '#555' }}>
          {ci?.email && (
            <a href={`mailto:${ci.email}`} style={{ color: accent, textDecoration: 'none' }}>{ci.email}</a>
          )}
          {ci?.phone && <span>| {ci.phone}</span>}
          {ci?.city && ci?.country && <span>| {ci.city}, {ci.country}</span>}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <h2 style={{
        fontSize: '14px',
        fontWeight: 700,
        marginBottom: '8px',
        color: '#222',
        paddingBottom: '3px',
        borderBottom: '1px solid #d1d5db',
      }}>
        <span style={{ color: '#999', fontWeight: 400, marginRight: '4px' }}>##</span>
        {title}
      </h2>
      {children}
    </div>
  )
}
