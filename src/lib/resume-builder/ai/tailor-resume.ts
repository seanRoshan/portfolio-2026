import { getAnthropicClient } from './client'
import type { PortfolioData } from './portfolio-data'

// ===== Types =====

export interface TailoredResumeData {
  suggested_title: string
  suggested_template: string
  contact_info: {
    full_name: string
    email: string
    phone: string
    city: string
    country: string
    linkedin_url: string
    github_url: string
    portfolio_url: string
  }
  summary: string
  work_experiences: Array<{
    job_title: string
    company: string
    location: string
    start_date: string
    end_date: string | null
    achievements: string[]
  }>
  skill_categories: Array<{
    name: string
    skills: string[]
  }>
  projects: Array<{
    name: string
    description: string
    url: string | null
    source_url: string | null
    achievements: string[]
  }>
  education: Array<{
    degree: string
    institution: string
    field_of_study: string
    graduation_date: string
  }>
  certifications: Array<{
    name: string
    issuer: string
    date: string
  }>
  extracurriculars: Array<{
    type:
      | 'patent'
      | 'publication'
      | 'talk'
      | 'open_source'
      | 'community'
      | 'other'
    title: string
    description: string
    url: string | null
  }>
  section_order: string[]
}

// ===== Template Map =====

export const TEMPLATE_MAP: Record<string, string> = {
  pragmatic: 'a1b2c3d4-0001-4000-8000-000000000001',
  mono: 'a1b2c3d4-0002-4000-8000-000000000002',
  smarkdown: 'a1b2c3d4-0003-4000-8000-000000000003',
  careercup: 'a1b2c3d4-0004-4000-8000-000000000004',
  parker: 'a1b2c3d4-0005-4000-8000-000000000005',
  experienced: 'a1b2c3d4-0006-4000-8000-000000000006',
}

export function getTemplateId(name: string): string {
  const normalized = name.toLowerCase().trim()
  const id = TEMPLATE_MAP[normalized]
  if (!id) {
    throw new Error(
      `Unknown template "${name}". Valid templates: ${Object.keys(TEMPLATE_MAP).join(', ')}`
    )
  }
  return id
}

// ===== System Prompt =====

const SYSTEM_PROMPT = `You are an expert resume writer and career strategist. Your job is to create a highly targeted, ATS-optimized resume from a candidate's portfolio data, tailored to a specific job description.

## Your Process

1. **Analyze the Job Description** — Identify:
   - Required and preferred technical skills
   - Expected experience level and years
   - Key responsibilities and domain expertise
   - Industry-specific terminology and keywords

2. **Select Relevant Content** — From the portfolio data, pick ONLY the most relevant entries for each section. Do NOT include everything — curate aggressively:
   - Work experiences most relevant to the target role (prioritize recency)
   - Skills that match or complement the JD requirements
   - Projects that demonstrate relevant technical depth
   - Education and certifications that are relevant

3. **Rewrite Experience Bullets** — Use the XYZ formula:
   "Accomplished [X] as measured by [Y] by doing [Z]"
   - Start each bullet with a strong action verb (Led, Built, Improved, Optimized, Designed, etc.)
   - Include quantifiable metrics where available
   - Be specific about technologies used
   - Max 4-6 bullets per work experience
   - Max 150 characters per bullet
   - No cliches or buzzwords (no "leveraged", "utilized", "passionate", "synergy", "dynamic")

4. **Group Skills** — Organize skills into resume categories such as:
   Languages, Frameworks & Libraries, Cloud & Infrastructure, Databases, Tools & Platforms, etc.

5. **Write Professional Summary** — 2-3 sentences that:
   - Highlight total years of experience and primary expertise
   - Reference the target role/company implicitly
   - Include 2-3 high-impact keywords from the JD

6. **Map Ventures** — If the candidate has ventures/side businesses relevant to the role, include them as extracurriculars with type "open_source", "community", or "other" as appropriate.

7. **Suggest Template** — Pick one of: pragmatic, mono, smarkdown, careercup, parker, experienced
   - "pragmatic" — clean, versatile, works for most roles
   - "mono" — minimalist, great for design-adjacent or startup roles
   - "smarkdown" — markdown-inspired, good for developer/engineering roles
   - "careercup" — traditional, best for enterprise/corporate applications
   - "parker" — modern with accent colors, good for product/PM roles
   - "experienced" — dense layout, ideal for senior/staff+ with lots of experience

8. **Suggest Section Order** — Recommend optimal ordering based on the candidate's strengths for this role.

9. **Suggest Title** — Format: "[Role] — [Company]" (e.g. "Senior Frontend Engineer — Stripe")

## Rules
- Respond with ONLY valid JSON matching the TailoredResumeData structure
- No markdown code fences, no explanations, just the JSON object
- If portfolio data is missing for a section, return an empty array for that section
- Dates should be in ISO format (YYYY-MM-DD) or partial (YYYY-MM)
- For current positions, end_date should be null
- contact_info fields should use empty string "" if not available (not null)
- section_order should contain these possible values: "summary", "work_experience", "skills", "projects", "education", "certifications", "extracurriculars"`

// ===== Portfolio Formatter =====

function formatPortfolioForPrompt(portfolio: PortfolioData): string {
  const sections: string[] = []

  // Contact Info
  sections.push(`## Contact Information
- Name: ${portfolio.name}
- Email: ${portfolio.email ?? 'N/A'}
- Phone: ${portfolio.phone ?? 'N/A'}
- Location: ${portfolio.location ?? 'N/A'}
- LinkedIn: ${portfolio.linkedin ?? 'N/A'}
- GitHub: ${portfolio.github ?? 'N/A'}
- Website: ${portfolio.website ?? 'N/A'}
- Blog: ${portfolio.blog ?? 'N/A'}`)

  // Bio
  if (portfolio.bio) {
    sections.push(`## Bio / About
${portfolio.bio}`)
  }

  // Work Experience
  if (portfolio.experiences.length > 0) {
    const expLines = portfolio.experiences.map((e) => {
      const dateRange = `${e.start_date} — ${e.end_date ?? 'Present'}`
      const via = e.via_company ? ` (via ${e.via_company})` : ''
      const type = e.employment_type !== 'direct' ? ` [${e.employment_type}]` : ''
      const bullets = e.achievements.length > 0
        ? '\n' + e.achievements.map((a) => `  - ${a}`).join('\n')
        : ''
      return `### ${e.role} at ${e.company}${via}${type}
${e.location ?? 'Remote'} | ${dateRange}${bullets}`
    })
    sections.push(`## Work Experience\n${expLines.join('\n\n')}`)
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
      .map(([cat, names]) => `- ${cat}: ${names.join(', ')}`)
      .join('\n')
    sections.push(`## Skills\n${skillLines}`)
  }

  // Education
  if (portfolio.education.length > 0) {
    const eduLines = portfolio.education.map((e) => {
      const field = e.field ? ` in ${e.field}` : ''
      const year = e.year ? ` (${e.year})` : ''
      const details = e.details ? `\n  ${e.details}` : ''
      return `- ${e.degree}${field} — ${e.school}${year}${details}`
    })
    sections.push(`## Education\n${eduLines.join('\n')}`)
  }

  // Certifications
  if (portfolio.certifications.length > 0) {
    const certLines = portfolio.certifications.map((c) => {
      const year = c.year ? ` (${c.year})` : ''
      return `- ${c.name} — ${c.issuer}${year}`
    })
    sections.push(`## Certifications\n${certLines.join('\n')}`)
  }

  // Projects
  if (portfolio.projects.length > 0) {
    const projLines = portfolio.projects.map((p) => {
      const urls: string[] = []
      if (p.live_url) urls.push(`Live: ${p.live_url}`)
      if (p.github_url) urls.push(`GitHub: ${p.github_url}`)
      const urlLine = urls.length > 0 ? `\n  ${urls.join(' | ')}` : ''
      const tech = p.tech_stack.length > 0 ? `\n  Tech: ${p.tech_stack.join(', ')}` : ''
      const highlights = p.highlights.length > 0
        ? '\n' + p.highlights.map((h) => `  - ${h.metric}: ${h.value}`).join('\n')
        : ''
      return `### ${p.title}
  ${p.short_description}${tech}${urlLine}${highlights}`
    })
    sections.push(`## Projects\n${projLines.join('\n\n')}`)
  }

  // Ventures
  if (portfolio.ventures.length > 0) {
    const ventureLines = portfolio.ventures.map((v) => {
      const year = v.founded_year ? ` (Founded ${v.founded_year})` : ''
      const url = v.url ? ` — ${v.url}` : ''
      const desc = v.description ? `\n  ${v.description}` : ''
      return `- ${v.name} — ${v.role}${year}${url}${desc}`
    })
    sections.push(`## Ventures / Side Projects\n${ventureLines.join('\n')}`)
  }

  return sections.join('\n\n')
}

// ===== Main Function =====

export async function tailorResume(
  portfolio: PortfolioData,
  jobDescription: string,
  experienceLevel: string = 'mid'
): Promise<TailoredResumeData> {
  const client = getAnthropicClient()
  if (!client) {
    throw new Error('AI not available: ANTHROPIC_API_KEY not set')
  }

  const formattedPortfolio = formatPortfolioForPrompt(portfolio)

  const userMessage = `Here is the candidate's full portfolio data:

${formattedPortfolio}

---

Experience Level: ${experienceLevel}

---

Target Job Description:

${jobDescription.slice(0, 4000)}

---

Using the portfolio data above, create a tailored resume optimized for this job description. Select only the most relevant content, rewrite bullets using the XYZ formula, and return the result as a JSON object matching the TailoredResumeData structure.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  const rawText = textBlock?.text ?? ''

  if (!rawText) {
    throw new Error('AI returned empty response')
  }

  // Handle potential markdown code fence wrapping
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('AI response did not contain valid JSON')
  }

  try {
    const parsed: TailoredResumeData = JSON.parse(jsonMatch[0])
    return parsed
  } catch (e) {
    throw new Error(
      `Failed to parse AI response as JSON: ${e instanceof Error ? e.message : String(e)}`
    )
  }
}
