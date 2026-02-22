import { fetchPortfolioData } from './portfolio-data'

/**
 * Generates a comprehensive source file containing ALL portfolio data.
 * This serves as the "truth document" that AI works from during resume tailoring.
 * Every piece of data from the database is included — nothing is lost.
 */
export async function generateResumeSourceFile(): Promise<string> {
  const portfolio = await fetchPortfolioData()
  const sections: string[] = []

  // Header
  sections.push(`# Complete Portfolio Data — Resume Source File
Generated: ${new Date().toISOString()}
`)

  // Contact Info
  sections.push(`## Contact Information
| Field | Value |
|-------|-------|
| Name | ${portfolio.name} |
| Email | ${portfolio.email ?? 'N/A'} |
| Phone | ${portfolio.phone ?? 'N/A'} |
| Location | ${portfolio.location ?? 'N/A'} |
| LinkedIn | ${portfolio.linkedin ?? 'N/A'} |
| GitHub | ${portfolio.github ?? 'N/A'} |
| Website | ${portfolio.website ?? 'N/A'} |
| Blog | ${portfolio.blog ?? 'N/A'} |`)

  // Bio
  if (portfolio.bio) {
    sections.push(`## Professional Bio\n${portfolio.bio}`)
  }

  // Work Experience
  if (portfolio.experiences.length > 0) {
    const expLines = portfolio.experiences.map((e, i) => {
      const dateRange = `${e.start_date} — ${e.end_date ?? 'Present'}`
      const meta: string[] = []
      if (e.employment_type !== 'direct') meta.push(`Type: ${e.employment_type}`)
      if (e.via_company) meta.push(`Via: ${e.via_company}`)
      const metaLine = meta.length > 0 ? `\n  _${meta.join(' | ')}_` : ''

      const curatedBullets = e.resume_achievements?.length
        ? `\n  **Curated Resume Bullets:**\n${e.resume_achievements.map((a: string) => `  - ${a}`).join('\n')}`
        : ''
      const allBullets =
        e.achievements.length > 0
          ? `\n  **All Achievements:**\n${e.achievements.map((a: string) => `  - ${a}`).join('\n')}`
          : ''

      return `### ${i + 1}. ${e.role} at ${e.company}
  ${e.location ?? 'Remote'} | ${dateRange}${metaLine}${curatedBullets}${allBullets}`
    })
    sections.push(
      `## Work Experience (${portfolio.experiences.length} entries)\n${expLines.join('\n\n')}`
    )
  }

  // Skills
  if (portfolio.skills.length > 0) {
    const byCategory = new Map<string, string[]>()
    for (const skill of portfolio.skills) {
      const cat = skill.category || 'Other'
      if (!byCategory.has(cat)) byCategory.set(cat, [])
      byCategory.get(cat)!.push(skill.name)
    }
    const skillLines = Array.from(byCategory.entries())
      .map(([cat, names]) => `- **${cat}:** ${names.join(', ')}`)
      .join('\n')
    sections.push(`## Skills (${portfolio.skills.length} total)\n${skillLines}`)
  }

  // Education
  if (portfolio.education.length > 0) {
    const eduLines = portfolio.education.map((e) => {
      const field = e.field ? ` in ${e.field}` : ''
      const year = e.year ? ` (${e.year})` : ''
      const details = e.details ? `\n  ${e.details}` : ''
      return `- **${e.degree}${field}** — ${e.school}${year}${details}`
    })
    sections.push(
      `## Education (${portfolio.education.length} entries)\n${eduLines.join('\n')}`
    )
  }

  // Certifications
  if (portfolio.certifications.length > 0) {
    const certLines = portfolio.certifications.map((c) => {
      const year = c.year ? ` (${c.year})` : ''
      return `- **${c.name}** — ${c.issuer}${year}`
    })
    sections.push(
      `## Certifications (${portfolio.certifications.length} entries)\n${certLines.join('\n')}`
    )
  }

  // Projects
  if (portfolio.projects.length > 0) {
    const projLines = portfolio.projects.map((p) => {
      const urls: string[] = []
      if (p.live_url) urls.push(`Live: ${p.live_url}`)
      if (p.github_url) urls.push(`GitHub: ${p.github_url}`)
      const urlLine = urls.length > 0 ? `\n  ${urls.join(' | ')}` : ''
      const tech =
        p.tech_stack.length > 0 ? `\n  Tech: ${p.tech_stack.join(', ')}` : ''
      const role = p.project_role ? `\n  Role: ${p.project_role}` : ''
      const desc = p.long_description ?? p.short_description
      const highlights = p.highlights?.length
        ? '\n  Highlights:\n' +
          p.highlights
            .map(
              (h: { metric: string; value: string }) =>
                `  - ${h.metric}: ${h.value}`
            )
            .join('\n')
        : ''
      return `### ${p.title}\n  ${desc}${role}${tech}${urlLine}${highlights}`
    })
    sections.push(
      `## Projects (${portfolio.projects.length} entries)\n${projLines.join('\n\n')}`
    )
  }

  // Ventures
  if (portfolio.ventures.length > 0) {
    const ventureLines = portfolio.ventures.map((v) => {
      const year = v.founded_year ? ` (Founded ${v.founded_year})` : ''
      const url = v.url ? ` — ${v.url}` : ''
      const desc = v.description ? `\n  ${v.description}` : ''
      return `- **${v.name}** — ${v.role}${year}${url}${desc}`
    })
    sections.push(
      `## Ventures & Side Projects (${portfolio.ventures.length} entries)\n${ventureLines.join('\n')}`
    )
  }

  return sections.join('\n\n---\n\n')
}
