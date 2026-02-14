import type { ResumeWithRelations } from '@/types/resume-builder'
import { getDateRange, getVisibleSections, getContactLinks } from './shared'

interface Props {
  resume: ResumeWithRelations
}

/* Sections that render in the LEFT sidebar */
const SIDEBAR_SECTIONS = new Set(['contact', 'skills', 'education', 'certifications', 'extracurriculars'])

export function ParkerTemplate({ resume }: Props) {
  const ci = resume.contact_info
  const dateFormat = resume.settings?.date_format ?? 'month_year'
  const sections = getVisibleSections(resume)
  const links = getContactLinks(resume)

  const dark = '#374151'
  const light = '#f9fafb'

  /* ---- sidebar renderers ---- */
  const sidebarRenderers: Record<string, () => React.ReactNode> = {
    contact: () => null, // handled inline in sidebar header
    skills: () =>
      resume.skill_categories.length > 0 ? (
        <SidebarSection title="SKILLS">
          {resume.skill_categories.map((cat) => (
            <div key={cat.id} style={{ marginBottom: '6px' }}>
              <div style={{ fontWeight: 700, fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#d1d5db', marginBottom: '2px' }}>
                {cat.name}
              </div>
              <div style={{ fontSize: '9.5px', color: '#e5e7eb', lineHeight: '1.4' }}>
                {cat.skills.join(', ')}
              </div>
            </div>
          ))}
        </SidebarSection>
      ) : null,
    education: () =>
      resume.education.length > 0 ? (
        <SidebarSection title="EDUCATION">
          {resume.education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 700, fontSize: '10px', color: '#fff' }}>{edu.degree}</div>
              {edu.field_of_study && (
                <div style={{ fontSize: '9.5px', color: '#d1d5db' }}>{edu.field_of_study}</div>
              )}
              <div style={{ fontSize: '9.5px', color: '#9ca3af' }}>{edu.institution}</div>
              {edu.graduation_date && (
                <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>
                  {getDateRange(null, edu.graduation_date, dateFormat).replace('Present – ', '')}
                </div>
              )}
              {edu.gpa && <div style={{ fontSize: '9px', color: '#9ca3af' }}>GPA: {edu.gpa}</div>}
              {edu.honors && <div style={{ fontSize: '9px', color: '#9ca3af' }}>{edu.honors}</div>}
            </div>
          ))}
        </SidebarSection>
      ) : null,
    certifications: () =>
      resume.certifications.length > 0 ? (
        <SidebarSection title="CERTIFICATIONS">
          {resume.certifications.map((cert) => (
            <div key={cert.id} style={{ marginBottom: '6px' }}>
              <div style={{ fontWeight: 700, fontSize: '9.5px', color: '#fff' }}>{cert.name}</div>
              {cert.issuer && <div style={{ fontSize: '9px', color: '#9ca3af' }}>{cert.issuer}</div>}
              {cert.date && (
                <div style={{ fontSize: '9px', color: '#9ca3af' }}>
                  {getDateRange(null, cert.date, dateFormat).replace('Present – ', '')}
                </div>
              )}
            </div>
          ))}
        </SidebarSection>
      ) : null,
    extracurriculars: () =>
      resume.extracurriculars.length > 0 ? (
        <SidebarSection title="ACTIVITIES">
          {resume.extracurriculars.map((item) => (
            <div key={item.id} style={{ marginBottom: '4px' }}>
              <div style={{ fontWeight: 700, fontSize: '9.5px', color: '#fff' }}>{item.title}</div>
              {item.description && (
                <div style={{ fontSize: '9px', color: '#9ca3af' }}>{item.description}</div>
              )}
            </div>
          ))}
        </SidebarSection>
      ) : null,
  }

  /* ---- main column renderers ---- */
  const mainRenderers: Record<string, () => React.ReactNode> = {
    summary: () =>
      resume.summary?.is_visible && resume.summary?.text ? (
        <MainSection title="SUMMARY">
          <p style={{ lineHeight: '1.5', color: '#374151', margin: 0, fontSize: '10.5px' }}>
            {resume.summary.text}
          </p>
        </MainSection>
      ) : null,
    experience: () =>
      resume.work_experiences.length > 0 ? (
        <MainSection title="EXPERIENCE">
          {resume.work_experiences.map((exp) => (
            <div key={exp.id} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '12px' }}>{exp.job_title}</span>
                  <span style={{ color: '#6b7280', fontSize: '11px' }}> at {exp.company}</span>
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
        </MainSection>
      ) : null,
    projects: () =>
      resume.projects.length > 0 ? (
        <MainSection title="PROJECTS">
          {resume.projects.map((proj) => (
            <div key={proj.id} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '12px' }}>{proj.name}</span>
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
        </MainSection>
      ) : null,
  }

  const sidebarSections = sections.filter((s) => SIDEBAR_SECTIONS.has(s) && s !== 'contact')
  const mainSections = sections.filter((s) => !SIDEBAR_SECTIONS.has(s))

  return (
    <div
      style={{
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: '#111827',
        fontSize: '10.5px',
        lineHeight: '1.5',
        display: 'flex',
        minHeight: '11in',
        background: '#fff',
      }}
    >
      {/* LEFT SIDEBAR - 30% */}
      <div
        style={{
          width: '30%',
          backgroundColor: dark,
          color: '#fff',
          padding: '0.8in 0.5in 0.6in',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        {/* Name */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '22px', fontWeight: 800, lineHeight: '1.1', color: '#fff', wordBreak: 'break-word' }}>
            {ci?.full_name || 'Your Name'}
          </div>
          {resume.target_role && (
            <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {resume.target_role}
            </div>
          )}
        </div>

        {/* Contact info */}
        <SidebarSection title="CONTACT">
          <div style={{ fontSize: '9.5px', color: '#e5e7eb', lineHeight: '1.6' }}>
            {ci?.email && <div>{ci.email}</div>}
            {ci?.phone && <div>{ci.phone}</div>}
            {ci?.city && ci?.country && <div>{ci.city}, {ci.country}</div>}
            {links.map((link, i) => (
              <div key={i}>
                <a href={link.url} style={{ color: '#93c5fd', textDecoration: 'none', fontSize: '9px', wordBreak: 'break-all' }}>
                  {link.url.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                </a>
              </div>
            ))}
          </div>
        </SidebarSection>

        {/* Sidebar sections */}
        {sidebarSections.map((sectionId) => {
          const renderer = sidebarRenderers[sectionId]
          return renderer ? <div key={sectionId}>{renderer()}</div> : null
        })}
      </div>

      {/* RIGHT MAIN COLUMN - 70% */}
      <div
        style={{
          width: '70%',
          padding: '0.8in 0.7in 0.6in 0.6in',
          boxSizing: 'border-box',
          background: light,
        }}
      >
        {mainSections.map((sectionId) => {
          const renderer = mainRenderers[sectionId]
          return renderer ? <div key={sectionId}>{renderer()}</div> : null
        })}
      </div>
    </div>
  )
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <h2 style={{
        fontSize: '10px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '2px',
        color: '#9ca3af',
        marginBottom: '8px',
        paddingBottom: '4px',
        borderBottom: '1px solid #4b5563',
      }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function MainSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <h2 style={{
        fontSize: '13px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        marginBottom: '8px',
        color: '#111827',
        paddingBottom: '4px',
        borderBottom: '2px solid #374151',
      }}>
        {title}
      </h2>
      {children}
    </div>
  )
}
