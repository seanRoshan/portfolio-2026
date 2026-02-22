import type { ResumeWithRelations } from '@/types/resume-builder'
import { getDateRange, getVisibleSections, getContactLinks, getTemplateStyles } from './shared'

interface Props {
  resume: ResumeWithRelations
}

export function CareerCupTemplate({ resume }: Props) {
  const ci = resume.contact_info
  const dateFormat = resume.settings?.date_format ?? 'month_year'
  const sections = getVisibleSections(resume)
  const links = getContactLinks(resume)
  const { accent, font, density } = getTemplateStyles(resume.settings)

  const sectionRenderers: Record<string, () => React.ReactNode> = {
    contact: () => null,
    summary: () =>
      resume.summary?.is_visible && resume.summary?.text ? (
        <Section title="SUMMARY" accent={accent} sectionSize={density.section} sectionGap={density.sectionGap}>
          <p style={{ lineHeight: density.lineHeight, color: '#222', margin: 0, fontSize: density.body }}>
            {resume.summary.text}
          </p>
        </Section>
      ) : null,
    experience: () =>
      resume.work_experiences.length > 0 ? (
        <Section title="EXPERIENCE" accent={accent} sectionSize={density.section} sectionGap={density.sectionGap}>
          {resume.work_experiences.map((exp) => (
            <div key={exp.id} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: density.heading }}>{exp.company}</span>
                <span style={{ fontSize: density.body, color: '#555', whiteSpace: 'nowrap' }}>
                  {getDateRange(exp.start_date, exp.end_date, dateFormat)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontStyle: 'italic', fontSize: density.body }}>{exp.job_title}</span>
                {exp.location && (
                  <span style={{ fontSize: density.body, color: '#777' }}>{exp.location}</span>
                )}
              </div>
              {exp.achievements && exp.achievements.length > 0 && (
                <ul style={{ margin: '3px 0 0', paddingLeft: '16px', listStyleType: 'disc' }}>
                  {exp.achievements.map((a) => (
                    <li key={a.id} style={{ fontSize: density.body, lineHeight: density.lineHeight, color: '#222', marginBottom: '1px' }}>
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
            <div key={edu.id} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: density.heading }}>{edu.institution}</span>
                <span style={{ fontSize: density.body, color: '#555', whiteSpace: 'nowrap' }}>
                  {edu.graduation_date ? getDateRange(null, edu.graduation_date, dateFormat).replace('Present – ', '') : ''}
                </span>
              </div>
              <div style={{ fontSize: density.body, fontStyle: 'italic' }}>
                {edu.degree}{edu.field_of_study ? ` in ${edu.field_of_study}` : ''}
              </div>
              {edu.gpa && <div style={{ fontSize: density.body, color: '#555' }}>GPA: {edu.gpa}</div>}
              {edu.honors && <div style={{ fontSize: density.body, color: '#555' }}>{edu.honors}</div>}
            </div>
          ))}
        </Section>
      ) : null,
    skills: () =>
      resume.skill_categories.length > 0 ? (
        <Section title="TECHNICAL SKILLS" accent={accent} sectionSize={density.section} sectionGap={density.sectionGap}>
          {resume.skill_categories.map((cat) => (
            <div key={cat.id} style={{ marginBottom: '2px', fontSize: density.body }}>
              <span style={{ fontWeight: 700 }}>{cat.name}: </span>
              <span>{cat.skills.join(', ')}</span>
            </div>
          ))}
        </Section>
      ) : null,
    projects: () =>
      resume.projects.length > 0 ? (
        <Section title="PROJECTS" accent={accent} sectionSize={density.section} sectionGap={density.sectionGap}>
          {resume.projects.map((proj) => (
            <div key={proj.id} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: density.heading }}>{proj.name}</span>
                  {proj.project_url && (
                    <a href={proj.project_url} style={{ fontSize: '9px', color: '#555', textDecoration: 'none', marginLeft: '6px' }}>
                      ({proj.project_url.replace(/https?:\/\//, '')})
                    </a>
                  )}
                </div>
              </div>
              {proj.description && (
                <div style={{ fontSize: density.body, color: '#222', marginTop: '1px', fontStyle: 'italic' }}>{proj.description}</div>
              )}
              {proj.achievements && proj.achievements.length > 0 && (
                <ul style={{ margin: '3px 0 0', paddingLeft: '16px', listStyleType: 'disc' }}>
                  {proj.achievements.map((a) => (
                    <li key={a.id} style={{ fontSize: density.body, lineHeight: density.lineHeight, color: '#222', marginBottom: '1px' }}>
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
            <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: density.body }}>
              <span>
                <span style={{ fontWeight: 700 }}>{cert.name}</span>
                {cert.issuer && <span style={{ color: '#555' }}>, {cert.issuer}</span>}
              </span>
              {cert.date && (
                <span style={{ color: '#555', fontSize: density.body }}>
                  {getDateRange(null, cert.date, dateFormat).replace('Present – ', '')}
                </span>
              )}
            </div>
          ))}
        </Section>
      ) : null,
    extracurriculars: () =>
      resume.extracurriculars.length > 0 ? (
        <Section title="ACTIVITIES & LEADERSHIP" accent={accent} sectionSize={density.section} sectionGap={density.sectionGap}>
          {resume.extracurriculars.map((item) => (
            <div key={item.id} style={{ marginBottom: '2px', fontSize: density.body }}>
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
        color: '#000',
        padding: '0.6in',
        fontSize: density.body,
        lineHeight: density.lineHeight,
        background: '#fff',
      }}
    >
      {/* Header - Centered */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '2px' }}>
          {ci?.full_name || 'Your Name'}
        </h1>
        <div style={{ fontSize: density.body, color: '#333' }}>
          {[
            ci?.email,
            ci?.phone,
            (ci?.city || ci?.country) ? [ci?.city, ci?.country].filter(Boolean).join(', ') : null,
            ...links.map((l) => l.url.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')),
          ]
            .filter(Boolean)
            .join('  |  ')}
        </div>
        <hr style={{ border: 'none', borderTop: `1.5px solid ${accent}`, marginTop: '8px', marginBottom: '0' }} />
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
        marginBottom: '4px',
        color: '#000',
        borderBottom: `1px solid ${accent}`,
        paddingBottom: '2px',
      }}>
        {title}
      </h2>
      {children}
    </div>
  )
}
