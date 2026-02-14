import type { ResumeWithRelations } from '@/types/resume-builder'
import { getDateRange, getVisibleSections, getContactLinks } from './shared'

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

  const dividerColor = '#d1d5db'
  const leftBg = '#f3f4f6'

  /* ---- left column renderers ---- */
  const leftRenderers: Record<string, () => React.ReactNode> = {
    contact: () => null, // rendered in left column header area
    skills: () =>
      resume.skill_categories.length > 0 ? (
        <LeftSection title="Skills">
          {resume.skill_categories.map((cat) => (
            <div key={cat.id} style={{ marginBottom: '6px' }}>
              <div style={{ fontWeight: 700, fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.3px', color: '#374151', marginBottom: '2px' }}>
                {cat.name}
              </div>
              <div style={{ fontSize: '9.5px', color: '#4b5563', lineHeight: '1.45' }}>
                {cat.skills.join(', ')}
              </div>
            </div>
          ))}
        </LeftSection>
      ) : null,
    education: () =>
      resume.education.length > 0 ? (
        <LeftSection title="Education">
          {resume.education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 700, fontSize: '10px', color: '#111827' }}>{edu.degree}</div>
              {edu.field_of_study && (
                <div style={{ fontSize: '9.5px', color: '#4b5563' }}>{edu.field_of_study}</div>
              )}
              <div style={{ fontSize: '9.5px', color: '#6b7280' }}>{edu.institution}</div>
              {edu.graduation_date && (
                <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>
                  {getDateRange(null, edu.graduation_date, dateFormat).replace('Present – ', '')}
                </div>
              )}
              {edu.gpa && <div style={{ fontSize: '9px', color: '#9ca3af' }}>GPA: {edu.gpa}</div>}
              {edu.honors && <div style={{ fontSize: '9px', color: '#9ca3af' }}>{edu.honors}</div>}
            </div>
          ))}
        </LeftSection>
      ) : null,
    certifications: () =>
      resume.certifications.length > 0 ? (
        <LeftSection title="Certifications">
          {resume.certifications.map((cert) => (
            <div key={cert.id} style={{ marginBottom: '6px' }}>
              <div style={{ fontWeight: 700, fontSize: '9.5px', color: '#111827' }}>{cert.name}</div>
              {cert.issuer && <div style={{ fontSize: '9px', color: '#6b7280' }}>{cert.issuer}</div>}
              {cert.date && (
                <div style={{ fontSize: '9px', color: '#9ca3af' }}>
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
        <RightSection title="Professional Summary">
          <p style={{ lineHeight: '1.5', color: '#374151', margin: 0, fontSize: '10.5px' }}>
            {resume.summary.text}
          </p>
        </RightSection>
      ) : null,
    experience: () =>
      resume.work_experiences.length > 0 ? (
        <RightSection title="Work Experience">
          {resume.work_experiences.map((exp) => (
            <div key={exp.id} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '11.5px', color: '#111827' }}>{exp.job_title}</span>
                  <span style={{ color: '#6b7280', fontSize: '11px' }}> | {exp.company}</span>
                </div>
                <span style={{ fontSize: '9.5px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                  {getDateRange(exp.start_date, exp.end_date, dateFormat)}
                </span>
              </div>
              {exp.location && (
                <div style={{ fontSize: '9.5px', color: '#9ca3af' }}>{exp.location}</div>
              )}
              {exp.achievements && exp.achievements.length > 0 && (
                <ul style={{ margin: '4px 0 0', paddingLeft: '18px', listStyleType: 'disc' }}>
                  {exp.achievements.map((a) => (
                    <li key={a.id} style={{ fontSize: '10.5px', lineHeight: '1.5', color: '#374151', marginBottom: '2px' }}>
                      {a.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </RightSection>
      ) : null,
    projects: () =>
      resume.projects.length > 0 ? (
        <RightSection title="Projects">
          {resume.projects.map((proj) => (
            <div key={proj.id} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '11.5px', color: '#111827' }}>{proj.name}</span>
                {proj.project_url && (
                  <a href={proj.project_url} style={{ fontSize: '9px', color: '#6b7280', textDecoration: 'none' }}>
                    {proj.project_url.replace(/https?:\/\//, '')}
                  </a>
                )}
              </div>
              {proj.description && (
                <div style={{ fontSize: '10.5px', color: '#374151', marginTop: '2px' }}>{proj.description}</div>
              )}
              {proj.achievements && proj.achievements.length > 0 && (
                <ul style={{ margin: '4px 0 0', paddingLeft: '18px', listStyleType: 'disc' }}>
                  {proj.achievements.map((a) => (
                    <li key={a.id} style={{ fontSize: '10.5px', lineHeight: '1.5', color: '#374151', marginBottom: '2px' }}>
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
        <RightSection title="Activities">
          {resume.extracurriculars.map((item) => (
            <div key={item.id} style={{ marginBottom: '4px', fontSize: '10.5px' }}>
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
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: '#111827',
        fontSize: '10.5px',
        lineHeight: '1.5',
        background: '#fff',
        minHeight: '11in',
      }}
    >
      {/* FULL-WIDTH HEADER */}
      <div
        style={{
          padding: '0.6in 0.7in 0.4in',
          borderBottom: `2px solid ${dividerColor}`,
        }}
      >
        <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#111827', letterSpacing: '-0.5px' }}>
          {ci?.full_name || 'Your Name'}
        </h1>
        {resume.target_role && (
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px', fontWeight: 500 }}>
            {resume.target_role}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '6px', fontSize: '10px', color: '#6b7280' }}>
          {ci?.email && <span>{ci.email}</span>}
          {ci?.phone && <span>|  {ci.phone}</span>}
          {ci?.city && ci?.country && <span>|  {ci.city}, {ci.country}</span>}
          {links.map((link, i) => (
            <span key={i}>
              |  <a href={link.url} style={{ color: '#6b7280', textDecoration: 'none' }}>
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
            padding: '0.5in 0.45in 0.6in 0.7in',
            boxSizing: 'border-box',
            borderRight: `1px solid ${dividerColor}`,
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
            padding: '0.5in 0.7in 0.6in 0.55in',
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

function LeftSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <h2 style={{
        fontSize: '10px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        color: '#374151',
        marginBottom: '8px',
        paddingBottom: '4px',
        borderBottom: '1px solid #d1d5db',
      }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function RightSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <h2 style={{
        fontSize: '13px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginBottom: '8px',
        color: '#111827',
        paddingBottom: '4px',
        borderBottom: '1px solid #e5e7eb',
      }}>
        {title}
      </h2>
      {children}
    </div>
  )
}
