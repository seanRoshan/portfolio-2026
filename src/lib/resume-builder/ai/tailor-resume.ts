import {
  APIError,
  APIConnectionError,
  APIConnectionTimeoutError,
  AuthenticationError,
  RateLimitError,
} from '@anthropic-ai/sdk'
import { getAnthropicClient } from './client'
import type { PortfolioData } from './portfolio-data'

// ===== Constants =====

const MODEL = 'claude-sonnet-4-6'

// Valid section names matching the editor's sectionMap keys
const VALID_SECTIONS = [
  'contact',
  'summary',
  'experience',
  'skills',
  'education',
  'projects',
  'certifications',
  'extracurriculars',
] as const

// ===== Types =====

export interface JDAnalysis {
  role_title: string
  company: string
  required_skills: string[]
  preferred_skills: string[]
  key_requirements: string[]
  years_experience: string | null
  domain: string
  location: string | null
  work_mode: string | null
}

export interface SkillMatchResult {
  matched: string[]
  missing: string[]
  portfolio_extras: string[]
}

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
    blog_url: string
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

export interface AIUsageInfo {
  model: string
  input_tokens: number
  output_tokens: number
}

export interface TailorResult {
  data: TailoredResumeData
  jdAnalysis: JDAnalysis
  skillMatch: SkillMatchResult
  usage: AIUsageInfo
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
  const normalized = (name || '').toLowerCase().trim()
  return TEMPLATE_MAP[normalized] ?? TEMPLATE_MAP.pragmatic
}

// ===== Step 1: Analyze Job Description =====

const JD_ANALYSIS_PROMPT = `You are an expert recruiter and job description analyst. Analyze this job description and extract structured information.

Return ONLY valid JSON with this exact structure (no markdown fences):
{
  "role_title": "exact role title from JD",
  "company": "company name or empty string",
  "required_skills": ["skill1", "skill2"],
  "preferred_skills": ["nice-to-have skill1"],
  "key_requirements": ["requirement1", "requirement2"],
  "years_experience": "e.g. 5+ years or null",
  "domain": "e.g. fintech, healthcare, SaaS",
  "location": "city, state/country from JD or null if not specified",
  "work_mode": "remote, hybrid, or onsite based on JD text, null if unclear"
}

Rules:
- required_skills: Technical skills explicitly required (languages, frameworks, tools, platforms)
- preferred_skills: Nice-to-have or preferred skills
- key_requirements: Non-skill requirements (leadership, communication, certifications, domain experience)
- location: The office/work location mentioned in the JD (city, state or city, country). null if not specified
- work_mode: "remote" if fully remote, "hybrid" if hybrid/flexible, "onsite" if in-office. null if unclear
- Be specific with skills: "React" not "frontend", "PostgreSQL" not "databases"
- Extract ALL mentioned technical skills, don't summarize`

async function analyzeJD(
  client: NonNullable<ReturnType<typeof getAnthropicClient>>,
  jobDescription: string
): Promise<{ analysis: JDAnalysis; usage: AIUsageInfo }> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: JD_ANALYSIS_PROMPT,
    messages: [{ role: 'user', content: jobDescription.slice(0, 8000) }],
  })

  const usage: AIUsageInfo = {
    model: MODEL,
    input_tokens: response.usage?.input_tokens ?? 0,
    output_tokens: response.usage?.output_tokens ?? 0,
  }

  const text = response.content.find((b) => b.type === 'text')?.text ?? ''
  const jsonMatch = extractJSON(text)
  if (!jsonMatch) throw new Error('JD analysis did not return valid JSON')

  const analysis: JDAnalysis = JSON.parse(jsonMatch[0])
  return { analysis, usage }
}

// ===== Step 2: Match Skills (Programmatic) =====

/** Check if two skill names are a meaningful match (not just substring collision) */
function skillsMatch(a: string, b: string): boolean {
  if (a === b) return true
  // Word-boundary match: check if one is a whole word within the other
  // This prevents "go" matching "google", "java" matching "javascript", etc.
  const wordBoundary = (haystack: string, needle: string) => {
    if (needle.length < 2) return haystack === needle // Single-char skills need exact match
    const re = new RegExp(`(?:^|[\\s\\-./,])${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[\\s\\-./,])`)
    return re.test(` ${haystack} `)
  }
  return wordBoundary(a, b) || wordBoundary(b, a)
}

function matchSkills(
  portfolio: PortfolioData,
  analysis: JDAnalysis
): SkillMatchResult {
  const portfolioSkillNames = portfolio.skills.map((s) =>
    s.name.toLowerCase().trim()
  )
  // Also extract skill names from project tech stacks
  const techStackSkills = portfolio.projects.flatMap((p) =>
    (p.tech_stack ?? []).map((t) => t.toLowerCase().trim())
  )
  const allPortfolioSkills = new Set([...portfolioSkillNames, ...techStackSkills])

  // Deduplicate JD skills (same skill can appear in required + preferred)
  const jdSkills = [...new Set([
    ...analysis.required_skills,
    ...analysis.preferred_skills,
  ])]

  const matched: string[] = []
  const missing: string[] = []
  const matchedLower = new Set<string>()

  for (const skill of jdSkills) {
    const normalized = skill.toLowerCase().trim()
    const found = [...allPortfolioSkills].some((ps) => skillsMatch(ps, normalized))
    if (found) {
      matched.push(skill)
      matchedLower.add(normalized)
    } else {
      missing.push(skill)
    }
  }

  // Portfolio skills not matched to any JD skill (extras the candidate has)
  const portfolioExtras = portfolio.skills
    .filter((s) => {
      const name = s.name.toLowerCase().trim()
      return ![...matchedLower].some((m) => skillsMatch(name, m))
    })
    .map((s) => s.name)

  return { matched, missing, portfolio_extras: portfolioExtras }
}

// ===== Step 3: Tailor Resume =====

function getSectionOrderInstruction(level: string): string {
  switch (level) {
    case 'intern':
    case 'new_grad':
      return `Page 1 priority: contact, summary, education, experience, skills
Page 2 content: projects, certifications, extracurriculars
(Education before experience — strongest section for this level)`
    case 'bootcamp_grad':
      return `Page 1 priority: contact, summary, skills, projects, experience
Page 2 content: education, certifications, extracurriculars
(Skills and projects before experience — strongest sections for bootcamp grads)`
    case 'senior':
    case 'staff_plus':
      return `Page 1 priority: contact, summary, experience, extracurriculars, skills
Page 2 content: education, projects, certifications
(Extracurriculars before skills — patents, publications, talks matter at this level)`
    case 'tech_lead':
    case 'eng_manager':
      return `Page 1 priority: contact, summary, experience, extracurriculars, skills
Page 2 content: education, projects, certifications
(Extracurriculars before skills — leadership contributions matter at this level)`
    default:
      return `Page 1 priority: contact, summary, experience, skills
Page 2 content: education, projects, certifications, extracurriculars`
  }
}

function buildTailoringPrompt(
  analysis: JDAnalysis,
  skillMatch: SkillMatchResult,
  experienceLevel: string,
  portfolio: PortfolioData
): string {
  // Provide exact counts so the AI knows how many items to include
  const expCount = portfolio.experiences.length
  const eduCount = portfolio.education.length
  const certCount = portfolio.certifications.length
  const projCount = portfolio.projects.length
  const ventureCount = portfolio.ventures.length
  const skillCount = portfolio.skills.length

  const countLines: string[] = []
  if (expCount > 0) countLines.push(`- Work Experiences: ${expCount} entries — include ALL ${expCount} in work_experiences`)
  if (skillCount > 0) countLines.push(`- Skills: ${skillCount} skills — group ALL relevant ones into skill_categories`)
  if (eduCount > 0) countLines.push(`- Education: ${eduCount} entries — include ALL ${eduCount} in education`)
  if (certCount > 0) countLines.push(`- Certifications: ${certCount} entries — include ALL ${certCount} in certifications`)
  if (projCount > 0) countLines.push(`- Projects: ${projCount} entries — include ALL ${projCount} in projects`)
  if (ventureCount > 0) countLines.push(`- Ventures: ${ventureCount} entries — map ALL ${ventureCount} as extracurriculars`)

  return `You are an expert resume writer creating a highly targeted, ATS-optimized resume.

## Context
- Target Role: ${analysis.role_title} at ${analysis.company || 'target company'}
- Domain: ${analysis.domain || 'technology'}
- Experience Level: ${experienceLevel}
- Required Years: ${analysis.years_experience || 'not specified'}

## Skill Analysis (pre-computed)
- MATCHED skills (candidate HAS these): ${skillMatch.matched.join(', ') || 'none identified'}
- MISSING skills (candidate LACKS these — do NOT fabricate): ${skillMatch.missing.join(', ') || 'none'}
- Extra portfolio skills: ${skillMatch.portfolio_extras.slice(0, 20).join(', ') || 'none'}

## Key JD Requirements
${analysis.key_requirements.map((r) => `- ${r}`).join('\n')}

${countLines.join('\n')}

## CRITICAL RULES

### You MUST populate EVERY section — no empty sections allowed:
1. **contact_info** — Copy from portfolio data exactly. For location, split into city and country (e.g. "San Francisco, CA" → city="San Francisco, CA", country="USA"). Map Website to portfolio_url and Blog to blog_url
2. **summary** — Write 2-3 sentences tailored to the role. Include years of experience, key expertise, and 2-3 JD keywords
3. **work_experiences** — Include ALL ${expCount} work experiences from portfolio. Do NOT skip any. Reverse-chronological order (newest first). Each MUST have 3-4 achievement bullets using XYZ formula: "Accomplished [X] as measured by [Y] by doing [Z]". Max 200 chars per bullet. Start each bullet with a strong action verb. If the portfolio data has existing achievements for an experience, REWRITE them using XYZ formula — do NOT drop them
4. **skill_categories** — Group matched + extra relevant skills into categories (Languages, Frameworks, Cloud, Databases, Tools). Include ALL matched skills. Do NOT include missing skills
5. **education** — Include ALL ${eduCount} education entries from portfolio
6. **projects** — Include ALL ${projCount} projects. Rewrite descriptions to highlight JD-relevant tech. Each project MUST have 2-3 achievement bullets
7. **certifications** — Include ALL ${certCount} certifications from portfolio
8. **extracurriculars** — Map ALL ${ventureCount} ventures/side projects as extracurriculars

### Section Ordering (these are the ONLY valid section names):
section_order MUST use exactly these values: "contact", "summary", "experience", "skills", "education", "projects", "certifications", "extracurriculars"

${getSectionOrderInstruction(experienceLevel)}

### Content Rules:
- Do NOT fabricate experiences, skills, or achievements — only use data from portfolio
- Do NOT include skills the candidate doesn't have
- Do NOT drop or skip any experience, education, certification, or project from the portfolio
- Every work experience MUST have 3-4 achievement bullets — NEVER leave achievements empty
- Dates MUST be in ISO format: YYYY-MM-DD only (not YYYY-MM). Use YYYY-01-01 if only year known, YYYY-MM-01 if only year and month known
- Current positions: end_date = null
- Empty strings "" for missing contact fields (not null)
- No buzzwords: "leveraged", "utilized", "passionate", "synergy", "dynamic"
- Work experiences MUST be in reverse-chronological order (most recent first)

### Template Selection
Pick one of: pragmatic, mono, smarkdown, careercup, parker, experienced
- pragmatic — clean, versatile (default safe choice)
- smarkdown — developer/engineering roles
- careercup — enterprise/corporate
- experienced — senior/staff+ with lots of experience

### Title Format
"[Role] — [Company]" (e.g. "Senior Frontend Engineer — Stripe")

Return ONLY valid JSON matching TailoredResumeData. No markdown fences, no explanations.
IMPORTANT: Your response MUST include ALL ${expCount} work experiences with 3-4 bullets each. Do NOT truncate.`
}

// ===== Portfolio Formatter =====

function formatPortfolioForPrompt(portfolio: PortfolioData): string {
  const sections: string[] = []

  sections.push(`## Contact Information
- Name: ${portfolio.name || 'N/A'}
- Email: ${portfolio.email ?? 'N/A'}
- Phone: ${portfolio.phone ?? 'N/A'}
- Location: ${portfolio.location ?? 'N/A'}
- LinkedIn: ${portfolio.linkedin ?? 'N/A'}
- GitHub: ${portfolio.github ?? 'N/A'}
- Website: ${portfolio.website ?? 'N/A'}
- Blog: ${portfolio.blog ?? 'N/A'}`)

  if (portfolio.bio) {
    sections.push(`## Bio / About\n${portfolio.bio}`)
  }

  if (portfolio.experiences.length > 0) {
    const expLines = portfolio.experiences.map((e) => {
      const dateRange = `${e.start_date} — ${e.end_date ?? 'Present'}`
      const via = e.via_company ? ` (via ${e.via_company})` : ''
      const type =
        e.employment_type !== 'direct' ? ` [${e.employment_type}]` : ''
      // Prefer curated resume_achievements over full achievements list
      const bullets = e.resume_achievements ?? e.achievements ?? []
      const bulletText =
        bullets.length > 0
          ? '\n' + bullets.map((a: string) => `  - ${a}`).join('\n')
          : ''
      return `### ${e.role} at ${e.company}${via}${type}\n${e.location ?? 'Remote'} | ${dateRange}${bulletText}`
    })
    sections.push(`## Work Experience\n${expLines.join('\n\n')}`)
  }

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

  if (portfolio.education.length > 0) {
    const eduLines = portfolio.education.map((e) => {
      const field = e.field ? ` in ${e.field}` : ''
      const year = e.year ? ` (${e.year})` : ''
      const details = e.details ? `\n  ${e.details}` : ''
      return `- ${e.degree}${field} — ${e.school}${year}${details}`
    })
    sections.push(`## Education\n${eduLines.join('\n')}`)
  }

  if (portfolio.certifications.length > 0) {
    const certLines = portfolio.certifications.map((c) => {
      const year = c.year ? ` (${c.year})` : ''
      return `- ${c.name} — ${c.issuer}${year}`
    })
    sections.push(`## Certifications\n${certLines.join('\n')}`)
  }

  if (portfolio.projects.length > 0) {
    const projLines = portfolio.projects.map((p) => {
      const urls: string[] = []
      if (p.live_url) urls.push(`Live: ${p.live_url}`)
      if (p.github_url) urls.push(`GitHub: ${p.github_url}`)
      const urlLine = urls.length > 0 ? `\n  ${urls.join(' | ')}` : ''
      const tech =
        (p.tech_stack ?? []).length > 0
          ? `\n  Tech: ${p.tech_stack.join(', ')}`
          : ''
      const role = p.project_role ? `\n  Role: ${p.project_role}` : ''
      const highlights =
        (p.highlights ?? []).length > 0
          ? '\n' +
            p.highlights.map((h) => `  - ${h.metric}: ${h.value}`).join('\n')
          : ''
      return `### ${p.title}\n  ${p.long_description ?? p.short_description}${tech}${role}${urlLine}${highlights}`
    })
    sections.push(`## Projects\n${projLines.join('\n\n')}`)
  }

  if (portfolio.ventures.length > 0) {
    const ventureLines = portfolio.ventures.map((v) => {
      const year = v.founded_year ? ` (Founded ${v.founded_year})` : ''
      const url = v.url ? ` — ${v.url}` : ''
      const desc = v.description ? `\n  ${v.description}` : ''
      return `- ${v.name} — ${v.role}${year}${url}${desc}`
    })
    sections.push(
      `## Ventures / Side Projects\n${ventureLines.join('\n')}`
    )
  }

  return sections.join('\n\n')
}

// ===== JSON Extraction (balanced braces) =====

function extractJSON(text: string): [string] | null {
  const start = text.indexOf('{')
  if (start === -1) return null
  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (escape) { escape = false; continue }
    if (ch === '\\' && inString) { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') depth++
    else if (ch === '}') { depth--; if (depth === 0) return [text.slice(start, i + 1)] }
  }
  return null
}

// ===== API Error Handler =====

function handleAPIError(err: unknown): never {
  if (err instanceof AuthenticationError) {
    throw new Error(
      'AI API key is invalid or expired. Check ANTHROPIC_API_KEY in your .env.local'
    )
  }
  if (err instanceof RateLimitError) {
    throw new Error(
      'AI rate limit reached. Please wait a moment and try again'
    )
  }
  if (err instanceof APIConnectionTimeoutError) {
    throw new Error('AI request timed out. Please try again')
  }
  if (err instanceof APIConnectionError) {
    throw new Error('Cannot reach AI API. Check your internet connection')
  }
  if (err instanceof APIError) {
    const status = err.status
    if (status && status >= 500) {
      throw new Error(
        'AI service is temporarily unavailable. Please try again later'
      )
    }
    throw new Error(`AI API error (${status}): ${err.message}`)
  }
  throw new Error(
    `Unexpected AI error: ${err instanceof Error ? err.message : String(err)}`
  )
}

// ===== Sanitize Section Order =====

function sanitizeSectionOrder(order: string[] | undefined): string[] {
  if (!order?.length) {
    return [...VALID_SECTIONS]
  }
  // Only keep valid section names, preserve order
  const valid = new Set<string>(VALID_SECTIONS)
  const seen = new Set<string>()
  const result: string[] = []

  const SECTION_ALIASES: Record<string, string> = {
    work_experience: 'experience',
    work_experiences: 'experience',
    work: 'experience',
    professional_experience: 'experience',
    skill_categories: 'skills',
    technical_skills: 'skills',
    extracurricular: 'extracurriculars',
    extra_curriculars: 'extracurriculars',
    activities: 'extracurriculars',
    certification: 'certifications',
    project: 'projects',
    contact_info: 'contact',
    professional_summary: 'summary',
  }

  for (const s of order) {
    const mapped = SECTION_ALIASES[s] ?? s
    if (valid.has(mapped) && !seen.has(mapped)) {
      result.push(mapped)
      seen.add(mapped)
    }
  }

  // Add any missing sections at the end
  for (const s of VALID_SECTIONS) {
    if (!seen.has(s)) {
      result.push(s)
    }
  }

  return result
}

// ===== Main Pipeline =====

export async function tailorResume(
  portfolio: PortfolioData,
  jobDescription: string,
  experienceLevel: string = 'mid'
): Promise<TailorResult> {
  const client = getAnthropicClient()
  if (!client) {
    throw new Error('AI not available — ANTHROPIC_API_KEY is not configured')
  }

  const totalUsage: AIUsageInfo = { model: MODEL, input_tokens: 0, output_tokens: 0 }

  // --- Step 1: Analyze JD ---
  let jdAnalysis: JDAnalysis
  try {
    const { analysis, usage } = await analyzeJD(client, jobDescription)
    jdAnalysis = analysis
    totalUsage.input_tokens += usage.input_tokens
    totalUsage.output_tokens += usage.output_tokens
  } catch (err) {
    // Re-throw parse/validation errors as-is; only wrap API errors
    if (err instanceof Error && !(err instanceof APIError || err instanceof APIConnectionError || err instanceof APIConnectionTimeoutError || err instanceof AuthenticationError || err instanceof RateLimitError)) {
      throw err
    }
    handleAPIError(err)
  }

  // --- Step 2: Match Skills (programmatic, instant) ---
  const skillMatch = matchSkills(portfolio, jdAnalysis)

  // --- Step 3: Tailor Resume ---
  const systemPrompt = buildTailoringPrompt(
    jdAnalysis,
    skillMatch,
    experienceLevel,
    portfolio
  )
  const formattedPortfolio = formatPortfolioForPrompt(portfolio)

  const userMessage = `Here is the candidate's complete portfolio data. Use ALL of it to populate the resume sections.

${formattedPortfolio}

---

Create the tailored resume JSON now. Remember: EVERY section must be populated with data from the portfolio above. Do not leave any section empty.`

  let text = ''
  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 32768,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })
    const response = await stream.finalMessage()
    totalUsage.input_tokens += response.usage?.input_tokens ?? 0
    totalUsage.output_tokens += response.usage?.output_tokens ?? 0
    text = response.content.find((b) => b.type === 'text')?.text ?? ''
  } catch (err) {
    if (err instanceof Error && !(err instanceof APIError || err instanceof APIConnectionError || err instanceof APIConnectionTimeoutError || err instanceof AuthenticationError || err instanceof RateLimitError)) {
      throw err
    }
    handleAPIError(err)
  }
  if (!text) throw new Error('AI returned empty response')

  const jsonMatch = extractJSON(text)
  if (!jsonMatch) throw new Error('AI response did not contain valid JSON')

  let parsed: TailoredResumeData
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch (e) {
    throw new Error(
      `Failed to parse AI response: ${e instanceof Error ? e.message : String(e)}`
    )
  }

  // Sanitize section_order to fix common AI mistakes
  parsed.section_order = sanitizeSectionOrder(parsed.section_order)

  // Sanitize work experiences — AI may use alternate key names or return nulls.
  // Cross-reference portfolio data to fill in any fields the AI dropped.
  parsed.work_experiences = (parsed.work_experiences ?? []).map((exp: Record<string, unknown>) => {
    const jobTitle = ((exp.job_title ?? exp.title ?? exp.role ?? '') as string).trim()
    const company = ((exp.company ?? exp.organization ?? '') as string).trim()

    // If the AI dropped job_title or company, look it up from the portfolio
    let resolvedTitle = jobTitle
    let resolvedCompany = company
    if (!resolvedTitle || !resolvedCompany) {
      const match = portfolio.experiences.find((pe) =>
        (resolvedCompany && pe.company.toLowerCase() === resolvedCompany.toLowerCase()) ||
        (resolvedTitle && pe.role.toLowerCase() === resolvedTitle.toLowerCase())
      )
      if (match) {
        resolvedTitle = resolvedTitle || match.role
        resolvedCompany = resolvedCompany || match.company
      }
    }

    return {
      job_title: resolvedTitle,
      company: resolvedCompany,
      location: ((exp.location ?? '') as string).trim(),
      start_date: (exp.start_date ?? '') as string,
      end_date: (exp.end_date ?? null) as string | null,
      achievements: (Array.isArray(exp.achievements) ? exp.achievements.filter(Boolean) : []) as string[],
    }
  }).filter((exp) => exp.job_title || exp.company) // Drop entries with no identifiable data

  // Sanitize projects — cross-reference portfolio for missing fields
  parsed.projects = (parsed.projects ?? []).map((proj: Record<string, unknown>) => {
    const name = ((proj.name ?? proj.title ?? '') as string).trim()

    // If the AI dropped the project name, look it up from the portfolio
    let resolvedName = name
    if (!resolvedName) {
      const desc = ((proj.description ?? '') as string).toLowerCase()
      const match = portfolio.projects.find((pp) =>
        desc && (pp.short_description?.toLowerCase().includes(desc.slice(0, 30)) ||
        pp.title.toLowerCase().includes(desc.slice(0, 30)))
      )
      if (match) resolvedName = match.title
    }

    return {
      name: resolvedName,
      description: ((proj.description ?? '') as string).trim(),
      url: (proj.url ?? proj.live_url ?? null) as string | null,
      source_url: (proj.source_url ?? proj.github_url ?? null) as string | null,
      achievements: (Array.isArray(proj.achievements) ? proj.achievements.filter(Boolean) : []) as string[],
    }
  }).filter((proj) => proj.name)

  // Sanitize contact_info — merge portfolio data for any missing fields
  const locationParts = (portfolio.location ?? '').split(',').map((s) => s.trim())
  const portfolioCity = locationParts[0] || null
  const portfolioCountry = locationParts.length > 1 ? locationParts.slice(1).join(', ').trim() : null
  const ci = parsed.contact_info ?? {} as Record<string, string>
  parsed.contact_info = {
    full_name: ci.full_name || portfolio.name || '',
    email: ci.email || portfolio.email || '',
    phone: ci.phone || portfolio.phone || '',
    city: ci.city || portfolioCity || '',
    country: ci.country || portfolioCountry || '',
    linkedin_url: ci.linkedin_url || portfolio.linkedin || '',
    github_url: ci.github_url || portfolio.github || '',
    portfolio_url: ci.portfolio_url || portfolio.website || '',
    blog_url: ci.blog_url || portfolio.blog || '',
  }

  // Ensure suggested_title comes from the JD analysis if the AI missed it
  if (!parsed.suggested_title && jdAnalysis) {
    const company = jdAnalysis.company || 'target company'
    parsed.suggested_title = `${jdAnalysis.role_title} — ${company}`
  }

  // Validate AI output completeness — log warnings for missing data
  const expectedExps = portfolio.experiences.length
  const actualExps = parsed.work_experiences?.length ?? 0
  if (actualExps < expectedExps) {
    console.warn(
      `[tailorResume] AI returned ${actualExps}/${expectedExps} work experiences — data may be incomplete`
    )
  }
  // Ensure every experience has achievement bullets
  for (const exp of parsed.work_experiences ?? []) {
    if (!exp.achievements || exp.achievements.length === 0) {
      console.warn(
        `[tailorResume] Work experience "${exp.job_title} at ${exp.company}" has no achievement bullets`
      )
    }
  }

  // Fill gaps: re-insert any experiences the AI dropped
  if (actualExps < expectedExps) {
    const aiCompanies = new Set(
      (parsed.work_experiences ?? []).map((e) =>
        `${e.job_title}|${e.company}`.toLowerCase()
      )
    )
    for (const pe of portfolio.experiences) {
      const key = `${pe.role}|${pe.company}`.toLowerCase()
      if (!aiCompanies.has(key)) {
        const bullets = pe.resume_achievements ?? pe.achievements ?? []
        parsed.work_experiences.push({
          job_title: pe.role,
          company: pe.company,
          location: pe.location ?? '',
          start_date: pe.start_date,
          end_date: pe.end_date,
          achievements: bullets.slice(0, 5),
        })
      }
    }
    // Re-sort by start_date descending
    parsed.work_experiences.sort((a, b) =>
      (b.start_date ?? '').localeCompare(a.start_date ?? '')
    )
  }

  // Fill gaps: ensure every experience has at least 1 bullet
  for (let i = 0; i < parsed.work_experiences.length; i++) {
    const exp = parsed.work_experiences[i]
    if (!exp.achievements || exp.achievements.length === 0) {
      const match = portfolio.experiences.find(
        (pe) => pe.company.toLowerCase() === exp.company.toLowerCase()
      )
      if (match) {
        const bullets = match.resume_achievements ?? match.achievements ?? []
        exp.achievements = bullets.slice(0, 4)
      }
    }
  }

  // Fill gaps: re-insert any projects the AI dropped
  const expectedProjs = portfolio.projects.length
  const actualProjs = parsed.projects?.length ?? 0
  if (actualProjs < expectedProjs) {
    const aiProjects = new Set(
      (parsed.projects ?? []).map((p) => p.name.toLowerCase())
    )
    for (const pp of portfolio.projects) {
      if (!aiProjects.has(pp.title.toLowerCase())) {
        parsed.projects.push({
          name: pp.title,
          description: pp.short_description,
          url: pp.live_url,
          source_url: pp.github_url,
          achievements: pp.highlights?.map((h) => `${h.metric}: ${h.value}`) ?? [],
        })
      }
    }
  }

  return {
    data: parsed,
    jdAnalysis,
    skillMatch,
    usage: totalUsage,
  }
}
