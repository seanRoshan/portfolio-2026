import React from "react"
import { Document, Page, Text, View, Link, StyleSheet, renderToBuffer } from "@react-pdf/renderer"
import type { EducationEntry, CertificationEntry, AdditionalSectionEntry } from "@/types/database"

interface ResumePdfData {
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
  skillGroups: { category: string; skills: string[] }[]
  experience: {
    company: string
    role: string
    location: string | null
    period: string
    description: string | null
    achievements: string[]
  }[]
}

const categoryLabels: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  devops: "DevOps & Cloud",
  database: "Databases",
  tools: "Tools",
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10.5,
    paddingTop: 43,
    paddingBottom: 43,
    paddingHorizontal: 43,
    lineHeight: 1.4,
    color: "#1a1a1a",
  },
  header: {
    textAlign: "center",
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  titleText: {
    fontSize: 12,
    color: "#555555",
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  contactItem: {
    fontSize: 9.5,
    color: "#444444",
  },
  contactSep: {
    fontSize: 9.5,
    color: "#999999",
    marginHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
    paddingBottom: 3,
    marginTop: 14,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: 10.5,
    lineHeight: 1.5,
  },
  expEntry: {
    marginBottom: 10,
  },
  expHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  expRole: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },
  expPeriod: {
    fontSize: 10,
    color: "#555555",
  },
  expCompany: {
    fontSize: 10.5,
    color: "#333333",
    marginBottom: 3,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 8,
  },
  bulletChar: {
    width: 12,
    fontSize: 10.5,
  },
  bulletText: {
    flex: 1,
    fontSize: 10.5,
  },
  skillRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  skillCategory: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    width: 110,
  },
  skillList: {
    flex: 1,
    fontSize: 10.5,
  },
  eduEntry: {
    marginBottom: 6,
  },
  eduHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eduSchool: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
  },
  eduYear: {
    fontSize: 10,
    color: "#555555",
  },
  eduDegree: {
    fontSize: 10.5,
    color: "#333333",
  },
  certEntry: {
    marginBottom: 4,
  },
  certName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
  },
  certIssuer: {
    fontSize: 10.5,
    color: "#333333",
  },
  link: {
    color: "#444444",
    textDecoration: "none",
  },
})

function ResumePdfDocument({ data }: { data: ResumePdfData }) {
  const contactItems: { text: string; href?: string }[] = []
  if (data.email) contactItems.push({ text: data.email, href: `mailto:${data.email}` })
  if (data.phone) contactItems.push({ text: data.phone, href: `tel:${data.phone}` })
  if (data.location) contactItems.push({ text: data.location })
  if (data.website)
    contactItems.push({ text: data.website.replace(/^https?:\/\//, ""), href: data.website })
  if (data.linkedin)
    contactItems.push({
      text: data.linkedin.replace(/^https?:\/\/(www\.)?/, ""),
      href: data.linkedin,
    })
  if (data.github)
    contactItems.push({ text: data.github.replace(/^https?:\/\//, ""), href: data.github })

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "LETTER", style: styles.page },

      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.name }, data.full_name),
        React.createElement(Text, { style: styles.titleText }, data.title),
        React.createElement(
          View,
          { style: styles.contactRow },
          ...contactItems.flatMap((item, i) => {
            const elements: React.ReactElement[] = []
            if (i > 0) {
              elements.push(
                React.createElement(Text, { key: `sep-${i}`, style: styles.contactSep }, "|"),
              )
            }
            if (item.href) {
              elements.push(
                React.createElement(
                  Link,
                  { key: `c-${i}`, src: item.href, style: styles.link },
                  React.createElement(Text, { style: styles.contactItem }, item.text),
                ),
              )
            } else {
              elements.push(
                React.createElement(Text, { key: `c-${i}`, style: styles.contactItem }, item.text),
              )
            }
            return elements
          }),
        ),
      ),

      // Summary
      data.summary
        ? React.createElement(
            View,
            null,
            React.createElement(Text, { style: styles.sectionTitle }, "Summary"),
            React.createElement(Text, { style: styles.summaryText }, data.summary),
          )
        : null,

      // Skills
      data.skillGroups.length > 0
        ? React.createElement(
            View,
            null,
            React.createElement(Text, { style: styles.sectionTitle }, "Skills"),
            ...data.skillGroups.map((group, i) =>
              React.createElement(
                View,
                { key: `skill-${i}`, style: styles.skillRow },
                React.createElement(
                  Text,
                  { style: styles.skillCategory },
                  `${categoryLabels[group.category] ?? group.category}:`,
                ),
                React.createElement(Text, { style: styles.skillList }, group.skills.join(", ")),
              ),
            ),
          )
        : null,

      // Experience
      data.experience.length > 0
        ? React.createElement(
            View,
            null,
            React.createElement(Text, { style: styles.sectionTitle }, "Experience"),
            ...data.experience.map((exp, i) =>
              React.createElement(
                View,
                { key: `exp-${i}`, style: styles.expEntry },
                React.createElement(
                  View,
                  { style: styles.expHeader },
                  React.createElement(Text, { style: styles.expRole }, exp.role),
                  React.createElement(Text, { style: styles.expPeriod }, exp.period),
                ),
                React.createElement(
                  Text,
                  { style: styles.expCompany },
                  [exp.company, exp.location].filter(Boolean).join(" — "),
                ),
                ...exp.achievements.map((achievement, j) =>
                  React.createElement(
                    View,
                    { key: `ach-${i}-${j}`, style: styles.bullet },
                    React.createElement(Text, { style: styles.bulletChar }, "•"),
                    React.createElement(Text, { style: styles.bulletText }, achievement),
                  ),
                ),
              ),
            ),
          )
        : null,

      // Education
      data.education.length > 0
        ? React.createElement(
            View,
            null,
            React.createElement(Text, { style: styles.sectionTitle }, "Education"),
            ...data.education.map((edu, i) =>
              React.createElement(
                View,
                { key: `edu-${i}`, style: styles.eduEntry },
                React.createElement(
                  View,
                  { style: styles.eduHeader },
                  React.createElement(Text, { style: styles.eduSchool }, edu.school),
                  edu.year ? React.createElement(Text, { style: styles.eduYear }, edu.year) : null,
                ),
                React.createElement(
                  Text,
                  { style: styles.eduDegree },
                  [edu.degree, edu.field].filter(Boolean).join(" in "),
                ),
                edu.details
                  ? React.createElement(
                      Text,
                      { style: { fontSize: 10, color: "#555555" } },
                      edu.details,
                    )
                  : null,
              ),
            ),
          )
        : null,

      // Certifications
      data.certifications.length > 0
        ? React.createElement(
            View,
            null,
            React.createElement(Text, { style: styles.sectionTitle }, "Certifications"),
            ...data.certifications.map((cert, i) =>
              React.createElement(
                View,
                { key: `cert-${i}`, style: styles.certEntry },
                React.createElement(
                  Text,
                  null,
                  React.createElement(Text, { style: styles.certName }, cert.name),
                  React.createElement(Text, { style: styles.certIssuer }, ` — ${cert.issuer}`),
                  cert.year
                    ? React.createElement(
                        Text,
                        { style: { fontSize: 10, color: "#555555" } },
                        ` (${cert.year})`,
                      )
                    : null,
                ),
              ),
            ),
          )
        : null,

      // Additional sections
      ...data.additional_sections.map((section, i) =>
        React.createElement(
          View,
          { key: `add-${i}` },
          React.createElement(Text, { style: styles.sectionTitle }, section.title),
          ...section.items.map((item, j) =>
            React.createElement(
              View,
              { key: `add-${i}-${j}`, style: styles.bullet },
              React.createElement(Text, { style: styles.bulletChar }, "•"),
              React.createElement(Text, { style: styles.bulletText }, item),
            ),
          ),
        ),
      ),
    ),
  )
}

export async function generateResumePdf(data: ResumePdfData): Promise<Buffer> {
  const doc = React.createElement(ResumePdfDocument, { data })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await renderToBuffer(doc as any)) as Buffer
}
