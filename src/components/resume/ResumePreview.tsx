import type { EducationEntry, CertificationEntry, AdditionalSectionEntry } from "@/types/database"

const categoryLabels: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  devops: "DevOps & Cloud",
  database: "Databases",
  tools: "Tools",
}

interface ResumePreviewProps {
  data: {
    full_name: string
    title: string
    email: string | null
    phone: string | null
    location: string | null
    website: string | null
    linkedin: string | null
    github: string | null
    summary: string | null
    education: EducationEntry[]
    certifications: CertificationEntry[]
    additional_sections: AdditionalSectionEntry[]
  }
  skills?: { category: string; skills: string[] }[]
  experience?: {
    company: string
    role: string
    location: string | null
    period: string
    achievements: string[]
  }[]
}

export function ResumePreview({ data, skills = [], experience = [] }: ResumePreviewProps) {
  const contactItems = [
    data.email,
    data.phone,
    data.location,
    data.website?.replace(/^https?:\/\//, ""),
    data.linkedin?.replace(/^https?:\/\/(www\.)?/, ""),
    data.github?.replace(/^https?:\/\//, ""),
  ].filter(Boolean)

  return (
    <div className="rounded-md border bg-white p-6 font-[Helvetica,Arial,sans-serif] text-[10px] leading-relaxed text-black shadow-sm">
      {/* Header */}
      <div className="mb-3 text-center">
        <h2 className="text-lg font-bold">{data.full_name || "Your Name"}</h2>
        <p className="text-xs text-gray-600">{data.title || "Your Title"}</p>
        {contactItems.length > 0 && (
          <p className="mt-1 text-[9px] text-gray-500">{contactItems.join(" | ")}</p>
        )}
      </div>

      {/* Summary */}
      {data.summary && (
        <section className="mb-3">
          <h3 className="mb-1.5 border-b border-gray-300 pb-0.5 text-[11px] font-bold tracking-wider uppercase">
            Summary
          </h3>
          <p>{data.summary}</p>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mb-3">
          <h3 className="mb-1.5 border-b border-gray-300 pb-0.5 text-[11px] font-bold tracking-wider uppercase">
            Skills
          </h3>
          {skills.map((group) => (
            <div key={group.category} className="mb-0.5 flex gap-1">
              <span className="w-20 shrink-0 font-bold">
                {categoryLabels[group.category] ?? group.category}:
              </span>
              <span>{group.skills.join(", ")}</span>
            </div>
          ))}
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="mb-3">
          <h3 className="mb-1.5 border-b border-gray-300 pb-0.5 text-[11px] font-bold tracking-wider uppercase">
            Experience
          </h3>
          {experience.map((exp, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between">
                <span className="text-[10.5px] font-bold">{exp.role}</span>
                <span className="text-[9px] text-gray-500">{exp.period}</span>
              </div>
              <p className="text-gray-600">
                {[exp.company, exp.location].filter(Boolean).join(" — ")}
              </p>
              {exp.achievements.map((ach, j) => (
                <div key={j} className="flex gap-1 pl-1.5">
                  <span>•</span>
                  <span>{ach}</span>
                </div>
              ))}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <section className="mb-3">
          <h3 className="mb-1.5 border-b border-gray-300 pb-0.5 text-[11px] font-bold tracking-wider uppercase">
            Education
          </h3>
          {data.education.map((edu, i) => (
            <div key={i} className="mb-1.5">
              <div className="flex justify-between">
                <span className="font-bold">{edu.school}</span>
                {edu.year && <span className="text-[9px] text-gray-500">{edu.year}</span>}
              </div>
              <p className="text-gray-600">
                {[edu.degree, edu.field].filter(Boolean).join(" in ")}
              </p>
              {edu.details && <p className="text-gray-500">{edu.details}</p>}
            </div>
          ))}
        </section>
      )}

      {/* Certifications */}
      {data.certifications.length > 0 && (
        <section className="mb-3">
          <h3 className="mb-1.5 border-b border-gray-300 pb-0.5 text-[11px] font-bold tracking-wider uppercase">
            Certifications
          </h3>
          {data.certifications.map((cert, i) => (
            <p key={i}>
              <span className="font-bold">{cert.name}</span>
              <span className="text-gray-600"> — {cert.issuer}</span>
              {cert.year && <span className="text-gray-500"> ({cert.year})</span>}
            </p>
          ))}
        </section>
      )}

      {/* Additional sections */}
      {data.additional_sections.map((section, i) => (
        <section key={i} className="mb-3">
          <h3 className="mb-1.5 border-b border-gray-300 pb-0.5 text-[11px] font-bold tracking-wider uppercase">
            {section.title}
          </h3>
          {section.items.map((item, j) => (
            <div key={j} className="flex gap-1 pl-1.5">
              <span>•</span>
              <span>{item}</span>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
