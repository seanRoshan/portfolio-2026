"use client"

import { Download, Printer, Mail, MapPin, Globe, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RevealOnScroll } from "@/components/animations/RevealOnScroll"
import type { AdditionalSectionEntry } from "@/types/database"

interface ResumePublicViewProps {
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
    additional_sections: AdditionalSectionEntry[]
    pdf_url: string | null
  }
  skills: { category: string; skills: string[] }[]
  experience: {
    company: string
    role: string
    location: string | null
    period: string
    achievements: string[]
    company_url: string | null
  }[]
  education: {
    school: string
    degree: string
    field: string | null
    year: string | null
    details: string | null
  }[]
  certifications: {
    name: string
    issuer: string
    year: string | null
    url: string | null
  }[]
}

const categoryLabels: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  devops: "DevOps & Cloud",
  database: "Databases",
  tools: "Tools",
}

export function ResumePublicView({
  data,
  skills,
  experience,
  education,
  certifications,
}: ResumePublicViewProps) {
  return (
    <div className="mx-auto max-w-3xl">
      {/* Action buttons */}
      <div className="mb-8 flex gap-3 print:hidden">
        <Button asChild>
          <a href="/api/resume/download" download>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </a>
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      {/* Header */}
      <RevealOnScroll>
        <header className="mb-10">
          <h1 className="mb-1 text-4xl font-bold">{data.full_name}</h1>
          <p className="text-muted-foreground mb-4 text-xl">{data.title}</p>
          <div className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {data.email && (
              <a
                href={`mailto:${data.email}`}
                className="hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                {data.email}
              </a>
            )}
            {data.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {data.location}
              </span>
            )}
            {data.website && (
              <a
                href={data.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <Globe className="h-3.5 w-3.5" />
                {data.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {data.linkedin && (
              <a
                href={data.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                LinkedIn
              </a>
            )}
            {data.github && (
              <a
                href={data.github}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                GitHub
              </a>
            )}
            {data.phone && (
              <a
                href={`tel:${data.phone}`}
                className="hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                {data.phone}
              </a>
            )}
          </div>
        </header>
      </RevealOnScroll>

      {/* Summary */}
      {data.summary && (
        <RevealOnScroll>
          <section className="mb-10">
            <h2 className="mb-4 border-b pb-2 text-lg font-bold tracking-wider uppercase">
              Summary
            </h2>
            <p className="text-muted-foreground leading-relaxed">{data.summary}</p>
          </section>
        </RevealOnScroll>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <RevealOnScroll>
          <section className="mb-10">
            <h2 className="mb-4 border-b pb-2 text-lg font-bold tracking-wider uppercase">
              Skills
            </h2>
            <div className="space-y-2">
              {skills.map((group) => (
                <div key={group.category} className="flex gap-2">
                  <span className="w-32 shrink-0 text-sm font-semibold">
                    {categoryLabels[group.category] ?? group.category}:
                  </span>
                  <span className="text-muted-foreground text-sm">{group.skills.join(", ")}</span>
                </div>
              ))}
            </div>
          </section>
        </RevealOnScroll>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <RevealOnScroll>
          <section className="mb-10">
            <h2 className="mb-4 border-b pb-2 text-lg font-bold tracking-wider uppercase">
              Experience
            </h2>
            <div className="space-y-6">
              {experience.map((exp, i) => (
                <div key={i}>
                  <div className="mb-1 flex items-baseline justify-between gap-4">
                    <h3 className="font-bold">{exp.role}</h3>
                    <span className="text-muted-foreground shrink-0 text-sm">{exp.period}</span>
                  </div>
                  <p className="text-muted-foreground mb-2 text-sm">
                    {exp.company_url ? (
                      <a
                        href={exp.company_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                      >
                        {exp.company}
                      </a>
                    ) : (
                      exp.company
                    )}
                    {exp.location && ` — ${exp.location}`}
                  </p>
                  {exp.achievements.length > 0 && (
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      {exp.achievements.map((ach, j) => (
                        <li key={j} className="flex gap-2">
                          <span className="shrink-0">•</span>
                          <span>{ach}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        </RevealOnScroll>
      )}

      {/* Education */}
      {education.length > 0 && (
        <RevealOnScroll>
          <section className="mb-10">
            <h2 className="mb-4 border-b pb-2 text-lg font-bold tracking-wider uppercase">
              Education
            </h2>
            <div className="space-y-4">
              {education.map((edu, i) => (
                <div key={i}>
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-bold">{edu.school}</h3>
                    {edu.year && <span className="text-muted-foreground text-sm">{edu.year}</span>}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {[edu.degree, edu.field].filter(Boolean).join(" in ")}
                  </p>
                  {edu.details && (
                    <p className="text-muted-foreground mt-1 text-sm">{edu.details}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </RevealOnScroll>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <RevealOnScroll>
          <section className="mb-10">
            <h2 className="mb-4 border-b pb-2 text-lg font-bold tracking-wider uppercase">
              Certifications
            </h2>
            <div className="space-y-2">
              {certifications.map((cert, i) => (
                <div key={i} className="text-sm">
                  {cert.url ? (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary font-semibold transition-colors"
                    >
                      {cert.name}
                    </a>
                  ) : (
                    <span className="font-semibold">{cert.name}</span>
                  )}
                  <span className="text-muted-foreground"> — {cert.issuer}</span>
                  {cert.year && <span className="text-muted-foreground"> ({cert.year})</span>}
                </div>
              ))}
            </div>
          </section>
        </RevealOnScroll>
      )}

      {/* Additional sections */}
      {data.additional_sections.map((section, i) => (
        <RevealOnScroll key={i}>
          <section className="mb-10">
            <h2 className="mb-4 border-b pb-2 text-lg font-bold tracking-wider uppercase">
              {section.title}
            </h2>
            <ul className="text-muted-foreground space-y-1 text-sm">
              {section.items.map((item, j) => (
                <li key={j} className="flex gap-2">
                  <span className="shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </RevealOnScroll>
      ))}
    </div>
  )
}
